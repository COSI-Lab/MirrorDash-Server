const {
  GraphQLID,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLObjectType,
  GraphQLList,
  GraphQLSchema
} = require("graphql");

const BigInt = require("graphql-bigint");

const { promisify } = require("util");

const sqlite3 = require("sqlite3");

const db = new sqlite3.Database("mirrorband.sqlite");

db.get = promisify(db.get);
db.all = promisify(db.all);

const TimeEntry = new GraphQLObjectType({
  name: "TimeEntry",
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

const TotalEntry = new GraphQLObjectType({
  name: "TotalEntry",
  fields: () => ({
    total: {
      type: BigInt
    }
  })
});

const DistroUsageEntry = new GraphQLObjectType({
  name: "DistroUsageEntry",
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
});

async function getHour(date, hour) {
  const query = `SELECT * FROM hour where time="${date} ${hour}:00"`;
  let row = await db.get(query);
  return {
    date: row.time,
    rx: row.rx,
    tx: row.tx,
    rate: row.rate
  };
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

async function getMonths(args) {
  let rows;
  if (args) {
    if (args.first) {
      rows = await db.all(
        `SELECT * FROM month ORDER BY id ASC LIMIT ${args.first}`
      );
    } else if (args.last) {
      rows = await db.all(
        `SELECT * FROM month ORDER BY id DESC LIMIT ${args.last}`
      );
    }
  } else {
    rows = await db.all("SELECT * FROM month");
  }
  return rows.map(row => {
    return {
      date: row.time,
      rx: row.rx,
      tx: row.tx,
      rate: row.rate
    };
  });
}

async function getDays(args) {
  let rows;
  if (args) {
    if (args.first) {
      rows = await db.all(
        `SELECT * FROM day ORDER BY id ASC LIMIT ${args.first}`
      );
    } else if (args.last) {
      rows = await db.all(
        `SELECT * FROM day ORDER BY id DESC LIMIT ${args.last}`
      );
    }
  } else {
    rows = await db.all("SELECT * from day");
  }
  return rows.map(row => {
    return {
      date: row.time,
      rx: row.rx,
      tx: row.tx,
      rate: row.rate
    };
  });
}

async function getHours(args) {
  let rows;
  if (args) {
    if (args.first) {
      rows = await db.all(
        `SELECT * FROM hour ORDER BY id ASC LIMIT ${args.first}`
      );
    } else if (args.last) {
      rows = await db.all(
        `SELECT * FROM hour ORDER BY id DESC LIMIT ${args.last}`
      );
    }
  } else {
    rows = await db.all("SELECT * from hour");
  }
  return rows.map(row => {
    return {
      date: row.time,
      rx: row.rx,
      tx: row.tx,
      rate: row.rate
    };
  });
}

async function getTotal() {
  let rows = await db.all("SELECT * from agg");

  let total = 0;

  for (const row of rows) {
    total += row.total;
  }

  return { total };
}

async function getDistroUsage(args) {
  let rows, distroArr;

  let { distros, date, lastDays, sortBiggest } = args;

  if (distros) {
    distroArr = `(${distros.map(distro => `"${distro}"`)})`;
  }

  let query = `SELECT * FROM distrousage
        ${distros ? `where distro IN ${distroArr}` : ""}
        ${
          date && distros
            ? `and time="${date}"`
            : date ? `where time="${date}"` : ""
        }

        ORDER BY id DESC LIMIT ${
          lastDays && distros
            ? distros.length * lastDays
            : lastDays ? 41 * lastDays : 123
        }
    `;

  rows = await db.all(query);

  rows = rows.map(row => {
    return {
      date: row.time,
      distro: row.distro,
      bytes: row.bytes,
      GB: parseFloat((row.bytes / 1000000000.0).toFixed(2))
    };
  });

  if (sortBiggest) {
    return rows.sort((a, b) => {
      if (a.bytes < b.bytes) {
        return 1;
      } else if (a.bytes > b.bytes) {
        return -1;
      }
      return 0;
    });
  } else {
    return rows;
  }
}

const Query = new GraphQLObjectType({
  name: "Query",
  fields: () => ({
    hour: {
      type: TimeEntry,
      args: {
        date: {
          name: "date",
          type: GraphQLString
        },
        hour: {
          name: "hour",
          type: GraphQLInt
        }
      },
      resolve(rootValue, { date, hour }) {
        return getHour(date, hour);
      }
    },
    months: {
      type: new GraphQLList(TimeEntry),
      args: {
        first: {
          name: "first",
          description: "The first n hours in the db",
          type: GraphQLInt
        },
        last: {
          name: "last",
          description: "The last n hours in the db",
          type: GraphQLInt
        }
      },
      resolve(rootValue, args) {
        return getMonths(args);
      }
    },
    days: {
      type: new GraphQLList(TimeEntry),
      args: {
        first: {
          name: "first",
          description: "The first n days in the db",
          type: GraphQLInt
        },
        last: {
          name: "last",
          description: "The last n days in the db",
          type: GraphQLInt
        }
      },
      resolve(rootValue, args) {
        return getDays(args);
      }
    },
    hours: {
      type: new GraphQLList(TimeEntry),
      args: {
        first: {
          name: "first",
          description: "The first n hours in the db",
          type: GraphQLInt
        },
        last: {
          name: "last",
          description: "The last n hours in the db",
          type: GraphQLInt
        }
      },
      resolve(rootValue, args) {
        return getHours(args);
      }
    },
    day: {
      type: TimeEntry,
      args: {
        date: {
          name: "date",
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
          name: "date",
          type: GraphQLString
        }
      },
      resolve(rootValue, { date }) {
        return getMonth(date);
      }
    },
    total: {
      type: TotalEntry,
      resolve(rootValue, args) {
        return getTotal();
      }
    },
    distrousage: {
      type: new GraphQLList(DistroUsageEntry),
      args: {
        distros: {
          name: "distro",
          description:
            "A list of distros you want to view, if a single distro, just make an array of one element",
          type: new GraphQLList(GraphQLString)
        },
        date: {
          name: "date",
          type: GraphQLString
        },
        lastDays: {
          name: "lastDays",
          description:
            "Last N days you wish to view. if blank will return last 3 days",
          type: GraphQLInt
        },
        sortBiggest: {
          name: "sortBiggest",
          type: GraphQLBoolean
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
