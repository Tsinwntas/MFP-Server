var https = require("https");
var jsdom = require("jsdom");
const {
    JSDOM
} = jsdom;
var fs = require('fs');
console.log("****************************");
console.log("Getting Data: " + new Date());
console.log("****************************");

var started = 0;
var finished = 0;

var base = "https://www.soccervista.com/";

class Crawler {
    constructor(distance) {
        this.matches = [];
        this.targetDate = getTargetDate(distance);
        this.mine = function () {
            fetchDate(base + "soccer_games.php?date=" + dateToString(this.targetDate), this.targetDate, this.matches);
        };
        class Team {
            constructor(name) {
                this.name = name;
                this.history = [];
            }
        }
        class Match {
            constructor(home, away, score, time) {
                this.home = home;
                this.score = score;
                this.away = away;
                this.time = time;
                this.FT = [];
                this.O = [];
                this.GG = 0;
                this.fix = function () {
                    this.FT = getFT();
                    for (var i = 0; i < 5; i++)
                        this.O[i] = getOver(i);
                    this.GG = getGG();
                };
                this.print = function () {};

                function getFT() {
                    var homeFT = [0, 0, 0];
                    var homeTotal = home.history.length;
                    var homeFTAtHome = [0, 0, 0];
                    var homeTotalAtHome = 0;
                    var awayFT = [0, 0, 0];
                    var awayTotal = away.history.length;
                    var awayFTAtAway = [0, 0, 0];
                    var awayTotalAtAway = 0;

                    homeTotalAtHome = setHistory(home.history, homeTotalAtHome, homeFT, homeFTAtHome);
                    awayTotalAtAway = setHistory(away.history, awayTotalAtAway, awayFT, awayFTAtAway);

                    return getAlgorithmResults(homeTotal, homeFT, homeTotalAtHome, homeFTAtHome, awayTotal, awayFT, awayTotalAtAway, awayFTAtAway);
                }

                function setHistory(history, sideTotalAtSide, sideFT, sideFTAtSide) {
                    for (var i = 0; i < history.length; i++) {
                        if (history[i].position) {
                            sideTotalAtSide++;
                        }
                        var result = getFTResult(history[i].score, history[i].position);
                        sideFT[result]++;
                        if (history[i].position) {
                            sideFTAtSide[result]++;
                        }
                    }
                    return sideTotalAtSide;
                }

                function getAlgorithmResults(homeTotal, homeFT, homeTotalAtHome, homeFTAtHome, awayTotal, awayFT, awayTotalAtAway, awayFTAtAway) {
                    var totalHomeWins = getAlgorithmResultsForPosition(homeTotal, 0, homeFT, homeTotalAtHome, homeFTAtHome);
                    var totalAwayWins = getAlgorithmResultsForPosition(awayTotal, 0, awayFT, awayTotalAtAway, awayFTAtAway);
                    var totalHomeDraws = getAlgorithmResultsForPosition(homeTotal, 1, homeFT, homeTotalAtHome, homeFTAtHome);
                    var totalAwayDraws = getAlgorithmResultsForPosition(awayTotal, 1, awayFT, awayTotalAtAway, awayFTAtAway);
                    var totalHomeLost = getAlgorithmResultsForPosition(homeTotal, 2, homeFT, homeTotalAtHome, homeFTAtHome);
                    var totalAwayLost = getAlgorithmResultsForPosition(awayTotal, 2, awayFT, awayTotalAtAway, awayFTAtAway);
                    var total = totalHomeWins + totalAwayWins + totalHomeDraws + totalAwayDraws + totalHomeLost + totalAwayLost;
                    return [(totalHomeWins + totalAwayLost) / total, (totalHomeDraws + totalAwayDraws) / total, (totalAwayWins + totalHomeLost) / total];
                }

                function getAlgorithmResultsForPosition(sideTotal, position, sideFT, sideTotalAtSide, sideFTAtSide) {
                    let sideTotalAverage = sideTotal > 0 ? sideFT[position] / sideTotal : 0;
                    let sideTotalAverageAtSide = sideTotalAtSide > 0 ? sideFTAtSide[position] / sideTotalAtSide : 0;
                    let positionResults = sideTotalAverage + sideTotalAverageAtSide;
                    let positionTotal = sideTotalAtSide > 0 ? 2.0 : 1.0;

                    return positionResults / positionTotal;
                }

                function getFTResult(score, position) {
                    if (position) {
                        if (score[0] > score[1])
                            return 0;
                        if (score[0] == score[1])
                            return 1;
                        else
                            return 2;
                    } else {
                        if (score[0] > score[1])
                            return 2;
                        if (score[0] == score[1])
                            return 1;
                        else
                            return 1;
                    }
                }

                function getOver(bound) {
                    var homeTotal = home.history.length;
                    var homeTotalAtHome = 0;
                    var awayTotal = away.history.length;
                    var awayTotalAtAway = 0;
                    var homeOU = 0;
                    var homeOUAtHome = 0;
                    var homeOUisReason = 0;
                    var homeOUisReasonAtHome = 0;
                    var awayOU = 0;
                    var awayOUAtAway = 0;
                    var awayOUisReason = 0;
                    var awayOUisReasonAtAway = 0;

                    for (var i = 0; i < home.history.length; i++) {
                        if (home.history[i].position) {
                            homeTotalAtHome++;
                        }
                        if (isOver(home.history[i].score, bound)) {
                            homeOU++;
                            if (home.history[i].position)
                                homeOUAtHome++;
                            if (isReason(home.history[i].position, home.history[i].score, bound)) {
                                homeOUisReason++;
                                if (home.history[i].position)
                                    homeOUisReasonAtHome++;
                            }
                        }
                    }
                    for (var i = 0; i < away.history.length; i++) {
                        if (!away.history[i].position) {
                            awayTotalAtAway++;
                        }
                        if (isOver(away.history[i].score, bound)) {
                            awayOU++;
                            if (!away.history[i].position)
                                awayOUAtAway++;
                            if (isReason(away.history[i].position, away.history[i].score, bound)) {
                                awayOUisReason++;
                                if (!away.history[i].position)
                                    awayOUisReasonAtAway++;
                            }
                        }
                    }
                    return (((homeTotal > 0 ? homeOU / homeTotal : 0) + (homeTotalAtHome > 0 ? homeOUAtHome / homeTotalAtHome : 0)) / (homeTotalAtHome > 0 ? 2 : 1) +
                        ((homeOU > 0 ? homeOUisReason / homeOU : 0) + (homeOUAtHome > 0 ? homeOUisReasonAtHome / homeOUAtHome : 0)) / (homeOUAtHome > 0 ? 2 : 1) +
                        ((awayTotal > 0 ? awayOU / awayTotal : 0) + (awayTotalAtAway > 0 ? awayOUAtAway / awayTotalAtAway : 0)) / (awayTotalAtAway > 0 ? 2 : 1) +
                        ((awayOU > 0 ? awayOUisReason / awayOU : 0) + (awayOUAtAway > 0 ? awayOUisReasonAtAway / awayOUAtAway : 0)) / (awayOUAtAway > 0 ? 2 : 1)) / 4;
                }

                function isOver(score, bound) {
                    return score[0] + score[1] > bound;
                }

                function isReason(position, score, bound) {
                    return (position && score[0] >= bound) || (!position && score[1] >= bound);
                }

                function getGG() {
                    var homeTotal = home.history.length;
                    var homeTotalAtHome = 0;
                    var awayTotal = away.history.length;
                    var awayTotalAtAway = 0;
                    var homeScored = 0;
                    var homeScoredAtHome = 0;
                    var homeConceded = 0;
                    var homeConcededAtHome = 0;
                    var awayScored = 0;
                    var awayScoredAtAway = 0;
                    var awayConceded = 0;
                    var awayConcededAtAway = 0;
                    for (var i = 0; i < home.history.length; i++) {
                        if (home.history[i].position) {
                            homeTotalAtHome++;
                        }
                        if (teamScored(home.history[i].position, home.history[i].score)) {
                            homeScored++;
                            if (home.history[i].position)
                                homeScoredAtHome++;
                        }
                        if (teamConceded(home.history[i].position, home.history[i].score)) {
                            homeConceded++;
                            if (home.history[i].position) {
                                homeConcededAtHome++;
                            }
                        }
                    }
                    for (var i = 0; i < away.history.length; i++) {
                        if (!away.history[i].position) {
                            awayTotalAtAway++;
                        }
                        if (teamScored(away.history[i].position, away.history[i].score)) {
                            awayScored++;
                            if (!away.history[i].position)
                                awayScoredAtAway++;
                        }
                        if (teamConceded(away.history[i].position, away.history[i].score)) {
                            awayConceded++;
                            if (!away.history[i].position) {
                                awayConcededAtAway++;
                            }
                        }
                    }
                    return (((homeTotal > 0 ? homeScored / homeTotal : 0) + (homeTotalAtHome > 0 ? homeScoredAtHome / homeTotalAtHome : 0)) / (homeTotalAtHome > 0 ? 2 : 1) +
                        ((awayTotal > 0 ? awayConceded / awayTotal : 0) + (awayTotalAtAway > 0 ? awayConcededAtAway / awayTotalAtAway : 0)) / (awayTotalAtAway > 0 ? 2 : 1) +
                        ((awayTotal > 0 ? awayScored / awayTotal : 0) + (awayTotalAtAway > 0 ? awayScoredAtAway / awayTotalAtAway : 0)) / (awayTotalAtAway > 0 ? 2 : 1) +
                        ((homeTotal > 0 ? homeConceded / homeTotal : 0) + (homeTotalAtHome > 0 ? homeConcededAtHome / homeTotalAtHome : 0)) / (homeTotalAtHome > 0 ? 2 : 1)) / 4;
                }

                function teamScored(position, score) {
                    if (position)
                        return score[0] > 0;
                    else
                        return score[1] > 0;
                }

                function teamConceded(position, score) {
                    if (!position)
                        return score[0] > 0;
                    else
                        return score[1] > 0;
                }
            }
        }
        class Record {
            constructor(position, score, dataArray) {
                this.position = position;
                this.score = score;
                this.dataArray = dataArray;
            }
        }

        function getTargetDate(distance) {
            let totalTime = new Date().getDate() + distance;
            let updatedDate = new Date().setDate(totalTime);
            return new Date(updatedDate);
        }

        function fetchDate(link, currentDate, matches) {
            getHtmlAsync(link, mineDate, currentDate, matches);
        }

        function dateToString(targetDate) {
            let month = ((targetDate.getMonth() + 1) > 9 ? "" : "0") + (targetDate.getMonth() + 1);
            let day = (targetDate.getDate() > 9 ? "" : "0") + targetDate.getDate();
            return targetDate.getFullYear() + "-" + month + "-" + day;
        }

        function mineDate(dom, currentDate, matches) {
            var table = getTodaysTable(dom);
            var rows = getRows(table);
            for (var i = 0; i < rows.length; i++) {
                fetchMatch(getMatchLink(rows[i]), currentDate, matches);
            }
        }

        function getTodaysTable(dom) {
            return dom.getElementsByClassName("main")[0];
        }

        function getRows(table) {
            var rows = [];
            var tableRows = table.getElementsByTagName("tr");
            for (var i = 0; i < tableRows.length; i++) {
                if (tableRows[i].className == "onem" || tableRows[i].className == "twom")
                    rows.push(tableRows[i]);
            }
            return rows;
        }

        function fetchMatch(link, currentDate, matches) {
            getHtmlAsync(base + link, getMatchPrediction, currentDate, matches);
        }

        function getMatchLink(row) {
            return row.getElementsByTagName("a")[0].href;
        }

        function getMatchPrediction(dom, currentDate, matches) {
            var league = getLeagueName(dom);
            var home = new Team(getTeamName(dom, 0));
            var away = new Team(getTeamName(dom, 1));
            setOdds(dom, home, away);
            getTeamHistoryInLeague(home, league, getHistoryTable(dom, 0), currentDate);
            getTeamHistoryInLeague(away, league, getHistoryTable(dom, 1), currentDate);
            var currMatch = new Match(home, away, getMatchScore(dom), getMatchTime(dom));
            currMatch.fix();
            matches.push(currMatch);
        }

        function getLeagueName(dom) {
            return dom.getElementsByTagName("p")[1] ? dom.getElementsByTagName("p")[1].textContent : "";
        }

        function getTeamName(dom, index) {
            return dom.querySelectorAll("h1[id='gamecss']")[index] ? dom.querySelectorAll("h1[id='gamecss']")[index].textContent : "";
        }

        function setOdds(dom, home, away) {
            var odds = dom.getElementsByClassName("odds");
            home.odds = odds[0] && !isNaN(odds[0].textContent) ? parseFloat(odds[0].textContent) : -1;
            away.odds = odds[2] && !isNaN(odds[2].textContent) ? parseFloat(odds[2].textContent) : -1;
        }

        function getMatchScore(dom) {
            return dom.getElementsByClassName("score")[0] ? dom.getElementsByClassName("score")[0].textContent : "";
        }

        function getMatchTime(dom) {
            var td = dom.getElementsByTagName("td");
            for (var i = 0; i < td.length; i++) {
                if (td[i].textContent && (td[i].textContent.includes("CEST") || td[i].textContent.includes("CET")))
                    return td[i].textContent;
            }
            return "";
        }

        function getHistoryTable(dom, index) {
            return dom.getElementsByClassName("homeonly")[index];
        }

        function getTeamHistoryInLeague(team, league, historyTable, currentDate) {
            try {
                var relatable = false;
                var records = historyTable.getElementsByTagName("tr");
                for (var i = 0; i < records.length; i++) {
                    relatable = createRelatableRecord(relatable, records[i], league, team, currentDate);
                }
            } catch (DOMException) {
                console.log(DOMException);
                console.log(currentDate);
                console.log(team);
            }
        }

        function createRelatableRecord(relatable, record, league, team, currentDate) {
            if (record) {
                if (relatable && isMatch(record.textContent)) {
                    createRecord(record.textContent, currentDate, team);
                    return relatable;
                } else if (record.textContent.includes(league)) {
                    return true;
                } else {
                    return false;
                }
            }
        }

        function isMatch(record) {
            return record.match(/[0-9][:][0-9]/);
        }

        function createRecord(context, currentDate, team) {
            var data = splitData(context);
            if (isToday(data[0].split("."), currentDate))
                return;
            team.history.push(new Record(getPosition(team.name, data[1]), getScore(data[2]), data));
        }

        function splitData(data) {
            var date;
            ({
                date,
                data
            } = getAndRemoveDate(data));
            var score;
            ({
                score,
                data
            } = getAndRemoveScore(data));
            var teams = data.split("***");
            var home = teams[0];
            var away = teams[1].replace(/[ ]$/, "");
            return [date, home, score, away];
        }

        function getAndRemoveDate(data) {
            var date = data.match(/[0-9]+[.][0-9]+[.]/)[0];
            data = removeFoundings(data, date, false, "");
            return {
                date,
                data
            };
        }

        function getAndRemoveScore(data) {
            var score = data.match(/[0-9][:][0-9]/)[0];
            data = removeFoundings(data, score, false, "***");
            return {
                score,
                data
            };
        }

        function removeFoundings(string, stringToReplace, addSpace, newString) {
            return string.replace(stringToReplace + (addSpace ? " " : ""), newString);
        }

        function getPosition(team, home) {
            return team == home;
        }

        function getScore(score) {
            score = score.split(":");
            return [parseInt(score[0]), parseInt(score[1])];
        }

        function isToday(date, currentDate) {
            return parseInt(date[0]) == currentDate.getDate() && parseInt(date[1]) == currentDate.getMonth() + 1;
        }

        function getHtmlAsync(link, callback, currentDate, matches) {
            started++;
            https.get(link, (resp) => {
                let data = '';
                resp.on('data', (chunk) => {
                    data += chunk;
                });
                resp.on('end', () => {
                    callback(turnToDom(data), currentDate, matches);
                    finished++;
                });
            }).on("error", (err) => {
                console.log("Error: " + err.message);
                console.log("Retrying..");
                getHtmlAsync(link, callback, currentDate, matches);
                finished++;
            });
        }

        function turnToDom(s) {
            return new JSDOM(s).window.document;
        }
    }
}
var crawlers = [];
var checkDoneInterv = setInterval(checkDone, 1000);
for (var c = -2; c <= 2; c++) {
    crawlers[c + 2] = new Crawler(c);
    crawlers[c + 2].mine();
}

function checkDone() {
    if (started == 0 || started != finished)
        return;
    saveToFile("data.js", "var data = " + JSON.stringify(crawlers) + ";", true);
    saveToFile("data.json", JSON.stringify(crawlers), true);
    console.log("Check output file.");
    clearInterval(checkDoneInterv);
}

function saveToFile(file, string, isProduction) {
    if (isProduction)
        file = "/root/projects/MagicFootballPredictions/" + file;
    fs.writeFile(file, string, function (err) {
        if (err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });
}