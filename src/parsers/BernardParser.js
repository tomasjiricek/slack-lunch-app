const HtmlParser = require('htmlparser2').Parser;
const parseHtmlViaRegEx = require('./ParserUtil').parseHtmlViaRegEx;

class BernardParser {
    constructor() {
        this._parserProps = {
            dishRowStarted: false,
            dishNameCellStarted: false,
            dishes: []
        };
    }

    parse(data, callback) {
        let date = new Date();
        this._parseHtml(data, (err, data) => {
            if (err) {
                callback(err);
            } else {
                callback(null, this._parseHtmlOutputArray(data));
            }
        });
    }

    _parseDishes(dishes) {
        return dishes.map((dish) => (`>•  ${dish}`));
    }

    _parseHtml(html, callback) {
        if (html) {
            let rgExp = new RegExp('<section class="daily-menu">(.+?)<\/section>', 'i');
            let rgExpData = parseHtmlViaRegEx(html, rgExp);

            if (rgExpData instanceof Array && rgExpData.length == 2) {
                rgExpData = rgExpData[1];

                let parser = new HtmlParser({
                    onopentag: this._onOpenTag.bind(this),
                    ontext: this._onText.bind(this),
                    onclosetag: this._onCloseTag.bind(this),
                    onend: this._onEnd.bind(this, callback)
                });

                parser.write(rgExpData);
                parser.end();
            } else {
                callback(new Error('Failed to get correct data'));
            }
        } else {
            callback(new Error('No data to parse'));
        }
    }

    _parseHtmlOutputArray(data) {
        let dishes = this._parseDishes(data).join('\n');
        return '*Bernard*\n' + dishes;
    }

    _onOpenTag(tagName, attributes) {
        if (tagName === 'li') {
            this._parserProps.dishRowStarted = true;
        } else if (tagName === 'strong' && this._parserProps.dishRowStarted) {
            this._parserProps.dishNameCellStarted = true;
        }
    }

    _onText(text) {
        if (this._parserProps.dishNameCellStarted) {
            this._parserProps.dishes.push(text);
        }
    }

    _onCloseTag(tagName) {
        if (tagName === 'strong' && this._parserProps.dishRowStarted) {
            this._parserProps.dishNameCellStarted = false;
        } else if (tagName === 'li' && this._parserProps.dishRowStarted) {
            this._parserProps.dishRowStarted = false;
        }
    }

    _onEnd(callback) {
        callback(null, this._parserProps.dishes);
    }
}

module.exports = BernardParser;
