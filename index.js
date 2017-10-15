const express = require('express');
const graphqlHTTP = require('express-graphql');


const { schema } = require('./schema.js');

const app = express();

app.use('/graphql', graphqlHTTP({
    schema,
    graphiql: true
}));

app.listen(3000, () => {
    console.log('Server running. Press ctrl-c to quit...');
});