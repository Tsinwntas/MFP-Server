var https = require("https");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');

var base = "https://www.soccervista.com/";
function Crawler(distance){
this.matches = [];
this.targetDate = getTargetDate(distance);
this.mine = function(){
	//donePercentage = setInterval(getDonePercentage,1000);
	fetchDate(base+"soccer_games.php?date="+dateToString(this.targetDate),this.targetDate,this.matches);
}
function Team(name){
	this.name = name;
	this.odds;
	this.history = [];
}
function Match(home,away,score,time){
	this.home = home;
	this.score = score;
	this.away = away;
	this.time = time;
	this.FT = [];
	this.O = [];
	this.GG = 0;
	this.fix = function(){
		this.FT = getFT();
		for(var i = 0 ; i < 5; i++)
			this.O[i] = getOver(i);
		this.GG = getGG();
	}
	this.print = function(){}
	function getFT(){
		var homeFT =[0,0,0];
		var homeTotal =home.history.length;
		var homeFTAtHome = [0,0,0];
		var homeTotalAtHome =0;

		var awayFT = [0,0,0];
		var awayTotal = away.history.length;
		var awayFTAtAway = [0,0,0];
		var awayTotalAtAway = 0;

		for(var i = 0; i < home.history.length; i++){
			if(home.history[i].position){
				homeTotalAtHome++;
			}
			var result = getFTResult(home.history[i].score,home.history[i].position);
			homeFT[result]++;
			if(home.history[i].position){
				homeFTAtHome[result]++;
			}
		}
		for(var i = 0; i < away.history.length; i++){
			if(away.history[i].position){
				awayTotalAtAway++;
			}
			var result = getFTResult(away.history[i].score,away.history[i].position);
			awayFT[result]++;
			if(away.history[i].position){
				awayFTAtAway[result]++;
			}
		}

		var homePoints = (homeTotal > 0? homeFT[0] / homeTotal : 0) + (homeTotalAtHome > 0? homeFTAtHome[0] / homeTotalAtHome : 0);
		var awayPoints = (awayTotal > 0? awayFT[0] / awayTotal : 0) + (awayTotalAtAway > 0? awayFTAtAway[0] / awayTotalAtAway : 0);
		/*for(var i = 0.50; i <=2; i+=0.5){
			if(homePoints + awayPoints < i){
				console.log(i+" "+ homePoints/i  +" "+ awayPoints/i + " "+ (i - homePoints - awayPoints)/i);
				return [homePoints/i, (i - homePoints - awayPoints)/i,awayPoints/i]
			}
		}
*/
		var totalHomeWins = ((homeTotal > 0? homeFT[0] / homeTotal : 0) + (homeTotalAtHome > 0? homeFTAtHome[0] / homeTotalAtHome : 0) ) / (homeTotalAtHome > 0 ? 2 :1);
		var totalAwayWins = ((awayTotal > 0? awayFT[0] / awayTotal : 0) + (awayTotalAtAway > 0? awayFTAtAway[0] / awayTotalAtAway : 0) ) / (awayTotalAtAway > 0 ? 2 :1);
		var totalHomeDraws = ((homeTotal > 0? homeFT[1] / homeTotal : 0) + (homeTotalAtHome > 0? homeFTAtHome[1] / homeTotalAtHome : 0) ) / (homeTotalAtHome > 0 ? 2 :1);
		var totalAwayDraws = ((awayTotal > 0? awayFT[1] / awayTotal : 0) + (awayTotalAtAway > 0? awayFTAtAway[1] / awayTotalAtAway : 0) ) / (awayTotalAtAway > 0 ? 2 :1);
		var totalHomeLost = ((homeTotal > 0? homeFT[2] / homeTotal : 0) + (homeTotalAtHome > 0? homeFTAtHome[2] / homeTotalAtHome : 0) ) / (homeTotalAtHome > 0 ? 2 :1);
		var totalAwayLost = ((awayTotal > 0? awayFT[2] / awayTotal : 0) + (awayTotalAtAway > 0? awayFTAtAway[2] / awayTotalAtAway : 0) ) / (awayTotalAtAway > 0 ? 2 :1);
		var total = totalHomeWins + totalAwayWins + totalHomeDraws + totalAwayDraws + totalHomeLost + totalAwayLost;
		return [(totalHomeWins + totalAwayLost)/total,(totalHomeDraws + totalAwayDraws)/total,(totalAwayWins + totalHomeLost)/total];

/*		debugger;
		var total = homeTotal + awayTotal;
		var ft1 = homeFT[0] + awayFT[2];
		var ft2 = homeFT[2] + awayFT[0];
		return [ft1/total, (total - ft1 - ft2)/total, ft2/total];*/
	}
	function getFTResult(score,position){
		if(position){
			if(score[0] > score[1]) return 0;
			if(score[0] == score[1]) return 1;
			else return 2;
		}else{
			if(score[0] > score[1]) return 2;
			if(score[0] == score[1]) return 1;
			else return 1;
		}
	}
	function getOver(bound){
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
		for(var i = 0; i < home.history.length; i++){
			if(home.history[i].position){
				homeTotalAtHome++;
			}
			if(isOver(home.history[i].score,bound)){
				homeOU++;
				if(home.history[i].position)
					homeOUAtHome++;
				if(isReason(home.history[i].position,home.history[i].score,bound)){
					homeOUisReason++;
					if(home.history[i].position)
						homeOUisReasonAtHome++;
				}
			}
		}
		for(var i = 0; i < away.history.length; i++){
			if(!away.history[i].position){
				awayTotalAtAway++;
			}
			if(isOver(away.history[i].score,bound)){
				awayOU++;
				if(!away.history[i].position)
					awayOUAtAway++;
				if(isReason(away.history[i].position,away.history[i].score,bound)){
					awayOUisReason++;
					if(!away.history[i].position)
						awayOUisReasonAtAway++;
				}
			}
		}
		return ( ((homeTotal > 0? homeOU/homeTotal : 0) + (homeTotalAtHome > 0? homeOUAtHome/homeTotalAtHome : 0))/(homeTotalAtHome > 0?2:1) 
		+ ((homeOU > 0? homeOUisReason/homeOU : 0) + (homeOUAtHome > 0?homeOUisReasonAtHome/homeOUAtHome : 0))/(homeOUAtHome > 0?2:1)
		+ ((awayTotal > 0? awayOU/awayTotal : 0) + (awayTotalAtAway > 0? awayOUAtAway/awayTotalAtAway : 0))/(awayTotalAtAway > 0?2:1)
		+ ((awayOU > 0? awayOUisReason/awayOU : 0) + (awayOUAtAway > 0? awayOUisReasonAtAway/awayOUAtAway : 0))/(awayOUAtAway > 0?2:1) )/4;
	}
	function isOver(score,bound){
		return score[0] + score[1] > bound;
	}
	function isReason(position, score, bound){
		return (position && score[0] >= bound) || (!position && score[1] >= bound);
	}
	function getGG(){
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
		for(var i = 0; i < home.history.length; i++){
			if(home.history[i].position){
				homeTotalAtHome++;
			}
			if(teamScored(home.history[i].position,home.history[i].score)){
				homeScored++;
				if(home.history[i].position)
					homeScoredAtHome++;
			}
			if(teamConceded(home.history[i].position,home.history[i].score)){
				homeConceded++;
				if(home.history[i].position){
					homeConcededAtHome++;
				}
			}
		}
		for(var i = 0; i < away.history.length; i++){
			if(!away.history[i].position){
				awayTotalAtAway++;
			}
			if(teamScored(away.history[i].position,away.history[i].score)){
				awayScored++;
				if(!away.history[i].position)
					awayScoredAtAway++;
			}
			if(teamConceded(away.history[i].position,away.history[i].score)){
				awayConceded++;
				if(!away.history[i].position){
					awayConcededAtAway++;
				}
			}
		}
		return ( ((homeTotal > 0 ? homeScored/homeTotal : 0) + (homeTotalAtHome > 0? homeScoredAtHome/homeTotalAtHome : 0))/(homeTotalAtHome > 0?2:1) 
		+ ((awayTotal > 0 ? awayConceded/awayTotal : 0) + (awayTotalAtAway > 0?awayConcededAtAway/awayTotalAtAway : 0))/(awayTotalAtAway > 0?2:1)
		+ ((awayTotal > 0 ? awayScored/awayTotal : 0) + (awayTotalAtAway > 0? awayScoredAtAway/awayTotalAtAway : 0))/(awayTotalAtAway > 0?2:1)
		+ ((homeTotal > 0 ? homeConceded/homeTotal :0) + (homeTotalAtHome > 0? homeConcededAtHome/homeTotalAtHome : 0))/(homeTotalAtHome > 0?2:1) )/4;
	}
	function teamScored(position, score){
		if(position)
			return score[0] > 0;
		else 
			return score[1] > 0;
	}
	function teamConceded(position, score){
		if(!position)
			return score[0] > 0;
		else 
			return score[1] > 0;
	}
}
function Record(position,score,dataArray){
	this.position = position;
	this.score = score;
	this.dataArray = dataArray;
}


function getTargetDate(distance){

	return new Date((new Date().setDate(new Date().getDate()+distance)));
}
function fetchDate(link,currentDate,matches){

	getHtmlAsync(link,mineDate,currentDate,matches);
}
function dateToString(targetDate){
	return targetDate.getFullYear()+"-"+((targetDate.getMonth()+1) > 9 ? "" : "0")+(targetDate.getMonth()+1)+"-"+(targetDate.getDate() > 9 ? "" : "0")+targetDate.getDate();
}
function mineDate(dom,currentDate,matches){
	var table = getTodaysTable(dom);
	var rows = getRows(table);
	for(var i =0 ; i < rows.length; i++){
		fetchMatch(getMatchLink(rows[i]),currentDate,matches);
	}
}
function getTodaysTable(dom){

	return dom.getElementsByClassName("main")[0];
}
function getRows(table){
	var rows = [];
	var tableRows = table.getElementsByTagName("tr");
	for(var i =0; i < tableRows.length; i++){
		if(tableRows[i].className == "onem" || tableRows[i].className == "twom")
			rows.push(tableRows[i]);
	}
	return rows;
}
function fetchMatch(link,currentDate,matches){
	getHtmlAsync(base+link,getMatchPrediction,currentDate,matches);
}
function getMatchLink(row){

	return row.getElementsByTagName("a")[0].href;
}
function getMatchPrediction(dom,currentDate,matches){
	var league = getLeagueName(dom);
	var home = new Team(getTeamName(dom,0));
	var away = new Team(getTeamName(dom,1));
	setOdds(dom, home,away);
	var score = getMatchScore(dom);
	var time = getMatchTime(dom);
	var homeHistoryTable = getHistoryTable(dom,0);
	var awayHistoryTable = getHistoryTable(dom,1);
	getTeamHistoryInLeague(home,league,homeHistoryTable,currentDate);
	getTeamHistoryInLeague(away,league,awayHistoryTable,currentDate);
	var currMatch = new Match(home,away,score,time);
	currMatch.fix();
	matches.push(currMatch);
}
function getLeagueName(dom){
	//console.log(dom.getElementsByTagName("p")[1].textContent);
	return dom.getElementsByTagName("p")[1]? dom.getElementsByTagName("p")[1].textContent : "";
}
function getTeamName(dom,index){

	return dom.querySelectorAll("h1[id='gamecss']")[index]? dom.querySelectorAll("h1[id='gamecss']")[index].textContent : "";
}
function setOdds(dom, home, away){
	var odds = dom.getElementsByClassName("odds");
	home.odds = odds[0] && !isNaN(odds[0].textContent)? parseFloat(odds[0].textContent) : -1;
	away.odds = odds[2] && !isNaN(odds[2].textContent)? parseFloat(odds[2].textContent) : -1;
}
function getMatchScore(dom){
	return dom.getElementsByClassName("score")[0]? dom.getElementsByClassName("score")[0].textContent : "";
}
function getMatchTime(dom){
	var td = dom.getElementsByTagName("td");
	for(var i = 0 ; i < td.length; i++){
		if(td[i].textContent && (td[i].textContent.includes("CEST") || td[i].textContent.includes("CET")))
			return td[i].textContent;
	}
	return "";
}
function getHistoryTable(dom,index){

	return dom.getElementsByClassName("homeonly")[index];
}
function getTeamHistoryInLeague(team,league,historyTable,currentDate){
	try{
	var relatable = false;
	var records = historyTable.getElementsByTagName("tr");
	for(var i =0; i < records.length; i++){
		if(records[i].textContent){
		if(relatable && isMatch(records[i].textContent)){
			var data = splitData(records[i].textContent);
			if(isToday(data[0].split("."),currentDate))
				continue;
			team.history.push(new Record(getPosition(team.name, data[1]),getScore(data[2]), data));
		}else if(records[i].textContent.includes(league)){
			relatable = true;
		}else{
			relatable = false;
		}}
	}
}catch(DOMException){
	console.log(currentDate);
	console.log(team);
}
}
function isMatch(record){

	return record.match(/[0-9][:][0-9]/);
}
function splitData(data){
	var date = data.match(/[0-9]+[.][0-9]+[.]/)[0];
	data = removeFoundings(data,date,false,"");

	var score = data.match(/[0-9][:][0-9]/)[0];
	data = removeFoundings(data,score,false,"***");
	var teams = data.split("***");
	var home =teams[0];
	var away = teams[1].replace(/[ ]$/,"");
	return [date,home,score,away];
}
function removeFoundings(string, stringToReplace, addSpace, newString){

	return string.replace(stringToReplace+(addSpace?" ":""),newString);
}
function getPosition(team, home){

	return team == home;
}
function getScore(score){
	score = score.split(":");
	return [parseInt(score[0]),parseInt(score[1])];
}
function isToday(date,currentDate){

	return parseInt(date[0]) == currentDate.getDate() && parseInt(date[1]) == currentDate.getMonth() + 1;
}
//
var donePercentage;
var started =0;
var finished =0;
//
function getDonePercentage(){
	if(started>0){
		console.log((100.0*finished/started)+"%");
		if (finished >= started){
			console.log("Done.");
			done=true;
			clearInterval(donePercentage);
		}
	}
}
function turnToDom(s){
  	return new JSDOM(s).window.document;
}
function getHtmlAsync(link, callback, currentDate, matches){
	//console.log("Getting for "+link);
	started++;
    https.get(link,(resp)=>{
        let data = '';
     
      // A chunk of data has been recieved.
      resp.on('data', (chunk) => {
      	//console.log("Got something for " +link);
        data += chunk;
      });
     
      // The whole response has been received. Print out the result.
      resp.on('end', () => {
      	//console.log("Ended " + link);
        callback(turnToDom(data),currentDate,matches);
			finished++;
      });
     
    }).on("error", (err) => {
		finished++;
      console.log("Error: " + err.message);
      console.log("Retrying..");
      getHtmlAsync(link, callback, currentDate, matches);
    });
    
}
}

var crawlers = [];
var checkDoneInterv = setInterval(checkDone,1000);
for(var c = -2; c <= 2; c++){
	crawlers[c+2]=new Crawler(c);
	crawlers[c+2].mine();
}
function checkDone(){
	for(c in crawlers)
		if(crawlers[c].matches.length < 40) return;
	//console.log(JSON.stringify(crawlers));
	//saveToFile("data.js","var data = "+JSON.stringify(crawlers)+";");
	//saveToFile("data.json",JSON.stringify(crawlers));
	saveToFile("/var/www/html/js/data.js","var data = "+JSON.stringify(crawlers)+";");
	saveToFile("/var/www/html/js/data.json",JSON.stringify(crawlers));
	console.log("Check output file.");
	clearInterval(checkDoneInterv);
}

function saveToFile(file,string){
	fs.writeFile(file, string, function(err) {
	    if(err) {
	        return console.log(err);
	    }

	    console.log("The file was saved!");
	}); 
}