import {customElement, html, LitElement, property} from "lit-element";

let count = 0;

@customElement('input-element')
export class InputElement extends LitElement {

    @property()
    placeholder: string;
    @property()
    buttonText: string;
    @property()
    input: string;

    @property()
    hints: { value: string, title: string }[];

    @property()
    showClearButton: boolean;
    @property()
    checkInput: (input: string) => void;

    private index: number;

    constructor() {
        super();
        this.index = count++;
    }

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

        let hintLines = this.hints ? this.hints.map(hint => html`<option value='${hint.value}'>${hint.title}</option>`) : null;
        let hints = hintLines ? html`<datalist id="input_${this.index}">${hintLines}</datalist>` : html``;

        return html`
            <input list="input_${this.index}" style="width: 200px;" .value="${this.input}"
                .placeholder="${this.placeholder || ""}"
                @input="${(e: Event) => this.onInput((<HTMLInputElement>e.target).value)}" 
                @keyup="${(e: KeyboardEvent) => this.onKeyUp(e)}" />
            ${hints}
            <button @click=${() => this.trigger()}>${this.buttonText}</button>
            ${clearButton}
        `;
    }

}
