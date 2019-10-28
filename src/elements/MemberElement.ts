import {css, html, LitElement, property} from "lit-element";
import {BilibiliMember, BilibiliVideo} from "../common/types";

export class MemberElement extends LitElement {

    static register() {
        customElements.define('member-element', MemberElement);
    }

    @property()
    member: BilibiliMember;

    static styles = css`
        img {
            max-width:64px;
            max-height:64px;
        }
    `;

    render() {
        return this.member ? html`
            <a href="/member.html?mid=${this.member.mid}">
                <img src="${this.member.face}" crossOrigin = "Anonymous" alt="face"/>
                <span>${this.member.name}</span>
            </a>
        ` : html``;
    }

}