import {Downloader} from "./Downloader";
import {Bilibili} from "./Bilibili";

const fs = require('fs');

let check: () => void = null;

function next() {
    process.stdout.write(".");
    setTimeout(check, 60000);
}

let downloader = new Downloader();

let download = async function (aid: number, force = false) {
    return downloader.enqueue(aid, force);
};

function loadDownloaded() {
    let content = "[[],[]]";
    if (fs.existsSync(`downloader\\status.txt`)) {
        content = fs.readFileSync(`downloader\\status.txt`, 'utf8');
    }
    let [downloaded, failed] = JSON.parse(content);
    downloaded = downloaded.filter((v: any, i: number, a: number[]) => a.indexOf(v) === i); //remove duplicate
    failed = failed.filter((v: any, i: number, a: number[]) => a.indexOf(v) === i);
    return [downloaded, failed];
}
let [downloaded, failed] = loadDownloaded();

function saveDownloaded() {
    downloaded = downloaded.filter((v: any, i: number, a: number[]) => a.indexOf(v) === i);
    failed = failed.filter((v: any, i: number, a: number[]) => a.indexOf(v) === i);
    let content = JSON.stringify([downloaded, failed]);
    fs.writeFileSync(`downloader\\status.txt`, content);
}

check = async function () {

    let aidArray = await Bilibili.getCoinVideos(110213);
    for (let aid of aidArray) {
        if (downloaded.indexOf(aid) < 0 && failed.indexOf(aid) < 0) {
            let result = await download(aid);
            // if (result) {
            //     downloaded.push(aid);
            // } else {
            //     failed.push(aid);
            // }
            // saveDownloaded();
        }
    }

    next();

};

check();

function print() {
    console.log(JSON.stringify(downloader.status_mini(), null, 2));

    setTimeout(() => print(), 1000);
}

print();