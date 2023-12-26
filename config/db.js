require('dotenv').config();
const mysql = require('mysql2');
const DATABASE_HOST = process.env.DATABASE_HOST;
const DATABASE_USER = process.env.DATABASE_USER;
const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;
const DATABASE_NAME = process.env.DATABASE_NAME;

const connection = mysql.createPool({
  host: DATABASE_HOST,
  user: DATABASE_USER,
  password: DATABASE_PASSWORD,
  database: DATABASE_NAME,
});

connection.getConnection((err) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log('connected successfully');
});

module.exports = connection.promise();