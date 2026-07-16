import {ApiGet, ApiPost, ApiRequest, RawApis, server} from "../common/api/Api";
import {Application, Response} from "express";
import {Downloader} from "./download/Downloader";

export function initServerApi(app: Application, downloader: Downloader) {
    const blacklist = ['meta', '$loki'];
    function stringify(obj: any) {
        return JSON.stringify(obj, function replacer(key, value) {
            return blacklist.indexOf(key) === -1 ? value : undefined;
        });
    }

    function serveApiGet<Param, Result>(api: ApiGet<Param, Result>, param: (req: ApiRequest) => Param, callback: (param: Param) => Result) {
        app.get(api.srvPattern, function (req: ApiRequest, res: Response) {
            let p = param(req);
            let r = callback(p);
            res.send(stringify(r));
        });
    }
    function serveApiGetAsync<Param, Result>(api: ApiGet<Param, Result>, param: (req: ApiRequest) => Param, callback: (param: Param) => Promise<Result>) {
        app.get(api.srvPattern, function (req: ApiRequest, res: Response) {
            let p = param(req);
            callback(p).then(r => res.send(stringify(r)));
        });
    }

    function serveApiPost<Param, Payload, Result>(api: ApiPost<Param, Payload, Result>, param: (req: ApiRequest) => Param, callback: (param: Param, body: Payload) => Promise<Result>) {
        app.post(api.srvPattern, function (req: ApiRequest, res: Response) {
            let p = param(req);
            callback(p, req.body).then(r => res.send(stringify(r)));
        });
    }

    server.serveGet = serveApiGet;
    server.serveGetAsync = serveApiGetAsync;
    server.servePost = serveApiPost;
}

export let ServerApis = RawApis;
