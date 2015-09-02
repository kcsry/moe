const MOE_VERSION = "20141222";

var Config = window.C;
var Storage = (function (Config) {
    var localStorage = (window.localStorage && window.JSON ? window.localStorage : null);
    var prefix = "moe_" + MOE_VERSION + "_" + Config.event_slug + "_";
    return {
        get: function (key) {
            var data = (localStorage ? localStorage[prefix + key] : null);
            try {
                return (data !== null ? JSON.parse(data) : null);
            } catch (e) {
                return null;
            }
        },
        set: function (key, value) {
            if (localStorage) localStorage[prefix + key] = JSON.stringify(value);
        }
    };
}(Config));

var Stars = (function () {
    var serverStarred = {};
    var locallyStarred = m.prop(Storage.get("starred") || {});

    function loadStarred() {
        if(!Config.starred_url) return;
        ajax({
            method: "GET",
            url: Config.starred_url,
            success: function (data) {
                data = JSON.parse(data);
                data.starred.forEach(function (identifier) {
                    serverStarred[identifier] = true;
                });
                m.redraw();
            }
        });
    }

    function getStarredness(program) {
        var localStar = locallyStarred()[program.identifier];
        if (localStar === true || localStar === false) return !!localStar;
        return !!serverStarred[program.identifier];
    }

    function setStarredness(programId, newStarredness) {
        var stars = locallyStarred();
        stars[programId] = !!newStarredness;
        locallyStarred(stars);
        Storage.set("starred", stars);
        if (!!Config.logged_in) {
            const url = (newStarredness ? Config.star_url : Config.unstar_url);
            if(!url) return;
            ajax({
                method: "POST",
                url: url + "?event=" + Config.event_slug + "&program_id=" + programId,
                data: "true"
            });
        }
    }

    return {
        load: loadStarred,
        get: getStarredness,
        set: setStarredness
    }
}());

var scheduleData = m.prop([]);
var showPast = m.prop(!!Storage.get("showPast"));
var search = m.prop(Storage.get("search") || "");
var filterLocation = m.prop("-");
var filterKindDisplay = m.prop("-");
var expandedProgram = m.prop(null);
var facetCache = {};

function preprocessProgram(program) {
    if (!program._cached) {
        program.start_ts = Date.parse(program.start_time);
        program.end_ts = Date.parse(program.end_time);
        program.start = new Date(program.start_ts);
        program.end = new Date(program.end_ts);
        program.weekday = Kit.getWeekday(program.start);
        program.startTimeStr = Kit.formatTime(program.start);
        program.endTimeStr = Kit.formatTime(program.end);
        program.plainDescription = program.description.replace(/<.+?>/g, ' ');
        program._cached = true;
    }
    return program;
}

function preprocessScheduleData(data) {
    facetCache = {}; // clear facet cache when we're (re)loading data
    data.forEach(preprocessProgram);
    return data.sort(
        (ea, eb) => Kit.cmp(ea.start_time, eb.start_time) || Kit.cmp(ea.location, eb.location)
    );
}


function getScheduleData() {
    var data;
    var now = (+new Date()) / 1000;
    if (data = Storage.get("data")) {
        let fetchTime = 0 | Storage.get("dataMtime");
        let age = (now - fetchTime);
        if (age < 60 * 15) {
            data = preprocessScheduleData(data);
            scheduleData(data);
            m.redraw();
            return scheduleData;
        }
    }

    ajax({
        method: "GET",
        url: Config.schedule_url,
        success: function (data) {
            data = JSON.parse(data);
            data = preprocessScheduleData(data);
            Storage.set("data", data);
            Storage.set("dataMtime", now);
            scheduleData(data);
            m.redraw();
        }
    });
    return scheduleData;
}

function controller() {
    if (!scheduleData().length) getScheduleData();
    Stars.load();
    setInterval(function () {
        m.redraw();
    }, 60000);
}

function getSearchFilterPredicate(searchString) {
    searchString = (searchString || "");
    if(!searchString.length) return null;
    const searchBits = searchString
        .split(/\s+/)
        .filter((bit) => bit.length > 0)
        .map((bit) => new RegExp(Kit.escapeRegExp(bit), "i"));
    if (!searchBits.length) return null;
    return function (str) {
        for (let i = 0; i < searchBits.length; i++) {
            if (!searchBits[i].test(str)) return false;
        }
        return true;
    };
}

function getFilterPredicate() {
    const nowTs = +new Date();
    const searchFilter = getSearchFilterPredicate(search());
    const doShowPast = !!(showPast());
    const filterLocationValue = filterLocation();
    const filterKindValue = filterKindDisplay();
    const location = (filterLocationValue && filterLocationValue !== "-" ? filterLocationValue : null);
    const kind = (filterKindValue && filterKindValue !== "-" ? filterKindValue : null);
    return function (program) {
        if (!doShowPast && (nowTs > program.end_ts)) return false;
        if (searchFilter && !(searchFilter(program.title) || searchFilter(program.presenter))) return false;
        if (location && program.location != location) return false;
        if (kind && program.kind_display != kind) return false;
        return true;
    };
};

function buildFilterBox(label, property, prop) {
    var facets = facetCache[property];
    if(facets === undefined) {
        facetCache[property] = facets = Kit.uniq(Kit.pluck(scheduleData(), property));
    }
    return m("select.filter",
        {
            onchange: m.withAttr("value", prop),
            value: prop
        },
        [m("option", {value: "-"}, label)].concat(facets.map((facet) => m("option", {value: facet}, facet)))
    );
}

function uiSetStarredness(event) {
    Stars.set(event.target.id.replace(/^star-/, ""), !!event.target.checked);
}

function fixup(string) {
    if (string === "Puuseppä") return "Puu\u00ADseppä";
    if (string === "Metsähalli") return "Metsä\u00ADhalli";
    return string;
}

function setOrClearExpanded(programIdentifier) {
    if(expandedProgram() === programIdentifier) {
        expandedProgram(null);
    } else {
        expandedProgram(programIdentifier);
    }
}

function getProgramTableContent(programs) {
    const out = [];
    var lastWeekday = null;
    programs.forEach(function (program) {
        if (program.weekday !== lastWeekday) {
            lastWeekday = program.weekday;
            out.push(m("tr.weekday-divider", [m("td[colspan=4])", program.weekday)]));
        }
        out.push(m("tr", {className: "prog " + program.klass}, [
            m("td.times", [program.startTimeStr + " \u2013 " + program.endTimeStr]),
            m("td", [
                m("div.title",
                    m("a", {
                        href: "#p-" + program.identifier,
                        onclick: function(event) {
                            setOrClearExpanded(program.identifier);
                            event.stopPropagation();
                            return false;
                        }
                    }, program.title)
                ),
                m("div.meta", [
                    (program.kind_display ? m("span.kind." + program.kind, program.kind_display) : null),
                    (program.presenter ? m("span.pres", program.presenter) : null),
                    (program.hashtag ? m("span.hashtag", "#" + program.hashtag) : null)
                ])
            ]),
            m("td.loc", [fixup(program.location)]),
            m("td.star", m("label", [
                m("input.star-cb[type=checkbox]", {
                    checked: Stars.get(program),
                    id: "star-" + program.identifier,
                    onchange: uiSetStarredness
                }),
                "\u2605"
            ]))
        ]));
        if(expandedProgram() === program.identifier) {
            out.push(m("tr", [
                m("td", {colspan: 4}, m("div.description", program.plainDescription))
            ]))
        }
    });

    return out;
}

function view() {
    var programs = scheduleData().filter(getFilterPredicate());

    var now = +new Date();
    programs.forEach(function (program) {
        var klass = "";
        if (program.start_ts <= now && now <= program.end_ts) klass = "current";
        else if (now > program.end_ts) klass = "past";
        program.klass = klass + (Stars.get(program) ? " starred" : "");
    });

    Storage.set("search", search());
    Storage.set("showPast", showPast());


    return m("div", [
        m("div#controls", [
            m("label", [
                m("input#search[placeholder=Etsi nimestä ja esittäjästä...]", {
                    onchange: m.withAttr("value", search),
                    oninput: m.withAttr("value", search),
                    value: search()
                })
            ]),
            m("label", [buildFilterBox("Sijainti...", "location", filterLocation)]),
            m("label", [buildFilterBox("Laji...", "kind_display", filterKindDisplay)]),
            m("label", [
                m("input[type=checkbox]", {
                    checked: showPast(),
                    onchange: m.withAttr("checked", showPast)
                }),
                "Menneet myös"
            ])
        ]),
        m("div#wrap", [
            (programs.length ?
                m("table", {id: "schedule"}, getProgramTableContent(programs)) : 
                m("div.no-results", (scheduleData().length ? "Ei tuloksia :(" : "Ladataan..."))
            )
        ])
    ]);
}

window.addEventListener("load", function () {
    m.module(window.document.body, {controller: controller, view: view});
}, false);
