import {html, render} from 'lit-html';
import {apiget} from "../../common/network";
import "../elements/MemberElement";
import {MemberDB, VideoDB} from "../../server/storage/dbTypes";
import {Paged} from "../../common/page";
import "../elements/PagedVideoContainer";
import "../elements/GuideElement";

let url_string = window.location.href;
let url = new URL(url_string);
let mid = parseInt(url.searchParams.get("mid")) || 212230;

function request(pageindex: number) {
    return new Promise(resolve => {
        apiget(`api/video/member/${mid}/${pageindex}`, (content: string) => {
            let r = JSON.parse(content) as Paged<VideoDB>;
            resolve(r);
        });
    });
}

const pageTemplate = (member: MemberDB) => html`
    <div style="height: 100%; width: 1280px; max-width: 100%; margin: 0 auto;">
        <div style="margin: 20px 0; position: relative;">
            <div style="position: absolute; right: 0;"><guide-element></guide-element></div>
            <member-element .member=${member}></member-element>
        </div>
        <pagedvideo-container .request=${request}></pagedvideo-container>
    </div>
`;

let member: MemberDB = null;

apiget(`api/member/mid/${mid}`, (content: string) => {
    member = JSON.parse(content) as MemberDB;
    render(pageTemplate(member), document.body);
});
