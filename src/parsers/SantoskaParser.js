const iconv = require('iconv-lite');
const HtmlParser = require('htmlparser2').Parser;
const AllHtmlEntities = require('html-entities').AllHtmlEntities;

const htmlEntities = new AllHtmlEntities();

class SantoskaParser {
    constructor() {
        this._parserProps = this.emptyData();
    }

    emptyData() {
        return {
            tableCellsCount: 0,
            temporaryCellString: '',
            tableCellTargetString: '',
            tableCellTextStarted: false,
            tableOpen: false,
            tableRowsCount: 0,
            tableRowTextsCount: 0,
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
            html = iconv.encode(iconv.decode(html, 'win1252').toString(), 'utf8').toString();
            parser.write(html);
            parser.end();
        } else {
            callback(new Error('No data to parse'));
        }
    }

    _parseHtmlOutputArray(data) {
        let dishes = this._parseDishes(data);

        if (dishes.length == 0) {
            return '';
        }

        return '*Santoška*\n' + dishes.join('\n');
    }

    _parseDishes(dishes) {
        return dishes.map((dish) => (`>•  ${dish}`));
    }

    _decodeAndTrimString(string) {
        return htmlEntities.decode(string)
            .trim()
            .replace(/\r\n|\r|\n/g, ' ')
            .replace(/ {2,}/g, ' ');
    }
    _onOpenTag(tagName, attributes) {
        if (tagName === 'table' && attributes.class === 'TableGrid') {
            this._parserProps.tableOpen = true;
        } else if (tagName === 'tr' && this._parserProps.tableOpen) {
            this._parserProps.tableRowsCount++;
        } else if (tagName === 'td' && this._parserProps.tableRowsCount > 0) {
            this._parserProps.tableCellsCount++;
            this._parserProps.tableCellTextStarted = true;
        }
    }

    _onText(text) {
        if (this._parserProps.tableCellTextStarted) {
            this._parserProps.temporaryCellString += text;
        }
    }

    _onCloseTag(tagName) {
        if (tagName === 'td' && this._parserProps.tableOpen) {
            this._parserProps.tableCellTextStarted = false;
            const temporaryString = this._decodeAndTrimString(this._parserProps.temporaryCellString);
            if (temporaryString.length > 1) {
                this._parserProps.tableRowTextsCount++;
                if (this._parserProps.tableCellsCount === 2) {
                    this._parserProps.tableCellTargetString = temporaryString;
                }
            }
            this._parserProps.temporaryCellString = '';
        } else if (tagName === 'tr') {
            this._parserProps.tableCellsCount = 0;
            if (this._parserProps.tableCellTargetString.length > 0 && this._parserProps.tableRowTextsCount === 3) {
                this._parserProps.table.push(this._parserProps.tableCellTargetString);
                this._parserProps.tableCellTargetString = '';
            }
            this._parserProps.tableRowTextsCount = 0;
        } else if (tagName === 'table') {
            this._parserProps.tableRowsCount = 0;
            this._parserProps.tableOpen = false;
        }
    }

    _onEnd(callback) {
        callback(null, this._parserProps.table);
    }
}

module.exports = SantoskaParser;
