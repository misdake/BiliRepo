import {Paged} from "../../common/page";
import {MemberDB, VideoDB} from "../../server/storage/dbTypes";
import {apiget} from "../../common/network";
import {html, TemplateResult} from "lit-html";
import {PagedContainer} from "../elements/PagedContainer";

export enum ViewType {
    video = 1,
    member,
    playlist,
    timestamp,
}

function requestMaker<T>(api: () => string) {
    return (pageindex: number) => {
        return new Promise<Paged<T>>(resolve => {
            apiget(`api/${api()}/${pageindex}`, (content: string) => {
                let r = JSON.parse(content) as Paged<T>;
                resolve(r);
            });
        });
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

    constructor(type: ViewType, title: string, allApi: string, searchApi: string,
                containerRenderer: (loadPage: number,
                                    request: (pageindex: number) => Promise<Paged<T>>,
                                    onContainerLoaded: (element: PagedContainer<T>) => void,
                                    afterLoad: (pageindex: number) => void) => TemplateResult
    ) {
        this.type = type;
        this.title = title;
        this.allRequest = requestMaker<T>(() => allApi);
        this.searchRequestMaker = (input: string) => requestMaker<T>(() => `${searchApi}/${input}`);

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
    ViewType.video, "视频", "video/recent", "video/search",
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
    ViewType.member, "UP主", "member/all", "member/search",
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

export const viewTypes = new Map<ViewType, ViewTypeContent<any, any>>();
viewTypes.set(ViewType.video, viewType_video);
viewTypes.set(ViewType.member, viewType_member);