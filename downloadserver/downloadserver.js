const {httpsget} = require("./util");
const {downloadVideoByAid, getVideoInfoByAid, downloadDanmaku} = require("./bilibili");
const {} = require("./bilibili");
const fs = require('fs');

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

let check = null;

function next() {
    process.stdout.write(".");
    setTimeout(check, 2000);
}

check = async function () {

    let data = await httpsget('https://rgbuv.xyz/java/todos/list/bilibili-repo');
    // console.log(data);

    let todo = null;
    let list = JSON.parse(data);
    for (let item of list.list) {
        if (item.name.match(/^av[0-9]+$/) && !item.finished) {
            todo = item;
            break;
        }
    }

    if (todo) {
        console.log();

        let item = todo;
        let name = item.name;
        let aid = name.substring(2);

        if (fs.existsSync(`repo/${aid}`)) { //downloaded
            console.log("skip:", name);
            await httpsget(`https://rgbuv.xyz/java/todos/item/bilibili-repo/${item.id}/check`);

        } else { //need download
            // fs.renameSync(old path, new path)
            let folder = `${aid}_download`;
            console.log("1/3 download video:", name);
            let returncode = await downloadVideoByAid(folder, aid);
            if (returncode === 0) {
                console.log("2/3 download info:", name);
                let videoInfo = await getVideoInfoByAid("1157186");
                fs.writeFileSync(`repo/${folder}/info.json`, JSON.stringify(videoInfo));

                let cid = videoInfo.data.pages[0].cid;
                console.log("3/3 download danmaku:", name);
                await downloadDanmaku(folder, cid);

                fs.renameSync(`repo/${folder}`, `repo/${aid}`);

                console.log("finished:", name);
                await httpsget(`https://rgbuv.xyz/java/todos/item/bilibili-repo/${item.id}/check`);
                //TODO notice webserver

            } else {
                console.log("failed:", name);
                await httpsget(`https://rgbuv.xyz/java/todos/item/bilibili-repo/${item.id}/check`);
                await httpsget(`https://rgbuv.xyz/java/todos/item/bilibili-repo/fail_${name}/add`);
            }

        }
    }

    next();

};

next();
