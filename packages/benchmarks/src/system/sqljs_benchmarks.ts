import * as arrow from 'apache-arrow';
import * as faker from 'faker';
import * as sqljs from 'sql.js';
import { sqlCreate, sqlInsert } from './simple_sql';
import { SystemBenchmark, SystemBenchmarkMetadata, SystemBenchmarkContext, noop } from './system_benchmark';
import { getTPCHQuery, getTPCHSQLiteDB } from './tpch_loader';
import { generateGroupedInt32, generateInt32, generateUtf8 } from './data_generator';

export class SqljsTPCHBenchmark implements SystemBenchmark {
    initDB: sqljs.SqlJsStatic;
    database: sqljs.Database | null;
    scaleFactor: number;
    query: number;
    queryText: string | null;

    constructor(initDB: sqljs.SqlJsStatic, scaleFactor: number, query: number) {
        this.initDB = initDB;
        this.database = null;
        this.scaleFactor = scaleFactor;
        this.query = query;
        this.queryText = null;
    }
    getName(): string {
        return `sqljs_tpch_${this.scaleFactor.toString().replace('.', '')}_q${this.query}`;
    }
    getMetadata(): SystemBenchmarkMetadata {
        return {
            benchmark: 'tpch',
            system: 'sqljs',
            tags: [],
            timestamp: +new Date(),
            parameters: [this.scaleFactor, this.query],
        };
    }
    async beforeAll(ctx: SystemBenchmarkContext): Promise<void> {
        switch (this.query) {
            case 7:
            case 8:
            case 9:
            case 22:
                this.queryText = await getTPCHQuery(ctx.projectRootPath, `${this.query}-sqlite.sql`);
                break;
            default:
                this.queryText = await getTPCHQuery(ctx.projectRootPath, `${this.query}.sql`);
                break;
        }
        const buffer = await getTPCHSQLiteDB(ctx.projectRootPath, this.scaleFactor);
        this.database = new this.initDB.Database(buffer);
    }
    async beforeEach(_ctx: SystemBenchmarkContext): Promise<void> {}
    async run(_ctx: SystemBenchmarkContext): Promise<void> {
        this.database!.run(this.queryText!);
    }
    async afterEach(_ctx: SystemBenchmarkContext): Promise<void> {}
    async afterAll(_ctx: SystemBenchmarkContext): Promise<void> {
        this.database = null;
    }
    async onError(_ctx: SystemBenchmarkContext): Promise<void> {
        this.database = null;
    }
}

export class SqljsIntegerScanBenchmark implements SystemBenchmark {
    initDB: sqljs.SqlJsStatic;
    database: sqljs.Database | null;
    tuples: number;

    constructor(initDB: sqljs.SqlJsStatic, tuples: number) {
        this.initDB = initDB;
        this.database = null;
        this.tuples = tuples;
    }
    getName(): string {
        return `sqljs_integer_scan_${this.tuples}`;
    }
    getMetadata(): SystemBenchmarkMetadata {
        return {
            benchmark: 'integer_scan',
            system: 'sqljs',
            tags: [],
            timestamp: +new Date(),
            parameters: [this.tuples],
        };
    }
    async beforeAll(ctx: SystemBenchmarkContext): Promise<void> {
        faker.seed(ctx.seed);
        const values = generateInt32(this.tuples);
        this.database = new this.initDB.Database();
        const schema = new arrow.Schema([new arrow.Field('v0', new arrow.Int32())]);
        this.database.run(sqlCreate(this.getName(), schema.fields));
        for (const query of sqlInsert(this.getName(), schema.fields, [values])) {
            this.database.run(query);
        }
    }
    async beforeEach(_ctx: SystemBenchmarkContext): Promise<void> {}
    async run(_ctx: SystemBenchmarkContext): Promise<void> {
        const results = this.database!.exec(`SELECT v0 FROM ${this.getName()}`);
        let n = 0;
        for (const row of results[0].values) {
            noop(row);
            n += 1;
        }
        if (n !== this.tuples) {
            throw Error(`invalid tuple count. expected ${this.tuples}, received ${n}`);
        }
    }
    async afterEach(_ctx: SystemBenchmarkContext): Promise<void> {}
    async afterAll(_ctx: SystemBenchmarkContext): Promise<void> {
        this.database!.run(`DROP TABLE IF EXISTS ${this.getName()}`);
    }
    async onError(_ctx: SystemBenchmarkContext): Promise<void> {
        this.database!.run(`DROP TABLE IF EXISTS ${this.getName()}`);
    }
}

export class SqljsVarcharScanBenchmark implements SystemBenchmark {
    initDB: sqljs.SqlJsStatic;
    database: sqljs.Database | null;
    tuples: number;
    chars: number;

    constructor(initDB: sqljs.SqlJsStatic, tuples: number, chars: number) {
        this.initDB = initDB;
        this.database = null;
        this.tuples = tuples;
        this.chars = chars;
    }
    getName(): string {
        return `sqljs_varchar_scan_${this.tuples}`;
    }
    getMetadata(): SystemBenchmarkMetadata {
        return {
            benchmark: 'varchar_scan',
            system: 'sqljs',
            tags: [],
            timestamp: +new Date(),
            parameters: [this.tuples, this.chars],
        };
    }
    async beforeAll(ctx: SystemBenchmarkContext): Promise<void> {
        faker.seed(ctx.seed);
        const values = generateUtf8(this.tuples, this.chars);
        this.database = new this.initDB.Database();
        const schema = new arrow.Schema([new arrow.Field('v0', new arrow.Utf8())]);
        this.database.run(sqlCreate(this.getName(), schema.fields));
        for (const query of sqlInsert(this.getName(), schema.fields, [values])) {
            this.database.run(query);
        }
    }
    async beforeEach(_ctx: SystemBenchmarkContext): Promise<void> {}
    async run(_ctx: SystemBenchmarkContext): Promise<void> {
        const results = this.database!.exec(`SELECT v0 FROM ${this.getName()}`);
        let n = 0;
        for (const row of results[0].values) {
            noop(row);
            n += 1;
        }
        if (n !== this.tuples) {
            throw Error(`invalid tuple count. expected ${this.tuples}, received ${n}`);
        }
    }
    async afterEach(_ctx: SystemBenchmarkContext): Promise<void> {}
    async afterAll(_ctx: SystemBenchmarkContext): Promise<void> {
        this.database!.run(`DROP TABLE IF EXISTS ${this.getName()}`);
    }
    async onError(_ctx: SystemBenchmarkContext): Promise<void> {
        this.database!.run(`DROP TABLE IF EXISTS ${this.getName()}`);
    }
}

export class SqljsRegexBenchmark implements SystemBenchmark {
    initDB: sqljs.SqlJsStatic;
    database: sqljs.Database | null;
    tuples: number;
    chars: number;

    constructor(initDB: sqljs.SqlJsStatic, tuples: number, chars: number) {
        this.initDB = initDB;
        this.database = null;
        this.tuples = tuples;
        this.chars = chars;
    }
    getName(): string {
        return `sqljs_regex_${this.tuples}`;
    }
    getMetadata(): SystemBenchmarkMetadata {
        return {
            benchmark: 'regex',
            system: 'sqljs',
            tags: [],
            timestamp: +new Date(),
            parameters: [this.tuples, this.chars],
        };
    }
    async beforeAll(ctx: SystemBenchmarkContext): Promise<void> {
        faker.seed(ctx.seed);
        const values = generateUtf8(this.tuples, this.chars);
        this.database = new this.initDB.Database();
        const schema = new arrow.Schema([new arrow.Field('v0', new arrow.Utf8())]);
        this.database.run(sqlCreate(this.getName(), schema.fields));
        for (const query of sqlInsert(this.getName(), schema.fields, [values])) {
            this.database.run(query);
        }
    }
    async beforeEach(_ctx: SystemBenchmarkContext): Promise<void> {}
    async run(_ctx: SystemBenchmarkContext): Promise<void> {
        const results = this.database!.exec(`SELECT * FROM ${this.getName()} WHERE v0 LIKE '_#%'`);
        let n = 0;
        for (const row of results[0].values) {
            noop(row);
            n += 1;
        }
        if (n !== 10) {
            throw Error(`invalid tuple count. expected 10, received ${n}`);
        }
    }
    async afterEach(_ctx: SystemBenchmarkContext): Promise<void> {}
    async afterAll(_ctx: SystemBenchmarkContext): Promise<void> {
        this.database!.run(`DROP TABLE IF EXISTS ${this.getName()}`);
    }
    async onError(_ctx: SystemBenchmarkContext): Promise<void> {
        this.database!.run(`DROP TABLE IF EXISTS ${this.getName()}`);
    }
}

export class SqljsIntegerSumBenchmark implements SystemBenchmark {
    initDB: sqljs.SqlJsStatic;
    database: sqljs.Database | null;
    tuples: number;
    groupSize: number;

    constructor(initDB: sqljs.SqlJsStatic, tuples: number, groupSize: number) {
        this.initDB = initDB;
        this.database = null;
        this.tuples = tuples;
        this.groupSize = groupSize;
    }
    getName(): string {
        return `sqljs_integer_sum_${this.tuples}`;
    }
    getMetadata(): SystemBenchmarkMetadata {
        return {
            benchmark: 'integer_sum',
            system: 'sqljs',
            tags: [],
            timestamp: +new Date(),
            parameters: [this.tuples, this.groupSize],
        };
    }
    async beforeAll(ctx: SystemBenchmarkContext): Promise<void> {
        faker.seed(ctx.seed);
        const [values0, values1] = generateGroupedInt32(this.tuples, this.groupSize);
        this.database = new this.initDB.Database();
        const schema = new arrow.Schema([
            new arrow.Field('v0', new arrow.Int32()),
            new arrow.Field('v1', new arrow.Int32()),
        ]);
        this.database.run(sqlCreate(this.getName(), schema.fields));
        for (const query of sqlInsert(this.getName(), schema.fields, [values0, values1])) {
            this.database.run(query);
        }
    }
    async beforeEach(_ctx: SystemBenchmarkContext): Promise<void> {}
    async run(_ctx: SystemBenchmarkContext): Promise<void> {
        const results = this.database!.exec(`SELECT SUM(v1) FROM ${this.getName()} GROUP BY v0`);
        let n = 0;
        for (const row of results[0].values) {
            noop(row);
            n += 1;
        }
        const expectedGroups = this.tuples / this.groupSize;
        if (n !== expectedGroups) {
            throw Error(`invalid tuple count. expected ${expectedGroups}, received ${n}`);
        }
    }
    async afterEach(_ctx: SystemBenchmarkContext): Promise<void> {}
    async afterAll(_ctx: SystemBenchmarkContext): Promise<void> {
        this.database!.run(`DROP TABLE IF EXISTS ${this.getName()}`);
    }
    async onError(_ctx: SystemBenchmarkContext): Promise<void> {
        this.database!.run(`DROP TABLE IF EXISTS ${this.getName()}`);
    }
}
