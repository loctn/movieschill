import React, { Component, PropTypes } from 'react';
import CSSModules from 'react-css-modules';

import styles from './css/taglines.css';

class Taglines extends Component {
  static propTypes = {
    styles: PropTypes.any
  }

  state = { index: 0, lengths: [33, 88, 46] }  // hardcoded lengths for now

  constructor(props) {
    super(props);
    setTimeout(this.nextTagline, 3500 + 80 * 33);
  }

  nextTagline = () => {
    let newIndex = (this.state.index + 1) % this.state.lengths.length;
    setTimeout(this.nextTagline, 2000 + 80 * this.state.lengths[newIndex]);
    this.setState({ index: newIndex });
  }

  taglineClass(index) {
    let css = this.props.styles;
    return (index === this.state.index) ? css['tagline-fadein'] : css['tagline-fadeout'];
  }

  render() {
    return (
      <div styleName="taglines">
        <div className={this.taglineClass(0)}><span>Enter a <em>movie name</em> to get started</span></div>
        <div className={this.taglineClass(1)}><span>Movies &amp; Chill</span> <span>creates a movie's <em>emotional fingerprint</em></span> <span>to find movies that feel the same</span></div>
        <div className={this.taglineClass(2)}><span>The final answer for</span> <span><em>What do we watch tonight?</em></span></div>
      </div>
    );
  }
}

export default CSSModules(Taglines, styles);