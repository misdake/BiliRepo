import {BilibiliPage, BilibiliVideo} from "./types";

export class Playlist {
    items: PlaylistItem[];
}

export class PlaylistItem {
    video: BilibiliVideo;
    part: BilibiliPage;

    constructor(video: BilibiliVideo, part: BilibiliPage) {
        this.video = video;
        this.part = part;
    }
}