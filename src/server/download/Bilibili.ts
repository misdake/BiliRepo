import {BilibiliVideo, BilibiliVideoJson} from "../../common/types";
import {httpsdownload, httpsget} from "../network";
import {ChildProcess} from "child_process";

const fs = require('fs');
const parser = require("xml2js");

const spawn = require('child_process').spawn;

export class Danmaku {
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

    static async downloadDanmaku(aid: number, cid: number, page: number, isUpdate: boolean = false) {
        let folder = isUpdate ? `${aid}` : `${aid}_download`;

        //read existing danmaku
        let list: Danmaku[] = [];
        let map = new Map<string, Danmaku>();
        if (fs.existsSync(`repo/${folder}/p${page}.xml`)) {
            let array = this.readDanmaku(folder, page);
            list = array;
            for (let d of array) {
                map.set(d.time + d.text, d);
            }
        }

        await httpsdownload(`https://comment.bilibili.com/${cid}.xml`, `repo/${folder}/p${page}.xml`);
        let array = this.readDanmaku(folder, page);

        for (let d of array) {
            if (!map.has(d.time + d.text)) {
                list.push(d);
            }
        }

        let content = {
            code: 0,
            data: list,
        };

        fs.writeFileSync(`repo/${folder}/p${page}.json`, JSON.stringify(content));
    }

    private static readDanmaku(folder: string, page: number) {
        let content = fs.readFileSync(`repo/${folder}/p${page}.xml`, 'utf8');

        let array: Danmaku[] = [];
        parser.parseString(content, function (err: Error, result: any) {
            let all = result.i.d;
            if (!all) return;
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

                array.push(d);
            }
        });
        return array;
    }

    static async downloadVideo(aid: number, page = 1, onoutput?: (lines: string[]) => void, onbind?: (proc: ChildProcess) => void) {
        return new Promise((resolve, reject) => {
            let params = ['-c', 'downloader/cookies.txt', '-n', '4', '-O', `p${page}`, '-o', `./repo/${aid}_download`, '-p', '-start', `${page}`, '-end', `${page}`, `av${aid}`];
            console.log("run: annie " + params.join(' '));
            const proc = spawn('downloader/annie', params);

            if (onbind) onbind(proc);

            let lineCount = 0;
            proc.stdout.on('data', (data: any) => {
                let lines = `${data}`.split(/\r?\n/);
                if (onoutput) onoutput(lines);
                for (let line of lines) {
                    lineCount++;
                    if (line.indexOf("/") < 0 || lineCount % 100 === 0) {
                        console.log("stdout:", line);
                    }
                }
                // console.log(`stdout: ${data}`);
            });
            proc.stderr.on('data', (data: any) => {
                let lines = `${data}`.split(/\r?\n/);
                if (onoutput) onoutput(lines);
                for (let line of lines) {
                    lineCount++;
                    if (line.indexOf("/") < 0 || lineCount % 100 === 0) {
                        console.log("stderr:", line);
                    }
                }
                // console.log(`stderr: ${data}`);
            });

            proc.on('close', (code: number) => {
                //TODO save out/err output to file if error occured
                console.log(`child process exited with code ${code}`);

                if (fs.existsSync(`repo/${aid}_download/p${page}.mp4`)) {
                    resolve(code);
                } else if (fs.existsSync(`repo/${aid}_download/p${page}.flv`)) {
                    console.log('下载文件为mp4，需转换为flv');
                    //如果是flv就转换成mp4，成功后删除源文件，如果失败就返回失败 ffmpeg.exe -i p1.flv -acodec copy -vcodec copy p1.mp4
                    this.convertFlvToMp4(aid, page).then(() => {
                        if (fs.existsSync(`repo/${aid}_download/p${page}.mp4`)) {
                            fs.unlinkSync(`repo/${aid}_download/p${page}.flv`);
                            resolve(code);
                        } else {
                            console.log('未找到文件');
                            resolve(-1);
                        }
                    });
                } else {
                    console.log('未找到文件');
                    resolve(-1);
                }
            });

        });
    }

    static async convertFlvToMp4(aid: number, page: number) {
        return new Promise((resolve, reject) => {
            let params = ['-i', `repo/${aid}_download/p${page}.flv`, '-acodec', 'copy', '-vcodec', 'copy', `repo/${aid}_download/p${page}.mp4`];
            console.log("run: ffmpeg " + params.join(' '));
            const proc = spawn('downloader/ffmpeg', params);

            proc.stdout.on('data', (data: any) => {
                console.log(`stdout: ${data}`);
            });
            proc.stderr.on('data', (data: any) => {
                console.log(`stderr: ${data}`);
            });

            proc.on('close', (code: number) => {
                console.log(`child process exited with code ${code}`);
                resolve(code);
            });
        });
    }
}
