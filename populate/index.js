'use strict';

const config    = require('./config.json');
const poolQuery = require('./db').poolQuery;

const fs     = require('fs');
const byline = require('byline');
const stream = byline(fs.createReadStream('data/omdbMovies_2016-03-26.txt', { encoding: 'utf8' }));  // remember to convert dump to UTF-8


let row = 0;
let query = `
  INSERT INTO ${config.db.table} (
    id,     imdb_id, title,     title_alpha, year,       mpaa_rating, runtime,  genre,   release_date, director,
    writer, cast,    mc_rating, imdb_rating, imdb_votes, plot_short,  language, country, awards
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
  ) ON DUPLICATE KEY UPDATE
    id          = ?, imdb_id  = ?, title     = ?, title_alpha  = ?, year       = ?,
    mpaa_rating = ?, runtime  = ?, genre     = ?, release_date = ?, director   = ?,
    writer      = ?, cast     = ?, mc_rating = ?, imdb_rating  = ?, imdb_votes = ?,
    plot_short  = ?, language = ?, country   = ?, awards       = ?
`;

stream.on('data', function(line) {
  stream.pause();
  if (row % 1000 === 0) console.log(row);
  row++;

  let r  = line.split('\t');
  let id = parseInt(r[0]);
  if (!id || r.length !== 21) return stream.resume();  // we omit 3 columns and use 18

  let title       = r[2].substr(0, 300);
  let year        = parseInt(r[3]) || null;
  let mpaa_rating = r[4].substr(0, 50);
  let runtime     = parseInt(r[5].replace(' min', '')) || null;
  let genre       = r[6].substr(0, 100) || null;
  let imdb_votes  = parseInt(r[13]) || null;

  let porn      = (genre && ~genre.toLowerCase().indexOf('adult') || mpaa_rating && mpaa_rating.toLowerCase() === 'x');
  let shorts    = (genre && ~genre.toLowerCase().indexOf('short') || runtime !== null && runtime < 60);
  let unpopular = (imdb_votes === null || imdb_votes < 1000);

  if (porn || shorts || unpopular) return stream.resume();

  let params = [
    id,
    r[1].substr(0, 12),                         // imdb_id
    title,
    title.replace("'", '').replace(/[^a-zA-Z0-9 ]/g, ' ').replace(/ +/g, ' '),  // TODO: convert weird characters to their alpha counterparts
    year,
    mpaa_rating,
    runtime,
    genre,
    parseInt(r[7].replace(/\-/g, '')) || null,  // release_date
    r[8].substr(0, 50) || null,                 // director
    r[9].substr(0, 150) || null,                // writer
    r[10].substr(0, 500) || null,               // cast
    parseInt(r[11]) || null,                    // mc_rating
    10 * parseFloat(r[12]) || null,             // imdb_rating
    imdb_votes,
    r[15].substr(0, 2000) || null,              // plot_short
    r[17].substr(0, 100) || null,               // language
    r[18].substr(0, 50) || null,                // country
    r[19].substr(0, 200) || null,               // awards
  ];
  params = params.concat(params);

  poolQuery(query, params).catch(e => {
    console.error(e);
  }).then(() => {
    stream.resume();
  });
});