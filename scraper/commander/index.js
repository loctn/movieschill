'use strict';

const config    = require('./config.json');
const poolQuery = require('./db').poolQuery;
const Scraper   = require('./scraper');
const Scorer    = require('./scorer');

const Promise = require('bluebird');
const co = (fn, ctx) => Promise.coroutine(fn.bind(ctx))();


let scrapers = {};

function statusSingle() {
  console.log(`[Pass ${status.pass}: ${settings.id}] Fetching params...`);
  status.pass++;
}

function statusBatch() {
  console.log(`[Pass ${status.pass}: ${status.row}/${settings.totalRows} (${Math.round(100 * status.row / settings.totalRows)}%)] Fetching params...`);
  let prevRow = status.row;
  status.row = (status.row + 1) % (settings.totalRows + 1) || 1;
  if (prevRow > status.row) status.pass++;
}

function scrape() {
  for (let host of config.soldiers) {
    scrapeSoldier(host);
  }
}

function scrapeSoldier(host) {
  co(function *() {
    while (!status.halt) {
      let results = yield prepareScrape();
      let scraper = scrapers[host] = scrapers[host] || new Scraper(host, config.scrape);
      let id      = results[0].id;
      let rt_url  = results[0].rt_url;

      for (let ip in scrapers) {
        if (scrapers.hasOwnProperty(ip) && ip !== host && scrapers[ip].id === id && scrapers[ip].site === settings.site) continue;
      }

      yield scraper.scrape(id, settings.site, rt_url);
    }
  }).then(endHandler);
}

function prepareScrape() {
  let query;

  switch (settings.batch) {
  case 'single':
    query = `SELECT id, rt_url FROM ${config.db.table} WHERE id = ${settings.id} LIMIT 1`;
    statusSingle();
    break;
  default:
    query = `SELECT id, rt_url FROM ${config.db.table} LIMIT ${status.row - 1}, 1`;
    statusBatch();
  }

  return poolQuery(query);
}

function score() {
  co(function *() {
    let scorer = new Scorer();

    while (!status.halt) {
      let query = `SELECT id, done_index_i, done_index_r FROM ${config.db.table} LIMIT ${status.row - 1}, 1`;
      statusBatch();

      let results = yield poolQuery(query);
      let id = results[0].id;

      for (let site of config.sites) {
        let doneIndex = results[0][`done_index_${site.charAt(0)}`] - 1;
        let isPageFile = false;

        while (!status.halt && !isPageFile) {
          doneIndex++;
          yield scorer.score(id, site, doneIndex);
          isPageFile = scorer.isPageFile;
        }
      }

      if (status.row === settings.totalRows) {
        status.halt = true;
      }
    }
  }).then(endHandler);
}

function endHandler() {
  return Promise.resolve().then(() => {
    console.log('Job interrupted or complete');
  }).catch(e => {
    console.error(e.stack);
  }).then(() => {
    process.exit();
  });
}


// DEBUG=* node server.js mode [site] [batch [singleId] | row]
var settings = {
  mode  : process.argv[2],
  site  : process.argv[3],
  batch : process.argv[4],
  id    : parseInt(process.argv[5])
};

var status = {
  pass : 1,
  row  : parseInt(settings.batch) || 1,
  halt : false
};

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', function() {
  status.halt = true;
});

poolQuery(`SELECT COUNT(*) AS count FROM ${config.db.table} LIMIT 1`).catch(e => {
  console.error('Error getting total rows');
  process.exit(1);
}).then(results => {
  settings.totalRows = results[0].count;

  switch (settings.mode) {  // mode
  case 'scrape':
    if (!~config.sites.indexOf(settings.site)) {
      console.error('Invalid site');
      process.exit(1);
    }

    scrape();
    break;
  case 'score':
    score();
  }
});
