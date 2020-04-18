import {customElement, html, LitElement, property} from "lit-element";
import {MemberDB} from "../../server/storage/dbTypes";
import "./MemberElement";
import {PagedContainer} from "./PagedContainer";
import {repeat} from "lit-html/directives/repeat";

@customElement('memberlist-element')
export class MemberListElement extends LitElement {

    @property()
    members: MemberDB[];

    createRenderRoot() {
        return this;
    }

    render() {
        return html`
            <ul style="padding: 0; margin: 0 -10px;">
                ${repeat(this.members, (member: MemberDB) => html`<member-element style="float: left; width: 300px; margin: 10px;" .member=${member}></member-element>`)}
            </ul>
        `;
    }

}

@customElement('pagedmember-container')
export class PagedMemberContainer extends PagedContainer<MemberDB> {

    constructor() {
        super();
        super.listRenderer = list => html`<memberlist-element .members=${list.result}></memberlist-element>`;
    }

}
