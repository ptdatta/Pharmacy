const mysql = require("mysql");
require("dotenv").config();

const con = mysql.createConnection({
  host: process.env.HOSTNAME,
  user: process.env.DATABASE_USERNAME,
  password: process.env.PASSWORD,
  database: process.env.DATABASE_NAME,
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});

module.exports = con;
