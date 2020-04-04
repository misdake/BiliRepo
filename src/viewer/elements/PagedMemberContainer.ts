import {customElement, html} from "lit-element";
import {MemberDB} from "../../server/storage/dbTypes";
import "./MemberListElement";
import {PagedContainer} from "./PagedContainer";

@customElement('pagedmember-container')
export class PagedMemberContainer extends PagedContainer<MemberDB> {

    constructor() {
        super();
        super.listRenderer = list => html`<memberlist-element .members=${list.result}></memberlist-element>`
    }

}
