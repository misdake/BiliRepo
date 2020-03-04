import {html, render} from 'lit-html';
import {httpget} from "../../common/network";
import "../elements/MemberElement";
import {MemberDB, VideoDB} from "../../server/storage/dbTypes";
import {Paged} from "../../common/page";
import "../elements/PagedVideoContainer";

let url_string = window.location.href;
let url = new URL(url_string);
let mid = parseInt(url.searchParams.get("mid")) || 212230;

function request(pageindex: number) {
    return new Promise(resolve => {
        httpget(`http://localhost:8081/api/video/member/${mid}/${pageindex}`, (content: string) => {
            let r = JSON.parse(content) as Paged<VideoDB>;
            resolve(r);
        });
    });
}

const pageTemplate = (member: MemberDB) => html`
    <member-element .member=${member}></member-element>
    <pagedvideo-container .request=${request}></pagedvideo-container>
`;

let member: MemberDB = null;

httpget(`http://localhost:8081/api/member/mid/${mid}`, (content: string) => {
    member = JSON.parse(content) as MemberDB;
    render(pageTemplate(member), document.body);
});
