import {html, render} from 'lit-html';
import {httpget} from "../../common/network";
import {Paged} from "../../common/page";
import {VideoDB} from "../../server/storage/dbTypes";
import {PagedVideoContainer} from "../elements/PagedVideoContainer";

PagedVideoContainer.register();

function request(pageindex: number) {
    return new Promise(resolve => {
        httpget(`http://localhost:8081/api/video/recent/${pageindex}`, (content: string) => {
            let r = JSON.parse(content) as Paged<VideoDB>;
            resolve(r);
        });
    });
}

const pageTemplate = html`
    <pagedvideo-container .request=${request}></pagedvideo-container>
`;

render(pageTemplate, document.body);
