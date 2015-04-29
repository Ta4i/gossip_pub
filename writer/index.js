var fs = require('fs');
var writer = {
    dictionary: {}
};
var allData = '';

writer.write = function(textNodes, callback) {
    writeToCSVFile(textNodes);
};

function writeToCSVFile(items){
    var csv = '';

    var csv = items.reduce(function(prev, item){
        var strItem = item.word + ', ' + item.time + ', ' + item.href + '\n';
        return prev + strItem;
    }, allData);

    allData = csv;

    fs.writeFile(
        '/Users/maksym/dev/gossip/result.csv',
        csv,
        function(err){
            if(err) {
                console.log(err);
            } else {
                console.log('Words for ' + items[0].href + ' wrote to file.');
            }
        }
    );
}

module.exports = writer;