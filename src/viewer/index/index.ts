import {html, render} from 'lit-html';
import {apiget} from "../../common/network";
import {Paged} from "../../common/page";
import {VideoDB} from "../../server/storage/dbTypes";
import "../elements/PagedVideoContainer";
import "../elements/Guide2Element";
import "../elements/InputElement";
import {PagedVideoContainer} from "../elements/PagedVideoContainer";

function requestMaker<T>(api: () => string) {
    return (pageindex: number) => {
        return new Promise<Paged<T>>(resolve => {
            apiget(`/api/${api()}/${pageindex}`, (content: string) => {
                let r = JSON.parse(content) as Paged<T>;
                resolve(r);
            });
        });
    };
}

interface ViewType<T> {
    name: string,
    allRequest: (pageindex: number) => Promise<Paged<T>>;
    searchRequestMaker: (input: number) => (pageindex: number) => Promise<Paged<T>>;
}

const ViewType_Video = {
    name: "video",
    allRequest: requestMaker<VideoDB>(() => "video/recent"),
    searchRequestMaker: (input: string) => requestMaker<VideoDB>(() => `video/search/${input}`),
};

let viewtype = ViewType_Video;

let currentRequest = viewtype.allRequest;

let url_string = window.location.href;
let url = new URL(url_string);
let loadpage = parseInt(url.searchParams.get("page") || "1");
function replaceUrl(pageindex: number) { //TODO add view type and search content to url.
    let url = `${location.pathname}?page=${pageindex}`;
    history.replaceState(null, "", url);
}

let pagedVideoContainer: PagedVideoContainer;
let onElementLoaded = (element: PagedVideoContainer) => {
    pagedVideoContainer = element;
};

function checkInput(input: string) {
    input = input.trim();
    if (input.length) {
        pagedVideoContainer.request = viewtype.searchRequestMaker(input);
    } else {
        pagedVideoContainer.request = viewtype.allRequest;
    }

    pagedVideoContainer.loadPage(1);
}

const pageTemplate = () => html`
    <div style="height: 100%; width: 1280px; max-width: 100%; margin: 0 auto;">
        <div style="margin: 0; position: relative;">
            <div style="position: absolute; right: 0;"><guide2-element></guide2-element></div>
            <h1 style="margin: 20px 0;">
                视频
                <input-element .input=${""} .buttonText=${"搜索"} .checkInput="${(input: string) => checkInput(input)}" .showClearButton=${true}></input-element>
            </h1>
        </div>
        <pagedvideo-container .request=${currentRequest} .onElementLoaded=${onElementLoaded} .firstLoadPage=${loadpage} .afterLoad=${replaceUrl}></pagedvideo-container>
    </div>
`;

function renderPage() {
    render(pageTemplate(), document.body);
}

renderPage();
