const Kit = {};
Kit.pluck = function(array, attr) {
    return array.map((object) => object[attr]);
};

Kit.uniq = function(array) {
    const seen = {}, out = [];
    array.forEach(function(object) {
        if(seen[object]) return;
        seen[object] = 1;
        out.push(object);
    });
    return out;
};

Kit.escapeRegExp = function(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};

Kit.cmp = function(a, b) {
    if(a < b) return -1;
    if(a > b) return +1;
    return 0;
};

const WEEKDAYS = {5: "perjantai", 6: "lauantai", 0: "sunnuntai"};

Kit.formatTime = function(date) {
    let minutes = "" + date.getMinutes();
    if(minutes.length === 1) minutes = "0" + minutes;
    let hours = "" + date.getHours();
    if(hours.length === 1) hours = "0" + hours;
    return hours + ":" + minutes;
};

Kit.getWeekday = function(date) {
    return WEEKDAYS[date.getDay()] || "päiväntäi";
};
