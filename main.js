const {httpsget} = require("./util");
const {downloadVideoByAid} = require("./bilibili");
const {getVideoInfoByAid} = require("./bilibili");
const fs = require('fs');
const {httpsdownload} = require("./util");

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

let check = null;

function next() {
    console.log("check");
    setTimeout(check, 2000);
}

check = async function () {

    let data = await httpsget('https://rgbuv.xyz/java/todos/list/bilibili-repo');
    console.log(data);

    let todo = null;
    let list = JSON.parse(data);
    for (let item of list.list) {
        if (item.name.match(/^av[0-9]+$/) && !item.finished) {
            todo = item;
            break;
        }
    }

    if (todo) {
        let item = todo;
        let name = item.name;
        let aid = name.substring(2);
        console.log("working on:", name);
        let returncode = await downloadVideoByAid(aid);
        if (returncode === 0) {
            console.log("finished:", name);
            await httpsget(`https://rgbuv.xyz/java/todos/item/bilibili-repo/${item.id}/check`);

            let videoInfo = await getVideoInfoByAid("1157186");
            fs.writeFileSync(`repo/${aid}/info.json`, JSON.stringify(videoInfo));

            let cid = videoInfo.data.pages[0].cid;
            await httpsdownload(`https://comment.bilibili.com/${cid}.xml`, `repo/${aid}/video.xml`);
        } else {
            console.log("failed:", name);
            await httpsget(`https://rgbuv.xyz/java/todos/item/bilibili-repo/${item.id}/check`);
            await httpsget(`https://rgbuv.xyz/java/todos/item/bilibili-repo/fail_${name}/add`);
        }
    }

    next();

};

next();
