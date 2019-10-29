import {PartDB, VideoParts} from "../../server/storage/dbTypes";

export class Playlist {
    items: PlaylistItem[];
}

export class PlaylistItem {
    video: VideoParts;
    part: PartDB;

    constructor(video: VideoParts, part: PartDB) {
        this.video = video;
        this.part = part;
    }
}