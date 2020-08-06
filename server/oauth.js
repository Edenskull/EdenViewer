const config = require('./config');
const ForgeSDK = require('forge-apis');
const { google } = require('googleapis');
const express = require('express');
const proxy = require('express-http-proxy');
const router = express.Router();

const redirectUrl = "https://developer.api.autodesk.com";

let tokenViewer = {};

const googleOauth2 = google.auth.OAuth2;
let googleClient = new googleOauth2(config.googleCredentials.client_id, config.googleCredentials.client_secret, config.googleCredentials.callbackURL);

const drive = google.drive('v3');

router.use('/proxy', proxy(redirectUrl, {
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        return new Promise(async(resolve, reject) => {
            getTokenViewer(function() {
                if (proxyReqOpts.headers) {
                    proxyReqOpts.headers['Authorization'] = `Bearer ${tokenViewer.access_token}`;
                }
                resolve(proxyReqOpts)
            });
        });
    }
}));

function getTokenViewer(callback) {
    if (tokenViewer.token == null) {
        let oauthInstance = new ForgeSDK.AuthClientTwoLegged(
            config.credentials.client_id,
            config.credentials.client_secret,
            config.credentials.scope,
            true
        );
        oauthInstance.authenticate().then(function (oauth) {
            tokenViewer.token = oauth;
            callback()
        });
    } else {
        callback();
    }
}

router.get('/google/auth', function(req, res) {
    let url = googleClient.generateAuthUrl({
        access_type: 'offline',
        scope: config.googleCredentials.scopes
    });
    res.end(url);
});

router.get('/api/google/callback/oauth', function(req, res) {
    let code = req.query.code;
    googleClient.getToken(code, function(err, tokenInfo) {
        if (err) {
            res.end(JSON.stringify(err));
            return
        }
        tokenViewer.googleToken = tokenInfo;
        res.redirect('/');
    });
});

router.get('/google/isAuthorized', function(req, res) {
    res.end((tokenViewer.googleToken != null) ? "1" : "0");
});

module.exports = router;
