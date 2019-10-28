import {html, render} from 'lit-html';
import {httpget} from "../../common/network";
import {DownloadStatus} from "../../common/DownloadStatus";

const pageTemplate = (status: DownloadStatus) => html`

`;

httpget("http://localhost:8081/download/status", (content: string) => {
    let status = JSON.parse(content) as DownloadStatus;

    render(pageTemplate(status), document.body);
});
