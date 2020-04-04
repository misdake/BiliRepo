import {customElement, html, LitElement, property} from "lit-element";

@customElement('input-element')
export class InputElement extends LitElement {

    @property()
    buttonText: string;
    @property()
    input: string;

    @property()
    showClearButton: boolean;
    @property()
    checkInput: (input: string) => void;

    createRenderRoot() {
        return this;
    }

    private onInput(input: string) {
        this.input = input;
    }
    private onKeyUp(e: KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            this.trigger();
        }
    }

    private onClearClick() {
        this.input = "";
        this.trigger();
    }

    private trigger() {
        if (this.checkInput) this.checkInput(this.input);
    }

    render() {
        let clearButton = this.showClearButton ? html`<button @click=${() => this.onClearClick()}>清空</button>` : html``;

        return html`
            <input style="width: 200px;" .value="${this.input}"
                @input="${(e: Event) => this.onInput((<HTMLInputElement>e.target).value)}" 
                @keyup="${(e: KeyboardEvent) => this.onKeyUp(e)}" />
            <button @click=${() => this.trigger()}>${this.buttonText}</button>
            ${clearButton}
        `;
    }

}
