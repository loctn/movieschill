'use strict';

const config    = require('./config.json');
const poolQuery = require('./db').poolQuery;

const fs     = require('fs');
const byline = require('byline');
const stream = byline(fs.createReadStream('data/tomatoURLs_2016-03-26.txt', { encoding: 'utf8' }));  // remember to convert dump to UTF-8


let row = 0;
let query = `UPDATE ${config.db.table} SET rt_url = ? WHERE id = ?`;

stream.on('data', function(line) {
  stream.pause();
  if (row % 1000 === 0) console.log(row);
  row++;

  let r      = line.split('\t');
  let id     = parseInt(r[0]);
  let rt_url = r[1].substr(0, 200) || null;
  if (!id || !rt_url || rt_url === 'N/A' || r.length !== 2) return stream.resume();

  poolQuery(query, [rt_url, id]).catch(e => {
    console.error(e);
  }).then(() => {
    stream.resume();
  });
});