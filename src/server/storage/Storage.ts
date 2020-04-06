import {MemberDB, PartDB, PlaylistDB, VideoDB, VideoParts} from "./dbTypes";
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
        this.table_video = new Table<VideoDB, "aid">(db, "video", "aid", ["mid"]);
        this.table_part = new Table<PartDB, "cid">(db, "part", "cid", ["aid"]);
        this.table_member = new Table<MemberDB, "mid">(db, "member", "mid");
        this.table_playlist = new Table<PlaylistDB, "pid">(db, "playlist", "pid");

        if (!db.getCollection("initialized")) {
            db.addCollection("initialized");
            this.initialize();
        }
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
            member: this.table_member.get(v.mid),
            parts: this.table_part.find({aid: aid}, "index")
        }
    }
    public recent_videos(page: PageQuery) {
        return this.table_video.all_paged(page.pageindex, page.pagesize, "aid", true);
    }

    public member(mid: number) {
        return this.table_member.get(mid);
    }
    public all_members(page: PageQuery) {
        return this.table_member.all_paged(page.pageindex, page.pagesize, "mid", true);
    }
    public mid_videos(mid: number, page: PageQuery) {
        return this.table_video.find_paged({mid: mid}, page.pageindex, page.pagesize, "aid", true);
    }

    //search
    public search_video_by_title(input: string, page: PageQuery) {
        return this.table_video.find_paged({title: {'$contains': input}}, page.pageindex, page.pagesize, "aid", true);
    }
    public search_member_by_name(input: string, page: PageQuery) {
        return this.table_member.find_paged({name: {'$contains': input}}, page.pageindex, page.pagesize, "mid", true);
    }

    //playlist
    public addPlaylist() {
        let p = new PlaylistDB();
        p.pid = 2;
        p.title = "playlist title";
        p.videoAid = [1,2];
        this.table_playlist.insert(p);
    }
    public getPlaylist() {
        return this.table_playlist.all_paged(1, 12);
    }

}