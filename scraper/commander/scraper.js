'use strict';

const PAGE_SIZE = 100 * 1024;


const config     = require('./config.json');
const chillUtils = require('./utils');
const Commander  = require('./commander');

const debug   = require('debug');
const Promise = require('bluebird');
const fs      = Promise.promisifyAll(require('fs'));
const zlib    = Promise.promisifyAll(require('zlib'));
const mkdirp  = Promise.promisify(require('mkdirp'));
const request = Promise.promisify(require('request'), { multiArgs: true });


class Scraper extends Commander {
  constructor(host, opts) {
    super();
    opts = opts || {};

    this.debug       = debug(host);
    this.host        = host;
    this.expires     = opts.expires || 14;  // days
    this.maxAttempts = opts.maxAttempts || 2;
    this.rt_url      = null;
    this.start       = null;
    this.status      = this.STATUS_IDLE;
    this.backoff     = 0;
  }

  static get STATUS_IDLE() {
    return 0;
  }

  static get STATUS_SCRAPING() {
    return 1;
  }

  get url() {
    let rt_url = encodeURIComponent(this.rt_url || '');
    return `http://${this.host}:8080/movieschill?id=${this.id}&site=${this.site}&page=${this.progress.page}&rt_url=${rt_url}`;
  }

  log(message) {
    this.debug(`(${this.id}:${this.site}) ${message}`);
  }

  scrape(id, site, rt_url) {
    return Promise.resolve().bind(this).then(() => {
      let minDelay = Math.max(0, config.minDelay - (Date.now() - this.start));
      let backoff  = Math.min(60000, 10 * Math.random() * (Math.pow(2, this.backoff) - 1));
      return Promise.delay(Math.max(minDelay, backoff));
    }).then(() => {
      this.id     = id;
      this.site   = site;
      this.rt_url = rt_url;

      if (this.status !== this.STATUS_IDLE) throw new Error('Scraper busy');  // TODO: handle this better
      if (site === 'rt' && !rt_url) return;
      this.log('Starting scrape...');
      
      this.start  = Date.now();
      this.status = this.STATUS_SCRAPING;

      return this.createPath().bind(this)
        .then(this.readProgress)
        .then(this.fetchScrape)
        .then(this.writeScrape)
        .then(this.writeProgress)
        .then(() => {
          this.log('Scrape successful.');
        });
    }).catch(chillUtils.DataExhaustedError, e => {
      this.log(e.message);
      this.start = Date.now() - config.minDelay;  // don't delay next scrape
    }).then(() => {
      this.backoff = 0;
    }).catch(e => {
      this.log(e.message);
      this.backoff = Math.min(15, this.backoff + 1);
    }).then(() => {
      this.status = this.STATUS_IDLE;
    });
  }

  createPath() {
    return mkdirp(this.path).catch(e => {
      if (e.code !== 'ENOENT') throw e;
    });
  }

  readProgress() {
    return fs.readFileAsync(this.progressFile).bind(this).catch(e => {
      if (e.code !== 'ENOENT') throw e;
    }).then(data => {
      this.progress = JSON.parse(data || this.PROGRESS_TEMPLATE);
      let oneDay = 24 * 60 * 60 * 1000;
      if (this.progress.page === this.progress.pageCount && Date.now() - this.progress.lastScraped < this.expires * oneDay) {
        throw new chillUtils.DataExhaustedError('Scrape data exhausted', this.id, this.site);
      }
    });
  }

  fetchScrape() {
    return request(this.url).bind(this).spread((res, html) => {
      this.data = JSON.parse(html);
      if (this.data.err) throw new Error(this.data.err.message);
    }).catch(SyntaxError, e => {
      throw new chillUtils.FetchAttemptError('Bad HTML response', this.id, this.site);
    });
  }

  writeScrape() {
    if (this.progress.page === this.data.pageCount) {
      return this.writeScrapePartial();
    } else {
      return this.writeScrapeFull();
    }
  }

  writeScrapePartial() {
    return Promise.resolve().bind(this).then(() => {
      let data = new Buffer(JSON.stringify(this.data.reviews));
      return zlib.deflateRawAsync(data, { level: 8 });
    }).then(data => {
      return fs.writeFileAsync(this.pageFile, data);
    });
  }

  writeScrapeFull() {
    return fs.readFileAsync(this.doneFile).bind(this).catch(e => {
      if (e.code !== 'ENOENT') throw e;
    }).then(data => {
      return zlib.inflateRawAsync(data || '');
    }).then(data => {
      data = data.toString();
      if (data.length >= PAGE_SIZE) {
        data = '';
        this.progress.doneIndex++;
      }
      data = new Buffer(JSON.stringify(JSON.parse(data || '[]').concat(this.data.reviews)));
      return zlib.deflateRawAsync(data, { level: 8 });
    }).then(data => {
      return fs.writeFileAsync(this.doneFile, data);
    });
  }

  writeProgress() {
    let progress = this.progress;
    return Promise.resolve().bind(this).then(() => {
      progress.page       += (progress.page !== this.data.pageCount);
      progress.pageCount   = this.data.pageCount;
      progress.lastScraped = Date.now();
      progress.attempts    = 0;
    }).catch(chillUtils.FetchAttemptError, e => {
      if (progress.attempts++ >= this.maxAttempts) {
        progress.attempts = 0;
        if (progress.page < progress.pageCount) progress.page++;
      }
    }).then(() => {   // TODO: if this errors we should roll back everything
      return fs.writeFileAsync(this.progressFile, JSON.stringify(progress));
    });
  }
}


module.exports = Scraper;
