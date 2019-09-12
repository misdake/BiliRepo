const {httpget} = require("./util");
const {downloadVideoByAid} = require("./bilibili");
const {getVideoInfoByAid} = require("./bilibili");
const fs = require('fs');

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

let check = null;

function next() {
    console.log("check");
    setTimeout(check, 2000);
}

check = async function () {

    let data = await httpget('https://rgbuv.xyz/java/todos/list/bilibili-repo');
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
            await httpget(`https://rgbuv.xyz/java/todos/item/bilibili-repo/${item.id}/check`);
        } else {
            console.log("failed:", name);
            await httpget(`https://rgbuv.xyz/java/todos/item/bilibili-repo/${item.id}/check`);
            await httpget(`https://rgbuv.xyz/java/todos/item/bilibili-repo/fail_${name}/add`);
        }

        let videoInfo = await getVideoInfoByAid("1157186");
        fs.writeFileSync(`repo/${aid}/info.json`, JSON.stringify(videoInfo));
    }

    next();

};

next();
