import {html, render} from 'lit-html';
import {httpget} from "../../common/network";
import {VideoListElement} from "../elements/VideoListElement";
import {MemberElement} from "../elements/MemberElement";
import {MemberDB, VideoDB} from "../../server/storage/dbTypes";
import {Paged} from "../../common/page";

let url_string = window.location.href;
let url = new URL(url_string);
let mid = parseInt(url.searchParams.get("mid")) || 212230;

MemberElement.register();
VideoListElement.register();

const pageTemplate = (member: MemberDB, videos: VideoDB[]) => html`
    <member-element .member=${member}></member-element>
    <videolist-element .videos=${videos}></videolist-element>
`;

let member: MemberDB = null;
let videos: VideoDB[] = null;

httpget(`http://localhost:8081/api/member/mid/${mid}`, (content: string) => {
    member = JSON.parse(content) as MemberDB;
    render(pageTemplate(member, videos), document.body);
});
httpget(`http://localhost:8081/api/video/member/${mid}`, (content: string) => {
    videos = (JSON.parse(content) as Paged<VideoDB>).result;
    render(pageTemplate(member, videos), document.body);
});
