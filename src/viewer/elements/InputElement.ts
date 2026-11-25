import {css, html, LitElement} from "lit";
import {customElement, property} from "lit/decorators.js";

@customElement('input-element')
export class InputElement extends LitElement {

    @property()
    placeholder: string = "";
    @property()
    buttonText: string = "确定";
    @property()
    input: string = "";
    @property()
    showClearButton: boolean = false;

    @property()
    checkInput: (input: string) => void;

    private onInput(input: string) {
        this.input = input;
    }
    private onKeyUp(e: KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            this.trigger();
        }
    }

    private trigger() {
        if (this.checkInput) this.checkInput(this.input);
    }

    private clear() {
        this.input = "";
        this.trigger();
    }

    render() {

        return html`
            <div class="input-group">
                <input .value=${this.input || ""}
                    .placeholder=${this.placeholder || ""}
                    @input=${(e: Event) => this.onInput((e.target as HTMLInputElement).value)}
                    @keyup=${(e: KeyboardEvent) => this.onKeyUp(e)} />
                <button class="primary" @click=${() => this.trigger()}>${this.buttonText}</button>
                ${this.showClearButton ? html`<button class="clear" @click=${() => this.clear()}>清空</button>` : html``}
            </div>
        `;
    }

    static styles = css`
        :host {
            display: inline-block;
        }
        .input-group {
            display: flex;
            width: 100%;
            align-items: center;
            gap: 7px;
        }
        input {
            box-sizing: border-box;
            flex: 1 1 auto;
            min-width: 0;
            width: var(--input-width, 200px);
            height: var(--control-height, 38px);
            padding: 0 11px;
            border: 1px solid #d0d5dd;
            border-radius: 8px;
            background: #fff;
            color: #172033;
            font: inherit;
            outline: none;
        }
        input:focus {
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, .12);
        }
        button {
            box-sizing: border-box;
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: var(--control-height, 38px);
            padding: 0 13px;
            border: 1px solid #d0d5dd;
            border-radius: 8px;
            background: #fff;
            color: #344054;
            font: inherit;
            white-space: nowrap;
            cursor: pointer;
            transition: background-color .15s ease, border-color .15s ease;
        }
        button:hover {
            background: #f8fafc;
        }
        button.primary {
            border-color: #2563eb;
            background: #2563eb;
            color: #fff;
        }
        button.primary:hover {
            background: #1d4ed8;
        }
        button.clear {
            color: #667085;
        }
    `;

}
