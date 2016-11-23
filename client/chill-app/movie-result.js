import React, { Component, PropTypes } from 'react';
import CSSModules from 'react-css-modules';

import { searchUrl } from './utils';
import RTScores from './rt-scores';
import IMDbStars from './imdb-stars';

import styles from './css/movie-result.css';

class MovieResult extends Component {
  static propTypes = {
    movie: PropTypes.object.isRequired
  }

  runtime(minutes) {
    let h = Math.floor(minutes / 60);
    let m = minutes % 60;
    return (h || '0') + ':' + ((m < 10) ? '0' : '') + m;
  }

  render() {
    let movie = this.props.movie;
    // Note: not a reliable API - do not use for serious projects
    let posterStyle = { backgroundImage: `url(http://img.omdbapi.com/?i=${movie.imdb_id}&apikey=dc53ea2e)` };

    return (
      <div styleName="result">
        <div styleName="result-left">
          <div style={posterStyle} styleName="poster">
            <div styleName="runtime">{this.runtime(movie.runtime)}</div>
          </div>
          <RTScores movie={movie} left={true} />
        </div>
        <div styleName="result-right">
          <RTScores movie={movie} />
          {movie.title &&
            <div styleName="movie-title">
              <a href={searchUrl(movie.imdb_id, movie.title)}>{movie.title} ({movie.year})</a>
            </div>
          }
          <div styleName="rating-genres">
            {movie.mpaa_rating && <span>{movie.mpaa_rating}<strong>&nbsp;&middot;&nbsp;</strong></span>}{movie.genre}
          </div>
          <IMDbStars movie={movie} />
          <div>{movie.plot_short}</div>
        </div>
      </div>
    );
  }
}

export default CSSModules(MovieResult, styles);