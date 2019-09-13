const fs = require('fs');
const {httpsget} = require("./util");
const spawn = require('child_process').spawn;

async function getVideoInfoByAid(aid) {
    let content = await httpsget(`https://api.bilibili.com/x/web-interface/view?aid=${aid}`);
    let obj = JSON.parse(content);
    return obj;
}

/**
 * download bilibili video by the video code (like av12345)
 * @param aid
 * @returns {Promise<number>} 0 => download succeed, others => failed
 */
function download(aid) {
    return new Promise((resolve, reject) => {

        const baseFolder = 'repo';
        const downloadFolder = 'repo\\' + aid;
        if (!fs.existsSync(baseFolder)) {
            fs.mkdirSync(baseFolder, {recursive: true});
        }
        if (!fs.existsSync(downloadFolder)) {
            fs.mkdirSync(downloadFolder, {recursive: true});
        }

        const proc = spawn('downloader/annie', ['-c', 'downloader/cookies.txt', '-o', './repo/' + aid, "av" + aid]);

        proc.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });
        proc.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
        });

        proc.on('close', (code) => {
            //TODO safe out/err output to file if error occured
            console.log(`child process exited with code ${code}`);
            resolve(code);
        });

    });
}

module.exports = {
    getVideoInfoByAid: getVideoInfoByAid,
    downloadVideoByAid: download,
};
