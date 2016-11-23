/*global results*/
import React, { Component } from 'react';
import classNames from 'classnames';
import CSSModules from 'react-css-modules';
import $ from 'jquery';

import { searchUrl, debounce } from './utils';
import Taglines from './taglines';

import styles from './css/movie-search.css';

class MovieSearch extends Component {
  state = {
    movieName         : results.length ? results[0].title : '',
    lastCompletedName : '',
    completions       : [],
    selectedIndex     : -1
  }

  autocomplete = debounce(() => {
    if (this.state.movieName === this.state.lastCompletedName) return;
    if (this.state.movieName.length < 4) {
      this.setState({ completions: [], selectedIndex: -1 });
      return;
    }

    $.getJSON('http://movieschill.com:8080/search?q=' + encodeURIComponent(this.state.movieName), data => {
      let completions = data.filter(obj => !!obj);
      this.setState({
        lastCompletedName : this.state.movieName,
        completions       : completions,
        selectedIndex     : completions.length ? 0 : -1
      });
    });
  }, 500)

  handleSubmit() {
    document.forms['search-form'].submit();
  }

  handleChange = event => {
    this.setState({ movieName: event.target.value }, this.autocomplete);
  }

  handleKeyDown = event => {
    if (!this.state.completions.length) return;

    switch (event.keycode || event.which) {
    case 38:
      event.preventDefault();
      this.setState({ selectedIndex: Math.max(0, this.state.selectedIndex - 1) });
      break;
    case 40:
      event.preventDefault();
      this.setState({ selectedIndex: Math.min(this.state.completions.length - 1, this.state.selectedIndex + 1) });
      break;
    case 13:
      event.preventDefault();
      var movie = this.state.completions[this.state.selectedIndex];
      window.location = searchUrl(movie.id, movie.title);
    }
  }

  handleFocus = () => {
    this.setState({ isFocused: true });
  }

  handleBlur = () => {
    this.setState({ isFocused: false });
  }

  handleMouseDown = (id, title) => {  // need because non-touch click causes blur first
    this.handleClick(id, title);
  }

  handleClick(id, title) {
    window.location = searchUrl(id, title);
  }

  render() {
    let autocompleteStyle = { display: this.state.isFocused && this.state.completions.length ? 'block' : 'none' };

    return (
      <div styleName="search-container">
        <form id="search-form" action="" method="get">
          <div styleName="label"><span>Show me <em styleName="em-movies">movies</em></span> <span>that <em styleName="em-feel">feel</em> like</span></div>
          <div styleName="search-box">
            <div onClick={this.handleSubmit} styleName="mag">{'\ud83d\udd0d'}</div>
            <div style={autocompleteStyle} styleName="autocomplete">
              {this.state.completions.map((movie, index) => {
                let rowClass = classNames({ 'autocomplete-selected': index === this.state.selectedIndex });

                return (
                  <div key={'autocomplete-' + index} className={rowClass} onMouseDown={this.handleMouseDown.bind(this, movie.id, movie.title)} onClick={this.handleClick.bind(this, movie.id, movie.title)}>
                    <div>{movie.title} ({movie.year})</div>
                    <div>{movie.cast.split(', ').slice(0, 3).join(', ')}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <input onChange={this.handleChange} onKeyDown={this.handleKeyDown} onFocus={this.handleFocus} onBlur={this.handleBlur} value={this.state.movieName} autoFocus={!results.length} autoComplete="off" type="text" name="movie" styleName="movie-name" placeholder="Movie Name" />
        </form>
        <Taglines />
      </div>
    );
  }
}

export default CSSModules(MovieSearch, styles);