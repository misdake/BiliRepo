import {css, html, LitElement} from "lit";
import {customElement, property} from "lit/decorators.js";
import {MemberDB} from "../../server/storage/dbTypes";

@customElement('member-element')
export class MemberElement extends LitElement {

    @property()
    member: MemberDB;

    static styles = css`
        :host {
            display: block;
            min-width: 0;
        }
        .member {
            box-sizing: border-box;
            height: var(--member-card-height, 56px);
            padding: var(--member-card-padding, 7px);
            border: 1px solid #e1e6ee;
            border-radius: 10px;
            background: #fff;
            overflow: hidden;
        }
        .member:hover {
            border-color: #b9c8e2;
            background: #fbfcfe;
        }
        a {
            display: flex;
            width: 100%;
            height: 100%;
            min-width: 0;
            align-items: center;
            gap: 9px;
            color: #172033;
            text-decoration: none;
        }
        img {
            flex: 0 0 var(--member-avatar-size, 40px);
            width: var(--member-avatar-size, 40px);
            height: var(--member-avatar-size, 40px);
            border-radius: 50%;
            object-fit: cover;
            background: #eef1f5;
        }
        .name {
            display: -webkit-box;
            flex: 1;
            min-width: 0;
            overflow: hidden;
            font-weight: 600;
            line-height: 1.35;
            overflow-wrap: anywhere;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
        }
    `;

    render() {
        const faceSrc = this.member
            ? `${serverConfig.repoRoot}repo/member/${this.member.mid}.jpg`
            : "";

        return this.member ? html`
            <div class="member"><a href="/index.html?type=2&mid=${this.member.mid}">
                <img src="${faceSrc}" crossOrigin = "Anonymous" alt="face"/>
                <div class="name">${this.member.name}</div>
            </a></div>
        ` : html``;
    }

}
