import {BilibiliVideo} from "../../common/types";
import {html, render} from 'lit-html';
import {httpget} from "../../common/network";
import {VideoListElement} from "../elements/VideoListElement";

VideoListElement.register();

const pageTemplate = (videos: BilibiliVideo[]) => html`
    <videolist-element .videos=${videos}></videolist-element>
`;

httpget("http://localhost:8081/api/video/recent", (content: string) => {
    let videos = JSON.parse(content) as BilibiliVideo[];
    render(pageTemplate(videos), document.body);
});
