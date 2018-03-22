const { promisify } = require("util");
const sqlite3 = require("sqlite3");

function newDBConnection() {
  let db = new sqlite3.Database("mirrorband.sqlite");
  db.get = promisify(db.get);
  db.all = promisify(db.all);
  return db;
}

async function getHour(date, hour) {
  const db = newDBConnection();
  const query = `SELECT * FROM hour where time="${date} ${hour}:00"`;
  let row = await db.get(query);
  db.close();
  return {
    date: row.time,
    rx: row.rx,
    tx: row.tx,
    rate: row.rate
  };
}

async function getDay(date) {
  const db = newDBConnection();
  let row = await db.get(`SELECT * FROM day where time=?`, date);
  db.close();
  return {
    date: row.time,
    rx: row.rx,
    tx: row.tx,
    rate: row.rate
  };
}

async function getMonth(date) {
  const db = newDBConnection();
  const query = `SELECT * FROM month where time like "%%${date}%%"`;
  let row = await db.get(query);
  db.close();
  return {
    date: row.time,
    rx: row.rx,
    tx: row.tx,
    rate: row.rate
  };
}

async function getMonths(args) {
  const db = newDBConnection();
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
  db.close();
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
  const db = newDBConnection();
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
  db.close();
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
  const db = newDBConnection();
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
  db.close();
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
  const db = newDBConnection();
  let rows = await db.all("SELECT * from agg");
  db.close();
  let total = 0;

  for (const row of rows) {
    total += row.total;
  }

  return { total };
}

async function getDistroUsage(args) {
  const db = newDBConnection();
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
  db.close();
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
