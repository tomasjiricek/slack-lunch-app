const GenericLoader = require('../loaders/GenericLoader');
const PdfParser = require('./PdfParser');
const parseHtmlViaRegEx = require('./ParserUtil').parseHtmlViaRegEx;

const genericLoader = new GenericLoader();
const pdfParser = new PdfParser();
const DAYS = ['', 'PONDĚLÍ', 'ÚTERÝ', 'STŘEDA', 'ČTVRTEK', 'PÁTEK'];

class MrBaoParser {
    parse(data, callback) {
        genericLoader.getPageData(this._getPdfMenuUrl(data.toString()), (err, data) => {
            if (err) {
                callback(err);
            } else {
                pdfParser.parse(data, this._processPdfParserResponse.bind(this, callback));
            }
        });
    }

    _getMenuForCurrentDay(data) {
        let dayOfWeek = new Date().getUTCDay();
        let startAt = DAYS[dayOfWeek];
        let stopAt = ++dayOfWeek > 5 ? 'Nápoje' : DAYS[dayOfWeek];
        let todaysMenuStarted;
        let currentDayMenu = data.filter((value, index) => {
            if (value.indexOf(startAt) != -1) {
                todaysMenuStarted = true;
            } else if (todaysMenuStarted && value.indexOf(stopAt) != -1) {
                todaysMenuStarted = false;
            }

            return todaysMenuStarted;
        });

        if (currentDayMenu instanceof Array && currentDayMenu.length > 0) {
            currentDayMenu[0] = currentDayMenu[0].replace(startAt + ' ', '');
        } else {
            currentDayMenu = [];
        }

        return currentDayMenu;
    }

    _getPdfMenuUrl(html) {
        if (html) {
            let rgExp = new RegExp(`'([^"']+Poledn[^-]+-menu[^"']+)'`, 'i');
            let rgExpData = parseHtmlViaRegEx(html, rgExp);

            if (rgExpData instanceof Array && rgExpData.length >= 2) {
                return encodeURI(rgExpData[1]);
            } else {
                return new Error('Failed to get a correct URL');
            }
        } else {
            callback(new Error('No data to parse'));
        }
    }

    _parseDishes(dishes) {
        return dishes.map((dish) => (`>•  ${dish}`));
    }

    _parseOutputArray(data) {
        let dishes = this._parseDishes(data);

        if (dishes.length == 0) {
            return '';
        }

        return '*Mr. Bao*\n' + dishes.join('\n');
    }

    _processPdfParserResponse(callback, err, data) {
        if (data instanceof Array && data.length > 0) {
            let currentMenu = this._getMenuForCurrentDay(data[0]);
            callback(err, this._parseOutputArray(currentMenu));
        } else {
            callback(new Error('Invalid parsed data from PDF.'));
        }
    }
}

module.exports = MrBaoParser;
