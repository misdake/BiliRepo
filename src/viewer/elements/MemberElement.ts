import {css, html, LitElement, property} from "lit-element";
import {MemberDB} from "../../server/storage/dbTypes";

export class MemberElement extends LitElement {

    static register() {
        customElements.define('member-element', MemberElement);
    }

    @property()
    member: MemberDB;

    static styles = css`
        .member {
            margin: 0 10px;
            width: 236px;
            height: 64px;
            overflow: hidden;
        }
        img {
            float: left;
            width: 64px;
            height: 64px;
            object-fit: cover;
        }
        .name {
            margin-left: 10px;
            float: left;
            width: 152px;
            height: 64px;
        }
    `;

    render() {
        return this.member ? html`
            <div class="member"><a href="/member.html?mid=${this.member.mid}">
                <img src="${this.member.face}" crossOrigin = "Anonymous" alt="face"/>
                <div class="name">${this.member.name}</div>
            </a></div>
        ` : html``;
    }

}