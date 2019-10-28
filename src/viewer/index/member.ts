import {BilibiliMember, BilibiliVideo} from "../../common/types";
import {html, render} from 'lit-html';
import {httpget} from "../../common/network";
import {VideoListElement} from "../elements/VideoListElement";
import {MemberElement} from "../elements/MemberElement";

let url_string = window.location.href;
let url = new URL(url_string);
let mid = parseInt(url.searchParams.get("mid")) || 212230;

MemberElement.register();
VideoListElement.register();

const pageTemplate = (member: BilibiliMember, videos: BilibiliVideo[]) => html`
    <member-element .member=${member}></member-element>
    <videolist-element .videos=${videos}></videolist-element>
`;

let member: BilibiliMember = null;
let videos: BilibiliVideo[] = null;

httpget(`http://localhost:8081/api/member/${mid}`, (content: string) => {
    member = JSON.parse(content) as BilibiliMember;
    render(pageTemplate(member, videos), document.body);
});
httpget(`http://localhost:8081/api/video/member/${mid}`, (content: string) => {
    videos = JSON.parse(content) as BilibiliVideo[];
    render(pageTemplate(member, videos), document.body);
});
