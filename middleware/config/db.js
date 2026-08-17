const { Pool } = require("pg");

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "JobVerse",
    password: "anj07",
    port: 5432
});

module.exports = pool;