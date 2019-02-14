const HtmlParser = require('htmlparser2').Parser;
const parseHtmlViaRegEx = require('./ParserUtil').parseHtmlViaRegEx;

class TradiceParser {
    constructor() {
        this._parserProps = this.emptyData();
    }

    emptyData() {
        return {
            dishCellStarted: false,
            dishNameCellStarted: false,
            dishes: []
        };
    }

    parse(data, callback) {
        this._parserProps = this.emptyData();
        let date = new Date();
        let czechDateFormat = `${date.getDate()}\\. ${date.getMonth() + 1}\\.`;
        this._parseHtml(data.toString(), czechDateFormat, (err, data) => {
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

    _parseHtml(html, date, callback) {
        if (html) {
            let rgExp = new RegExp(
                `<h2 class="center">[^<]*\\(${date}\\)<\/h2> *<div class="separator-section">(.*?)<\/div> *<div class="separator"><\/div>`,
                'i'
            );
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
                callback(new Error(`Failed to get correct data for day: "${date}"`));
            }
        } else {
            callback(new Error('No data to parse'));
        }
    }

    _parseHtmlOutputArray(data) {
        let dishes = this._parseDishes(data).join('\n');
        return '*Tradice*\n' + dishes;
    }

    _onOpenTag(tagName, attributes) {
        if (tagName === 'div' && attributes.class === 'fourfifth') {
            this._parserProps.dishCellStarted = true;
        } else if (tagName === 'strong' && this._parserProps.dishCellStarted) {
            this._parserProps.dishNameCellStarted = true;
        }
    }

    _onText(text) {
        if (this._parserProps.dishNameCellStarted) {
            this._parserProps.dishes.push(text);
        }
    }

    _onCloseTag(tagName) {
        if (tagName === 'strong' && this._parserProps.dishCellStarted) {
            this._parserProps.dishNameCellStarted = false;
        } else if (tagName === 'div' && this._parserProps.dishCellStarted) {
            this._parserProps.dishCellStarted = false;
        }
    }

    _onEnd(callback) {
        callback(null, this._parserProps.dishes);
    }
}

module.exports = TradiceParser;
