import {Bilibili} from "./Bilibili";
import {BilibiliPage, BilibiliVideo, BilibiliVideoJson} from "../../common/types";
import {DownloadStatus, PartStatus, VideoStatus} from "../../common/DownloadStatus";
import {PartDB} from "../storage/dbTypes";

const fs = require('fs');

export class PartDownloadProgress {
    video: BilibiliVideo;
    part: BilibiliPage;
    done: boolean;
    failed: boolean;

    quality: string;
    curr: string;
    total: string;
    progress: number;

    private setMessage: (message: string) => void;
    private shutdownMethod: () => void;

    constructor(video: BilibiliVideo, part: BilibiliPage, setMessage: (message: string) => void) {
        this.video = video;
        this.part = part;
        this.setMessage = setMessage;
        this.done = false;
        this.failed = false;
    }

    async start() {
        this.shutdownMethod = undefined;
        let returncode = await Bilibili.downloadVideo(this.video.aid, this.part.page, lines => this.processOutput(lines), proc => {
            this.shutdownMethod = () => proc.kill();
        });
        this.shutdownMethod = undefined;
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

    shutdown(): boolean {
        if (this.shutdownMethod) {
            this.shutdownMethod();
            return true;
        }
        return false;
    }

    private processOutput(lines: string[]) {
        {
            let qualityRegex = new RegExp('Quality:\\s+(.*)$');
            for (let string of lines) {
                let res = string.match(qualityRegex);
                if (res) {
                    console.log(`画质：${res[1]}`);
                    this.quality = res[1];
                }
            }
        }
        {
            let sizeRegex = new RegExp('([0-9.]+ [KMGi]*B) \\/ ([0-9.]+ [KMGni]*B)');
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
                this.progress = parseFloat(percent);
            }
        }
        {
            for (let line of lines) {
                if (line.indexOf("cookie error") >= 0) {
                    this.setMessage("cookie error");
                }
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
    downloadingPart: PartDownloadProgress;

    json: BilibiliVideoJson;

    constructor(aid: number, setMessage: (message: string) => void) {
        this.aid = aid;
        this.parts = [];
        this.done = false;
        this.failed = false;
        this.info = Bilibili.getVideoInfoByAid_promise(aid).then(result => {
            this.json = result;
            this.video = result.data;
            for (let part of this.video.pages) {
                this.parts.push(new PartDownloadProgress(this.video, part, setMessage));
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

    shutdown(): boolean {
        if (this.downloadingPart) {
            return this.downloadingPart.shutdown()
        }
        return false;
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
            this.downloadingPart = part;
            let success = await part.start();
            this.downloadingPart = undefined;
            if (!success) {
                return false;
            }
        }

        fs.writeFileSync(`repo/${folder}/info.json`, JSON.stringify(this.json, null, 2));
        fs.renameSync(`repo/${folder}`, `repo/${aid}`);

        return true;
    }

    private checkDownloaded(aid: number): boolean {
        return fs.existsSync(`repo/${aid}`);
    }
}

export class Downloader {
    private onDone: (video: BilibiliVideo) => void;

    private message: string;
    private queue: VideoDownloadProgress[];
    private current: VideoDownloadProgress;
    private done: VideoDownloadProgress[];
    private failed: VideoDownloadProgress[];

    constructor(onDone: (video: BilibiliVideo) => void) {
        this.onDone = onDone;
        this.message = null;
        this.queue = [];
        this.current = null;
        this.done = [];
        this.failed = [];
    }

    status() {
        return {
            message: this.message,
            queue: this.queue,
            current: this.current,
            done: this.done,
            failed: this.failed,
        };
    }
    status_mini(): DownloadStatus {
        return {
            message: this.message,
            queue: Downloader.generateVideoStatus(this.queue, false),
            current: this.current ? Downloader.generateVideoStatus([this.current], true)[0] : null,
            done: Downloader.generateVideoStatus(this.done, false),
            failed: Downloader.generateVideoStatus(this.failed, false),
        }
    }

    updateDanmaku(part: PartDB) {
        return Bilibili.downloadDanmaku(part.aid, part.cid, part.index, true);
    }

    redownload(aid: number) {
        if (fs.existsSync(`repo/${aid}_download/`)) {
            return false;
        }
        if (!fs.existsSync(`repo/${aid}/`)) {
            return false;
        }

        try {
            fs.renameSync(`repo/${aid}`, `repo/${aid}_download`);
        } catch (e) {
            return false;
        }
        this.enqueue(aid);
        return true;
    }

    setCookie(cookie: string) {
        fs.writeFileSync("downloader/cookies.txt", cookie);
        this.message = null;
    }

    private static generateVideoStatus(list: VideoDownloadProgress[], enableParts: boolean) {
        let r: VideoStatus[] = [];
        for (let v of list) {
            let parts: PartStatus[] = null;
            if (enableParts) {
                parts = [];
                if (v.parts) for (let part of v.parts) {
                    let p: PartStatus = {
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

    enqueue(aid: number) {
        this.queue.push(new VideoDownloadProgress(aid, message => {
            this.message = message;
        }));
        this.schedule();
    }

    remove(aid: number) {
        //from from queue => simply remove
        this.queue = this.queue.filter(video => video.aid !== aid);
        //from from queue => simply remove
        this.failed = this.failed.filter(video => video.aid !== aid);

        //remove current => treat current as failed
        if (this.current && this.current.aid === aid) {
            this.current.shutdown();
            this.failed.unshift(this.current);
            this.current = null;
        }

        this.schedule();
    }

    private schedule() {
        //clear current
        if (this.current) {
            if (this.current.done) {
                this.done.unshift(this.current);
                if (this.onDone && this.current.video) {
                    this.onDone(this.current.video);
                }
                this.current = null;
            } else if (this.current.failed) {
                this.failed.unshift(this.current);
                this.current = null;
            }
        }

        const LIST_MAX = 10;

        if (this.done.length > LIST_MAX) this.done = this.done.slice(0, LIST_MAX);
        if (this.failed.length > LIST_MAX) this.failed = this.failed.slice(0, LIST_MAX);

        //schedule new download
        if (!this.current) {
            if (this.queue.length) {
                this.message = null;
                this.current = this.queue.shift();
                this.current.start().then(_ => {
                    this.schedule();
                });
            }
        }
    }

}
