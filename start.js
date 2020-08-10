const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const forgeOauth = require('./server/forgeOauth');
const googleOauth = require('./server/googleOauth');

var app = express();

app.use(cookieParser());
app.set('trust proxy', 1);
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

app.use('/', express.static(__dirname + '\\client')); // redirect to client
app.use('/bootstrap', express.static(__dirname + '\\node_modules\\bootstrap')); // redirect to boostrap
app.use('/jquery', express.static(__dirname + '\\node_modules\\jquery\\dist')); // redirect to jquery
app.use('/', forgeOauth);

app.set('port', 80); // set port to 80

var server = app.listen(80, function() {
    console.log('Starting at ' + (new Date()).toString());
	console.log('Server listening on port ' + server.address().port);
});
