const fs = require('fs');

//video_full
//video_info
//member_info

class Storage {
    constructor() {

        // [aid, aid, ...] (sorted?)
        this._aid_list = [];
        // aid => video
        this._aid_video_map = {};

        // mid => { mid, username, maxAid, (other names)[username, username, ...], url }
        this._mid_map = {};
        // mid => [video, video, ...]
        this._mid_videolist_map = {};

        // [aid, aid, ...] (queue)
        this.new_aid = [];

    }

    loadAllVideos() {
        let _loadVideo = (aid) => {
            let content = fs.readFileSync(`repo/${aid}/info.json`, 'utf8');
            let video = JSON.parse(content).data;
            aid = video.aid; //number

            this._aid_video_map[aid] = video;
            this._aid_list.push(aid);

            let mid = video.owner.mid;

            let owner = this._mid_map[mid] || (this._mid_map[mid] = {maxAid: 0});
            if (video.aid > owner.maxAid) {
                owner.mid = video.owner.mid;
                owner.name = video.owner.name;
                owner.face = video.owner.face;
            }

            let videolist = this._mid_videolist_map[mid] || (this._mid_videolist_map[mid] = []);
            videolist.push(video);
        };

        let folders = fs.readdirSync('repo', {withFileTypes: true})
            .filter(dirent => dirent.isDirectory() && dirent.name.indexOf("download") === -1)
            .map(dirent => dirent.name);
        for (let folder of folders) {
            _loadVideo(folder);
        }
    }

    randomVideo() {

    }

    video_aid(aid) {
        return this._aid_video_map[aid];
    }
}

let storage = new Storage();
storage.loadAllVideos();


module.exports = Storage;
