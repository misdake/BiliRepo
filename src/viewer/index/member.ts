import {html, render} from 'lit/html.js';
import "../elements/MemberElement";
import {MemberDB} from "../../server/storage/dbTypes";
import "../elements/PagedVideoContainer";
import "../elements/GuideElement";
import {ClientApis} from "../common/api/ClientApi";
import {positiveIntegerParam} from "../common/url";

let url = new URL(window.location.href);
let mid = positiveIntegerParam(url.searchParams, "mid") || 212230;

function request(page: number) {
    return ClientApis.ListVideoByMember.fetch({mid, page});
}

const pageTemplate = (member: MemberDB) => html`
    <div style="height: 100%; width: 1280px; max-width: 100%; margin: 0 auto;">
        <div style="margin: 20px 0; position: relative;">
            <div style="position: absolute; right: 0;">
                <guide-element></guide-element>
                <a style="text-decoration: none; padding: 0; color: blue;" target="_blank" rel="noopener noreferrer" href="https://space.bilibili.com/${mid}">B站链接</a>
            </div>
            <member-element .member=${member}></member-element>
        </div>
        <pagedvideo-container .request=${request}></pagedvideo-container>
    </div>
`;

render(html`<div style="width: 1280px; max-width: 100%; margin: 20px auto;">加载中…</div>`, document.body);
ClientApis.GetMember.fetch(mid).then(member => {
    if (!member) throw new Error("没有找到该UP主");
    render(pageTemplate(member), document.body);
}).catch(error => {
    const message = error instanceof Error ? error.message : String(error);
    render(html`<div style="width: 1280px; max-width: 100%; margin: 20px auto; color: #B00020;">加载UP主失败：${message} <button @click=${() => window.location.reload()}>重试</button> <a href="index.html?type=2">返回UP主列表</a></div>`, document.body);
});
