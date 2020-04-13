import {html, render} from 'lit-html';
import "../elements/PagedVideoContainer";
import "../elements/PagedMemberContainer";
import "../elements/ViewTypeElement";
import "../elements/InputElement";
import {ViewType, ViewTypeContent, viewTypes} from "./indexViewType";
import {ClientApis} from "../common/api/ClientApi";

let url_string = window.location.href;
let url = new URL(url_string);
let loadpage = parseInt(url.searchParams.get("page") || "1");
let viewtype = parseInt(url.searchParams.get("type") || "1");
let searchInput = url.searchParams.get("search") && decodeURIComponent(url.searchParams.get("search"));

function replaceUrl(type: ViewType, pageindex: number, input: string) {
    viewtype = type || viewtype;
    loadpage = pageindex || loadpage;
    searchInput = input || searchInput;
    let url = `${location.pathname}?type=${viewtype}&page=${loadpage}`;
    if (searchInput) url += `&search=${encodeURIComponent(searchInput)}`;
    history.replaceState(null, "", url);
}

let currentViewType: ViewType = undefined;
let currentViewTypeContent: ViewTypeContent<any, any>;

function setViewType(viewType: ViewType) {
    if (viewType !== currentViewType) {
        if (currentViewType) searchInput = "";
        currentViewType = viewType;
        currentViewTypeContent = viewTypes.get(viewType);
        renderPage();
    }
}

function checkInput(input: string) {
    searchInput = input;
    currentViewTypeContent.search(input);
}

const pageTemplate = () => {
    let container = currentViewTypeContent.render(loadpage, searchInput, replaceUrl);
    document.title = currentViewTypeContent.title;
    return html`
        <div style="height: 100%; width: 1280px; max-width: 100%; margin: 0 auto;">
            <div style="margin: 0; position: relative;">
                <div style="position: absolute; right: 0; bottom: 0;">
                    <viewtype-element .selectedType=${currentViewType} .afterLoad=${(type: ViewType, pageindex: number) => replaceUrl(type, pageindex, searchInput)} .onClick=${(viewType: ViewType) => setViewType(viewType)}></viewtype-element>
                </div>
                <h1 style="margin: 20px 0;">
                    ${currentViewTypeContent.title}
                    <input-element .input=${searchInput} .buttonText=${"搜索"} .checkInput="${(input: string) => checkInput(input)}" .showClearButton=${true}></input-element>
                </h1>
            </div>
            ${container}
        </div>
    `;
};

function renderPage() {
    render(pageTemplate(), document.body);
}

setViewType(viewtype); //will render page

//TODO
ClientApis.GetVideo.run(327709504).then(value => {
    console.log(value);
});