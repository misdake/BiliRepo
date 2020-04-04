import {html, render} from 'lit-html';
import "../elements/PagedVideoContainer";
import "../elements/PagedMemberContainer";
import "../elements/ViewTypeElement";
import "../elements/InputElement";
import {ViewType, ViewTypeContent, viewTypes} from "./indexViewType";

let url_string = window.location.href;
let url = new URL(url_string);
let loadpage = parseInt(url.searchParams.get("page") || "1");
function replaceUrl(pageindex: number) { //TODO add view type and search content to url.
    let url = `${location.pathname}?page=${pageindex}`;
    history.replaceState(null, "", url);
}


let currentViewType: ViewType = undefined;
let currentViewTypeContent: ViewTypeContent<any, any>;

function setViewType(viewType: ViewType) {
    console.log("setViewType", viewType, currentViewType);
    if (viewType !== currentViewType) {
        //TODO clear search input
        currentViewType = viewType;
        currentViewTypeContent = viewTypes.get(viewType);
        renderPage();
    }
}

function checkInput(input: string) {
    currentViewTypeContent.search(input);
}

const pageTemplate = () => {
    let container = currentViewTypeContent.render(loadpage);
    return html`
        <div style="height: 100%; width: 1280px; max-width: 100%; margin: 0 auto;">
            <div style="margin: 0; position: relative;">
                <div style="position: absolute; right: 0; bottom: 0;">
                    <viewtype-element .selectedType=${currentViewType} .onClick=${(viewType: ViewType) => setViewType(viewType)}></viewtype-element>
                </div>
                <h1 style="margin: 20px 0;">
                    ${currentViewTypeContent.title}
                    <input-element .input=${""} .buttonText=${"搜索"} .checkInput="${(input: string) => checkInput(input)}" .showClearButton=${true}></input-element>
                </h1>
            </div>
            ${container}
        </div>
    `;
};

function renderPage() {
    render(pageTemplate(), document.body);
}

setViewType(ViewType.video); //will render page
