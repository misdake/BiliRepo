import {MemberDB, VideoDB, VideoParts} from "../../server/storage/dbTypes";
import {Paged} from "../page";
import {BilibiliVideoJson} from "../types";

export let runner = {
    apiGet: (_api: any, _param: any) => {
    },
    apiPost: (_api: any, _param: any, _payload: any) => {
    },
};

export class ApiGet<Param, Result> {
    readonly srvPattern: string;
    readonly reqPattern: (param: Param) => string;
    constructor(srvPattern: string, reqPattern: (param: Param) => string) { //TODO construct reqPattern func from srvPattern
        this.srvPattern = srvPattern;
        this.reqPattern = reqPattern;
    }

    run(param: Param): Promise<Result> {
        // @ts-ignore
        return runner.apiGet(this, param);
    }
}

export class ApiPost<Param, Payload, Result> {
    readonly srvPattern: string;
    readonly reqPattern: (param: Param) => string;
    constructor(srvPattern: string, reqPattern: (param: Param) => string) {
        this.srvPattern = srvPattern;
        this.reqPattern = reqPattern;
    }

    run(param: Param, payload: Payload): Promise<Result> {
        // @ts-ignore
        return runner.apiPost(this, param, payload);
    }
}

export let RawApis = {
    //Video
    GetVideo: new ApiGet<number, VideoDB>("/api/video/aid/:aid", aid => `api/video/aid/${aid}`),
    GetVideoParts: new ApiGet<number, VideoParts>("/api/video/withparts/:aid", aid => `api/video/withparts/${aid}`),
    ListVideo: new ApiGet<number, Paged<VideoDB>>("/api/video/recent/:page", page => `api/video/recent/${page}`),
    ListVideoByMember: new ApiGet<{ mid: number, page: number }, Paged<VideoDB>>("/api/video/member/:mid/:page", ({mid, page}) => `api/video/member/${mid}/${page}`),

    //Member
    GetMember: new ApiGet<number, MemberDB>("/api/member/mid/:mid", mid => `api/member/mid/${mid}`),
    ListMember: new ApiGet<number, Paged<MemberDB>>("/api/member/all/:page", page => `api/member/all/${page}`),

    //Search
    SearchVideo: new ApiGet<{ input: string, page: number }, Paged<VideoDB>>("/api/video/search/:input/:page", ({input, page}) => `api/video/search/${input}/${page}`),
    SearchMember: new ApiGet<{ input: string, page: number }, Paged<MemberDB>>("/api/member/search/:input/:page", ({input, page}) => `api/member/search/${input}/${page}`),

    //Proxy
    GetVideoInfo: new ApiGet<string, BilibiliVideoJson>("/proxy/videoinfo/:id", id => `proxy/videoinfo/${id}`),

    //Download
    //TODO download apis
};