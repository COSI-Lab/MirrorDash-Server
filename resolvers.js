const { promisify } = require("util");
const sqlite3 = require("sqlite3");

const db = new sqlite3.Database("mirrorband.sqlite");
db.get = promisify(db.get);
db.all = promisify(db.all);

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

module.exports = {
  getHour,
  getDay,
  getMonth,
  getHours,
  getDays,
  getMonths,
  getTotal,
  getDistroUsage
};
