const express = require("express");
const graphqlHTTP = require("express-graphql");
const path = require("path");
const cors = require("cors");

const corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200,
  credentials: true
};

const { schema } = require("./schema.js");

const app = express();

app.use(cors(corsOptions));

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/index.html"));
});

app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    graphiql: true
  })
);

app.listen(4000, () => {
  console.log("Mirror GraphQL Server running. Press ctrl-c to quit...");
});
