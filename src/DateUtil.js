function timeEqual(dateStr) {
    let parsed = dateStr.split(':', 3);
    let dateIsEqual = false;

    if (parsed.length > 0) {
        let hours = parseInt(parsed[0]);
        let minutes = this.getMinutes();
        let seconds = this.getSeconds();

        if (parsed.length > 1) {
            minutes = parseInt(parsed[1]);
            if (parsed.length > 2) {
                seconds = parseInt(parsed[2]);
            }
        }

        dateIsEqual = hours === this.getHours() && minutes === this.getMinutes() && seconds === this.getSeconds();
    }

    return dateIsEqual;
}

function timeBetween(timeFrom, timeTo) {
    function getTimeWithDate(time) {
        let date = new Date();
        date.setHours(time.hours);
        date.setMinutes(time.minutes);
        date.setSeconds(time.seconds);
        return date;
    }

    function isBetween(value, min, max) {
        return value >= min && value <= max;
    }

    let timeIsBetween = false;

    timeFrom = timeFrom.split(':', 3);
    timeTo = timeTo.split(':', 3);

    if (timeFrom.length > 0 && timeTo.length > 0) {
        let from = { hours: parseInt(timeFrom[0]), minutes: 0, seconds: 0 };
        let to = { hours: parseInt(timeTo[0]), minutes: 59, seconds: 59 };

        if (timeFrom.length > 1) {
            from.minutes = parseInt(timeFrom[1]);
            if (timeFrom.length > 2) {
                from.seconds = parseInt(timeFrom[2]);
            }
        }

        if (timeTo.length > 1) {
            to.minutes = parseInt(timeTo[1]);
            if (timeTo.length > 2) {
                to.seconds = parseInt(timeTo[2]);
            }
        }

        let timestampFrom = getTimeWithDate(from).getTime();
        let timestampTo = getTimeWithDate(to).getTime();

        timeIsBetween = isBetween(this.getTime(), timestampFrom, timestampTo);
    }

    return timeIsBetween;
}

module.exports.timeBetween = timeBetween;
module.exports.timeEqual = timeEqual;