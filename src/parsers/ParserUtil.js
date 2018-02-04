function parseHtmlViaRegEx(html, regExp) {
    if (html && regExp) {
        return html.replace(/\r\n|\n|\t/g, ' ').replace(/ {2,}/g, ' ').match(regExp);
    } else {
        return null;
    }
}

module.exports.parseHtmlViaRegEx = parseHtmlViaRegEx;