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

export function httppost(url: string, body: object, callback: (content: string) => void) {
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