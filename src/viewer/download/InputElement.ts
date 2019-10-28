import {css, html, LitElement, property} from "lit-element";

export class InputElement extends LitElement {

    static register() {
        customElements.define('input-element', InputElement);
    }

    @property()
    input: string;

    @property()
    checkInput: (input: string) => void;

    static styles = css`
        input {
            width: 200px;
        }
    `;

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

    render() {
        return html`
            <input value="${this.input}"
                @input="${(e: Event) => this.onInput((<HTMLInputElement>e.target).value)}" 
                @keyup="${(e: KeyboardEvent) => this.onKeyUp(e)}" />
            <button @click=${() => this.trigger()}>check</button>
        `;
    }

}