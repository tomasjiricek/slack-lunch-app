const HtmlParser = require('htmlparser2').Parser;
const AllHtmlEntities = require('html-entities').AllHtmlEntities;
const htmlEntities = new AllHtmlEntities();

class HlubinaParser {
    constructor() {
        this._parserProps = this.emptyData();
    }

    emptyData() {
        return {
            dessertsStarted: false,
            tableCellsCount: 0,
            tableRowsCount: 0,
            tablesCount: 0,
            table: []
        };
    }

    parse(data, callback) {
        this._parserProps = this.emptyData();
        this._parseHtml(data, (err, data) => {
            if (err) {
                callback(err);
            } else {
                callback(null, this._parseHtmlOutputArray(data));
            }
        });
    }

    _parseHtml(html, callback) {
        if (html) {
            let parser = new HtmlParser({
                onopentag: this._onOpenTag.bind(this),
                ontext: this._onText.bind(this),
                onclosetag: this._onCloseTag.bind(this),
                onend: this._onEnd.bind(this, callback)
            });

            parser.write(html);
            parser.end();
        } else {
            callback(new Error('No data to parse'));
        }
    }

    _parseHtmlOutputArray(data) {
        let dishes = this._parseDishes(data);

        return '*Hlubina*\n' + dishes.join('\n');
    }

    _parseDishes(dishes) {
        return dishes.map((dish) => (`>•  ${dish}`));
    }

    _onOpenTag(tagName, attributes) {
        if (tagName === 'div' && attributes.class === 'text') {
            this._parserProps.textSectionStarted = true;
        } else if (tagName === 'table' && this._parserProps.textSectionStarted) {
            this._parserProps.tablesCount++;
        } else if (tagName === 'tr' && this._parserProps.tablesCount === 2) {
            this._parserProps.tableRowsCount++;
        } else if (tagName === 'td' && this._parserProps.tableRowsCount > 0) {
            this._parserProps.tableCellsCount++;
        }
    }

    _onText(text) {
        text = htmlEntities.decode(text).trim();
        if (text.indexOf("dezerty") !== -1) {
            this._parserProps.dessertsStarted = true;
        } else if (!this._parserProps.dessertsStarted && this._parserProps.tableCellsCount === 2 && text.length > 1) {
            this._parserProps.table.push(text);
        }
    }

    _onCloseTag(tagName) {
        if (tagName === 'tr') {
            this._parserProps.tableCellsCount = 0;
        } else if (tagName === 'table') {
            this._parserProps.tableRowsCount = 0;
        }
    }

    _onEnd(callback) {
        callback(null, this._parserProps.table);
    }
}

module.exports = HlubinaParser;
