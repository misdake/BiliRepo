import {html, render} from 'lit-html';
import {httpget} from "../../common/network";
import {VideoListElement} from "../elements/VideoListElement";
import {Paged} from "../../common/page";
import {VideoDB} from "../../server/storage/dbTypes";

VideoListElement.register();

const pageTemplate = (videos: VideoDB[]) => html`
    <videolist-element .videos=${videos}></videolist-element>
`;

httpget("http://localhost:8081/api/video/recent", (content: string) => {
    let videos = JSON.parse(content) as Paged<VideoDB>;
    render(pageTemplate(videos.result), document.body);
});
