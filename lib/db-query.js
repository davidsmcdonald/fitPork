const { Client } = require('pg');
const config = require('./config');

const logQuery = (statement, parameters) => {
  const timeStamp = new Date();
  const formattedTimeStamp = timeStamp.toString().substring(4, 24);
  console.log(formattedTimeStamp, statement, parameters);
};

const isProduction = (config.NODE_ENV === "production");

const CONNECTION = {
  connectionString: config.DATABASE_URL,
  ssl: isProduction,
};

module.exports = {
  async dbQuery(statement, ...parameters) {
    const client = new Client(CONNECTION);

    await client.connect();
    logQuery(statement, parameters);
    const result = await client.query(statement, parameters);
    await client.end();

    return result;
  },
};
