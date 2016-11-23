'use strict';

var fs = require('fs');

var dups = fs.readFileSync('words-dups.txt').toString().split('\r\n');
var dir = fs.readdirSync('words');

dir.forEach(function(file) {
  var words = fs.readFileSync('words/' + file).toString().split('\r\n');

  dups.forEach(function(word) {
    var pos = words.indexOf(word);
    if (pos !== -1) {
      words.splice(pos, 1);
    }
  });

  fs.writeFileSync('words/' + file, words.join('\r\n'));
});
