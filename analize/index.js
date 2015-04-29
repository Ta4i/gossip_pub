var fs = require('fs');
var file = '/Users/maksym/dev/gossip/result.csv';

var dict = {};
var wordStat = [];

fs.readFile(file, 'utf8', function(err, data) {
    if (err) throw err;
    var lines = data.split('\n');
    console.log('OK: ' + file);
    console.log(lines.length);

    lines.forEach(function(line){
        var cols = line.split(', ');
        dict[cols[0]] = dict[cols[0]] || 0;
        dict[cols[0]]++;
    });

    for(var word in dict){
        wordStat.push({
            word: word,
            found: dict[word]
        });
    }

    var sorted = wordStat.sort(function(a, b){
        var as = a.word.split('');
        var bs = b.word.split('');
        var ac = 0;
        var bc = 0;

        as.forEach(function(s){
            if(s === 'о'){
                ac++;
            }
        });
        bs.forEach(function(s){
            if(s === 'о'){
                bc++;
            }
        });

        return bc - ac;

        // return a.found - b.found;
    });

    var res = 0;
    var j = 0;

    while(res < 20 || j >= lines.length){
        if(!sorted[j]){
            console.log('No item at ' + j);
        }
        var wordc = sorted[j].word;
        if(true){
            console.log(sorted[j].word + ': ' + sorted[j].found);
            res++;
        }
        j++;
    }

});