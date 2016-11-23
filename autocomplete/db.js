'use strict';

const config = require('./config.json');

const Promise = require('bluebird');
const mysql   = require('mysql');


let pool = mysql.createPool({
  host              : config.db.host,
  user              : config.db.user,
  password          : config.db.password,
  database          : config.db.database,
  connectionLimit   : 10,
  supportBigNumbers : true
});

Promise.promisifyAll(require('mysql/lib/Connection').prototype);
Promise.promisifyAll(require('mysql/lib/Pool').prototype);

let getConnection = () => pool.getConnectionAsync().disposer(connection => connection.destroy());
let poolQuery = (query, params) => Promise.using(getConnection(), connection => connection.queryAsync(mysql.format(query, params)));


exports.pool      = pool;
exports.poolQuery = poolQuery;
