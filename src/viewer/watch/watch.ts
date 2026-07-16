import { html, render } from 'lit/html.js';
import './PageElement';
import { Playlist, PlaylistItem } from './Playlist';
import { ClientApis } from '../common/api/ClientApi';
import { PartDB, VideoParts } from '../../server/storage/dbTypes';
import { PageElement } from './PageElement';
import {nonNegativeIntegerParam, positiveIntegerParam} from '../common/url';

document.documentElement.classList.add('watch-page');
document.body.classList.add('watch-page');

const url = new URL(window.location.href);
const pid = positiveIntegerParam(url.searchParams, 'pid');
const aid = positiveIntegerParam(url.searchParams, 'aid');
const part = positiveIntegerParam(url.searchParams, 'p') || 1;
let timestamp = nonNegativeIntegerParam(url.searchParams, 't');
let activePid = pid;

function appendVideoParts(playlist: Playlist, videos: VideoParts[]) {
    for (const video of videos) {
        for (const videoPart of video.parts || []) {
            playlist.items.push(new PlaylistItem(video, videoPart));
        }
    }
}

async function loadPlaylistByPid(playlist: Playlist, targetPid: number): Promise<boolean> {
    const response = await ClientApis.GetPlaylistVideoParts.fetch(targetPid);
    if (!response || !Array.isArray(response.videoParts)) return false;
    appendVideoParts(playlist, response.videoParts);
    return true;
}

async function loadPlaylist(): Promise<Playlist | undefined> {
    const playlist = new Playlist();
    playlist.items = [];

    if (pid !== undefined) {
        if (!await loadPlaylistByPid(playlist, pid)) return undefined;
    } else if (aid !== undefined) {
        const containingPlaylists = await ClientApis.GetVideoPlaylists.fetch(aid);
        if (Array.isArray(containingPlaylists) && containingPlaylists.length > 0) {
            activePid = containingPlaylists[0].pid;
            if (!await loadPlaylistByPid(playlist, activePid)) return undefined;
            return playlist.items.length ? playlist : undefined;
        }

        const response = await ClientApis.GetVideoParts.fetch(aid);
        if (!response || !Array.isArray(response.parts)) return undefined;
        appendVideoParts(playlist, [response]);
    } else {
        return undefined;
    }

    return playlist.items.length ? playlist : undefined;
}

function renderLoadError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    render(html`
        <div class="status-panel status-panel--error">
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

    render(html`<div class="status-panel">正在加载视频…</div>`, document.body);
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
        if (activePid !== undefined) params.set('pid', String(activePid));
        params.set('aid', String(video.aid));
        params.set('p', String(currentPart.index));
        history.replaceState(null, '', `${location.pathname}?${params.toString()}`);
    };

    render(html`
        <watch-page-element .onBeginPart=${onBeginPart} .onPlayerLoaded=${onPlayerLoaded} .playlist=${playlist} .playindex=${currentIndex}></watch-page-element>
    `, document.body);
}

start().catch(renderLoadError);
