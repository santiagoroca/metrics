// require anychart and anychart export modules
var exporting = require("node-highcharts-exporting");
var fs = require('fs');
var Client = require('node-rest-client').Client;
var client = new Client();
const WebSocket = require('ws');

const INTERVAL = 100;
const CLIENTS = 10000;

const times = [];
let intervalTimes = {};

setInterval(function () {
	times.push(Object.assign(intervalTimes));
	intervalTimes = {};
}, 1000);

for (let i = 0; i < CLIENTS; i++) {
	const ws = new WebSocket('ws://localhost:8080');

	ws.on('message', function incoming(message) {
	  	let time = parseInt((process.hrtime()[1] - JSON.parse(message).time) / 1000000);

	  	if (time < 0) return;

		if (!intervalTimes[time]) {
			intervalTimes[time] = 0;
		}
		
		intervalTimes[time]++;
	});
}

setTimeout(function () {

	let metrics = {};
	for (let i = 0; i < times.length; i++) {
		for (let key in times[i]) {
			if (!metrics[key]) {
				metrics[key] = 0;
			}

			metrics[key] += times[i][key];
		}
	}

	console.log(times);

	Promise.all([
		new Promise(function (resolve, reject) {
			exporting({
			    data : {
			        xAxis: {
			            categories: Object.keys(metrics)
			        },
			        series: [{
			            data: Object.keys(metrics).map(function (key) {
			            	return metrics[key];
			            })
			        }]
			    },
			 
			    options : {
			        title : {text : `Interval ${INTERVAL} CLIENTS ${CLIENTS}`} ,
			        "yAxis" : {"title" : {"text": "Number of request." }}
			    }
			 
			} , function (err , data){
			    // data had encode base64 , should be decode 
				fs.writeFile(`./metrics/${INTERVAL}_${CLIENTS}_Request_Per_Second.png`, Buffer.from(data, 'base64'), function() {
					resolve();
			    });
			});
		}),
		new Promise(function (resolve, reject) {
			exporting({
			    data : {
			        xAxis: {
			            categories: times.map(function (values, index) {
			            	return index;
			            })
			        },
			        series: [{
			            data: times.map(function (values) {
					    	let average = 0;
					    	let count = 0;

					    	for (let i in values) {
					    		average += parseInt(i);
					    		count += values[i];
					    	}

					    	return average ? average / count : 0;
					    })
			        }]
			    },
			 
			    options : {
			        title : {text : `Interval ${INTERVAL} CLIENTS ${CLIENTS}`} ,
			        "yAxis" : {"title" : {"text": "Time." }}
			    }
			 
			} , function (err , data){
			    // data had encode base64 , should be decode 
				fs.writeFile(`./metrics/${INTERVAL}_${CLIENTS}_Request_time_Growth.png`, Buffer.from(data, 'base64'), function() {
			        resolve();
			    });
			});
		})	
	])
	.then(function () {
		process.exit();
	});
	
}, 60000);