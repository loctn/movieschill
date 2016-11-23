'use strict';

const MIN_DB_WORD   = 4;
const MIN_REDS_WORD = 8;
const MAX_WORD      = 200;
const MAX_RESULTS   = 10;


const config    = require('./config.json');
const pool      = require('./db').pool;
const poolQuery = require('./db').poolQuery;

const Promise = require('bluebird');
const reds    = require('reds');
const express = require('express');


let app    = express();
let movies = {};
let search = reds.createSearch('title');

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://movieschill.com');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/search', (req, res) => {
  let query = req.query.q;

  // Hit the DB for BTREE-indexed `title_alpha` (alphanumeric version of `title`), then merge results with redis cache
  // Note: this is a poor man's alternative to a proper search database such as Elasticsearch or Solr
  Promise.resolve().then(() => {
    if (!query) throw new Error('Empty query');
    query = collapseSpaces(alpha(trim(String(query))));
    if (query.length < MIN_DB_WORD || query.length >= MAX_WORD) throw new Error('Query length error');

    return poolQuery(`SELECT id, title, year, cast FROM ${config.db.table} WHERE title_alpha LIKE '${query}%' ORDER BY imdb_votes DESC LIMIT ${MAX_RESULTS}`);
  }).then(results => {
    query = collapseVowels(query);

    if (query.length < MIN_REDS_WORD || results.length >= MAX_RESULTS) {
      return res.json(results.slice(0, MAX_RESULTS));
    }

    search.query(query).end((err, ids) => {
      if (err) throw err;
      let redsResults = ids
        .filter(id => !results.some(movie => movie.id == id))  // id is a String
        .map(id => movies[id]);
      res.json(results.concat(redsResults).slice(0, MAX_RESULTS));
    });
  }).catch(e => {
    res.sendStatus(400);
  });
});

function alpha(str) {
  return str.replace("'", '').replace(/[^a-zA-Z0-9 ]/g, ' ');
}

function collapseSpaces(str) {
  return str.replace(/ +/g, ' ');
}

function collapseVowels(str) {
  return str.replace(/([aiu])\1+/g, '$1').replace(/([eo])\1{2,}/g, '$1').replace(/([aeiou])[aeiou]{3,}/g, '$1');
}

function trim(str) {
  return str.replace(/^ +/, '').replace(/ +$/, '');
}


console.log('Building autocomplete cache...');

pool.getConnection((err, connection) => {
  connection.query(`SELECT id, title, year, cast FROM ${config.db.table} WHERE word_count_d > 0 OR word_count_p_i > 0 OR word_count_p_r > 0`).on('result', movie => {
    connection.pause();
    
    movies[movie.id] = {
      id    : movie.id,
      title : movie.title,
      year  : movie.year,
      cast  : (movie.cast || '').split(', ').slice(0, 3).join(', ')
    };

    search.index(movie.title, movie.id, () => {
      connection.resume();
    });
  }).on('error', err => {
    console.error(err);
    process.exit(1);
  }).on('end', () => {
    console.log('Autocomplete cache ready.');
  });
});


app.listen('8080');
console.log('Listening on 8080...');
