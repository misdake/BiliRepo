import {MemberDB, PartDB, PartTimestamps, PlaylistDB, PlaylistVideoParts, PlaylistVideos, Timestamp, VideoDB, VideoParts} from "./dbTypes";
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
    private table_timestamp: Table<Timestamp, "tid">;

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
        this.importAllVideos();
    }

    private importAllVideos() {
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
    public reimportAllVideos() {
        this.table_video.deleteAll("confirm deleteAll");
        this.importAllVideos();
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
        if (!m2 || m2.lastCtime < bilibiliVideo.ctime) {
            let m: MemberDB = {
                mid: bilibiliVideo.owner.mid,

                name: bilibiliVideo.owner.name,
                face: bilibiliVideo.owner.face,
                lastCtime: bilibiliVideo.ctime,
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
        //TODO 把名字放到indices里？
        this.table_video = new Table<VideoDB, "aid">(db, "video", "aid", ["mid", "ctime"]);
        this.table_part = new Table<PartDB, "cid">(db, "part", "cid", ["aid"]);
        this.table_member = new Table<MemberDB, "mid">(db, "member", "mid");
        this.table_playlist = new Table<PlaylistDB, "pid">(db, "playlist", "pid");
        this.table_timestamp = new Table<Timestamp, "tid">(db, "timestamp", "tid", ["aid", "part"]);

        if (!db.getCollection("initialized")) {
            db.addCollection("initialized");
            this.initialize();
        }

        this.loadPlaylistMap();
        this.loadTimestamp();
    }

    public video(aid: number) {
        return this.table_video.get(aid)
    }
    public videoRandom() {
        return this.table_video.random();
    }
    public videoparts(aid: number): VideoParts {
        let v = this.table_video.get(aid);
        let parts = this.table_part.find({aid: aid}, "index");
        let timestamps = this.getVideoTimestamps(aid);
        let pts: PartTimestamps[] = [];
        for (let part of parts) {
            let partT = new PartTimestamps();
            Object.assign(partT, part);
            partT.timestamps = [];
            pts.push(partT);
        }
        for (let timestamp of timestamps) {
            pts[timestamp.part - 1].timestamps.push(timestamp);
        }
        return {
            aid: v.aid,
            title: v.title,
            mid: v.mid,
            desc: v.desc,
            ctime: v.ctime,
            member: this.table_member.get(v.mid),
            parts: pts,
        };
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
    private lastPid = 1;
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
    public updatePlaylist(pid: number, title: string | null, add: number[] | undefined, remove: number[] | undefined) {
        let playlist = this.table_playlist.get(pid);
        if (playlist) {
            if (title) {
                playlist.title = title;
            }
            if (add || remove) {
                this.unregisterVideoPlaylist(playlist);
                //modify
                if (remove) playlist.videosAid = playlist.videosAid.filter(i => remove.indexOf(i) < 0);
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
    public getPlaylistVideoParts(pid: number) {
        let playlist = this.table_playlist.get(pid);
        if (!playlist) return undefined;

        let pv = new PlaylistVideoParts();
        Object.assign(pv, playlist);
        if (playlist.videosAid) {
            let videos: VideoDB[] = this.table_video.find({aid: {'$in': playlist.videosAid}});
            let parts: PartDB[] = this.table_part.find({aid: {'$in': playlist.videosAid}});
            let members: MemberDB[] = this.table_member.find({mid: {'$in': videos.map(v => v.mid)}});
            let timestamps: Timestamp[] = this.table_timestamp.find({aid: {'$in': playlist.videosAid}});

            let videoMap: Map<number, VideoParts> = new Map<number, VideoParts>();
            let memberMap: Map<number, MemberDB> = new Map<number, MemberDB>();

            for (let member of members) {
                memberMap.set(member.mid, member);
            }
            for (let video of videos) {
                let videoParts = new VideoParts();
                Object.assign(videoParts, video);
                videoParts.member = memberMap.get(video.mid);
                videoParts.parts = [];
                videoMap.set(video.aid, videoParts);
            }
            for (let part of parts) {
                let video = videoMap.get(part.aid);
                let partT = new PartTimestamps();
                Object.assign(partT, part);
                partT.timestamps = [];
                video.parts.push(partT);
            }
            for (let timestamp of timestamps) {
                let vp = videoMap.get(timestamp.aid);
                let pt = vp ? vp.parts[timestamp.part - 1] : undefined;
                if (pt) {
                    pt.timestamps.push(timestamp);
                }
            }
            for (let video of videoMap.values()) {
                video.parts.sort((a, b) => a.index - b.index);
            }

            pv.videoParts = Array.from(videoMap.values()).sort((a, b) => a.ctime - b.ctime);
        } else {
            pv.videoParts = [];
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

    //timestamp
    private lastTid = 0;
    private loadTimestamp() {
        let maxKey = this.table_timestamp.maxKey();
        this.lastTid = maxKey > 0 ? maxKey : 0;
    }
    public addTimestamp(aid: number, part: number, time_second: number, name: string) {
        let t = new Timestamp();
        t.tid = ++this.lastTid;
        t.aid = aid;
        t.part = part;
        t.time_second = time_second;
        t.name = name;
        this.table_timestamp.insert(t);
        return t;
    }
    public removeTimestamp(tid: number) {
        let timestamp = this.table_timestamp.get(tid);
        if (timestamp) {
            this.table_timestamp.delete(timestamp);
        }
        return !!timestamp;
    }
    public getVideoTimestamps(aid: number) {
        return this.table_timestamp.find({aid}, "part");
    }
    public getPartTimestamps(aid: number, part: number) {
        return this.table_timestamp.find({aid, part}, "time_second");
    }
    public listTimestamp(page: PageQuery) {
        return this.table_timestamp.all_paged(page.pageindex, page.pagesize, "tid", true);
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
    public search_timestamp_by_name(input: string, page: PageQuery) {
        return this.table_timestamp.find_paged({name: {'$contains': input}}, page.pageindex, page.pagesize, "tid", true);
    }

}