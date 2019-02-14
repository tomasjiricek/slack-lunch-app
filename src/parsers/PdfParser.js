const pdf = require('pdf-parse');

const RENDER_OPTIONS = {
    normalizeWhitespace: false,
    disableCombineTextItems: false
};

class PdfParser {
    parse(data, callback) {
        pdf(data, {pagerender: this._customPdfRenderer.bind(this)}).then((data) => {
            callback(null, this._getParsedPdfArray(data.text));
        }).catch(callback);
    }

    _customPdfRenderer(pageData) {    
        return pageData.getTextContent(RENDER_OPTIONS)
            .then((textContent) => this._processTextContent(textContent));
    }
    
    _getParsedPdfArray(text) {
        let pages = text.split('\n\n');

        return pages
            .filter((page) => (page !== ''))
            .map((page) => (
                page.split('\r\n').filter((row) => (row !== ''))
            ));
    }

    _processTextContent(textContent) {
        let rows = {};
        let rowsArray = [];

        for (let i in textContent.items) {
            let item = textContent.items[i];
            var rId = `i${item.transform[5]}`;
            
            if (!rows[rId]) {
                rows[rId] = [];
            }
            
            rows[rId].push(item.str);
        }            

        for (let idx in rows) {
            rowsArray.push(rows[idx].join('').replace(/\t/g, ' ').replace(/ {2,}/g, ' ').trim());
        }

        return rowsArray.join('\r\n');        
    }
}

module.exports = PdfParser;
