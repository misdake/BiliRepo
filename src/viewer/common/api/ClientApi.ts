import {ApiGet, ApiPost, RawApis, runner} from "../../../common/api/Api";

export function httpget(url: string, callback: (content: string) => void) {
    let request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
            callback(request.responseText);
        }
    };
    request.open("GET", url, true);
    request.send();
}
export function httppost(url: string, body: any, callback: (content: string) => void) {
    let request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
            callback(request.responseText);
        }
    };
    request.open("POST", url, true);
    request.setRequestHeader('content-type', 'application/json');
    request.send(JSON.stringify(body));
}
export function apiget(url: string, callback: (content: string) => void) {
    httpget(serverConfig.apiRoot + url, callback);
}
export function apipost(url: string, body: any, callback: (content: string) => void) {
    httppost(serverConfig.apiRoot + url, body, callback);
}

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