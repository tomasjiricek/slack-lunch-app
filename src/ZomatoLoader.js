const async = require('async');
const https = require('https');

class ZomatoLoader {
    constructor(requestData) {
        this._requestData = requestData;
    }

    getRestaurantsMenu(restaurants, callback) {
        if (this._requestData instanceof Object) {
            let series = restaurants.map(
                (restaurant) => this._getRestaurantMenu.bind(this, restaurant)
            );

            async.series(series, callback);
        } else {
            callback(new Error('Constructor needs request data.'));
        }
    }

    _createQueryString(query) {
        let queryArray = [];

        for (let key in query) {
            queryArray.push(`${key}=${query[key]}`);
        }

        return queryArray.join('&');
    }

    _getRestaurantMenu(restaurant, callback) {
        let queryString = this._createQueryString({ res_id: restaurant.id });
        let request = this._requestData.request;
        let options = {
            host: request.host,
            headers: this._requestData.headers,
            path: request.apiPath + `dailymenu?${queryString}`
        };

        this._sendRequest(options, (err, data) => {
            if (err) {
                callback(err);
            } else {
                if (data instanceof Object) {
                    data.restaurantName = restaurant.name;
                }

                callback(null, data);
            }
        });
    }

    _onRequestEnd(res, data, callback) {
        let statusCode = res.statusCode;

        if (statusCode !== 200) {
            callback(new Error('Request to Zomato API failed:', data));
        } else {
            try {
                let json = JSON.parse(data);
                callback(null, json);
            } catch (e) {
                console.log(e);
                callback(new Error('The type of received data is not a valid JSON'));
            }
        }
    }

    _sendRequest(options, callback) {
        let req = https.get(options, (res) => {
            let rawData = '';

            res.on('data', (chunk) => rawData += chunk);
            res.on('end', () => this._onRequestEnd(res, rawData, callback));
        });

        req.on('error', callback);
    }
}

module.exports = ZomatoLoader;