const {
    GraphQLID,
    GraphQLString,
    GraphQLInt,
    GraphQLFloat,
    GraphQLObjectType,
    GraphQLList,
    GraphQLSchema
} = require('graphql');

const BigInt = require('graphql-bigint');

const { promisify } = require('util');

const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('mirrorband.sqlite');

db.get = promisify(db.get);
db.all = promisify(db.all);

const DayEntry = new GraphQLObjectType({
    name: 'DayEntry',
    fields: () => ({
        date: {
            type: GraphQLString
        },
        rx: {
            type: BigInt
        },
        tx: {
            type: BigInt
        },
        rate: {
            type: GraphQLFloat
        }
    })
});

const DistroUsageEntry = new GraphQLObjectType({
    name: 'DistroUsageEntry',
    fields: () => ({
        date: {
            type: GraphQLString
        },
        distro: {
            type: GraphQLString
        },
        bytes: {
            type: BigInt
        }
    })
})

async function getDay(date) {
    let row = await db.get(`SELECT * FROM day where time=?`, date);
    return {
        date: row.time,
        rx: row.rx,
        tx: row.tx,
        rate: row.rate
    };
}

async function getDays(args) {
    let rows;
    if(args) {
        if(args.first) {
            rows = await db.all(`SELECT * FROM day ORDER BY id ASC LIMIT ${args.first}`);
        } else if(args.last) {
            rows = await db.all(`SELECT * FROM day ORDER BY id DESC LIMIT ${args.last}`);
        }
    } else {
        rows = await db.all('SELECT * from day');
    }
    rows = rows.map(row => {
        return {
            date: row.time,
            rx: row.rx,
            tx: row.tx,
            rate: row.rate
        }
    });
    return rows;
}

async function getDistroUsage(args) {
    let rows;
    if(args.distro) {
        rows = await db.all(`SELECT * FROM distrousage WHERE distro="${args.distro}" ORDER BY id DESC LIMIT 50`);
    } else if(args.date) {
        rows = await db.all(`SELECT * FROM distrousage WHERE time="${args.date}"`);
    } else {
        rows = await db.all(`SELECT * FROM distrousage ORDER BY id DESC LIMIT 50`);
    }

    rows = rows.map(row => {
        // console.log(row);
        return {
            date: row.time,
            distro: row.distro,
            bytes: row.bytes
        };
    });
    return rows;
}

const Query = new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
        days: {
            type: new GraphQLList(DayEntry),
            args: {
                first: {
                    name: 'first',
                    description: 'The first n days in the db',
                    type: GraphQLInt
                },
                last: {
                    name: 'last',
                    description: 'The last n days in the db',
                    type: GraphQLInt
                }
            },
            resolve(rootValue, args) {
                return getDays(args);
            }
        },
        day: {
            type: DayEntry,
            args: {
                date: {
                    name: 'date',
                    type: GraphQLString
                }
            },
            resolve(rootValue, { date }) {
                return getDay(date);
            }
        },
        distrousage: {
            type: new GraphQLList(DistroUsageEntry),
            args: {
                distro: {
                    name: 'distro',
                    type: GraphQLString
                },
                date: {
                    name: 'date',
                    type: GraphQLString
                }
            },
            resolve(rootValue, args) {
                return getDistroUsage(args);
            }
        }
    })
});

const schema = new GraphQLSchema({
    query: Query
});

module.exports = { schema };