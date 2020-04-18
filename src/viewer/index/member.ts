import {html, render} from 'lit-html';
import "../elements/MemberElement";
import {MemberDB, VideoDB} from "../../server/storage/dbTypes";
import {Paged} from "../../common/page";
import "../elements/PagedVideoContainer";
import "../elements/GuideElement";
import {ClientApis} from "../common/api/ClientApi";

let url_string = window.location.href;
let url = new URL(url_string);
let mid = parseInt(url.searchParams.get("mid")) || 212230;

function request(page: number) {
    return new Promise<Paged<VideoDB>>(resolve => {
        ClientApis.ListVideoByMember.fetch({mid, page}).then(paged => {
            resolve(paged);
        });
    });
}

const pageTemplate = (member: MemberDB) => html`
    <div style="height: 100%; width: 1280px; max-width: 100%; margin: 0 auto;">
        <div style="margin: 20px 0; position: relative;">
            <div style="position: absolute; right: 0;"><guide-element></guide-element></div>
            <member-element .member=${member}></member-element>
        </div>
        <pagedvideo-container .request=${request}></pagedvideo-container>
    </div>
`;

ClientApis.GetMember.fetch(mid).then(member => {
    render(pageTemplate(member), document.body);
});
