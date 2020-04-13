import {VideoDB} from "../../server/storage/dbTypes";

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
    GetVideo: new ApiGet<Number, VideoDB>("/api/video/aid/:aid", aid => `api/video/aid/${aid}`),
    //TODO more apis
};