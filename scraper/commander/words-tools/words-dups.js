'use strict';

var stdin = process.stdin;

stdin.setRawMode(true);
stdin.resume();
stdin.setEncoding('utf8');

var fs    = require('fs');
var dups  = fs.readFileSync('words-dups.txt').toString().split('\r\n');
var words = [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []];
var pos   = parseInt(process.argv[2]) || 0;

console.log(dups[pos]);

stdin.on('data', function(key) {
  if (key === '\u0003') {   // Ctrl+C
    process.exit();
  }

  var i = 'abcdefghijklmnopqrstuvwxyz123456'.indexOf(key);
  if (i !== -1) {
    console.log(key);
    console.log('');
    words[i].push(dups[pos]);

    pos += parseInt(process.argv[3]) || 1;
    if (pos >= dups.length) {
      // Write file with grouped words
      words.forEach(function(list, index) {
        fs.appendFileSync('words/' + index + '.txt', '\r\n' + list.join('\r\n'));
      });

      console.log('WE IS DONE');
      process.exit(1);
    }
    console.log(dups[pos]);
  }
});