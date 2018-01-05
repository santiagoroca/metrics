const WebSocket = require('ws');
const readFile = require('fs').readFile;
const wss = new WebSocket.Server({ port: 8080 });
 
console.log(process.hrtime()[1]);

wss.on('connection', function connection(ws) {
	setInterval(function () {
		readFile('./test.log', 'utf8', function (error, text) {
			ws.send(JSON.stringify({
				time: process.hrtime()[1],
				text: text
			}));
		});
	}, 100);
});