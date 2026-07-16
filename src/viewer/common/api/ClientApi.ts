import {ApiGet, ApiPost, RawApis, client} from "../../../common/api/Api";

type HttpErrorCallback = (error: Error) => void;

function defaultHttpError(error: Error) {
    console.error(error);
}

export function showRequestError(action: string, error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    window.alert(`${action}失败：${message}`);
}

export function httpget(url: string, callback: (content: string) => void, onError: HttpErrorCallback = defaultHttpError) {
    let request = new XMLHttpRequest();
    let settled = false;
    const fail = (error: Error) => {
        if (settled) return;
        settled = true;
        onError(error);
    };
    request.onreadystatechange = function () {
        if (request.readyState !== 4 || settled) return;
        if (request.status >= 200 && request.status < 300) {
            settled = true;
            callback(request.responseText);
        } else fail(new Error(`GET ${url} 失败（HTTP ${request.status || "网络错误"}）`));
    };
    request.onerror = () => fail(new Error(`GET ${url} 失败（网络错误）`));
    request.onabort = () => fail(new Error(`GET ${url} 已取消`));
    request.open("GET", url, true);
    request.send();
}
export function httppost(url: string, body: any, callback: (content: string) => void, onError: HttpErrorCallback = defaultHttpError) {
    let request = new XMLHttpRequest();
    let settled = false;
    const fail = (error: Error) => {
        if (settled) return;
        settled = true;
        onError(error);
    };
    request.onreadystatechange = function () {
        if (request.readyState !== 4 || settled) return;
        if (request.status >= 200 && request.status < 300) {
            settled = true;
            callback(request.responseText);
        } else fail(new Error(`POST ${url} 失败（HTTP ${request.status || "网络错误"}）`));
    };
    request.onerror = () => fail(new Error(`POST ${url} 失败（网络错误）`));
    request.onabort = () => fail(new Error(`POST ${url} 已取消`));
    request.open("POST", url, true);
    request.setRequestHeader('content-type', 'application/json');
    request.send(JSON.stringify(body));
}
export function apiget(url: string, callback: (content: string) => void, onError?: HttpErrorCallback) {
    httpget(serverConfig.apiRoot + url, callback, onError);
}
export function apipost(url: string, body: any, callback: (content: string) => void, onError?: HttpErrorCallback) {
    httppost(serverConfig.apiRoot + url, body, callback, onError);
}

function fetchApiGet<Param, Result>(api: ApiGet<Param, Result>, param: Param): Promise<Result> {
    return new Promise<Result>((resolve, reject) => {
        apiget(api.reqPattern(param), content => {
            try {
                resolve(JSON.parse(content) as Result);
            } catch (error) {
                reject(error);
            }
        }, reject);
    });
}
function fetchApiPost<Param, Payload, Result>(api: ApiPost<Param, Payload, Result>, param: Param, payload: Payload): Promise<Result> {
    return new Promise<Result>((resolve, reject) => {
        apipost(api.reqPattern(param), payload, content => {
            try {
                resolve(JSON.parse(content) as Result);
            } catch (error) {
                reject(error);
            }
        }, reject);
    });
}

client.fetchGet = fetchApiGet;
client.fetchPost = fetchApiPost;

export let ClientApis = RawApis;
