var parser = {};

parser.parse = function(options) {

    var text     = options.text;
    var href     = options.href;
    var time     = options.time;
    var callback = options.callback;

    var parsedText = text
        .match(/[A-Z0-9А-Я]+/ig)
        .map(function(word){
            return {
                word: word.toLowerCase(),
                href: href,
                time: time
            };
        });
        
    callback(parsedText);
};

module.exports = parser;