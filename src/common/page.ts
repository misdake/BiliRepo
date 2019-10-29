export class PageQuery {
    pageindex: number; // >= 1
    pagesize: number;
}

export class Paged<T extends Object> {
    total: number;
    pageindex: number; // >= 1
    pagecount: number;
    pagesize: number;

    result: T[];

    constructor(result: T[], pageindex: number, pagesize: number, total: number) {
        this.result = result;
        this.pageindex = pageindex;
        this.pagesize = pagesize;
        this.total = total;
        this.pagecount = Math.ceil(total / pagesize);
    }
}