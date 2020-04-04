import {customElement, html, LitElement, property} from "lit-element";
import {repeat} from "lit-html/directives/repeat";
import "./MemberElement";
import {MemberDB} from "../../server/storage/dbTypes";

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
