'use strict';

const MIN_MS_PER_REQUEST = 100;


const Promise = require('bluebird');
const fs      = Promise.promisifyAll(require('fs'));
const request = Promise.promisify(require('request'), { multiArgs: true });
const byline  = require('byline');
const stream  = byline(fs.createReadStream('data/tomatoes_2016-03-26.txt', { encoding: 'utf8' }));  // remember to convert dump to UTF-8
// const stream  = byline(fs.createReadStream('data/tomatoErrors-onepass.txt', { encoding: 'utf8' }));  // rerequest errors


let startId = process.argv[2] || 1;
let row = 0;

stream.on('data', function(line) {
  stream.pause(); 
  if (row % 10 === 0) console.log(row);
  row++;

  let r  = line.split('\t');
  let id = parseInt(r[0]);
  
  if (!id || id < startId || r.length !== 16) return stream.resume();
  // if (!id || id < startId) return stream.resume(); // re-request errors

  let omdbUrl   = `http://www.omdbapi.com/?i=${idToImdbId(id)}&tomatoes=true`;
  let startTime = Date.now();

  request(omdbUrl).spread((res, html) => {
    let tomatoURL = JSON.parse(html || '{}').tomatoURL;
    if (!tomatoURL) throw new Error('OMDb API returned a bad object');
    return fs.appendFileAsync('data/tomatoURLs.txt', id + '\t' + tomatoURL + '\r\n', 'utf8');
  }).catch(e => {
    e.id = id;
    console.error(e);
    return fs.appendFileAsync('data/tomatoErrors.txt', id + '\r\n');
  }).then(() => {
    let delay = Math.max(0, MIN_MS_PER_REQUEST - (Date.now() - startTime));
    return Promise.delay(delay);
  }).then(() => {
    stream.resume();
  });
});

function idToImdbId(id) {
  return 'tt' + '0000000'.substr(0, Math.max(0, 7 - id.toString().length)) + id;
}
