import {Bilibili} from "./Bilibili";
import {BilibiliPage, BilibiliVideo} from "../../common/types";
import {DownloadStatus, PartStatus, VideoStatus} from "../../common/DownloadStatus";

const fs = require('fs');

export class PartDownloadProgress {
    video: BilibiliVideo;
    part: BilibiliPage;
    done: boolean;
    failed: boolean;

    quality: string;
    curr: string; //TODO
    total: string; //TODO
    progress: number;

    constructor(video: BilibiliVideo, part: BilibiliPage) {
        this.video = video;
        this.part = part;
        this.done = false;
        this.failed = false;
    }

    async start() {
        let returncode = await Bilibili.downloadVideo(this.video.aid, this.part.page, lines => this.processOutput(lines));
        if (returncode === 0) {
            this.done = true;
            console.log(`download part ${this.part.page} success`);
            console.log(`download danmaku: ${this.video.aid} ${this.video.title} part${this.part.part}`);
            await Bilibili.downloadDanmaku(this.video.aid, this.part.cid, this.part.page);
            return true;
        } else {
            this.failed = true;
            console.log(`download part ${this.part.page} fail`);
            return false;
        }
    }

    private processOutput(lines: string[]) {
        {
            let qualityRegex = new RegExp('Quality:\\s+(.*)$');
            for (let string of lines) {
                let res = string.match(qualityRegex);
                if (res) {
                    // console.log(`画质：${res[1]}`);
                    this.quality = res[1];
                }
            }
        }
        {
            let sizeRegex = new RegExp('([0-9.]+ [KMGi]*B) \\/ ([0-9.]+ [KMGi]*B)');
            let res = lines[lines.length - 1].match(sizeRegex);
            if (res) {
                this.curr = res[1];
                this.total = res[2];
            }
        }
        {
            let progressRegex = new RegExp('([0-9.]+)%');
            let res = lines[lines.length - 1].match(progressRegex);
            if (res) {
                let percent = res[1];
                let n = parseFloat(percent);
                // console.log(`progress：${percent}`);
                this.progress = n;
            }
        }
    }
}

export class VideoDownloadProgress {
    aid: number;
    done: boolean;
    failed: boolean;

    info: Promise<void | BilibiliVideo>;
    video: BilibiliVideo;
    parts: PartDownloadProgress[];

    constructor(aid: number) {
        this.aid = aid;
        this.parts = [];
        this.done = false;
        this.failed = false;
        this.info = Bilibili.getVideoInfoByAid_promise(aid).then(result => {
            this.video = result;
            for (let part of this.video.pages) {
                this.parts.push(new PartDownloadProgress(this.video, part));
            }
        }, () => {
            this.failed = true; //cause downloadEntireVideo to return false
        });
    }

    async start() {
        let success = await this.downloadEntireVideo(false);
        this.done = success;
        this.failed = !success;
    }

    private async downloadEntireVideo(force: boolean = false) {
        if (this.failed) {
            return false; //getVideoInfoByAid failed
        }

        let aid = this.aid;

        //skip if downloaded
        if (this.checkDownloaded(aid) && !force) {
            console.log("skip:", aid);
            return true;
        }

        const baseFolder = 'repo';
        const downloadFolder = `repo\\${aid}_download`;
        if (!fs.existsSync(baseFolder)) {
            fs.mkdirSync(baseFolder, {recursive: true});
        }
        if (!fs.existsSync(downloadFolder)) {
            fs.mkdirSync(downloadFolder, {recursive: true});
        }

        console.log("download info:", aid);
        await this.info;
        if (!this.video) {
            return false;
        }
        let video: BilibiliVideo = this.video;
        let folder = `${aid}_download`;

        console.log("download thumb:", aid);
        let thumb = video.pic;
        await Bilibili.downloadThumb(folder, thumb);

        for (let part of this.parts) {
            let success = await part.start();
            if (!success) {
                return false;
            }
        }

        fs.writeFileSync(`repo/${folder}/info.json`, JSON.stringify(video));
        fs.renameSync(`repo/${folder}`, `repo/${aid}`);

        return true;
    }

    private checkDownloaded(aid: number): boolean {
        return fs.existsSync(`repo/${aid}`);
    }
}

export class Downloader {

    private queue: VideoDownloadProgress[];
    private current: VideoDownloadProgress;
    private done: VideoDownloadProgress[];
    private failed: VideoDownloadProgress[];

    constructor() {
        this.queue = [];
        this.current = null;
        this.done = [];
        this.failed = [];
    }

    status() {
        return {
            queue: this.queue,
            current: this.current,
            done: this.done,
            failed: this.failed,
        };
    }
    status_mini() : DownloadStatus {
        return {
            queue: Downloader.generateVideoStatus(this.queue, false),
            current: this.current ? Downloader.generateVideoStatus([this.current], true)[0] : null,
            done: Downloader.generateVideoStatus(this.done, false),
            failed: Downloader.generateVideoStatus(this.failed, false),
        }
    }

    private static generateVideoStatus(list: VideoDownloadProgress[], enableParts: boolean) {
        let r: VideoStatus[] = [];
        for (let v of list) {
            let parts: PartStatus[] = null;
            if (enableParts) {
                parts = [];
                if (v.parts) for (let part of v.parts) {
                    let p = {
                        p: part.part.page,
                        title: part.part.part,
                        done: part.done,
                        failed: part.failed,
                        quality: part.quality,
                        progress: part.progress,
                        curr: part.curr,
                        total: part.total,
                    };
                    if (part.done || part.failed) {
                        p.quality = undefined;
                        p.progress = undefined;
                        p.curr = undefined;
                        p.total = undefined;
                    }
                    parts.push(p);
                }
            }

            r.push({
                aid: v.aid,
                title: v.video ? v.video.title : undefined,
                pic: v.video ? v.video.pic : undefined,
                done: v.done,
                failed: v.failed,
                parts: parts,
            })
        }
        return r;
    }

    enqueue(aid: number, force: boolean = false) {
        //TODO check downloaded? check done/failed?
        this.queue.push(new VideoDownloadProgress(aid));
        this.schedule();
    }

    // remove(aid: number) {
    //
    // }

    private schedule() {
        //clear current
        if (this.current) {
            if (this.current.done) {
                this.done.push(this.current);
                this.current = null;
            } else if (this.current.failed) {
                this.failed.push(this.current);
                this.current = null;
            }
        }

        //TODO check done/failed length, remove item if too long

        //schedule new download
        if (!this.current) {
            if (this.queue.length) {
                this.current = this.queue.splice(0, 1)[0];
                this.current.start().then(_ => {
                    this.schedule();
                });
            }
        }
    }

}