import { html, render } from 'lit/html.js';
import "../elements/PagedVideoContainer";
import "../elements/PagedMemberContainer";
import "../elements/PagedPlaylistContainer";
import "../elements/PagedTimestampContainer";
import "../elements/ViewTypeElement";
import "../elements/InputElement";
import { ViewType, ViewTypeContent, viewTypes } from "./indexViewType";
import {positiveIntegerParam} from "../common/url";

let url = new URL(window.location.href);
let loadpage = positiveIntegerParam(url.searchParams, "page") || 1;
let requestedViewType = positiveIntegerParam(url.searchParams, "type") as ViewType;
let viewtype = viewTypes.has(requestedViewType) ? requestedViewType : ViewType.video;
let searchInput = url.searchParams.get("search") || "";

function replaceUrl(type?: ViewType, pageindex?: number, input?: string) {
    if (type !== undefined && viewTypes.has(type)) viewtype = type;
    if (pageindex !== undefined && Number.isSafeInteger(pageindex) && pageindex >= 1) loadpage = pageindex;
    if (input !== undefined) searchInput = input;
    let url = `${location.pathname}?type=${viewtype}&page=${loadpage}`;
    if (searchInput) url += `&search=${encodeURIComponent(searchInput)}`;
    history.replaceState(null, "", url);
}

let currentViewType: ViewType = undefined;
let currentViewTypeContent: ViewTypeContent<any, any>;

function setViewType(viewType: ViewType) {
    if (!viewTypes.has(viewType)) viewType = ViewType.video;
    if (viewType !== currentViewType) {
        if (currentViewType !== undefined) {
            loadpage = 1;
            searchInput = "";
        }
        currentViewType = viewType;
        currentViewTypeContent = viewTypes.get(viewType);
        renderPage();
    }
}

function checkInput(input: string) {
    searchInput = (input || "").trim();
    loadpage = 1;
    currentViewTypeContent.search(searchInput, loadpage);
}

const pageTemplate = () => {
    let container = currentViewTypeContent.render(loadpage, searchInput, replaceUrl);
    document.title = currentViewTypeContent.title;
    return html`
        <div style="height: 100%; width: 1280px; max-width: 100%; margin: 0 auto;">
            <div style="margin: 0; position: relative;">
                <div style="position: absolute; right: 0; bottom: 0;">
                    <viewtype-element .selectedType=${currentViewType} .afterLoad=${(type: ViewType, pageindex: number) => replaceUrl(type, 1, searchInput)} .onClick=${(viewType: ViewType) => setViewType(viewType)}></viewtype-element>
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
