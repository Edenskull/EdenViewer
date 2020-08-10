const config = require('./config');
const ForgeSDK = require('forge-apis');
const express = require('express');
const proxy = require('express-http-proxy');
const router = express.Router();

const redirectUrl = "https://developer.api.autodesk.com";

let forgeToken = {};

router.use('/proxy', proxy(redirectUrl, {
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        return new Promise(async(resolve, reject) => {
            getTokenViewer(function() {
                if (proxyReqOpts.headers) {
                    proxyReqOpts.headers['Authorization'] = `Bearer ${forgeToken.access_token}`;
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
            forgeToken = oauth;
            callback()
        });
    } else {
        callback();
    }
}

module.exports = router;
