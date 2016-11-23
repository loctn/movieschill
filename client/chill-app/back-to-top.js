import React, { Component, PropTypes } from 'react';

export default class BackToTop extends Component {
  static propTypes = {
    renderIf: PropTypes.any
  }

  handleClick(event) {
    event.preventDefault();
    let timer = setInterval(() => {
      if (document.body.scrollTop > 0) {
        document.body.scrollTop = Math.max(0, document.body.scrollTop - 80);
      } else {
        clearInterval(timer);
      }
    }, 8);
  }

  render() {
    if (!this.props.renderIf) return null;
    return (
      <span onClick={this.handleClick}>Back to Top</span>
    );
  }
}