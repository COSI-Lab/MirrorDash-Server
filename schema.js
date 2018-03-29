const {
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLObjectType,
  GraphQLList,
  GraphQLSchema
} = require("graphql");

const { TimeEntry, DistroUsageEntry, TotalEntry } = require("./types");
const resolvers = require("./resolvers");

const DateDescription = "Date in format MMM/DD/YYYY";

const hourQuery = {
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
    return resolvers.getHour(date, hour);
  }
};

const monthsQuery = {
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
    return resolvers.getMonths(args);
  }
};

const daysQuery = {
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
    return resolvers.getDays(args);
  }
};

const hoursQuery = {
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
    return resolvers.getHours(args);
  }
};

const dayQuery = {
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
    return resolvers.getDay(date);
  }
};

const monthQuery = {
  type: TimeEntry,
  description: "A time entry for a particular month",
  args: {
    date: {
      name: "date",
      type: GraphQLString,
      description: DateDescription
    }
  },
  resolve(rootValue, { date }) {
    return resolvers.getMonth(date);
  }
};

const totalQuery = {
  type: TotalEntry,
  description: "Total bandwidth on Mirror",
  resolve(rootValue, args) {
    return resolvers.getTotal();
  }
};

const distrousageQuery = {
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
    return resolvers.getDistroUsage(args);
  }
};

const distrousageTotalQuery = {
  type: DistroUsageEntry,
  description: "Aggregate bandwidth for a repo",
  args: {
    distro: {
      name: "distro",
      description: "The name of a distro",
      type: GraphQLString
    }
  },
  resolve(rootValue, args) {
    return resolvers.getDistroUsageTotal(args);
  }
};

const Query = new GraphQLObjectType({
  name: "Query",
  fields: () => ({
    months: monthsQuery,
    days: daysQuery,
    hours: hoursQuery,
    month: monthQuery,
    day: dayQuery,
    hour: hourQuery,
    total: totalQuery,
    distrousage: distrousageQuery,
    distrousagetotal: distrousageTotalQuery
  })
});

const schema = new GraphQLSchema({
  query: Query
});

module.exports = { schema };
