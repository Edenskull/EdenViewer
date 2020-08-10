const { google } = require('googleapis');

const googleOauth2 = google.auth.OAuth2;
let googleClient = new googleOauth2(config.googleCredentials.client_id, config.googleCredentials.client_secret, config.googleCredentials.callbackURL);

let googleToken = {};

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
        googleToken = tokenInfo;
        res.redirect('/');
    });
});

router.get('/google/isAuthorized', function(req, res) {
    res.end((googleToken != null) ? googleToken.access_token : null);
});

module.exports = router;