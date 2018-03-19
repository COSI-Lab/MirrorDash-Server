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

const DateDescription = "Date in format MMM/DD/YYYY";

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

module.exports = {
  TimeEntry,
  DistroUsageEntry,
  TotalEntry
};
