const {downloadVideoByAid, getVideoInfoByAid, downloadDanmaku} = require("./bilibili");
const fs = require('fs');
const {getVideoToDownload} = require("./bilibili");

let check = null;

function next() {
    process.stdout.write(".");
    setTimeout(check, 60000);
}

download = async function (aid, force = false) {
    if (fs.existsSync(`repo/${aid}`) && !force) { //downloaded
        console.log("skip:", aid);
        return true;

    } else { //need download
        console.log("0 download info:", aid);
        let videoInfo = await getVideoInfoByAid(aid);

        let steps = videoInfo.data.pages.length;
        let folder = `${aid}_download`;

        let good = true;

        for (let i = 0; i < steps; i++) {
            let pageInfo = videoInfo.data.pages[i];
            let cid = pageInfo.cid;
            let title = pageInfo.part || videoInfo.data.title;

            if (fs.existsSync(`repo/${aid}/p${pageInfo.page}.flv`)) { //downloaded
                continue;
            }
            console.log(`${i + 1}/${steps} download video: ${aid} ${title}`);

            let returncode = await downloadVideoByAid(folder, aid, pageInfo.page);
            if (returncode === 0) {
                console.log(`${i + 1}/${steps} download danmaku: ${aid} ${title}`);
                await downloadDanmaku(folder, cid, pageInfo.page);
            } else {
                good = false;
                console.log(`${i + 1}/${steps} download fail`);
            }
        }

        if (good) {
            console.log("finished:", aid);
            fs.writeFileSync(`repo/${folder}/info.json`, JSON.stringify(videoInfo));
            fs.renameSync(`repo/${folder}`, `repo/${aid}`);
            //TODO notice webserver
            return true;
        } else {
            return false;
        }

    }
};

function loadDownloaded() {
    let content = "[[],[]]";
    if (fs.existsSync(`downloader\\status.txt`)) {
        content = fs.readFileSync(`downloader\\status.txt`, 'utf8');
    }
    let [downloaded, failed] = JSON.parse(content);
    downloaded = downloaded.filter((v, i, a) => a.indexOf(v) === i);
    failed = failed.filter((v, i, a) => a.indexOf(v) === i);
    return [downloaded, failed];
}
let [downloaded, failed] = loadDownloaded();

function saveDownloaded() {
    downloaded = downloaded.filter((v, i, a) => a.indexOf(v) === i);
    failed = failed.filter((v, i, a) => a.indexOf(v) === i);
    let content = JSON.stringify([downloaded, failed]);
    fs.writeFileSync(`downloader\\status.txt`, content);
}

check = async function () {

    let data = await getVideoToDownload(110213);
    let aidArray = data.data.map(videoInfo => videoInfo.aid);
    for (let aid of aidArray) {
        if (downloaded.indexOf(aid) < 0 && failed.indexOf(aid) < 0) {
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