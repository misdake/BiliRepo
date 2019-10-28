import {BilibiliMember, BilibiliVideo, BilibiliVideoJson} from "../common/types";

const fs = require("fs");

export class Storage {
    private aid_list: number[] = [];
    private aid_video: { [aid: number]: BilibiliVideo } = {};
    private mid_member: { [mid: number]: BilibiliMember } = {};
    private mid_videos: { [mid: number]: BilibiliVideo[] } = {};

    constructor() {
        this.loadAllVideos();
    }

    private loadVideo(aid: number) {
        let content = fs.readFileSync(`repo/${aid}/info.json`, 'utf8');
        let video = (JSON.parse(content) as BilibiliVideoJson).data;

        this.aid_video[aid] = video;
        this.aid_list.push(aid);

        console.log(`loaded: ${aid} ${video.title}`);
    }

    public importVideo(aid: number) {
        if (this.aid_video[aid]) return;
        this.loadVideo(aid);
        this.aid_list.sort().reverse();
        this.refreshMid();
    }

    private loadAllVideos() {
        let folders = fs.readdirSync('repo');
        folders = folders.sort().reverse();
        for (let folder of folders) {
            if (folder.match(/^[0-9]+$/)) {
                this.loadVideo(parseInt(folder));
            }
        }
    }

    private refreshMid() {
        for (let aid of this.aid_list) {
            let video = this.aid_video[aid];
            let owner = video.owner;
            this.mid_member[owner.mid] = owner;
            (this.mid_videos[owner.mid] = this.mid_videos[owner.mid] || []).push(video);
        }
    }

    public member(mid: number): BilibiliMember {
        return this.mid_member[mid];
    }
    public member_videos(mid: number): BilibiliVideo[] {
        return this.mid_videos[mid];
    }

    public video(page: number = 0, count: number = 20): BilibiliVideo[] { //TODO encapsulate page index/count in result
        let aids = this.aid_list.slice(page * count, (page + 1) * count);
        let r: BilibiliVideo[] = [];
        for (let aid of aids) {
            r.push(this.aid_video[aid]);
        }
        return r;
    }

}