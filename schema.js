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
  description: "An entry which includeds RX, TX, and rate",
  fields: () => ({
    date: {
      type: GraphQLString,
      description: DateDescription
    },
    rx: {
      type: BigInt,
      description: "Bytes recieved in"
    },
    tx: {
      type: BigInt,
      description: "Bytes transferred out"
    },
    rate: {
      type: GraphQLFloat,
      description: "Bandwidth rate in Mbit/s"
    }
  })
});

const TotalEntry = new GraphQLObjectType({
  name: "TotalEntry",
  description: "Entry for total bandwidth ever on Mirror",
  fields: () => ({
    total: {
      type: BigInt,
      description: "The number in bytes ever passed through Mirror currently"
    }
  })
});

const DistroUsageEntry = new GraphQLObjectType({
  name: "DistroUsageEntry",
  description: "Daily entry for individual distros & projects",
  fields: () => ({
    date: {
      type: GraphQLString,
      description: DateDescription
    },
    distro: {
      type: GraphQLString,
      description: "The name of the distro / project"
    },
    bytes: {
      type: BigInt,
      description: "Bandwidth of this particular distro on a given day in bytes"
    },
    GB: {
      type: GraphQLFloat,
      description: "Bandwidth in GB"
    }
  })
});

const DateDescription = "Date in format MMM/DD/YYYY";

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
      description: "A time entry for a particular hour",
      args: {
        date: {
          name: "date",
          type: GraphQLString,
          description: DateDescription
        },
        hour: {
          name: "hour",
          type: GraphQLInt,
          description: "An number between 0 and 23 for hours"
        }
      },
      resolve(rootValue, { date, hour }) {
        return getHour(date, hour);
      }
    },
    months: {
      type: new GraphQLList(TimeEntry),
      description: "A list of time entries for a set of months",
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
      description: "A list of time entries for a set of days",
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
      description: "A list of time entries for a set of hours",
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
      description: "A time entry for a particular day",
      args: {
        date: {
          name: "date",
          type: GraphQLString,
          description: DateDescription
        }
      },
      resolve(rootValue, { date }) {
        return getDay(date);
      }
    },
    month: {
      type: TimeEntry,
      description: "A time entry for a particular hour",
      args: {
        date: {
          name: "date",
          type: GraphQLString,
          description: DateDescription
        }
      },
      resolve(rootValue, { date }) {
        return getMonth(date);
      }
    },
    total: {
      type: TotalEntry,
      description: "Total bandwidth on Mirror",
      resolve(rootValue, args) {
        return getTotal();
      }
    },
    distrousage: {
      type: new GraphQLList(DistroUsageEntry),
      description:
        "A list of Distrousage entries for a set on distros on a set of days",
      args: {
        distros: {
          name: "distro",
          description:
            "A list of distros you want to view, if a single distro, just make an array of one element",
          type: new GraphQLList(GraphQLString)
        },
        date: {
          name: "date",
          type: GraphQLString,
          description: DateDescription
        },
        lastDays: {
          name: "lastDays",
          description:
            "Last N days you wish to view. if blank will return last 3 days",
          type: GraphQLInt
        },
        sortBiggest: {
          name: "sortBiggest",
          description: "Sort by largest repos descending",
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
