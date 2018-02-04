const async = require('async');
const http = require('http');

class GenericLoader {
    getPageData(url, callback) {
        this._sendRequest(url, (err, data) => {
            if (err) {
                callback(err);
            } else {
                callback(null, data);
            }
        });
    }

    _onRequestEnd(url, res, data, callback) {
        let statusCode = res.statusCode;

        if (statusCode >= 301 && statusCode <= 303) {
            this._sendRequest(res.headers.location, callback);
        } else {
            if (statusCode !== 200) {
                callback(new Error('Request to "%s" failed (%d):', url, statusCode, data));
            } else {
                callback(null, data);
            }
        }
    }

    _sendRequest(url, callback) {
        let req = http.get(url, (res) => {
            let rawData = '';

            res.on('data', (chunk) => rawData += chunk);
            res.on('end', () => this._onRequestEnd(url, res, rawData, callback));
        });

        req.on('error', callback);
    }
}

module.exports = GenericLoader;