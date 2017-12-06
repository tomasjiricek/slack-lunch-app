const process = require('process');
const AndelLoader = require('./src/loaders/AndelLoader');
const AndelParser = require('./src/parsers/AndelParser');
const SlackBot = require('./src/SlackBot');
const ZomatoLoader = require('./src/loaders/ZomatoLoader');
const ZomatoParser = require('./src/parsers/ZomatoParser');

const HtmlParser = require('htmlparser2').Parser;

let appConfig;

try {
    appConfig = require('./app-config.json');
} catch (e) {
    console.log(new Error('File app-config.json was not found or is not a valid JSON.'));
    process.exit();
}

let andelLoader = new AndelLoader();
let andelParser = new AndelParser();
let slackBot = new SlackBot(appConfig.SLACK_TEST);
let zomatoLoader = new ZomatoLoader(appConfig.ZOMATO.loaderData);
let zomatoParser = new ZomatoParser();

andelLoader.getMenu((err, data) => {
    if (err) {
        console.log(err);
    } else {
        andelParser.parse(data, (err, data) => {
            if (err) {
                console.log(err);
            } else {
                slackBot.sendMessage(data)
                    .then((err) => {
                        console.log(err);
                    }, (data) => {
                        console.log('Andel: success');
                    });
            }
        });
    }
});

zomatoLoader.getRestaurantsMenu(
    appConfig.ZOMATO.restaurants,
    (err, data) => {
        if (err) {
            console.log(err);
        } else {
            let restaurants = zomatoParser.parse(data).map((restaurant) => {
                let dishes = restaurant.dishes.join('\n');
                return `*${restaurant.name}*\n${dishes}\n\n`;
            });
            let restaurantsString = restaurants.join('\n');

            slackBot.sendMessage(restaurantsString)
                .then((err) => {
                    console.log(err);
                }, (data) => {
                    console.log('Zomato: success');
                });
        }
    }
);
