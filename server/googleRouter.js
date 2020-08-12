const config = require('./config');
const express = require('express');
const router = express.Router();
const { driveService } = require('./googleOauth');

router.get('/google/auth', function(req, res) {
    let url = driveService.oauth2client.generateAuthUrl({
        access_type: 'offline',
        scope: 'https://www.googleapis.com/auth/drive'
    });
    res.end(url);
});

router.get('/api/google/callback/oauth', function(req, res) {
    let code = req.query.code;
    driveService.oauth2client.getToken(code, function(err, tokenInfo) {
        if(err) {
            res.end(JSON.stringify(err));
            return;
        }
        driveService.createService(tokenInfo);
        res.redirect('/');
    });
});

router.get('/google/isAuthorized', function(req, res) {
    res.end((driveService.isConnected()) ? 'true' : 'false');
});

router.get('/google/getTree', function(req, res) {
    let result = driveService.searchFile(null, []);
    res.end(result);
});

module.exports = router;