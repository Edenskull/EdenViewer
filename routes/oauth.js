var Token = require('./token');
const express = require('express');
const proxy = require('express-http-proxy');
const router = express.Router();

const redirectUrl = "https://developer.api.autodesk.com";

router.use('/proxy', proxy(redirectUrl, {
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
		var tokenSession = new Token(srcReq.session);
        return new Promise(async(resolve, reject) => {
			tokenSession.getTokenInternal(function(oauth) {
				if (proxyReqOpts.headers) {
					proxyReqOpts.headers['Authorization'] = `Bearer ${oauth.access_token}`;
				}
				resolve(proxyReqOpts);
			});
        });
    }
}));

module.exports = router;