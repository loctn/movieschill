'use strict';

const MAX_SUBPETAL_MATCHES = 7;
const SPAM_THRESHOLD       = Infinity;
const MIN_WORDS_PER_REVIEW = 0;
const PRIMARY_FACTOR       = 9;
const PRIMARY_BLEED_1      = 0;
const PRIMARY_BLEED_2      = 0;
const SECONDARY_FACTOR     = 4;


const config     = require('./config.json');
const poolQuery  = require('./db').poolQuery;
const chillUtils = require('./utils');
const Commander  = require('./commander');

const Promise = require('bluebird');
const fs      = Promise.promisifyAll(require('fs'));
const zlib    = Promise.promisifyAll(require('zlib'));


// TODO: exclude words which are in the title of the movie
// TODO: spam should be on a per-word basis, not per-list
// TODO: perhaps a word should only be counted once per review?
let wordsRegex = Array.from(new Array(32), (v, i) => {
  // Don't care about the right-side word boundary, to cover suffixes
  return new RegExp('\\b' + fs.readFileSync(`words/${i}.txt`).toString().split('\r\n').join('|'), 'g');
});

class Scorer extends Commander {
  constructor() {
    super();
    this.isPageFile = false;
  }

  get SCORE_EMPTY() {
    return Array.from(new Array(32), () => 0);
  }

  get _s() {
    return `_${this.site.charAt(0)}`;
  }

  score(id, site, doneIndex) {
    this.id = id;
    this.site = site;   
    this.progress.doneIndex = doneIndex;
    this.isPageFile = false;

    console.log('Starting score...');

    return this.readReviews().bind(this)
      .then(this.computeScore)
      .then(this.writeScore)
      .then(this.writeScoreCache)
      .then(() => {
        console.log('Score successful.');
      }).catch(chillUtils.ChillError, e => {
        console.error(e);
      }).catch(e => {
        console.error(e.stack);
      });
  }

  readReviews() {
    return fs.readFileAsync(this.doneFile).bind(this).catch(e => {
      if (e.code !== 'ENOENT') throw e;
      this.isPageFile = true;
      throw new chillUtils.ChillError('Score data exhausted', this.site, this.id);
    }).then(data => {
      return zlib.inflateRawAsync(data);
    }).then(data => {
      this.data = JSON.parse(data);
      return fs.readFileAsync(this.getDoneFile(this.progress.doneIndex + 1));
    }).catch(e => {
      if (e.code !== 'ENOENT') throw e;
      this.isPageFile = true;
      return fs.readFileAsync(this.pageFile).bind(this).then(data => {
        return zlib.inflateRawAsync(data);
      }).then(data => {
        this.data = this.data.concat(JSON.parse(data));
      }).catch(e => {
        if (e.code !== 'ENOENT') throw e;
      });
    });
  }

  computeScore() {
    return Promise.resolve().bind(this).then(() => {
      // result.score's 0 element is serenity, 2 is ecstasy, 3 is love, 4 is acceptance, etc.
      let result = { score: this.SCORE_EMPTY, word_count: 0 };

      for (let review of this.data) {
        let reviewScore = this.computeReviewScore(review);

        if (reviewScore) {
          for (let i = 0; i < result.score.length; i++) {
            result.score[i] += reviewScore.score[i];
          }
          result.word_count += reviewScore.word_count;
        }
      }

      return result;
    });
  }

  computeReviewScore(review) {
    let word_count = (review.match(/\S+/g) || { length: 0 }).length;
    if (word_count < MIN_WORDS_PER_REVIEW) return;

    let result = { score: this.SCORE_EMPTY, word_count: word_count };
    let isSpam = false;

    wordsRegex.forEach((re, i) => {
      if (isSpam) return;
      let matches = (review.match(re) || { length: 0 }).length;

      if (matches >= SPAM_THRESHOLD) isSpam = true;
      if (isSpam || !matches) return;

      let s = result.score;
      let m = Math.min(MAX_SUBPETAL_MATCHES, matches);
      let a;

      switch (i % 4) {
      case 0:
        s[i]     += PRIMARY_FACTOR  * m;
        s[i + 1] += PRIMARY_BLEED_1 * m;
        s[i + 2] += PRIMARY_BLEED_2 * m;
        break;
      case 1:
        s[i]     += PRIMARY_FACTOR  * m;
        s[i - 1] += PRIMARY_BLEED_1 * m;
        s[i + 1] += PRIMARY_BLEED_1 * m;
        break;
      case 2:
        s[i]     += PRIMARY_FACTOR  * m;
        s[i - 1] += PRIMARY_BLEED_1 * m;
        s[i - 2] += PRIMARY_BLEED_2 * m;
        break;
      case 3:
        a = SECONDARY_FACTOR * m;
        s[i - 3] += a; s[(i + 1) % 32] += a;
        s[i - 2] += a; s[(i + 2) % 32] += a;
        s[i - 1] += a; s[(i + 3) % 32] += a;
      }
    });

    return isSpam ? null : result;
  }

  writeScore(result) {
    if (this.isPageFile) {
      return this.writeScorePartial(result);
    } else {
      return this.writeScoreFull(result);
    }
  }

  buildSets(fn) {
    let sets = [];
    let i = 0;
    for (let p = 0; p < 8; p++) {
      for (let s = 0; s < 3; s++) {
        sets.push(fn(`${p}${s}`, i));
        i += (i % 4 === 2) ? 2 : 1;
      }
    }
    return sets.join(', ');
  }

  writeScorePartial(result) {
    let sets = this.buildSets((ps, i) => `p${ps}${this._s} = ${result.score[i]}`);
  
    return poolQuery(`UPDATE ${config.db.table} SET ${sets}, word_count_p${this._s} = ${result.word_count}, done_index${this._s} = ${this.progress.doneIndex} WHERE id = ${this.id}`);
  }

  writeScoreFull(result) {
    let sets = this.buildSets((ps, i) => `d${ps} = d${ps} + ${result.score[i]}`);

    return poolQuery(`UPDATE ${config.db.table} SET ${sets}, word_count_d = word_count_d + ${result.word_count}, done_index${this._s} = ${this.progress.doneIndex + 1} WHERE id = ${this.id}`);
  }

  writeScoreCache() {
    let sets = this.buildSets(ps => `c${ps} = ROUND(10000 * (d${ps} + p${ps}_i + p${ps}_r) / (word_count_d + word_count_p_i + word_count_p_r))`);

    return poolQuery(`UPDATE ${config.db.table} SET ${sets} WHERE id = ${this.id}`);
  }
}


module.exports = Scorer;
