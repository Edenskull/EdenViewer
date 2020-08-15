const config = require('./config');
const ForgeOauth2 = require('forge-apis');

function Token(session) {
	this._session = session;
}

// forge token handling

Token.prototype.getTokenInternal = function (callback) {
	var apiInstance = new ForgeOauth2.AuthClientTwoLegged(
		config.forge.client_id, config.forge.client_secret,
		config.forge.scopeInternal, false);
	apiInstance.authenticate().then(function (oauth) {
		callback(oauth);
	});
};

Token.prototype.getTokenPublic = function (callback) {
	var s = this._session;
	if (this._session.tokenpublic == null) {
		var apiInstance = new ForgeOauth2.AuthClientTwoLegged(
			config.forge.client_id, config.forge.client_secret,
			config.forge.scopePublic, false);
		apiInstance.authenticate().then(function (oauth) {
			s.tokenpublic = oauth;
			callback(s.tokenpublic);
		});
	}
	else {
		callback(this._session.tokenpublic);
	}
};

// google token handling

Token.prototype.getGoogleToken = function () {
	return this._session.googletoken;
};

Token.prototype.setGoogleToken = function (token) {
	this._session.googletoken = token;
};

Token.prototype.isGoogleAuthorized = function () {
	return (this._session != null && this._session.googletoken != null);
};

module.exports = Token;
