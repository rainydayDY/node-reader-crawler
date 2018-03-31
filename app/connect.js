const mysql = require('mysql');

let connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'dy521jiayou',
    database: 'reader'
});

module.exports = connection;
