// ==UserScript==
// @name         B站本地下载
// @namespace    http://tampermonkey.net/
// @version      0.1
// @author       z
// @match        https://www.bilibili.com/video/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

function httpGetAsync(theUrl, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            callback(xmlHttp.responseText);
        }
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous
    xmlHttp.send(null);
}

let interval = -1;
let checkAndSet = () => {
	if(!document.querySelector(".new-sort")) return;
    if(!window.__INITIAL_STATE__.aid) return;

	if(document.querySelector(".appeal-text")) {
		let parent = document.querySelector(".appeal-text").parentElement;
		let div = document.createElement("div");
		div.classList = ["appeal-text"];
		div.innerHTML = "本地下载";
		parent.appendChild(div);

		div.onclick = () => {
			httpGetAsync("http://localhost:8081/download/add/" + window.__INITIAL_STATE__.aid, (text) => {
                div.innerHTML = JSON.parse(text) ? "成功" : "失败";
			});
		};
	}

	clearInterval(interval);

}
interval = setInterval( checkAndSet, 1000 );

})();