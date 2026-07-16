import {css, html, LitElement} from "lit";
import {customElement, property} from "lit/decorators.js";

export const mediaGridStyles = css`
    ul {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        padding: 0;
        margin: 0;
        list-style: none;
    }
`;

@customElement("media-card-element")
export class MediaCardElement extends LitElement {
    @property()
    href: string = "";
    @property({type: Number})
    thumbnailAid: number;
    @property()
    title: string = "";

    render() {
        return html`
            <li class="media-card">
                <a href=${this.href}>
                    <div class="thumb-container">
                        <img class="thumb" src="${serverConfig.repoRoot}repo/${this.thumbnailAid}/thumb.jpg" alt="thumb"/>
                    </div>
                    <span class="title"><span class="title-text">${this.title}</span></span>
                </a>
            </li>
        `;
    }

    static styles = css`
        :host {
            display: block;
            min-width: 0;
            height: 100%;
        }
        .media-card {
            display: block;
            min-width: 0;
            height: 100%;
            padding: 0;
            border: 1px solid #e1e6ee;
            border-radius: 10px;
            background: #fff;
            overflow: hidden;
            transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease;
        }
        .media-card:hover {
            border-color: #b9c8e2;
            box-shadow: 0 8px 20px rgba(16, 24, 40, .08);
            transform: translateY(-1px);
        }
        a {
            display: block;
            color: #172033;
            text-decoration: none;
        }
        .thumb-container {
            position: relative;
            width: 100%;
            aspect-ratio: 16 / 9;
            background: #eef1f5;
        }
        .thumb {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .title {
            display: block;
            box-sizing: border-box;
            height: 54px;
            min-height: 0;
            max-height: 54px;
            padding: 7px 10px;
            overflow: hidden;
            font-weight: 600;
        }
        .title-text {
            display: -webkit-box;
            max-height: 40px;
            overflow: hidden;
            line-height: 20px;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
        }
    `;
}
