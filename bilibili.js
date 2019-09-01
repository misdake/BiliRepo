const fs = require('fs');
const spawn = require('child_process').spawn;

/**
 * download bilibili video by the video code (like av12345)
 * @param videoCode
 * @returns {boolean} downloaded succeeded or not
 */
function download(videoCode, callback) {
    const baseFolder = 'repo';
    const downloadFolder = 'repo\\' + videoCode;
    if (!fs.existsSync(baseFolder)) {
        fs.mkdirSync(baseFolder, {recursive: true});
    }
    if (!fs.existsSync(downloadFolder)) {
        fs.mkdirSync(downloadFolder, {recursive: true});
    }

    const ls = spawn('downloader/annie', ['-c', 'downloader/cookies.txt', '-o', './repo/' + videoCode, '-C', videoCode]);

    ls.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    ls.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });

    ls.on('close', (code) => {
        //TODO safe out/err output to file if error occured
        console.log(`child process exited with code ${code}`);
        callback(code);
    });
}

module.exports = {
    download: download
};
