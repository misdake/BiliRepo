import {customElement, html} from "lit-element";
import {VideoDB} from "../../server/storage/dbTypes";
import "./VideoListElement";
import {PagedContainer} from "./PagedContainer";

@customElement('pagedvideo-container')
export class PagedVideoContainer extends PagedContainer<VideoDB> {

    constructor() {
        super();
        super.listRenderer = list => html`<videolist-element .videos=${list.result}></videolist-element>`
    }

}
