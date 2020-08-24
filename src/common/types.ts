export interface BilibiliVideoJson {
    data: BilibiliVideo;
}
export interface BilibiliVideoListJson {
    data: BilibiliVideo[];
}

export interface BilibiliVideo {
    aid: number;
    videos: number;
    tid: number;
    pic: string;
    title: string;
    tname: string;
    pubdate: number;
    ctime: number;
    desc: string;

    owner: BilibiliMember;
    pages: BilibiliPage[];
}

export interface BilibiliMember {
    mid: number;
    name: string;
    face: string;
}

export interface BilibiliPage {
    cid: number;
    page: number;
    part: string;
    duration: number;
}