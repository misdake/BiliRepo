const https = require('https');
const {download} = require("./bilibili");

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

let check = null;

function next() {
    console.log("check");
    setTimeout(check, 2000);
}

//TODO rewrite with promise
check = function () {
    https.get('https://rgbuv.xyz/java/todos/list/bilibili-repo', (resp) => {
        let data = '';

        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
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
                console.log("working on:", item.name);
                download(item.name, function (returncode) {
                    if (returncode === 0) {
                        console.log("finished:", item.name);
                        https.get(`https://rgbuv.xyz/java/todos/item/bilibili-repo/${item.id}/check`);
                    } else {
                        console.log("failed:", item.name);
                        https.get(`https://rgbuv.xyz/java/todos/item/bilibili-repo/${item.id}/check`);
                        https.get(`https://rgbuv.xyz/java/todos/item/bilibili-repo/fail_${item.name}/add`);
                    }
                    next();
                });
            } else {
                next();
            }
        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });
};

next();
