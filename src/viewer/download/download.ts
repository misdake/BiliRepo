import {httpget} from "../../common/network";
import {DownloadStatus, VideoStatus} from "../../common/DownloadStatus";

import {html} from "lit-element";
import {render} from "lit-html";
import {repeat} from "lit-html/directives/repeat";
import {VideoStatusElement} from "./VideoStatusElement";

VideoStatusElement.register();

const pageTemplate = (status: DownloadStatus) => html`
    <ul>
        ${repeat(status.queue, (v: VideoStatus) => html`<videostatus-element .video=${v}></videostatus-element>`)}
    </ul>
`;

httpget("http://localhost:8081/download/status", (content: string) => {
    let status = JSON.parse(content) as DownloadStatus;
    render(pageTemplate(status), document.body);
});

