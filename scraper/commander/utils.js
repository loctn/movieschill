'use strict';

const ErrorMixin = Base => class extends Base {
  constructor(message, id, site) {
    super(message);
    this.id   = id;
    this.site = site;
  }
};

class ChillError extends ErrorMixin(Error) {
  constructor(message, id, site) {
    super(message, id, site);
    this.name = 'ChillError';
  }
}

class DataExhaustedError extends ErrorMixin(Error) {
  constructor(message, id, site) {
    super(message, id, site);
    this.name = 'DataExhaustedError';
  }
}

class FetchAttemptError extends ErrorMixin(Error) {
  constructor(message, id, site) {
    super(message, id, site);
    this.name = 'FetchAttemptError';
  }
}


exports.ChillError         = ChillError;
exports.DataExhaustedError = DataExhaustedError;
exports.FetchAttemptError  = FetchAttemptError;
