'use strict';

const config    = require('./config.json');
const poolQuery = require('./db').poolQuery;

const fs     = require('fs');
const byline = require('byline');
const stream = byline(fs.createReadStream('data/tomatoes_2016-03-26.txt', { encoding: 'utf8' })); // remember to convert dump to UTF-8


let row = 0;
let query = `
  UPDATE ${config.db.table} SET
    rt_critics_image  = ?, rt_critics_rating    = ?, rt_critics_meter = ?, rt_critics_votes = ?, rt_critics_fresh = ?,
    rt_critics_rotten = ?, rt_critics_consensus = ?, rt_users_meter   = ?, rt_users_rating  = ?, rt_users_votes   = ?,
    dvd_date          = ?, box_office           = ?, production       = ?, website_url      = ?
  WHERE id = ?
`;

stream.on('data', function(line) {
  stream.pause();
  if (row % 1000 === 0) console.log(row);
  row++;

  let r  = line.split('\t');
  let id = parseInt(r[0]);
  if (!id || r.length !== 16) return stream.resume();  // we omit 1 columns and use 15

  let box_office = r[12].replace('$', '');
  if (box_office.indexOf('M') !== -1) {
    box_office = parseInt(1000000 * parseFloat(box_office.replace('M', '')));
  } else {
    box_office = parseInt(box_office);
  }

  let params = [
    r[1].substr(0, 9) || null,                   // rt_critics_image
    10 * parseFloat(r[2]) || null,               // rt_critics_rating
    parseInt(r[3]) || null,                      // rt_critics_meter
    parseInt(r[4]) || null,                      // rt_critics_votes
    parseInt(r[5]) || null,                      // rt_critics_fresh
    parseInt(r[6]) || null,                      // rt_critics_rotten
    r[7].substr(0, 2000) || null,                // rt_critics_consensus
    parseInt(r[8]) || null,                      // rt_users_meter
    10 * parseInt(r[9]) || null,                 // rt_users_rating
    parseInt(r[10]) || null,                     // rt_users_votes
    parseInt(r[11].replace(/\-/g, '')) || null,  // dvd_date
    box_office || null,
    r[13].substr(0, 50) || null,                 // production
    r[14].substr(0, 200) || null,                // website_url
    id
  ];

  poolQuery(query, params).catch(e => {
    console.error(e);
  }).then(() => {
    stream.resume();
  });
});