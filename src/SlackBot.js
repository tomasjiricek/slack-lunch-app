const https = require('https');

class SlackBot {
    constructor(requestData) {
        this._requestData = requestData;
    }

    sendMessage(message) {
        return this._sendMessageToChannel(this._requestData, message);
    }

    _createRequest(options, data, callback) {
        let req = https.request(options, res => {
            let rawData = '';

            res.on('data', (chunk) => rawData += chunk);
            res.on('end', () => this._onRequestEnd(res, rawData, callback));
        });

        req.on('error', callback);

        req.write(data);
        req.end();
    }

    _onRequestEnd(res, data, callback) {
        if (data !== 'ok') {
            callback(new Error('Slack API call failed:', data));
        } else {
            callback(null, data);
        }
    }

    _sendMessageToChannel(options, message) {
        let postData = JSON.stringify({ text: message });

        let requestOptions = {
            host: options.host,
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            path: options.path
        }

        return new Promise((reject, resolve) => {
            if (this._requestData instanceof Object) {
                this._createRequest(requestOptions, postData, (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            } else {
                reject(new Error('Constructor needs request data.'));
            }
        });
    }
}

module.exports = SlackBot;