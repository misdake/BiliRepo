import {ApiGet, ApiPost, RawApis, runner} from "../../../common/api/Api";
import {apiget, apipost} from "../network";

function runApiGet<Param, Result>(api: ApiGet<Param, Result>, param: Param): Promise<Result> {
    return new Promise<Result>(resolve => {
        apiget(api.reqPattern(param), content => {
            resolve(JSON.parse(content) as Result);
        });
    });
}
function runApiPost<Param, Payload, Result>(api: ApiPost<Param, Payload, Result>, param: Param, payload: Payload): Promise<Result> {
    return new Promise<Result>(resolve => {
        apipost(api.reqPattern(param), payload, content => {
            resolve(JSON.parse(content) as Result);
        });
    });
}

runner.apiGet = runApiGet;
runner.apiPost = runApiPost;

export let ClientApis = RawApis;