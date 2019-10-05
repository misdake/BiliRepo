const fs = require('fs');
const parser = require("xml2js");
const {httpsdownload} = require("./util");
const {httpsget} = require("./util");
const spawn = require('child_process').spawn;

async function getVideoInfoByAid(aid) {
    let content = await httpsget(`https://api.bilibili.com/x/web-interface/view?aid=${aid}`);
    return JSON.parse(content);
}

async function getVideoToDownload(mid) {
    let content = await httpsget(`https://api.bilibili.com/x/space/coin/video?vmid=${mid}`);
    return JSON.parse(content);
}

async function downloadDanmaku(folder, cid, page) {
    await httpsdownload(`https://comment.bilibili.com/${cid}.xml`, `repo/${folder}/p${page}.xml`);
    let content = fs.readFileSync(`repo/${folder}/p${page}.xml`, 'utf8');

    let r = {
        code: 0,
        data: [],
    };
    parser.parseString(content, function (err, result) {
        let all = result.i.d;
        for (let item of all) {
            let attrs = item.$.p;
            let text = item._;
            let split = attrs.split(",");

            let type = "right";
            if (split[1] === "5") type = "top";
            if (split[1] === "4") type = "bottom";

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

function downloadVideo(folder, aid, page = 1) {
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

        proc.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });
        proc.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
        });

        proc.on('close', (code) => {
            //TODO save out/err output to file if error occured
            console.log(`child process exited with code ${code}`);
            resolve(code);
        });

    });
}

module.exports = {
    getVideoInfoByAid: getVideoInfoByAid,
    getVideoToDownload: getVideoToDownload,
    downloadDanmaku: downloadDanmaku,
    downloadVideoByAid: downloadVideo,
};
