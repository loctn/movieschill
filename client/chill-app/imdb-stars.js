import React, { Component, PropTypes } from 'react';
import classNames from 'classnames';
import CSSModules from 'react-css-modules';

import styles from './css/imdb-stars.css';

class IMDbStars extends Component {
  static propTypes = {
    styles: PropTypes.any,
    movie: PropTypes.object.isRequired
  }

  imdbRating(imdb_rating) {
    return (imdb_rating / 10).toFixed(1);
  }

  render() {
    let css = this.props.styles;
    let movie = this.props.movie;
    let imdbClass = classNames(css['imdb-container'], css['imdb-hide'], { [css['imdb-show']]: movie.imdb_rating });

    // Note: images are a more consistent solution across browsers, but this is fine for now
    let starBox     = (window.innerWidth > 560) ? 0.8125 : 0.8;
    let starPadding = 2 * starBox / 13;
    let starWidth   = starBox - 2 * starPadding;
    let origin      = 0.4 * starBox / 13;
    let score       = movie.imdb_rating / 10;
    let scoreFloor  = Math.floor(score);
    let remainder   = score - scoreFloor;
    let imdbRatingStyle = { width: (origin + starBox * scoreFloor + (remainder ? starPadding : 0) + remainder * starWidth) + 'rem' };

    return (
      <div className={imdbClass}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i =>
          <span key={movie.imdb_id + '-imdb-star-gray-' + i} className={css['imdb-star-gray']}></span>
        )}
        &nbsp;<span styleName="imdb-score">{this.imdbRating(movie.imdb_rating)}</span> <span styleName="imdb-logo"><span>IMDb</span></span>
        <div style={imdbRatingStyle} styleName="imdb-rating-container">
          <div styleName="imdb-rating">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i =>
              <span key={movie.imdb_id + '-imdb-star-gold-' + i} className={css['imdb-star-gold']}></span>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default CSSModules(IMDbStars, styles);