const async = require('async');
const http = require('http');

const REQUEST_URL = 'http://www.restauraceandel.cz/menu';

class AndelLoader {
    constructor(requestData) {
        this._requestData = requestData;
    }

    getMenu(callback) {
        this._getTodaysMenu(callback);
    }

    _getTodaysMenu(callback) {
        this._sendRequest(REQUEST_URL, (err, data) => {
            if (err) {
                callback(err);
            } else {
                callback(null, data);
            }
        });
    }

    _onRequestEnd(res, data, callback) {
        let statusCode = res.statusCode;

        if (statusCode >= 301 && statusCode <= 303) {
            this._sendRequest(res.headers.location, callback);
        } else {
            if (statusCode !== 200) {
                callback(new Error('Request to Andel failed (%d):', statusCode, data));
            } else {
                try {
                    callback(null, data);
                } catch (e) {
                    console.log(e);
                    callback(new Error('The type of received data is not a valid JSON'));
                }
            }
        }
    }

    _sendRequest(options, callback) {
        let req = http.get(options, (res) => {
            let rawData = '';

            res.on('data', (chunk) => rawData += chunk);
            res.on('end', () => this._onRequestEnd(res, rawData, callback));
        });

        req.on('error', callback);
    }
}

module.exports = AndelLoader;