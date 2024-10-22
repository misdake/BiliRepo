import { httpsget } from './network';
import * as fs from 'fs';

function getDay(msUtc: number) {
    let t = msUtc;
    const DAY_TIME = 1000 * 60 * (60 * 24 + 480);
    let today = ~~(t / DAY_TIME);
    return today;
}

interface BiliResult<T> {
    code: number;
    message: string;
    // ttl: number;
    data: T;
}
interface BiliFanCount {
    tendency: BiliDayData[];
    // data_tendency: DataTendency;
    // tendency_rank?: null;
}
interface BiliDayData {
    date_key: number;
    total_inc: number;
    // sub_total_inc: number;
}

export interface DayData {
    day: number; // utc+8 day
    fan_count: number;
}

async function fetchData(cookie: string): Promise<BiliDayData[]> {
    let options = {
        host: 'member.bilibili.com',
        protocol: 'https:',
        path: '/x/web/data/v2/overview/stat/graph?period=3&s_locale=zh_CN&type=fan',
        headers: { Cookie: cookie }
    };
    let content = await httpsget(options);
    let result = readBiliData(content);
    return result;
}

function readBiliData(content: string): BiliDayData[] {
    let result = JSON.parse(content) as BiliResult<BiliFanCount>;
    if (result.code !== 0) {
        debugger;
        return [];
    }
    return result.data.tendency;
}
function readData(content: string): DayData[] {
    let result = JSON.parse(content) as DayData[];
    if (!Array.isArray(result)) {
        debugger;
    }
    return result;
}
function writeData(content: DayData[], path: string) {
    fs.writeFileSync(path, JSON.stringify(content, null, 2));
}

function convert(source: BiliDayData[]): DayData[] {
    let result = source.map(value => {
        return { day: getDay(value.date_key * 1000), fan_count: value.total_inc };
    });
    return result;
}

function mergeData(...sources: DayData[][]): DayData[] {
    // day -> fan_count
    let dict = new Map<number, number>();
    function write(source: DayData[]) {
        for (let v of source) {
            if (dict.has(v.day)) {
                let prev = dict.get(v.day);
                dict.set(v.day, Math.max(v.fan_count, prev));
            } else {
                dict.set(v.day, v.fan_count);
            }
        }
    }
    for (let source of sources) {
        if (source) {
            write(source);
        }
    }

    let result = [];
    for (let [k, v] of dict.entries()) {
        result.push({ day: k, fan_count: v });
    }
    return result;
}

function readCookie(): string {
    let buffer = fs.readFileSync('downloader/cookies.txt');
    let cookie = buffer.toString('utf-8');
    return cookie;
}

export async function updateFanCount(): Promise<DayData[]> {
    let cookie = readCookie();
    let content = await fetchData(cookie);
    let curr = convert(content);

    let prev: DayData[] = [];

    if (fs.existsSync('repo/fan_count.json')) {
        prev = readData(fs.readFileSync('repo/fan_count.json').toString('utf-8'));
    }
    let result = mergeData(prev, curr);

    console.log(`prev ${prev.length}, curr ${result.length}`);
    if (prev.length <= result.length) {
        writeData(result, 'repo/fan_count.json');
    }
    return result;
}

if (require.main === module) {
    console.log('update fan count directly');
    (async function () {
        await updateFanCount();
    })();
}
