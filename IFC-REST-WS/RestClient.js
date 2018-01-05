// require anychart and anychart export modules
var exporting = require("node-highcharts-exporting");
var fs = require('fs');
var Client = require('node-rest-client').Client;
var client = new Client();

const INTERVAL = 5000;
const CLIENTS = 1000;

const times = [];
let intervalTimes = {};

setInterval(function () {
	times.push(Object.assign(intervalTimes));
	intervalTimes = {};
}, 1000);

for (let i = 0; i < CLIENTS; i++) {

	setTimeout(function () {
		setInterval(function () {
			let date = new Date().getTime();
			// direct way 
			client.get("http://localhost:8081/progress", function (data, response) {
				let time = new Date().getTime() - date;
				if (!intervalTimes[time]) {
					intervalTimes[time] = 0;
				}
				
				intervalTimes[time]++;
			});		
		}, INTERVAL);	
	}, (Math.random() + 1) * INTERVAL);

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

