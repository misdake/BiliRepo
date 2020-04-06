export class VideoDB {
    aid: number; //Key

    title: string;
    mid: number; //MemberDB
    desc: string;
}

export class PartDB {
    cid: number; //Key

    aid: number; //VideoDB

    index: number;
    title: string;
}

export class VideoParts extends VideoDB {
    parts: PartDB[];
    member: MemberDB;
}

export class MemberDB {
    mid: number; //Key

    name: string;
    face: string;

    lastAid: number;
}

export class PlaylistDB {
    pid: number; //Key

    title: string;
    videoAid: number[];
}

export class PlaylistVideos extends PlaylistDB {
    videos: VideoDB[];
}