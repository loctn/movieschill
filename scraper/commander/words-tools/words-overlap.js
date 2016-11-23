'use strict';

var fs = require('fs');
var words = [];

var dir = fs.readdirSync('words');

dir.forEach(function(file) {
  words.push(fs.readFileSync('words/' + file).toString().split('\r\n'));
});

var dups = [];

for (var i = 0; i < words.length - 1; i++) {
  for (var j = i + 1; j < words.length; j++) {
    words[i].forEach(function(word) {
      if (words[j].indexOf(word) !== -1) dups.push(word);
    });
  }
}

fs.writeFileSync('words-dups.txt', dups.join('\r\n'));