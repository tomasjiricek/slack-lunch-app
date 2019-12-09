const async = require('async');
const http = require('http');
const https = require('https');

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
                callback(new Error(`Request to "${url}" failed (${statusCode}):`, data));
            } else {
                callback(null, data);
            }
        }
    }

    _sendRequest(url, callback) {
        if (url) {
            let module = url.indexOf('https') != -1 ? https : http;
            let req = module.get(url, (res) => {
                let rawData = [];

                res.on('data', (chunk) => rawData.push(chunk));
                res.on('end', () => this._onRequestEnd(url, res, Buffer.concat(rawData), callback));
            });

            req.on('error', callback);
        } else {
            callback(new Error('No URL was given.'));
        }
    }
}

module.exports = GenericLoader;