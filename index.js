const process = require('process');

const SlackBot = require('./src/SlackBot');
const AndelParser = require('./src/parsers/AndelParser');
const HlubinaParser = require('./src/parsers/HlubinaParser');
const TradiceParser = require('./src/parsers/TradiceParser');
const ZomatoParser = require('./src/parsers/ZomatoParser');
const GenericLoader = require('./src/loaders/GenericLoader');
const ZomatoLoader = require('./src/loaders/ZomatoLoader');

const ANDEL_REQUEST_URL = 'http://www.restauraceandel.cz/menu';
const HLUBINA_REQUEST_URL = 'http://www.senkyrna.cz/senkyrna-hlubina';
const TRADICE_REQUEST_URL = 'http://tradiceandel.cz/cz/denni-nabidka/';

let appConfig;

try {
    appConfig = require('./app-config.json');
} catch (e) {
    console.log(new Error('File app-config.json was not found or is not a valid JSON.'));
    process.exit();
}

let slackBot = new SlackBot(appConfig.SLACK);

let genericLoader = new GenericLoader();
let zomatoLoader = new ZomatoLoader(appConfig.ZOMATO.loaderData);

let andelParser = new AndelParser();
let hlubinaParser = new HlubinaParser();
let tradiceParser = new TradiceParser();
let zomatoParser = new ZomatoParser();

function getRestaurantMenu(url, parser) {
    return new Promise((resolve, reject) => {
        genericLoader.getPageData(url, (err, data) => {
            if (err) {
                reject(err);
            } else {
                parser.parse(data.toString(), (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            }
        });
    });
}

function getAndelMenu() {
    return getRestaurantMenu(ANDEL_REQUEST_URL, andelParser);
}

function getHlubinaMenu() {
    return getRestaurantMenu(HLUBINA_REQUEST_URL, hlubinaParser);
}

function getTradiceMenu() {
    return getRestaurantMenu(TRADICE_REQUEST_URL, tradiceParser);
}

function getZomatoMenu() {
    return new Promise((resolve, reject) => {
        zomatoLoader.getRestaurantsMenu(appConfig.ZOMATO.restaurants, (err, data) => {
            if (err) {
                reject(err);
            } else {
                let restaurants = zomatoParser.parse(data)
                    .filter(
                        (restaurant) => (restaurant.dishes instanceof Array)
                    ).map((restaurant) => {
                        let dishes = restaurant.dishes.join('\n');
                        return `*${restaurant.name}*\n${dishes}\n\n`;
                    });
                resolve(restaurants.join('\n'));
            }
        });
    });
}

Date.prototype.timeEqual = function (dateStr) {
    let parsed = dateStr.split(':', 3);
    let dateIsEqual = false;

    if (parsed.length > 0) {
        let hours = parseInt(parsed[0]);
        let minutes = this.getMinutes();
        let seconds = this.getSeconds();

        if (parsed.length > 1) {
            minutes = parseInt(parsed[1]);
            if (parsed.length > 2) {
                seconds = parseInt(parsed[2]);
            }
        }

        dateIsEqual = hours === this.getHours() && minutes === this.getMinutes() && seconds === this.getSeconds();
    }

    return dateIsEqual;
}

Date.prototype.timeBetween = function (timeFrom, timeTo) {
    function getTimeWithDate(time) {
        let date = new Date();
        date.setHours(time.hours);
        date.setMinutes(time.minutes);
        date.setSeconds(time.seconds);
        return date;
    }

    function isBetween(value, min, max) {
        return value >= min && value <= max;
    }

    let timeIsBetween = false;

    timeFrom = timeFrom.split(':', 3);
    timeTo = timeTo.split(':', 3);

    if (timeFrom.length > 0 && timeTo.length > 0) {
        let from = { hours: parseInt(timeFrom[0]), minutes: 0, seconds: 0 };
        let to = { hours: parseInt(timeTo[0]), minutes: 59, seconds: 59 };

        if (timeFrom.length > 1) {
            from.minutes = parseInt(timeFrom[1]);
            if (timeFrom.length > 2) {
                from.seconds = parseInt(timeFrom[2]);
            }
        }

        if (timeTo.length > 1) {
            to.minutes = parseInt(timeTo[1]);
            if (timeTo.length > 2) {
                to.seconds = parseInt(timeTo[2]);
            }
        }

        let timestampFrom = getTimeWithDate(from).getTime();
        let timestampTo = getTimeWithDate(to).getTime();

        timeIsBetween = isBetween(this.getTime(), timestampFrom, timestampTo);
    }

    return timeIsBetween;
}

var menusSent = false;

function sendSlackMessage(message, notify = false) {
    slackBot.sendMessage(message).then(
        (data) => {
            if (notify) {
                console.log('Message sent:', message);
            }
        },
        (err) => {
            console.log('Slack Error:', err);
        }
    );
}

async function getAllLunchMenus() {
    var messages = [];

    var andel = null;
    var hlubina = null;
    var tradice = null;
    var zomato = null;

    try {
        andel = await getAndelMenu();
        messages.push(andel);
        console.log('Andel: succeed');
    } catch (e) {
        console.log("Andel: failed");
    }

    try {
        tradice = await getTradiceMenu();
        messages.push(tradice);
        console.log("Tradice: succeed");
    } catch (e) {
        console.log("Tradice: failed");
    }

    try {
        hlubina = await getHlubinaMenu();
        messages.push(hlubina);
        console.log("Hlubina: succeed");
    } catch (e) {
        console.log("Hlubina: failed");
    }
                 
    try {
        zomato = await getZomatoMenu();
        messages.push(zomato);
        console.log("Zomato: succeed");
    } catch (e) {
        console.log("Zomato: failed");
    }

    if (messages.length > 0) {
        sendSlackMessage(messages.join('\n\n'));
    }
}

function tickerScript() {
    let date = new Date();

    if (date.getDay() > 0 && date.getDay() < 6) {
        if (date.timeBetween('11:25', '12:15') && !menusSent) {
            getAllLunchMenus();
            menusSent = true;
        }
    }

    if (date.timeEqual('12:16') && menusSent) {
        menusSent = false;
    }

    setTimeout(tickerScript, 1000);
}

tickerScript();

/*
var Pdf2json = require("pdf2json");
var http = require("http");

var pdfParser = new Pdf2json();

function readPDF() {
  http.get("http://peronsmichov.cz/images/dokumenty/poledni-menu.pdf", (res) => {
    var data = [];
    res.on("data", chunk => {
      data.push(chunk);
    });
    res.on("end", () => {
      var buffer = Buffer.concat(data);
      console.log(buffer);
      pdfParser.parseBuffer(buffer);
    });
  });
}

  pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );
  pdfParser.on("pdfParser_dataReady", pdfData => {
    console.log(pdfData);
  });

*/