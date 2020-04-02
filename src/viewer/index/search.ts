import {html, render} from 'lit-html';
import {apiget} from "../../common/network";
import {Paged} from "../../common/page";
import {VideoDB} from "../../server/storage/dbTypes";
import "../elements/PagedVideoContainer";
import "../elements/GuideElement";
import "../elements/InputElement";

function request(pageindex: number) {
    return new Promise(resolve => {
        apiget(`/api/video/recent/${pageindex}`, (content: string) => {
            let r = JSON.parse(content) as Paged<VideoDB>;
            resolve(r);
        });
    });
}

let url_string = window.location.href;
let url = new URL(url_string);
let loadpage = parseInt(url.searchParams.get("page") || "1");
function replaceUrl(pageindex: number) {
    let url = `${location.pathname}?page=${pageindex}`;
    history.replaceState(null, "", url);
}

function checkInput(input: string) {
    console.log(input);
}

//TODO 可搜索内容：视频 up主 视频列表 视频节点

const pageTemplate = html`
    <div style="height: 100%; width: 1280px; max-width: 100%; margin: 0 auto;">
        <div style="margin: 0; position: relative;">
            <div style="position: absolute; right: 0;"><guide-element></guide-element></div>
            <h1 style="margin: 20px 0;">搜索<input-element .input=${""} .buttonText=${"搜索"} .checkInput="${(input: string) => checkInput(input)}"></input-element></h1>
        </div>
        <pagedvideo-container .request=${request} .loadpage=${loadpage} .afterLoad=${replaceUrl}></pagedvideo-container>
    </div>
`;

render(pageTemplate, document.body);
