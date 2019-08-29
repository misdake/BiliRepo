const https = require('https');
const fs = require('fs');
const spawn = require('child_process').spawn;

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

https.get('https://rgbuv.xyz/java/todos/list/bilibili-repo', (resp) => {
    let data = '';

    // A chunk of data has been recieved.
    resp.on('data', (chunk) => {
        data += chunk;
    });

    // The whole response has been received. Print out the result.
    resp.on('end', () => {
        let list = JSON.parse(data);
        for (let item of list.list) {
            console.log(item);
        }
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});

const videoCode = process.argv[2] || 'av19536380';
const downloadFolder = 'repo\\' + videoCode;

if (!fs.existsSync(downloadFolder)) {
    fs.mkdirSync(downloadFolder);
}

const ls = spawn('downloader/annie', ['-c', 'downloader/cookies.txt', '-o', './repo/' + videoCode, '-C', videoCode]);

ls.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
});

ls.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
});

ls.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
});
