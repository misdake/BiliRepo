import {MemberDB, PartDB, PlaylistDB, PlaylistVideos, VideoDB, VideoParts} from "../../server/storage/dbTypes";
import {Paged} from "../page";
import {BilibiliVideoJson} from "../types";
import {DownloadStatus} from "../DownloadStatus";
import {Request} from "express";

export let server = {
    serveGet: (_api: any, param: (req: Request) => any, callback: (param: any) => any) => {
    },
    servePost: (_api: any, param: (req: Request) => any, callback: (param: any, body: any) => any) => {
    },
};
export let client = {
    fetchGet: (_api: any, _param: any) => {
    },
    fetchPost: (_api: any, _param: any, _payload: any) => {
    },
};

export class ApiGet<Param, Result> {
    readonly srvPattern: string;
    readonly reqPattern: (param: Param) => string;
    constructor(srvPattern: string, reqPattern: (param: Param) => string) { //TODO construct reqPattern func from srvPattern, auto server-side param extraction
        this.srvPattern = srvPattern;
        this.reqPattern = reqPattern;
    }

    serve(param: (req: Request) => Param, callback: (param: Param) => Result) {
        server.serveGet(this, param, callback);
    }
    fetch(param: Param): Promise<Result> {
        // @ts-ignore
        return client.fetchGet(this, param);
    }
}

export class ApiPost<Param, Payload, Result> {
    readonly srvPattern: string;
    readonly reqPattern: (param: Param) => string;
    constructor(srvPattern: string, reqPattern: (param: Param) => string) {
        this.srvPattern = srvPattern;
        this.reqPattern = reqPattern;
    }

    serve(param: (req: Request) => Param, callback: (param: Param, body: Payload) => Promise<Result>) {
        server.servePost(this, param, callback);
    }
    fetch(param: Param, payload: Payload): Promise<Result> {
        // @ts-ignore
        return client.fetchPost(this, param, payload);
    }
}

export let RawApis = {
    //Video
    GetVideo: new ApiGet<number, VideoDB>("/api/video/aid/:aid", aid => `api/video/aid/${aid}`),
    GetVideoParts: new ApiGet<number, VideoParts>("/api/video/withparts/:aid", aid => `api/video/withparts/${aid}`),
    ListVideo: new ApiGet<number, Paged<VideoDB>>("/api/video/list/:page", page => `api/video/list/${page}`), //TODO just call it list instread of recent
    ListVideoByMember: new ApiGet<{ mid: number, page: number }, Paged<VideoDB>>("/api/video/member/:mid/:page", ({mid, page}) => `api/video/member/${mid}/${page}`),

    //Member
    GetMember: new ApiGet<number, MemberDB>("/api/member/mid/:mid", mid => `api/member/mid/${mid}`),
    ListMember: new ApiGet<number, Paged<MemberDB>>("/api/member/list/:page", page => `api/member/list/${page}`),

    //Playlist
    AddPlaylist: new ApiPost<{}, { title: string, aids: number[] }, PlaylistDB>("/api/playlist/add", ({}) => `api/playlist/add`),
    UpdatePlaylist: new ApiPost<number, { title: string, aids: number[]}, PlaylistDB>("/api/playlist/update/:pid", pid => `api/playlist/update/${pid}`),
    RemovePlaylist: new ApiGet<number, boolean>("/api/playlist/remove/:pid", pid => `api/playlist/remove/${pid}`),
    ListPlaylist: new ApiGet<number, Paged<PlaylistDB>>("/api/playlist/list/:page", page => `api/playlist/list/${page}`),
    GetPlaylist: new ApiGet<number, PlaylistDB>("/api/playlist/pid/:pid", pid => `api/playlist/pid/${pid}`),
    GetPlaylistVideos: new ApiGet<number, PlaylistVideos>("/api/playlist/withvideos/:pid", pid => `api/playlist/withvideos/${pid}`),

    //Search
    SearchVideo: new ApiGet<{ input: string, page: number }, Paged<VideoDB>>("/api/video/search/:input/:page", ({input, page}) => `api/video/search/${input}/${page}`),
    SearchMember: new ApiGet<{ input: string, page: number }, Paged<MemberDB>>("/api/member/search/:input/:page", ({input, page}) => `api/member/search/${input}/${page}`),

    //Proxy
    GetVideoInfo: new ApiPost<string, {}, BilibiliVideoJson>("/proxy/videoinfo/:id", id => `proxy/videoinfo/${id}`),

    //Download
    AddDownload: new ApiGet<number, boolean>("/download/add/:aid", aid => `download/add/${aid}`),
    RetryDownload: new ApiGet<number, boolean>("/download/retry/:aid", aid => `download/retry/${aid}`),
    RemoveDownload: new ApiGet<number, boolean>("/download/remove/:aid", aid => `download/remove/${aid}`),
    StatusDownload: new ApiGet<{}, DownloadStatus>("/download/status", () => `download/status`),
    UpdateCookie: new ApiPost<{}, { cookie: string }, string>("/download/cookie", () => `download/cookie`),
    UpdateDanmaku: new ApiPost<{}, { part: PartDB }, string>("/download/danmaku/update", () => `download/danmaku/update`),
};