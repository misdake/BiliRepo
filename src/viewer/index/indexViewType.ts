import {Paged} from "../../common/page";
import {MemberDB, PlaylistDB, VideoDB} from "../../server/storage/dbTypes";
import {html, TemplateResult} from "lit-html";
import {PagedContainer} from "../elements/PagedContainer";
import {ApiGet} from "../../common/api/Api";
import {ClientApis} from "../common/api/ClientApi";

export enum ViewType {
    video = 1,
    member,
    playlist,
    timestamp,
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

export class ViewTypeContent<T, viewType extends ViewType> {
    type: ViewType;
    title: string;
    allRequest: (pageindex: number) => Promise<Paged<T>>;
    searchRequestMaker: (input: string) => (pageindex: number) => Promise<Paged<T>>;

    private container: PagedContainer<T>;
    private containerRenderer: (loadPage: number,
                                request: (pageindex: number) => Promise<Paged<T>>,
                                onContainerLoaded: (element: PagedContainer<T>) => void,
                                afterLoad: (pageindex: number) => void) => TemplateResult;

    constructor(type: ViewType, title: string, allApi: ApiGet<number, Paged<T>>, searchApi: ApiGet<{ input: string, page: number }, Paged<T>>,
                containerRenderer: (loadPage: number,
                                    request: (pageindex: number) => Promise<Paged<T>>,
                                    onContainerLoaded: (element: PagedContainer<T>) => void,
                                    afterLoad: (pageindex: number) => void) => TemplateResult
    ) {
        this.type = type;
        this.title = title;
        this.allRequest = requestListMaker<T>(allApi);
        this.searchRequestMaker = (input: string) => requestSearchMaker<T>(input, searchApi);

        this.containerRenderer = containerRenderer;
    }

    search(input: string) {
        input = input || "";
        input = input.trim();
        if (input.length) {
            this.container.request = this.searchRequestMaker(input);
        } else {
            this.container.request = this.allRequest;
        }
        this.container.loadPage(1);
    }
    render(loadPage: number, firstSearch: string, afterLoad: (type: ViewType, pageindex: number, input: string) => void) {
        let onContainerLoaded = (element: PagedContainer<T>) => {
            this.container = element;
            this.search(firstSearch);
        };
        return this.containerRenderer(loadPage, this.allRequest, onContainerLoaded, pageindex => afterLoad(this.type, pageindex, undefined));
    }
}

const viewType_video: ViewTypeContent<VideoDB, ViewType.video> = new ViewTypeContent<VideoDB, ViewType.video>(
    ViewType.video, "视频", ClientApis.ListVideo, ClientApis.SearchVideo,
    (loadPage, request, onContainerLoaded, afterLoad) => {
        return html`
            <pagedvideo-container
                .autoLoad=${false}
                .request=${request} 
                .onElementLoaded=${onContainerLoaded} 
                .firstLoadPage=${loadPage} 
                .afterLoad=${afterLoad}
            ></pagedvideo-container>
        `;
    }
);

const viewType_member: ViewTypeContent<MemberDB, ViewType.member> = new ViewTypeContent<MemberDB, ViewType.member>(
    ViewType.member, "UP主", ClientApis.ListMember, ClientApis.SearchMember,
    (loadPage, request, onContainerLoaded, afterLoad) => {
        return html`
            <pagedmember-container
                .autoLoad=${false}
                .request=${request} 
                .onElementLoaded=${onContainerLoaded} 
                .firstLoadPage=${loadPage} 
                .afterLoad=${afterLoad}
            ></pagedmember-container>
        `;
    }
);

const viewType_playlist: ViewTypeContent<PlaylistDB, ViewType.playlist> = new ViewTypeContent<PlaylistDB, ViewType.playlist>(
    ViewType.playlist, "播放列表", ClientApis.ListPlaylist, ClientApis.SearchPlaylist,
    (loadPage, request, onContainerLoaded, afterLoad) => {
        return html`
            <pagedplaylist-container
                .autoLoad=${false}
                .request=${request} 
                .onElementLoaded=${onContainerLoaded} 
                .firstLoadPage=${loadPage} 
                .afterLoad=${afterLoad}
            ></pagedplaylist-container>
        `;
    }
);

export const viewTypes = new Map<ViewType, ViewTypeContent<any, any>>();
viewTypes.set(ViewType.video, viewType_video);
viewTypes.set(ViewType.member, viewType_member);
viewTypes.set(ViewType.playlist, viewType_playlist);