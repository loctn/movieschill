'use strict';

class Commander {
  constructor() {
    this.id       = null;
    this.site     = null;
    this.progress = JSON.parse(this.PROGRESS_TEMPLATE);
    this.data     = null;
  }

  get PROGRESS_TEMPLATE() {
    return '{"page":1,"pageCount":10,"lastScraped":0,"doneIndex":0,"attempts":0}';
  }

  get path() {
    return `reviews/${Math.floor(this.id / 1000)}/${this.id % 1000}/${this.site}`;
  }

  get progressFile() {
    return `${this.path}/progress.json`;
  }

  get pageFile() {
    return `${this.path}/page.deflate`;
  }

  get doneFile() {
    return this.getDoneFile(this.progress.doneIndex);
  }

  getDoneFile(index) {
    return `${this.path}/done-${index}.deflate`;  
  }
}


module.exports = Commander;
