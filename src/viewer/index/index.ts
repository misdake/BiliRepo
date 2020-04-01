import {html, render} from 'lit-html';
import {httpget} from "../../common/network";
import {Paged} from "../../common/page";
import {VideoDB} from "../../server/storage/dbTypes";
import "../elements/PagedVideoContainer";

function request(pageindex: number) {
    return new Promise(resolve => {
        httpget(`http://localhost:8081/api/video/recent/${pageindex}`, (content: string) => {
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

const pageTemplate = html`
    <pagedvideo-container .request=${request} .loadpage=${loadpage} .afterLoad=${replaceUrl}></pagedvideo-container>
`;

render(pageTemplate, document.body);
