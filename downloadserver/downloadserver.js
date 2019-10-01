const {httpsget} = require("./util");
const {downloadVideoByAid, getVideoInfoByAid, downloadDanmaku} = require("./bilibili");
const {} = require("./bilibili");
const fs = require('fs');
const {getVideoToDownload} = require("./bilibili");

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

let check = null;

function next() {
    process.stdout.write(".");
    setTimeout(check, 60000);
}

download = async function (aid) {
    console.log();

    if (fs.existsSync(`repo/${aid}`)) { //downloaded
        console.log("skip:", aid);
        return true;

    } else { //need download
        let folder = `${aid}_download`;
        console.log("1/3 download video:", aid);
        let returncode = await downloadVideoByAid(folder, aid);
        if (returncode === 0) {
            console.log("2/3 download info:", aid);
            let videoInfo = await getVideoInfoByAid(aid);
            fs.writeFileSync(`repo/${folder}/info.json`, JSON.stringify(videoInfo));

            let cid = videoInfo.data.pages[0].cid;
            console.log("3/3 download danmaku:", aid);
            await downloadDanmaku(folder, cid);

            fs.renameSync(`repo/${folder}`, `repo/${aid}`);

            console.log("finished:", aid);
            //TODO notice webserver
            return true;

        } else {
            console.log("failed:", aid);
            return false;
        }

    }
};

function loadDownloaded() {
    let content = "[[],[]]";
    if (fs.existsSync(`downloader\\status.txt`)) {
        content = fs.readFileSync(`downloader\\status.txt`, 'utf8');
    }
    return JSON.parse(content);
}
let [downloaded, failed] = loadDownloaded();

function saveDownloaded() {
    let content = JSON.stringify([downloaded, failed]);
    fs.writeFileSync(`downloader\\status.txt`, content);
}

check = async function () {

    let data = await getVideoToDownload(110213);
    let aidArray = data.data.map(videoInfo => videoInfo.aid);
    for (let aid of aidArray) {
        if (!downloaded[aid] && !failed[aid]) {
            let result = await download(aid);
            if (result) {
                downloaded.push(aid);
            } else {
                failed.push(aid);
            }
            saveDownloaded();
        }
    }

    next();

};

check();
