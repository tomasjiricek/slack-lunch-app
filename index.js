const process = require('process');
const SlackBot = require('./src/SlackBot');
const ZomatoLoader = require('./src/ZomatoLoader');
const ZomatoParser = require('./src/ZomatoParser');

let appConfig;

try {
    appConfig = require('./app-config.json');
} catch (e) {
    console.log(new Error('File app-config.json was not found or is not a valid JSON.'));
    process.exit();
}

let slackBot = new SlackBot(appConfig.SLACK);
let zomatoLoader = new ZomatoLoader(appConfig.ZOMATO.loaderData);
let zomatoParser = new ZomatoParser();

let zomatoCall = zomatoLoader.getRestaurantsMenu(
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
                    console.log('success');
                });
        }
    }
);
