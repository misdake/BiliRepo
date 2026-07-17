import {Paged} from "../../common/page";
import {MemberDB, PlaylistDB, Timestamp, VideoDB} from "../../server/storage/dbTypes";
import {html, type TemplateResult} from "lit/html.js";
import {ApiGet} from "../../common/api/Api";
import {ClientApis} from "../common/api/ClientApi";

export enum ViewType {
    video = 1,
    member,
    playlist,
    timestamp,
    download,
}

function requestListMaker<T>(api: ApiGet<number, Paged<T>>) {
    return (page: number) => {
        return api.fetch(page);
    };
}
function requestSearchMaker<T>(input: string, api: ApiGet<{ input: string, page: number }, Paged<T>>) {
    return (page: number) => {
        return api.fetch({input, page});
    };
}

type ContainerRenderer<T> = (
    request: (pageindex: number) => Promise<Paged<T>>,
    searchInput: string,
    onSearch: (input: string) => void,
    afterLoad: (pageindex: number) => void,
    firstLoadPage: number) => TemplateResult;

// pure per-tab configuration: title, list/search requests and the container
// template. Holds no element references; the page state flows into the
// container through properties.
export class ViewTypeContent<T, viewType extends ViewType> {
    type: ViewType;
    title: string;
    allRequest: (pageindex: number) => Promise<Paged<T>>;
    searchRequestMaker: (input: string) => (pageindex: number) => Promise<Paged<T>>;
    containerRenderer: ContainerRenderer<T>;

    constructor(type: ViewType, title: string, allApi: ApiGet<number, Paged<T>>, searchApi: ApiGet<{ input: string, page: number }, Paged<T>>,
        containerRenderer: ContainerRenderer<T>
    ) {
        this.type = type;
        this.title = title;
        this.allRequest = requestListMaker<T>(allApi);
        this.searchRequestMaker = (input: string) => requestSearchMaker<T>(input, searchApi);

        this.containerRenderer = containerRenderer;
    }

    requestFor(input: string) {
        input = (input || "").trim();
        return input.length ? this.searchRequestMaker(input) : this.allRequest;
    }

    render(loadPage: number, searchInput: string, onSearch: (input: string) => void, afterLoad: (pageindex: number) => void) {
        return this.containerRenderer(this.requestFor(searchInput), searchInput, onSearch, afterLoad, loadPage);
    }
}

const viewType_video: ViewTypeContent<VideoDB, ViewType.video> = new ViewTypeContent<VideoDB, ViewType.video>(
    ViewType.video, "视频", ClientApis.ListVideo, ClientApis.SearchVideo,
    (request, searchInput, onSearch, afterLoad, firstLoadPage) => {
        return html`
            <pagedvideo-container
                .request=${request}
                .searchInput=${searchInput}
                .onSearch=${onSearch}
                .afterLoad=${afterLoad}
                .firstLoadPage=${firstLoadPage}
            ></pagedvideo-container>
        `;
    }
);

const viewType_member: ViewTypeContent<MemberDB, ViewType.member> = new ViewTypeContent<MemberDB, ViewType.member>(
    ViewType.member, "UP主", ClientApis.ListMember, ClientApis.SearchMember,
    (request, searchInput, onSearch, afterLoad, firstLoadPage) => {
        return html`
            <pagedmember-container
                .request=${request}
                .searchInput=${searchInput}
                .onSearch=${onSearch}
                .afterLoad=${afterLoad}
                .firstLoadPage=${firstLoadPage}
            ></pagedmember-container>
        `;
    }
);

const viewType_playlist: ViewTypeContent<PlaylistDB, ViewType.playlist> = new ViewTypeContent<PlaylistDB, ViewType.playlist>(
    ViewType.playlist, "播放列表", ClientApis.ListPlaylist, ClientApis.SearchPlaylist,
    (request, searchInput, onSearch, afterLoad, firstLoadPage) => {
        return html`
            <pagedplaylist-container
                .request=${request}
                .searchInput=${searchInput}
                .onSearch=${onSearch}
                .afterLoad=${afterLoad}
                .firstLoadPage=${firstLoadPage}
            ></pagedplaylist-container>
        `;
    }
);

const viewType_timestamp: ViewTypeContent<Timestamp, ViewType.timestamp> = new ViewTypeContent<Timestamp, ViewType.timestamp>(
    ViewType.timestamp, "时间点", ClientApis.ListTimestamp, ClientApis.SearchTimestamp,
    (request, searchInput, onSearch, afterLoad, firstLoadPage) => {
        return html`
            <pagedtimestamp-container
                .request=${request}
                .searchInput=${searchInput}
                .onSearch=${onSearch}
                .afterLoad=${afterLoad}
                .firstLoadPage=${firstLoadPage}
            ></pagedtimestamp-container>
        `;
    }
);

export const viewTypes = new Map<ViewType, ViewTypeContent<any, any>>();
viewTypes.set(ViewType.video, viewType_video);
viewTypes.set(ViewType.member, viewType_member);
viewTypes.set(ViewType.playlist, viewType_playlist);
viewTypes.set(ViewType.timestamp, viewType_timestamp);

export function isViewType(type: ViewType) {
    return type === ViewType.download || viewTypes.has(type);
}
