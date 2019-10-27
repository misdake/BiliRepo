const fs = require('fs');
const parser = require("xml2js");
import {httpsdownload, httpsget} from "./network";

const spawn = require('child_process').spawn;

export async function getVideoInfoByAid(aid: number) {
    let content = await httpsget(`https://api.bilibili.com/x/web-interface/view?aid=${aid}`);
    return JSON.parse(content);
}

export async function getVideoToDownload(mid: number) {
    let content = await httpsget(`https://api.bilibili.com/x/space/coin/video?vmid=${mid}`);
    return JSON.parse(content);
}

export async function downloadThumb(folder: string, url: string) {
    url = url.replace("http://", "https://");
    await httpsdownload(url, `repo/${folder}/thumb.jpg`);
}

class Danmaku {
    time: number;
    type: number;
    color: string;
    author: string;
    text: string;
}

export async function downloadDanmaku(folder: string, cid: number, page: number) {
    await httpsdownload(`https://comment.bilibili.com/${cid}.xml`, `repo/${folder}/p${page}.xml`);
    let content = fs.readFileSync(`repo/${folder}/p${page}.xml`, 'utf8');

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

    fs.writeFileSync(`repo/${folder}/p${page}.json`, JSON.stringify(r));
}

export function downloadVideo(folder: string, aid: number, page = 1) {
    return new Promise((resolve, reject) => {

        const baseFolder = 'repo';
        const downloadFolder = 'repo\\' + folder;
        if (!fs.existsSync(baseFolder)) {
            fs.mkdirSync(baseFolder, {recursive: true});
        }
        if (!fs.existsSync(downloadFolder)) {
            fs.mkdirSync(downloadFolder, {recursive: true});
        }

        const proc = spawn('downloader/annie', ['-c', 'downloader/cookies.txt', '-O', `p${page}`, '-o', './repo/' + folder, `av${aid}/?p=${page}`]);

        proc.stdout.on('data', (data: any) => {
            console.log(`stdout: ${data}`);
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
