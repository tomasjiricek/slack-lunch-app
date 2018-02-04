const HtmlParser = require('htmlparser2').Parser;

const DAYS = ['', 'pondeli', 'utery', 'streda', 'ctvrtek', 'patek', ''];

class AndelParser {
    constructor() {
        this._parserProps = {
            headingStarted: false,
            headingsCount: 0,
            tableCellsCount: 0,
            tableRowsCount: 0,
            tableRowStarted: false,
            tableStarted: false,
            tablesCount: 0,
            tmpValue: '',
            headings: [],
            tables: []
        };
    }

    parse(data, callback) {
        let dayOfWeek = DAYS[new Date().getDay()];
        this._parseHtml(data, dayOfWeek, (err, data) => {
            if (err) {
                callback(err);
            } else {
                callback(null, this._parseHtmlOutputArray(data));
            }
        });
    }

    _parseHtml(html, dayOfWeek, callback) {
        if (html) {
            let rgExp = new RegExp(`<div class="[^"]*" id="${dayOfWeek}">(.*?)<\/div>`, 'i');
            let rgExpData = html.replace(/\r\n|\n|\t/g, '').match(rgExp);

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
                callback(new Error(`Failed to get correct data for day: ${dayOfWeek}`));
            }
        } else {
            callback(new Error('No data to parse'));
        }
    }

    _parseHtmlOutputArray(data) {
        let soups = this._parseDishes(data[0]);
        let dishes = this._parseDishes(data[1]);
        soups = '>*Polévky*\n' + soups.join('\n');
        dishes = '>*Hlavní jídla*\n' + dishes.join('\n');

        return '*Restaurace Anděl*\n' + soups + '\n\n' + dishes;
    }

    _parseDishes(dishes) {
        return dishes.map((obj) => (`>•  ${obj[0]}`));
    }

    _onOpenTag(tagName, attributes) {
        if (tagName === 'h3') {
            this._parserProps.headingStarted = true;
            this._parserProps.headingsCount++;
        } else if (tagName === 'table' && this._parserProps.headingsCount > 0) {
            this._parserProps.tableStarted = true;
            this._parserProps.tablesCount++;
            this._parserProps.tables[this._parserProps.tablesCount - 1] = [];
        } else if (tagName === 'tr' && this._parserProps.headingsCount > 0) {
            this._parserProps.tableRowStarted = true;
            this._parserProps.tableRowsCount++;
            this._parserProps.tables[this._parserProps.tablesCount - 1][this._parserProps.tableRowsCount - 1] = [];
        }
    }

    _onText(text) {
        if (this._parserProps.headingStarted) {
            this._parserProps.headings.push(text);
        } else if (this._parserProps.tableRowStarted) {
            this._parserProps.tableCellsCount++;
        }

        if (this._parserProps.tableCellsCount > 1) {
            let tableIndex = this._parserProps.tablesCount - 1;
            let rowIndex = this._parserProps.tableRowsCount - 1;
            this._parserProps.tables[tableIndex][rowIndex].push(text.trim());
        }
    }

    _onCloseTag(tagName) {
        if (tagName === 'h3') {
            this._parserProps.headingStarted = false;
        } else if (tagName === 'tr') {
            this._parserProps.tableRowStarted = false;
            this._parserProps.tableCellsCount = 0;
        } else if (tagName === 'table') {
            this._parserProps.tableStarted = false;
            this._parserProps.tableRowsCount = 0;
        }
    }

    _onEnd(callback) {
        callback(null, this._parserProps.tables);
    }
}

module.exports = AndelParser;