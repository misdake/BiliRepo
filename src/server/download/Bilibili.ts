import {BilibiliVideo, BilibiliVideoJson} from "../../common/types";
import {httpsdownload, httpsget} from "../network";

const fs = require('fs');
const parser = require("xml2js");

const spawn = require('child_process').spawn;

class Danmaku {
    time: number;
    type: number;
    color: string;
    author: string;
    text: string;
}

export class Bilibili {
    static async getVideoInfoByAid_promise(aid: number) {
        return new Promise<BilibiliVideoJson>(async (resolve, reject) => {
            httpsget(`https://api.bilibili.com/x/web-interface/view?aid=${aid}`).then(content => {
                resolve(JSON.parse(content) as BilibiliVideoJson);
            }, () => {
                reject();
            });
        });
    }
    static async getVideoInfoByAid(aid: number) {
        let content = await httpsget(`https://api.bilibili.com/x/web-interface/view?aid=${aid}`);
        return JSON.parse(content).data as BilibiliVideo;
    }
    static async getCoinVideos(mid: number) {
        let content = await httpsget(`https://api.bilibili.com/x/space/coin/video?vmid=${mid}`);
        let obj = JSON.parse(content);
        let aidArray: number[] = obj.data.map((videoInfo: any) => videoInfo.aid);
        return aidArray;
    }
    static async downloadThumb(folder: string, url: string) {
        url = url.replace("http://", "https://");
        await httpsdownload(url, `repo/${folder}/thumb.jpg`);
    }

    static async downloadDanmaku(aid: number, cid: number, page: number) {
        await httpsdownload(`https://comment.bilibili.com/${cid}.xml`, `repo/${aid}_download/p${page}.xml`);
        let content = fs.readFileSync(`repo/${aid}_download/p${page}.xml`, 'utf8');

        let array: Danmaku[] = [];
        let r = {
            code: 0,
            data: array,
        };
        parser.parseString(content, function (err: Error, result: any) {
            let all = result.i.d;
            for (let item of all) {
                let attrs = item.$.p;
                let text = item._;
                let split = attrs.split(",");

                let type = 0; //right
                if (split[1] === "5") type = 1; //top
                if (split[1] === "4") type = 2; //bottom

                let color = parseInt(split[3]);
                let hex = '#' + ('000000' + color.toString(16).toUpperCase()).slice(-6);

                let d = {
                    time: parseFloat(split[0]),
                    type: type,
                    color: hex,
                    author: split[6],
                    text: text
                };

                r.data.push(d);
            }
        });

        fs.writeFileSync(`repo/${aid}_download/p${page}.json`, JSON.stringify(r));
    }

    static async downloadVideo(aid: number, page = 1, onoutput?: (lines: string[]) => void) {
        return new Promise((resolve, reject) => {
            const proc = spawn('downloader/annie', ['-c', 'downloader/cookies.txt', '-O', `p${page}`, '-o', `./repo/${aid}_download`, `av${aid}/?p=${page}`]);

            proc.stdout.on('data', (data: any) => {
                let lines = `${data}`.split(/\r?\n/);
                if (onoutput) onoutput(lines);
                // console.log(`stdout: ${data}`);
            });
            proc.stderr.on('data', (data: any) => {
                console.log(`stderr: ${data}`);
            });

            proc.on('close', (code: number) => {
                //TODO save out/err output to file if error occured
                console.log(`child process exited with code ${code}`);
                resolve(code);
            });

        });
    }
}
