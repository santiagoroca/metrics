const readFile = require('fs').readFile;
const express = require('express');
const app = express();

app.get('/progress', function (req, res) {
	readFile('./test.log', 'utf8', function (error, text) {
		res.send(text);
	});
});

app.listen(8081, function () {});