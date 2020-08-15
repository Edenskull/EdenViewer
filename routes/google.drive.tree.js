var Token = require('./token');
const express = require('express');
const router = express.Router();
const config = require('./config');
var { google } = require('googleapis');

var OAuth2 = google.auth.OAuth2;
var oauth2Client = new OAuth2(config.google.client_id, config.google.client_secret, config.google.callbackURL);

router.get('/google/authenticate', function (req, res) {
	var scopes = [
		'https://www.googleapis.com/auth/drive.readonly',
		'https://www.googleapis.com/auth/userinfo.profile'
	];
	var url = oauth2Client.generateAuthUrl({
		access_type: 'offline', // 'online' (default) or 'offline' (gets refresh_token)
		scope: scopes
	});
	res.end(url);
});

router.get('/api/google/callback/oauth', function (req, res) {
	var code = req.query.code;
	oauth2Client.getToken(code, function (err, tokenInfo) {
		if (err) {
			res.end(JSON.stringify(err));
			return;
		}
		var tokenSession = new Token(req.session);
		tokenSession.setGoogleToken(tokenInfo.access_token);
		res.redirect('/');
	});
});

router.get('/google/isAuthorized', function (req, res) {
	var tokenSession = new Token(req.session);
	res.end(tokenSession.isGoogleAuthorized() ? 'true' : 'false');
});

router.get('/google/getTree', function (req, res) {
	var tokenSession = new Token(req.session);
	if (!tokenSession.isGoogleAuthorized()) {
		res.status(401).end('Please Google login first');
		return;
	}
	oauth2Client.setCredentials({
		access_token: tokenSession.getGoogleToken()
	});
	var drive = google.drive({ version: 'v3', auth: oauth2Client });
	res.setHeader('Content-Type', 'application/json');
	searchFiles(drive, null, [], function(tree) {
		res.json(tree);
	});
});

function searchFiles(service, nextPageToken, tableResult, callback) {
	service.files.list({
		q: "name contains '.rvt' and mimeType != 'application/vnd.google-apps.folder'",
		pageSize: 1000,
		orderBy: 'name',
		fields: 'nextPageToken, files(id, name, size)',
		pageToken: nextPageToken
	}, function(err, lst) {
		if(err) {
			console.log(err);
			return;
		}
		if(lst !== null) {
			lst.data.files.forEach(file => {
				tableResult.push({
					id: file.id,
					text: file.name,
					size: (file.size / (1024 * 1024)).toFixed(2)
				});
			});
			if(lst.nextPageToken) {
				searchFiles(service, lst.nextPageToken, tableResult);
			} else {
				callback(tableResult);
			}
		}
	});
}

module.exports = router;
