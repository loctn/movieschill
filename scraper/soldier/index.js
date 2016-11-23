'use strict';

const sites = require('./sites.json');

const Promise = require('bluebird');
const whacko  = require('whacko');  // cheerio leaks memory: https://github.com/cheeriojs/cheerio/issues/830
const express = require('express');
const request = Promise.promisify(require('request'), { multiArgs: true });

const app = express();


app.get('/movieschill', (req, res) => {
  let id     = req.query.id;
  let site   = req.query.site;
  let page   = req.query.page;
  let rt_url = req.query.rt_url;

  if (!id || !site || !page) return res.send(400);

  console.log(`(${id}:${site}) Starting scrape...`);
  let url = (site === 'imdb') ? imdbReviewsUrl(id, page) : rtReviewsUrl(rt_url, page);

  // Note: scraping code has not been tested since Q1 2016 - it is not guaranteed to work due to possible changes in RT/IMDb pages
  request(url).spread((response, html) => {
    let $ = whacko.load(html);

    let $reviews = $(sites[site].selectors.reviews);
    if (!$reviews.length) throw new Error(`"${site}" DOM error getting reviews`);

    let pageCount = parseInt($(sites[site].selectors.pageCount).eq(0).text().replace(/Page [0-9]+ of ([0-9]+):?/, '$1'));
    if (!pageCount) throw new Error(`"${site}" DOM error getting pageCount`);

    let data = { pageCount: pageCount, reviews: [] };
    $reviews.each((i, element) => {
      data.reviews.push($(element).text().replace(/<[^>]*>/g, ' '));
    });

    console.log(`(${id}:${site}) Scrape successful.`);
    res.json(data);
  }).catch(e => {
    console.error(e);
    res.json({ err: { code: e.code, message: e.message }});
  });
});

function idToImdbId(id) {
  return 'tt' + '0000000'.substr(0, Math.max(0, 7 - id.toString().length)) + id;
}

function imdbReviewsUrl(id, page) {
  return `http://www.imdb.com/title/${idToImdbId(id)}/reviews?start=${10 * (page - 1)}`;
}

function rtReviewsUrl(rt_url, page) {
  if (~rt_url.indexOf('%')) rt_url = decodeURIComponent(rt_url);
  return `${rt_url}reviews/?page=${page}&type=user&sort=`;
}


app.listen('8080');
console.log('Listening on 8080...');
