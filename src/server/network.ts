import { IncomingMessage } from 'http';
import { RequestOptions } from 'https';

const https = require('https');
const fs = require('fs');
const zlib = require('zlib');

export function httpsget(options: RequestOptions | string) {
    return new Promise<string>((resolve, reject) => {
        https.get(options, (response: IncomingMessage) => {
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });
            response.on('end', () => {
                resolve(data);
            });
        }).on("error", (err: Error) => {
            reject(err);
        });
    });
}

export function httpsdownload(url: string, file: string) {
    return new Promise<boolean>((resolve, reject) => {
        let request = https.get(url, (response: IncomingMessage) => {
        }).on('response', function (response: IncomingMessage) {
            let output = fs.createWriteStream(file);
            output.on('finish', function () {
                resolve(true);
            });
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
        }).on("error", (err: Error) => {
            reject(err);
        });
    });
}
