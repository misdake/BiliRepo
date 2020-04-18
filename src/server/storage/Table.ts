import {Paged} from "../../common/page";

export class Table<T extends Object, K extends keyof T> {
    private readonly collection: Collection<T>;
    private readonly key: K;

    constructor(db: Loki, name: string, key: K, indices: (keyof T)[] = undefined) {
        this.key = key;

        let collection = db.getCollection<T>(name);
        if (!collection) {
            collection = db.addCollection<T>(name, {
                clone: true,
                unique: [key],
                indices: indices,
            });
        }
        this.collection = collection;
    }

    insert(t: T) {
        this.collection.insert(t);
    }
    get(v: T[K]): T | null {
        let filter: LokiQuery<T & LokiObj> = {};
        filter[this.key] = v;

        return this.collection.by(this.key, v);
    }
    update(t: T) {
        let filter: LokiQuery<T & LokiObj> = {};
        filter[this.key] = t[this.key];

        this.collection.findAndUpdate(filter, obj => {
            Object.assign(obj, t);
        });
    }
    insertOrUpdate(t: T) {
        let g = this.get(t[this.key]);
        if (g) {
            Object.assign(g, t);
            this.collection.update(g);
        } else {
            this.collection.insert(t);
        }
    }

    delete(t: T) {
        this.collection.remove(t);
    }
    deleteAll(confirm: string) {
        if (confirm === "confirm deleteAll") {
            let list = this.collection.chain().data();
            for (let item of list) this.collection.remove(item);
            console.log("deleteAll!");
        }
    }

    find(query: LokiQuery<T & LokiObj>, sort?: keyof T, desc: boolean = false) {
        let chain = this.collection.chain().find(query);
        if (sort) chain = chain.simplesort(sort, {desc: desc});
        return chain.data();
    }
    find_paged(query: LokiQuery<T & LokiObj>, pageindex: number, pagesize: number, sort?: keyof T, desc: boolean = false): Paged<T> {
        let chain = this.collection.chain().find(query);
        if (sort) chain = chain.simplesort(sort, {desc: desc});
        return this.page(chain, pageindex, pagesize);
    }

    all(sort?: keyof T, desc: boolean = false) {
        let chain = this.collection.chain();
        if (sort) chain = chain.simplesort(sort, {desc: desc});
        return chain.data();
    }
    all_paged(pageindex: number, pagesize: number, sort?: keyof T, desc: boolean = false): Paged<T> {
        let chain = this.collection.chain();
        if (sort) chain = chain.simplesort(sort, {desc: desc});
        return this.page(chain, pageindex, pagesize);
    }

    private page(r: Resultset<T & LokiObj>, pageindex: number, pagesize: number) {
        let total = r.count();
        let result = r.offset(pagesize * (pageindex - 1)).limit(pagesize).data();
        return new Paged<T>(result, pageindex, pagesize, total);
    }

}