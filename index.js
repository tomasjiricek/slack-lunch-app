const process = require('process');

const DateUtil = require('./src/DateUtil');
const SlackBot = require('./src/SlackBot');
const AndelParser = require('./src/parsers/AndelParser');
const HlubinaParser = require('./src/parsers/HlubinaParser');
const MrBaoParser = require('./src/parsers/MrBaoParser');
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

let slackBot = new SlackBot(appConfig[appConfig.defaultSlackChannel]);

let genericLoader = new GenericLoader();
let zomatoLoader = new ZomatoLoader(appConfig.ZOMATO.loaderData);

let andelParser = new AndelParser();
let hlubinaParser = new HlubinaParser();
let mrBaoParser = new MrBaoParser();
let tradiceParser = new TradiceParser();
let zomatoParser = new ZomatoParser();

function getRestaurantMenu(url, parser) {
    return new Promise((resolve, reject) => {
        genericLoader.getPageData(url, (err, data) => {
            if (err) {
                reject(err);
            } else {
                parser.parse(data, (err, data) => {
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

function getMrBaoMenu() {
    return getRestaurantMenu("http://www.mrbao.cz/menu/", mrBaoParser);
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

Date.prototype.timeBetween = DateUtil.timeBetween;
Date.prototype.timeEqual = DateUtil.timeEqual;

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
    let messages = [];

    let andel = null;
    let hlubina = null;
    let mrBao = null;
    let tradice = null;
    let zomato = null;

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

    try {
        mrBao = await getMrBaoMenu();
        messages.push(mrBao);
        console.log("MrBao: succeed");
    } catch (e) {
        console.log("MrBao: failed");
    }

    if (messages.length > 0) {
        sendSlackMessage(messages.join('\n\n'));
    }
}

function tickerScript() {
    let date = new Date();

    if (date.getDay() > 0 && date.getDay() < 6) {
        if (date.timeBetween('11:29', '12:30') && !menusSent) {
            getAllLunchMenus();
            menusSent = true;
        }
    }

    if (date.timeEqual('12:31') && menusSent) {
        menusSent = false;
    }

    setTimeout(tickerScript, 1000);
}

//tickerScript();
getAllLunchMenus();
