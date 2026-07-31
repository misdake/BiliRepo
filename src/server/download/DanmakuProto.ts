import {httpsgetBuffer} from "../network";

const fs = require('fs');
const crypto = require('crypto');

// bilibili protobuf danmaku api, ported from
// https://greasyfork.org/zh-CN/scripts/524107 (dm/view + wbi signed seg.so)
const NAV_API = "https://api.bilibili.com/x/web-interface/nav";
const DM_VIEW_API = "https://api.bilibili.com/x/v2/dm/web/view";
const DM_SEG_API = "https://api.bilibili.com/x/v2/dm/wbi/web/seg.so";
const DM_SEG_FALLBACK_API = "https://api.bilibili.com/x/v2/dm/web/seg.so";

const COOKIE_FILE = "downloader/cookies.txt";

const MIXIN_KEY_ENC_TAB = [
    46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35,
    27, 43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13,
    37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4,
    22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52,
];

export class DanmakuElem {
    id: number = 0;
    progress: number = 0; //ms
    mode: number = 1;
    fontsize: number = 25;
    color: number = 16777215;
    midHash: string = "";
    content: string = "";
    ctime: number = 0;
    pool: number = 0;
    idStr: string = "";
}

class DmView {
    total: number = 0; //total segments
    specialDmUrls: string[] = [];
}

export class DanmakuProto {
    private static mixinKeyCache: string = "";

    //cookies.txt is either header style ("k=v" per line) or Netscape cookie file
    private static readCookie(): string {
        if (!fs.existsSync(COOKIE_FILE)) return "";
        let lines: string[] = fs.readFileSync(COOKIE_FILE, 'utf8').split(/\r?\n/);
        let pairs: string[] = [];
        for (let line of lines) {
            line = line.trim();
            if (!line || line.startsWith('#')) continue;
            let tab = line.split('\t');
            if (tab.length >= 7) {
                pairs.push(`${tab[5]}=${tab[6]}`);
            } else {
                pairs.push(line);
            }
        }
        return pairs.join('; ');
    }

    private static headers(cookie: string) {
        return {
            'Cookie': cookie,
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://www.bilibili.com',
        };
    }

    // ---- wbi signing ----

    private static async getMixinKey(cookie: string): Promise<string> {
        if (this.mixinKeyCache) return this.mixinKeyCache;
        let body = await httpsgetBuffer(NAV_API, this.headers(cookie));
        let json = JSON.parse(body.toString('utf8'));
        let wbiImg = json.data && json.data.wbi_img;
        let imgKey = ((wbiImg?.img_url || "").split('/').pop() || "").split('.')[0];
        let subKey = ((wbiImg?.sub_url || "").split('/').pop() || "").split('.')[0];
        let raw = `${imgKey}${subKey}`;
        if (!raw) throw new Error("cannot get wbi keys");
        this.mixinKeyCache = MIXIN_KEY_ENC_TAB.map(i => raw[i] || "").join("").slice(0, 32);
        return this.mixinKeyCache;
    }

    private static async wbiSign(params: {[key: string]: string}, cookie: string) {
        let mixinKey = await this.getMixinKey(cookie);
        let signed: {[key: string]: string} = {
            ...params,
            wts: `${Math.floor(Date.now() / 1000)}`,
            web_location: '1550101',
        };
        let search = new URLSearchParams();
        for (let key of Object.keys(signed).sort()) {
            search.append(key, signed[key].replace(/[!'()*]/g, ""));
        }
        signed.w_rid = crypto.createHash('md5').update(`${search.toString()}${mixinKey}`).digest('hex');
        return signed;
    }

    // ---- minimal protobuf reader (varint/bytes fields only) ----

    private static readVarint(buf: Buffer, pos: number) {
        let result = 0;
        let shift = 0;
        while (pos < buf.length) {
            let byte = buf[pos++];
            result += (byte & 0x7f) * Math.pow(2, shift);
            if ((byte & 0x80) === 0) return {value: result, pos};
            shift += 7;
        }
        return {value: result, pos};
    }

    private static readBytes(buf: Buffer, pos: number) {
        let r = this.readVarint(buf, pos);
        let end = Math.min(pos = r.pos + r.value, buf.length);
        return {value: buf.subarray(r.pos, end), pos: end};
    }

    private static skipField(buf: Buffer, pos: number, wireType: number) {
        if (wireType === 0) return this.readVarint(buf, pos).pos;
        if (wireType === 1) return Math.min(pos + 8, buf.length);
        if (wireType === 2) return this.readBytes(buf, pos).pos;
        if (wireType === 5) return Math.min(pos + 4, buf.length);
        return buf.length;
    }

    private static parseDmView(buf: Buffer): DmView {
        let data = new DmView();
        let pos = 0;
        while (pos < buf.length) {
            let tag = this.readVarint(buf, pos);
            pos = tag.pos;
            let fieldNum = tag.value >> 3;
            let wireType = tag.value & 7;
            if (fieldNum === 4 && wireType === 2) { //DmSegConfig
                let bytes = this.readBytes(buf, pos);
                pos = bytes.pos;
                let p = 0;
                while (p < bytes.value.length) {
                    let t = this.readVarint(bytes.value, p);
                    p = t.pos;
                    if ((t.value >> 3) === 2 && (t.value & 7) === 0) { //total
                        data.total = this.readVarint(bytes.value, p).value;
                        p = this.readVarint(bytes.value, p).pos;
                    } else {
                        p = this.skipField(bytes.value, p, t.value & 7);
                    }
                }
            } else if (fieldNum === 6 && wireType === 2) { //specialDm url
                let bytes = this.readBytes(buf, pos);
                pos = bytes.pos;
                data.specialDmUrls.push(bytes.value.toString('utf8'));
            } else {
                pos = this.skipField(buf, pos, wireType);
            }
        }
        return data;
    }

    private static parseElems(buf: Buffer): DanmakuElem[] {
        if (buf.length === 2 && buf[0] === 16 && buf[1] === 1) {
            throw new Error("danmaku closed for this video");
        }
        let elems: DanmakuElem[] = [];
        let pos = 0;
        while (pos < buf.length) {
            let tag = this.readVarint(buf, pos);
            pos = tag.pos;
            let fieldNum = tag.value >> 3;
            let wireType = tag.value & 7;
            if (fieldNum === 1 && wireType === 2) {
                let bytes = this.readBytes(buf, pos);
                pos = bytes.pos;
                elems.push(this.parseElem(bytes.value));
            } else {
                pos = this.skipField(buf, pos, wireType);
            }
        }
        return elems;
    }

    private static parseElem(buf: Buffer): DanmakuElem {
        let elem = new DanmakuElem();
        let pos = 0;
        while (pos < buf.length) {
            let tag = this.readVarint(buf, pos);
            pos = tag.pos;
            let fieldNum = tag.value >> 3;
            let wireType = tag.value & 7;
            if (wireType === 0) {
                let v = this.readVarint(buf, pos);
                pos = v.pos;
                if (fieldNum === 1) elem.id = v.value;
                else if (fieldNum === 2) elem.progress = v.value;
                else if (fieldNum === 3) elem.mode = v.value;
                else if (fieldNum === 4) elem.fontsize = v.value;
                else if (fieldNum === 5) elem.color = v.value;
                else if (fieldNum === 8) elem.ctime = v.value;
                else if (fieldNum === 11) elem.pool = v.value;
            } else if (wireType === 2) {
                let v = this.readBytes(buf, pos);
                pos = v.pos;
                if (fieldNum === 6) elem.midHash = v.value.toString('utf8');
                else if (fieldNum === 7) elem.content = v.value.toString('utf8');
                else if (fieldNum === 12) elem.idStr = v.value.toString('utf8');
            } else {
                pos = this.skipField(buf, pos, wireType);
            }
        }
        return elem;
    }

    // ---- api calls ----

    private static async fetchDmView(aid: number, cid: number, cookie: string): Promise<DmView> {
        let body = await httpsgetBuffer(`${DM_VIEW_API}?type=1&oid=${cid}&pid=${aid}`, this.headers(cookie));
        return this.parseDmView(body);
    }

    private static async fetchSegment(aid: number, cid: number, index: number, cookie: string): Promise<DanmakuElem[]> {
        let params: {[key: string]: string} = {
            type: '1',
            oid: `${cid}`,
            pid: `${aid}`,
            segment_index: `${index}`,
        };
        try {
            let signed = await this.wbiSign(params, cookie);
            let body = await httpsgetBuffer(`${DM_SEG_API}?${new URLSearchParams(signed)}`, this.headers(cookie));
            return this.parseElems(body);
        } catch (e) {
            console.warn(`danmaku wbi segment ${index} failed, fallback to unsigned api`, e);
            this.mixinKeyCache = "";
            let body = await httpsgetBuffer(`${DM_SEG_FALLBACK_API}?${new URLSearchParams(params)}`, this.headers(cookie));
            return this.parseElems(body);
        }
    }

    private static async fetchSpecial(url: string, cookie: string): Promise<DanmakuElem[]> {
        let body = await httpsgetBuffer(url, this.headers(cookie));
        let elems = this.parseElems(body);
        for (let elem of elems) {
            if (!elem.mode) elem.mode = 9;
            if (!elem.pool) elem.pool = 2;
        }
        return elems;
    }

    static async fetchAll(aid: number, cid: number): Promise<DanmakuElem[]> {
        let cookie = this.readCookie();
        let view = await this.fetchDmView(aid, cid, cookie);
        let total = view.total > 0 ? view.total : 1;

        let all: DanmakuElem[] = [];
        for (let i = 1; i <= total; i++) {
            try {
                let elems = await this.fetchSegment(aid, cid, i, cookie);
                all.push(...elems);
                console.log(`danmaku segment ${i}/${total}: ${elems.length}`);
            } catch (e) {
                console.error(`danmaku segment ${i}/${total} failed`, e);
            }
        }
        for (let url of view.specialDmUrls) {
            try {
                all.push(...await this.fetchSpecial(url, cookie));
            } catch (e) {
                console.warn(`special danmaku failed: ${url}`, e);
            }
        }

        //dedupe by id, sort by progress
        let seen = new Set<string>();
        let result: DanmakuElem[] = [];
        for (let elem of all) {
            let key = elem.idStr || `${elem.id}` || `${elem.progress}:${elem.mode}:${elem.content}`;
            if (seen.has(key)) continue;
            seen.add(key);
            result.push(elem);
        }
        result.sort((a, b) => a.progress - b.progress);
        return result;
    }

    private static escapeXml(value: string) {
        return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
    }

    //same format as https://comment.bilibili.com/<cid>.xml
    static toXml(elems: DanmakuElem[], cid: number): string {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<i>\n';
        xml += '<chatserver>chat.bilibili.com</chatserver>\n';
        xml += `<chatid>${cid}</chatid>\n`;
        for (let elem of elems) {
            let time = (elem.progress / 1000).toFixed(5);
            let id = elem.idStr || elem.id;
            xml += `<d p="${time},${elem.mode},${elem.fontsize},${elem.color},${elem.ctime},${elem.pool},${elem.midHash},${id}">${this.escapeXml(elem.content)}</d>\n`;
        }
        xml += '</i>';
        return xml;
    }

    static async fetchXml(aid: number, cid: number): Promise<string> {
        let elems = await this.fetchAll(aid, cid);
        console.log(`danmaku total: ${elems.length}`);
        return this.toXml(elems, cid);
    }
}
