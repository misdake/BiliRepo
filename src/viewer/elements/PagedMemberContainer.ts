import {css, html, LitElement} from "lit";
import {customElement, property} from "lit/decorators.js";
import {MemberDB} from "../../server/storage/dbTypes";
import "./MemberElement";
import {PagedContainer} from "./PagedContainer";
import {repeat} from "lit/directives/repeat.js";

@customElement('memberlist-element')
export class MemberListElement extends LitElement {

    @property()
    members: MemberDB[];

    render() {
        return html`
            <ul>
                ${repeat(this.members, (member: MemberDB) => html`<member-element .member=${member}></member-element>`)}
            </ul>
        `;
    }

    static styles = css`
        ul {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
            padding: 0;
            margin: 0;
            list-style: none;
        }
    `;

}

@customElement('pagedmember-container')
export class PagedMemberContainer extends PagedContainer<MemberDB> {

    constructor() {
        super();
        this.listRenderer = list => html`
            <memberlist-element .members=${list.result}></memberlist-element>`;
    }

}
