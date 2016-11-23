import React, { Component, PropTypes } from 'react';
import classNames from 'classnames';
import CSSModules from 'react-css-modules';

import styles from './css/rt-scores.css';

class RTScores extends Component {
  static propTypes = {
    styles: PropTypes.any,
    movie: PropTypes.object.isRequired,
    left: PropTypes.bool
  }

  rt_meter(percent) {
    return (percent || percent === 0) ? percent + '%' : '';
  }

  render() {
    let css = this.props.styles;
    let movie = this.props.movie;
    let containerClass = classNames(css['rt-container'], {
      [css['rt-container-right']] : !this.props.left,
      [css['rt-container-left']]  : this.props.left
    });
    let criticsClass = classNames(css['rt-fresh-rotten'], css['rt-critics'], {
      [css['rt-critics-fresh']]  : movie.rt_critics_meter >= 60,
      [css['rt-critics-rotten']] : movie.rt_critics_meter !== null && movie.rt_critics_meter < 60
    });
    let usersClass = classNames(css['rt-fresh-rotten'], css['rt-audience'], {
      [css['rt-audience-fresh']]  : movie.rt_users_meter >= 60,
      [css['rt-audience-rotten']] : movie.rt_users_meter !== null && movie.rt_users_meter < 60
    });
    let showAttribution = (movie.rt_critics_meter !== null || movie.rt_users_meter !== null);
    let showPlural = (movie.rt_critics_meter !== null && movie.rt_users_meter !== null);

    return (
      <div className={containerClass}>
        {showAttribution &&
          <div styleName="rt-attribution">
            <a href={movie.rt_url} target="_blank">Rotten Tomatoes&reg; Score{showPlural && <span>s</span>}</a>
          </div>
        }
        <div className={criticsClass}><a href={movie.rt_url} target="_blank">{this.rt_meter(movie.rt_critics_meter)}</a></div>
        <div className={usersClass}><a href={movie.rt_url} target="_blank">{this.rt_meter(movie.rt_users_meter)}</a></div>
      </div>
    );
  }
}

export default CSSModules(RTScores, styles);