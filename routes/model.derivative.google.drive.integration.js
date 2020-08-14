/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by ForgeSDK Partner Development
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////

var token = require('./token');
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var config = require('./config');
var { google } = require('googleapis');
var ForgeSDK = require('forge-apis');
var request = require('request');

var OAuth2 = google.auth.OAuth2;
var oauth2Client = new OAuth2(config.google.client_id, config.google.client_secret, config.google.callbackURL);

router.post('/integration/sendToTranslation', jsonParser, function (req, res) {
	var googleFileId = req.body.googlefile;
	var tokenSession = new token(req.session);
	tokenSession.getTokenInternal(function (tokenInternal) {
		oauth2Client.setCredentials({
			access_token: tokenSession.getGoogleToken()
		});
		var drive = google.drive({ version: 'v3', auth: oauth2Client });
		var ossBucketKey = config.forge.bucket.toLowerCase();
		var buckets = new ForgeSDK.BucketsApi();
		var objects = new ForgeSDK.ObjectsApi();
		var postBuckets = new ForgeSDK.PostBucketsPayload();
		postBuckets.bucketKey = ossBucketKey;
		postBuckets.policyKey = "persistent"; // expires in 24h
		buckets.createBucket(postBuckets, {}, null, tokenInternal).catch(function (err) { console.log(err); }).then(function () {
			drive.files.get({
				fileId: googleFileId,
				fields: 'md5Checksum,name'
			}, function (err, fileInfo) {
				var filename = fileInfo.data.name;
				var md5Checksum = fileInfo.data.md5Checksum;
				var ossObjectName = googleFileId + '.' + re.exec(filename)[1];
				// at this point the bucket exists (either created or already there)
				objects.getObjects(ossBucketKey, { 'limit': 100 }, null, tokenInternal).then(function (response) {
					var alreadyTranslated = false;
					var objectsInBucket = response.body.items;
					objectsInBucket.forEach(function (item) {
						if (item.objectKey === ossObjectName) {
							res.status(200).json({
								readyToShow: true,
								status: 'File already translated.',
								objectId: item.objectId,
								urn: item.objectId.toBase64()
							});
							alreadyTranslated = true;
						}
					});
					if (!alreadyTranslated) {
						request({
							url: 'https://www.googleapis.com/drive/v2/files/' + googleFileId + '?alt=media',
							method: "GET",
							headers: {
								'Authorization': 'Bearer ' + tokenSession.getGoogleToken(),
							},
							encoding: null
						}, function (error, response, filestream) {
							objects.uploadObject(ossBucketKey, ossObjectName, filestream.length, filestream, {}, null, tokenInternal).then(function (response) {
								var ossUrn = response.body.objectId.toBase64();
								var derivative = new ForgeSDK.DerivativesApi();
								derivative.translate(translateData(ossUrn), {}, null, tokenInternal).then(function (data) {
									res.status(200).json({
										readyToShow: false,
										status: 'Translation in progress, please wait...',
										urn: ossUrn
									});
								}).catch(function (e) { res.status(500).json({ error: e.statusMessage }) }); // translate
							}).catch(function (err) { console.log(err); }); //uploadObject
						});
					}
				}).catch(function (e) { res.status(500).json({ error: e.statusMessage }); }); //getObjects
			});
		});
	});
});

router.post('/integration/isReadyToShow', jsonParser, function (req, res) {
	var ossUrn = req.body.urn;
	var tokenSession = new token(req.session);
	tokenSession.getTokenInternal(function (tokenInternal) {
		var derivative = new ForgeSDK.DerivativesApi();
		derivative.getManifest(ossUrn, {}, null, tokenInternal).then(function (response) {
			var manifest = response.body;
			if (manifest.status === 'success') {
				res.status(200).json({
					readyToShow: true,
					status: 'Translation completed.',
					urn: ossUrn
				});
			} else {
				res.status(200).json({
					readyToShow: false,
					status: 'Translation ' + manifest.status + ': ' + manifest.progress,
					urn: ossUrn
				});
			}
		}).catch(function (e) { res.status(500).json({ error: e.error.body }); });
	});
});

String.prototype.toBase64 = function () {
	return Buffer.from(this).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

function translateData(ossUrn) {
	var postJob = {
		input: {
			urn: ossUrn
		},
		output: {
			formats: [
				{
					type: "svf",
					views: ["2d", "3d"]
				}
			]
		}
	};
	return postJob;
}

var re = /(?:\.([^.]+))?$/; // regex to extract file extension

module.exports = router;
