import { html, render } from 'lit/html.js';
import './PageElement';
import { Playlist, PlaylistItem } from './Playlist';
import { ClientApis } from '../common/api/ClientApi';
import { PartDB, VideoParts } from '../../server/storage/dbTypes';
import { PageElement } from './PageElement';
import {nonNegativeIntegerParam, positiveIntegerParam} from '../common/url';

const url = new URL(window.location.href);
const pid = positiveIntegerParam(url.searchParams, 'pid');
const aid = positiveIntegerParam(url.searchParams, 'aid');
const part = positiveIntegerParam(url.searchParams, 'p') || 1;
let timestamp = nonNegativeIntegerParam(url.searchParams, 't');

async function loadPlaylist(): Promise<Playlist | undefined> {
    const playlist = new Playlist();
    playlist.items = [];

    if (pid !== undefined) {
        const response = await ClientApis.GetPlaylistVideoParts.fetch(pid);
        if (!response || !Array.isArray(response.videoParts)) return undefined;
        for (let video of response.videoParts) {
            for (let videoPart of video.parts || []) {
                playlist.items.push(new PlaylistItem(video, videoPart));
            }
        }
    } else if (aid !== undefined) {
        const response = await ClientApis.GetVideoParts.fetch(aid);
        if (!response || !Array.isArray(response.parts)) return undefined;
        for (let videoPart of response.parts) {
            playlist.items.push(new PlaylistItem(response, videoPart));
        }
    } else {
        return undefined;
    }

    return playlist.items.length ? playlist : undefined;
}

function renderLoadError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    render(html`
        <div style="width: 1280px; max-width: 100%; margin: 20px auto; color: #B00020;">
            加载视频失败：${message}
            <button @click=${() => window.location.reload()}>重试</button>
            <a href="index.html">返回主页</a>
        </div>
    `, document.body);
}

async function start() {
    if (pid === undefined && aid === undefined) {
        window.location.replace('index.html');
        return;
    }

    render(html`<div style="width: 1280px; max-width: 100%; margin: 20px auto;">加载中…</div>`, document.body);
    const playlist = await loadPlaylist();
    if (!playlist) {
        renderLoadError(new Error('没有找到可播放的视频'));
        return;
    }

    let currentIndex = 0;
    if (aid !== undefined) {
        currentIndex = playlist.items.findIndex(item => aid === item.video.aid && part === item.part.index);
        if (currentIndex < 0) {
            renderLoadError(new Error('指定的视频或分P不在当前列表中'));
            return;
        }
    }

    const onPlayerLoaded = (pageelement: PageElement) => {
        if (timestamp !== undefined) {
            pageelement.player.setTimeOnCanplay(timestamp);
            timestamp = undefined;
        }
    };

    const onBeginPart = (video: VideoParts, currentPart: PartDB) => {
        const params = new URLSearchParams();
        if (pid !== undefined) params.set('pid', String(pid));
        params.set('aid', String(video.aid));
        params.set('p', String(currentPart.index));
        history.replaceState(null, '', `${location.pathname}?${params.toString()}`);
    };

    render(html`
        <watch-page-element .onBeginPart=${onBeginPart} .onPlayerLoaded=${onPlayerLoaded} .playlist=${playlist} .playindex=${currentIndex}></watch-page-element>
    `, document.body);
}

start().catch(renderLoadError);
