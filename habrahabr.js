var By = require('selenium-webdriver').By;
var phantomjs = require('selenium-webdriver/chrome');
var driver = new phantomjs.Driver();
var parser = require('./parser');
var writer = require('./writer');
var Q = require('q');
var def = Q.defer;
// driver.get('http://habrahabr.ru/');
// driver.get('http://habrahabr.ru/posts/top/alltime/');
driver.get('http://habrahabr.ru/posts/top/weekly/');

var articles = [];
var target  = 0;
var current = 0;
var page    = 0;
var articleContents = {};

getArticleList(readArticles);

function getArticleList(callback){
    target  = 0;
    current = 0;

    driver
        .findElements(
            By.css('.title > .post_title')
        )
        .then(function(nodes){
            target = nodes.length;
            nodes.forEach(function(node, i){
                node.getAttribute('href')
                    .then(function(href){
                        articles.push(href);
                        current++;
                        if(current === target){
                            console.log(target + ' articles on page #' + page);
                            nextPage(callback);
                        }
                    });
            });
        });
};

function nextPage(callback){
    var nextLink = driver
        .findElements(
            By.css('.next')
        );
    nextLink.then(function(links){
        // if(links.length > 0 && page < 3){
        if(links.length > 0){
            links[0].click();
            page++;
            getArticleList(callback);
        }else{
            callback(articles);
            driver.quit();
        }
    });
};

function readArticles(articleLinks){
    var totalArticles = articleLinks.length;
    var articlesForRead = [];
    var step = 9;
    var position = 0;

    next();

    function next(){

        var _to = position + step - 1;
        _to = _to > (totalArticles - 1) ?
            (totalArticles - 1) :
            _to;
        console.log('\nProcess articles from ' + position + ' to ' + _to);

        articlesForRead = [];
        console.log('position ' + position + ' totalArticles ' + totalArticles);
        while(position < totalArticles && articlesForRead.length < step){
            articlesForRead.push(
                gotoArticle(articleLinks[position], position)
            );
            position++;
        }

        if(articlesForRead.length === 0){
            return;
        }

        Q.all(articlesForRead)
            .done(function(){
                next();
            });
    }
};

function gotoArticle(href, position){
    var d = def();
    var articlePage = new phantomjs.Driver();
    articlePage.get(href);

    var text = getContent({
        page : articlePage,
        css : '.content'
    });
    var date = getContent({
        page : articlePage,
        css : '.published'
    });
    
    Q.all([
            text, date
        ])
        .spread(function (_text, _date) {
            processContent({
                text: _text,
                date: _date,
                href: href
            });
            articlePage.quit();
            d.resolve();
        })
        .done();


    return d.promise;
};

function getContent(options){
    var page = options.page;
    var css  = options.css;
    var type = options.type;
    var d = def();

    var element = page.findElement(By.css(css));
    var content = null;

    switch(type){
        case 'html':
            content = element.getInnerHtml();
            break;
        default:
            content = element.getText();
            break;
    }

    content.then(function(text){
        d.resolve(text);
    });

    return d.promise;
};

function processContent(options){
    var rawTime = options.date.split(' ');
    var text    = options.text;
    var href    = options.href;
    var convertedTime = convertTime(rawTime);

    var content = {
        text : text,
        time : convertedTime,
        href : href,
        callback : function(items){
            writer.write(items);
        }
    };

    parser.parse(content);
};

function convertTime(rawTime){
    if(rawTime[0] === 'вчера'){
        convertedTime = getFromYesterday(rawTime);
    }else if(rawTime[0] === 'сегодня'){
        convertedTime = getFromToday(rawTime);
    }else if(rawTime.length === 4){
        convertedTime = getFromDateWithoutYear(rawTime);
    }else{
        convertedTime = getFromDate(rawTime);
    }

    return convertedTime;

    function getFromYesterday(separated){
        var date = '';
        var now = new Date();
        var time = separated[2].split(':');
        var hour   = +time[0] - 1;
        var minute = +time[1];

        now = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        now.setHours(hour);
        now.setMinutes(minute);
        now.setMilliseconds(0);

        return now.getTime();
    };

    function getFromToday(separated){
        var date = '';
        var now = new Date();
        var time = separated[2].split(':');
        var hour   = +time[0] - 1;
        var minute = +time[1];

        now.setHours(hour);
        now.setMinutes(minute);
        now.setMilliseconds(0);

        return now.getTime();
    };

    function getFromDateWithoutYear(separated){
        var now = new Date();
        var time = separated[3].split(':');
        var hour   = +time[0] - 4;
        var minute = +time[1];

        var monthes = [
            'январь',
            'февраль',
            'март',
            'апрель',
            'май',
            'июнь',
            'июль',
            'август',
            'сентябрь',
            'октябрь',
            'ноябрь',
            'декабрь'
        ]

        now.setUTCMonth(monthes.indexOf(separated[1]));
        now.setUTCDate(+separated[0]);
        now.setUTCHours(hour);
        now.setUTCMinutes(minute);
        now.setUTCSeconds(0);
        now.setUTCMilliseconds(0);

        return now.getTime();
    };

    function getFromDate(separated){
        var now = new Date();
        var time = separated[4].split(':');
        var hour   = +time[0] - 4;
        var minute = +time[1];

        var monthes = [
            'январь',
            'февраль',
            'март',
            'апрель',
            'май',
            'июнь',
            'июль',
            'август',
            'сентябрь',
            'октябрь',
            'ноябрь',
            'декабрь'
        ]

        var year = separated[2];

        now.setUTCFullYear(year);
        now.setUTCMonth(monthes.indexOf(separated[1]));
        now.setUTCDate(+separated[0]);
        now.setUTCHours(hour);
        now.setUTCMinutes(minute);
        now.setUTCSeconds(0);
        now.setUTCMilliseconds(0);

        return now.getTime();
    };
}