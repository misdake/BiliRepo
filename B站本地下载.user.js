// ==UserScript==
// @name         B站本地下载
// @namespace    http://tampermonkey.net/
// @version      0.2
// @author       z
// @match        https://www.bilibili.com/video/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function makeRequest(method, url, data) {
        return new Promise(function (resolve, reject) {
            let xhr = new XMLHttpRequest();
            xhr.open(method, url);
            xhr.onload = function () {
                if (this.status >= 200 && this.status < 300) {
                    resolve(xhr.response);
                } else {
                    reject({
                        status: this.status,
                        statusText: xhr.statusText
                    });
                }
            };
            xhr.onerror = function () {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            };
            if (method === "POST") {
                xhr.setRequestHeader('content-type', 'application/json');
            }
            xhr.send(data);
        });
    }

    const SVG = `<svg width="800px" height="800px" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="video-complaint-icon video-toolbar-item-icon">
<path fill-rule="evenodd" clip-rule="evenodd" d="M3 14.25C3.41421 14.25 3.75 14.5858 3.75 15C3.75 16.4354 3.75159 17.4365 3.85315 18.1919C3.9518 18.9257 4.13225 19.3142 4.40901 19.591C4.68577 19.8678 5.07435 20.0482 5.80812 20.1469C6.56347 20.2484 7.56459 20.25 9 20.25H15C16.4354 20.25 17.4365 20.2484 18.1919 20.1469C18.9257 20.0482 19.3142 19.8678 19.591 19.591C19.8678 19.3142 20.0482 18.9257 20.1469 18.1919C20.2484 17.4365 20.25 16.4354 20.25 15C20.25 14.5858 20.5858 14.25 21 14.25C21.4142 14.25 21.75 14.5858 21.75 15V15.0549C21.75 16.4225 21.75 17.5248 21.6335 18.3918C21.5125 19.2919 21.2536 20.0497 20.6517 20.6516C20.0497 21.2536 19.2919 21.5125 18.3918 21.6335C17.5248 21.75 16.4225 21.75 15.0549 21.75H8.94513C7.57754 21.75 6.47522 21.75 5.60825 21.6335C4.70814 21.5125 3.95027 21.2536 3.34835 20.6517C2.74643 20.0497 2.48754 19.2919 2.36652 18.3918C2.24996 17.5248 2.24998 16.4225 2.25 15.0549C2.25 15.0366 2.25 15.0183 2.25 15C2.25 14.5858 2.58579 14.25 3 14.25Z" fill="#1C274C"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M12 16.75C12.2106 16.75 12.4114 16.6615 12.5535 16.5061L16.5535 12.1311C16.833 11.8254 16.8118 11.351 16.5061 11.0715C16.2004 10.792 15.726 10.8132 15.4465 11.1189L12.75 14.0682V3C12.75 2.58579 12.4142 2.25 12 2.25C11.5858 2.25 11.25 2.58579 11.25 3V14.0682L8.55353 11.1189C8.27403 10.8132 7.79963 10.792 7.49393 11.0715C7.18823 11.351 7.16698 11.8254 7.44648 12.1311L11.4465 16.5061C11.5886 16.6615 11.7894 16.75 12 16.75Z" fill="#1C274C"/>
</svg>`;
    const TEXT = `<span class="video-complaint-info video-toolbar-item-text">本地下载</span>`;

    let interval = -1;
    let checkAndSet = () => {
        if (!window.__INITIAL_STATE__.aid) return;

        let brother = document.querySelector(".video-toolbar-right-item");
        console.log("checkAndSet", brother && brother.parentElement.childElementCount > 1);

        if (brother && brother.parentElement.childElementCount > 1) {
            let parent = brother.parentElement;
            let div = document.createElement("div");
            div.classList = ["video-toolbar-right-item"];
            div.innerHTML = `${SVG}${TEXT}`;
            div.style.marginRight = "18px";
            parent.insertBefore(div, brother);

            div.onclick = () => {
                let cookie = document.querySelector("#script-cookies")?.dataset?.cookies;
                let cookie_promise = Promise.resolve();
                if (cookie) {
                    let c = JSON.parse(cookie)[0];
                    let data = {cookie: "SESSDATA=" + c.value};
                    cookie_promise = makeRequest("POST", "http://localhost:8081/download/cookie", JSON.stringify(data));
                }

                cookie_promise
                    .then(() => makeRequest("GET", "http://localhost:8081/download/add/" + window.__INITIAL_STATE__.aid))
                    .then((text) => {
                        div.innerHTML = JSON.parse(text) ? "成功" : "失败";
                    });
            }

            clearInterval(interval);
        }
    };
    interval = setInterval(checkAndSet, 1000);

    //强行取消自动跳转
    let checkSkip = () => {
        let button = document.querySelector(".bpx-player-ending-related-item-cancel");
        if (!button || button.style.display === "none") return;
        button.click();
        console.log("取消自动跳转！");
    }
    setInterval(checkSkip, 2000);

    console.log("script loaded");
})();
