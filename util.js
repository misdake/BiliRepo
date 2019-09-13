const https = require('https');
const fs = require('fs');
const zlib = require('zlib');

function httpsget(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (resp) => {
            let data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', () => {
                resolve(data);
            });
        }).on("error", (err) => {
            reject(err);
        });
    });
}

function httpsdownload(url, file) {
    return new Promise((resolve, reject) => {
        let request = https.get(url, response => {
            response.on('end', () => {
                resolve(true);
            });
        }).on('response', function (response) {
            let output = fs.createWriteStream(file);
            switch (response.headers['content-encoding']) {
                case 'gzip':
                    response.pipe(zlib.createGunzip()).pipe(output);
                    break;
                case 'deflate':
                    response.pipe(zlib.createInflateRaw()).pipe(output);
                    break;
                default:
                    response.pipe(output);
                    break;
            }
        }).on("error", (err) => {
            reject(err);
        });
    });
}

module.exports = {
    httpsget: httpsget,
    httpsdownload,
};
