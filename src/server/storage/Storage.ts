import {MemberDB, PartDB, PlaylistDB, PlaylistVideos, VideoDB, VideoParts} from "./dbTypes";
import {Table} from "./Table";
import {PageQuery} from "../../common/page";
import {BilibiliVideo, BilibiliVideoJson} from "../../common/types";

const loki = require("lokijs");
const fs = require("fs");

export class Storage {

    private table_video: Table<VideoDB, "aid">;
    private table_part: Table<PartDB, "cid">;
    private table_member: Table<MemberDB, "mid">;
    private table_playlist: Table<PlaylistDB, "pid">;

    private static instance: Promise<Storage> = null;
    static async createInstance(): Promise<Storage> {
        if (Storage.instance) return Storage.instance;
        return Storage.instance = new Promise<Storage>((resolve, _) => {
            let lokidb: Loki = new loki("repo/storage.db", {
                autoload: true,
                autosave: true,
                autosaveInterval: 4000,
                autoloadCallback: () => {
                    resolve(new Storage(lokidb));
                },
            });
        });
    }

    private initialize() {
        this.importAll();
    }

    private importAll() {
        console.log("import all videos!");
        let folders = fs.readdirSync('repo');
        folders = folders.sort();
        for (let folder of folders) {
            if (folder.match(/^[0-9]+$/)) {
                let aid = parseInt(folder);
                let content = fs.readFileSync(`repo/${aid}/info.json`, 'utf8');
                let video = (JSON.parse(content) as BilibiliVideoJson).data;
                this.importVideo(video);
            }
        }

    }

    public importVideo(bilibiliVideo: BilibiliVideo) {
        console.log("import video: " + bilibiliVideo.title);

        let v: VideoDB = {
            aid: bilibiliVideo.aid,

            mid: bilibiliVideo.owner.mid,
            title: bilibiliVideo.title,
            desc: bilibiliVideo.desc,
            ctime: bilibiliVideo.ctime,
        };
        this.table_video.insertOrUpdate(v);

        let m2 = this.table_member.get(bilibiliVideo.owner.mid);
        if (!m2 || m2.lastAid < bilibiliVideo.aid) {
            let m: MemberDB = {
                mid: bilibiliVideo.owner.mid,

                name: bilibiliVideo.owner.name,
                face: bilibiliVideo.owner.face,
                lastAid: bilibiliVideo.aid,
            };
            this.table_member.insertOrUpdate(m);
        }

        for (let part of bilibiliVideo.pages) {
            let p: PartDB = {
                cid: part.cid,

                aid: bilibiliVideo.aid,
                index: part.page,
                title: part.part,
            };
            this.table_part.insertOrUpdate(p);
        }
    }

    private constructor(db: Loki) {
        this.table_video = new Table<VideoDB, "aid">(db, "video", "aid", ["mid", "ctime"]);
        this.table_part = new Table<PartDB, "cid">(db, "part", "cid", ["aid"]);
        this.table_member = new Table<MemberDB, "mid">(db, "member", "mid");
        this.table_playlist = new Table<PlaylistDB, "pid">(db, "playlist", "pid");

        if (!db.getCollection("initialized")) {
            db.addCollection("initialized");
            this.initialize();
        }

        this.loadPlaylistMap();
    }

    public video(aid: number) {
        return this.table_video.get(aid)
    }
    public videoparts(aid: number): VideoParts {
        let v = this.table_video.get(aid);
        return {
            aid: v.aid,
            title: v.title,
            mid: v.mid,
            desc: v.desc,
            ctime: v.ctime,
            member: this.table_member.get(v.mid),
            parts: this.table_part.find({aid: aid}, "index")
        }
    }
    public recent_videos(page: PageQuery) {
        return this.table_video.all_paged(page.pageindex, page.pagesize, "ctime", true);
    }

    public member(mid: number) {
        return this.table_member.get(mid);
    }
    public all_members(page: PageQuery) {
        return this.table_member.all_paged(page.pageindex, page.pagesize, "mid", true);
    }
    public mid_videos(mid: number, page: PageQuery) {
        return this.table_video.find_paged({mid: mid}, page.pageindex, page.pagesize, "ctime", true);
    }

    //playlist
    private lastPid = 0;
    private video_playlist: Map<number, Set<number>> = new Map<number, Set<number>>();
    private loadPlaylistMap() {
        for (let playlist of this.table_playlist.all()) {
            this.lastPid = Math.max(this.lastPid, playlist.pid);
            this.registerVideoPlaylist(playlist);
        }
    }
    private registerVideoPlaylist(playlist: PlaylistDB) {
        let aids = playlist.videosAid;
        for (let aid of aids) {
            if (!this.video_playlist.has(aid)) {
                this.video_playlist.set(aid, new Set<number>([playlist.pid]));
            } else {
                this.video_playlist.get(aid).add(playlist.pid);
            }
        }
    }
    private unregisterVideoPlaylist(playlist: PlaylistDB) {
        for (let aid of playlist.videosAid) {
            let set = this.video_playlist.get(aid);
            if (set) set.delete(playlist.pid);
        }
    }
    public addPlaylist(title: string, withAids: number[] = []) {
        let p = new PlaylistDB();
        p.pid = ++this.lastPid;
        p.title = title;
        p.videosAid = withAids;
        this.table_playlist.insert(p);
        this.registerVideoPlaylist(p);
        return p;
    }
    public updatePlaylist(pid: number, title: string | null, add: number[] | null, remove: number[] | null) {
        let playlist = this.table_playlist.get(pid);
        if (playlist) {
            if (title) {
                playlist.title = title;
            }
            if (add || remove) {
                this.unregisterVideoPlaylist(playlist);
                //modify
                if (remove) playlist.videosAid = playlist.videosAid.filter(i => remove.indexOf(i) >= 0);
                if (add) playlist.videosAid.push(...add);
                //reorder
                let array: VideoDB[] = this.table_video.find({aid: {'$in': playlist.videosAid}});
                playlist.videosAid = array.sort((a, b) => a.ctime - b.ctime).map(i => i.aid);
                this.registerVideoPlaylist(playlist);
            }
            this.table_playlist.update(playlist);
        }
        return playlist;
    }
    public removePlaylist(pid: number) { //TODO return value
        let playlist = this.table_playlist.get(pid);
        if (playlist) {
            this.table_playlist.delete(playlist);
            this.unregisterVideoPlaylist(playlist);
            return true;
        }
        return false;
    }
    public listPlaylist(page: PageQuery) {
        return this.table_playlist.all_paged(page.pageindex, page.pagesize, "pid", true);
    }
    public getPlaylist(pid: number) {
        let playlist = this.table_playlist.get(pid);
        return playlist;
    }
    public getPlaylistVideos(pid: number) {
        let playlist = this.table_playlist.get(pid);
        let pv = new PlaylistVideos();
        Object.assign(pv, playlist);
        if (playlist.videosAid) {
            let array: VideoDB[] = this.table_video.find({aid: {'$in': playlist.videosAid}});
            pv.videos = array.sort((a, b) => a.ctime - b.ctime);
        } else {
            pv.videos = [];
        }
        return pv;
    }
    public getVideoPlaylists(aid: number) {
        let pids = this.video_playlist.get(aid);
        if (pids) {
            let playlists = pids ? this.table_playlist.find({pid: {'$in': Array.from(pids.values())}}) : [];
            playlists.sort((a, b) => b.pid - a.pid);
            return playlists;
        } else {
            return [];
        }
    }

    //search
    public search_video_by_title(input: string, page: PageQuery) {
        return this.table_video.find_paged({title: {'$contains': input}}, page.pageindex, page.pagesize, "ctime", true);
    }
    public search_member_by_name(input: string, page: PageQuery) {
        return this.table_member.find_paged({name: {'$contains': input}}, page.pageindex, page.pagesize, "mid", true);
    }
    public search_playlist_by_title(input: string, page: PageQuery) {
        return this.table_playlist.find_paged({title: {'$contains': input}}, page.pageindex, page.pagesize, "pid", true);
    }

}