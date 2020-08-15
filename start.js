const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const favicon = require('serve-favicon');

let app = express();

app.use(cookieParser());
app.set('trust proxy', 1);
app.use(express.static(__dirname + "\\public"))
app.use(session({
	secret: 'edenForge',
	cookie: {
		httpOnly: true,
		secure: false,
		maxAge: 1000 * 60 * 15
	},
	resave: false,
	saveUninitialized: true
}));
app.use(favicon(__dirname + '\\favicon.ico'));

app.use('/', express.static(__dirname + '\\client')); // redirect to client
app.use('/bootstrap', express.static(__dirname + '\\node_modules\\bootstrap')); // redirect to boostrap
app.use('/jquery', express.static(__dirname + '\\node_modules\\jquery\\dist')); // redirect to jquery
app.use('/fonta', express.static(__dirname + '\\node_modules\\@fortawesome\\fontawesome-free')); // redirect to fontawesome
app.use('/jstree', express.static(__dirname + '\\node_modules\\jstree\\dist')); // redirect to jstree

app.use('/', require('./routes/oauth')); // redirect oauth API calls
app.use('/', require('./routes/model.derivative')); // redirect Model Derivative API calls
app.use('/', require('./routes/google.drive.tree')); // redirect Google Drive API calls
app.use('/', require('./routes/model.derivative.google.drive.integration')); // redirect integration API calls

app.set('port', 80); // set port to 80

var server = app.listen(80, function () {
	console.log('Starting at ' + (new Date()).toString());
	console.log('Server listening on port ' + server.address().port);
});