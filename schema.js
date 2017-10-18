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

const TimeEntry = new GraphQLObjectType({
    name: 'TimeEntry',
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
        },
        GB: {
            type: GraphQLFloat
        }
    })
})

async function getHour(date, hour) {
    const query = `SELECT * FROM hour where time="${date} ${hour}:00"`;
    let row = await db.get(query);
    return {
        date: row.time,
        rx: row.rx,
        tx: row.tx,
        rate: row.rate
    }
}

async function getDay(date) {
    let row = await db.get(`SELECT * FROM day where time=?`, date);
    return {
        date: row.time,
        rx: row.rx,
        tx: row.tx,
        rate: row.rate
    };
}

async function getMonth(date) {
    const query = `SELECT * FROM month where time like "%%${date}%%"`;

    let row = await db.get(query);
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
    return rows.map(row => {
        return {
            date: row.time,
            rx: row.rx,
            tx: row.tx,
            rate: row.rate
        }
    });
}

async function getDistroUsage(args) {
    let rows;

    let { distro, date } = args;

    let query = `SELECT * FROM distrousage
        ${distro ? `where distro="${distro}"` : ''}
        ${date && distro ? `and time="${date}"` : date ? `where time="${date}"`: ''}
        ORDER BY id DESC LIMIT 120
    `;

    rows = await db.all(query);

    return rows.map(row => {
        return {
            date: row.time,
            distro: row.distro,
            bytes: row.bytes,
            GB: parseFloat((row.bytes / 1000000000.0).toFixed(3))
        };
    });
}

const Query = new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
        hour: {
            type: TimeEntry,
            args: {
                date: {
                    name: 'date',
                    type: GraphQLString
                },
                hour: {
                    name: 'hour',
                    type: GraphQLInt
                }
            },
            resolve(rootValue, { date, hour }) {
                return getHour(date, hour);
            }
        },
        days: {
            type: new GraphQLList(TimeEntry),
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
            type: TimeEntry,
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
        month: {
            type: TimeEntry,
            args: {
                date: {
                    name: 'date',
                    type: GraphQLString
                }
            },
            resolve(rootValue, {date}) {
                return getMonth(date);
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