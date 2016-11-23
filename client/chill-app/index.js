/*global results*/
import React, { Component } from 'react';
import CSSModules from 'react-css-modules';

import MovieSearch from './movie-search';
import MovieResult from './movie-result';
import BackToTop from './back-to-top';

import styles from './css/chill-app.css';

class ChillApp extends Component {
  render() {
    return (
      <div styleName="container">
        <div styleName="logo"><a href="/">movies</a><span><a href="/">&amp;</a></span><a href="/">chill</a></div>
        <MovieSearch />
        {results.map(movie =>
          <MovieResult key={movie.imdb_id} movie={movie} />
        )}
        <div styleName="back-to-top">
          <BackToTop renderIf={results.length} />
        </div>
        <div styleName="footer-spacer"></div>
      </div>
    );
  }
}

export default CSSModules(ChillApp, styles);