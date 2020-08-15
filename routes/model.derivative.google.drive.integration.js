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

var Token = require('./token');
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
const config = require('./config');
var { google } = require('googleapis');
const ForgeSDK = require('forge-apis');
const request = require('request');
const admin = require('firebase-admin');
const firebaseAccount = require('../service_account.json');

admin.initializeApp({
	credential: admin.credential.cert(firebaseAccount),
	databaseURL: "https://edenviewer-2e334.firebaseio.com"
});

const database = admin.firestore();

var OAuth2 = google.auth.OAuth2;
var oauth2Client = new OAuth2(config.google.client_id, config.google.client_secret, config.google.callbackURL);

router.post('/integration/sendToTranslation', jsonParser, function (req, res) {
	var googleFileId = req.body.googlefile;
	var tokenSession = new Token(req.session);
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
				var alreadyTranslated = false;
				var filename = fileInfo.data.name;
				var md5Checksum = fileInfo.data.md5Checksum;
				var ossObjectName = googleFileId + '.' + re.exec(filename)[1];
				// at this point the bucket exists (either created or already there)
				documentExists(md5Checksum).then(function(docUrn) {
					if(docUrn != null) {
						res.status(200).json({
							readyToShow: true,
							status: 'File already translated.',
							urn: docUrn
						});
						alreadyTranslated = true;
					} else {
						objects.getObjects(ossBucketKey, { 'limit': 100 }, null, tokenInternal).then(function (response) {
							var objectsInBucket = response.body.items;
							objectsInBucket.forEach(function (item) {
								if (item.objectKey === ossObjectName) {
									console.log("creating")
									documentRegister(item.objectId.toBase64(), md5Checksum);
									res.status(200).json({
										readyToShow: true,
										status: 'File already translated.',
										objectId: item.objectId,
										urn: item.objectId.toBase64()
									});
									alreadyTranslated = true;
								}
							});
						}).catch(function (e) { res.status(500).json({ error: e.statusMessage }); }); //getObjects
					}
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
										urn: ossUrn,
										md5: md5Checksum
									});
								}).catch(function (e) { res.status(500).json({ error: e.statusMessage }) }); // translate
							}).catch(function (err) { console.log(err); }); //uploadObject
						});
					}
				});
			});
		});
	});
});

router.post('/integration/isReadyToShow', jsonParser, function (req, res) {
	var ossUrn = req.body.urn;
	var md5Checksum = req.body.md5;
	var tokenSession = new Token(req.session);
	tokenSession.getTokenInternal(function (tokenInternal) {
		var derivative = new ForgeSDK.DerivativesApi();
		derivative.getManifest(ossUrn, {}, null, tokenInternal).then(function (response) {
			var currentProgress;
			var manifest = response.body;
			if (manifest.status === 'success') {
				currentProgress = 100;
				documentRegister(ossUrn, md5Checksum).then(function(){
					res.status(200).json({
						readyToShow: true,
						progress: currentProgress,
						urn: ossUrn
					});
				});
			} else {
				currentProgress = parseInt(manifest.progress.split(" ")[0].replace("%", ""), 10);
				res.status(200).json({
					readyToShow: false,
					progress: currentProgress,
					urn: ossUrn,
					md5: md5Checksum
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

async function documentExists(md5Checksum) {
	var data = null;
	await database.collection('models').where('md5', '==', md5Checksum).get().then(function(snap) {
		snap.forEach(doc => {
			data = doc.data();
		});
	});
	if(data == null) {
		return null;
	} else {
		return data.urn;
	}
}

async function documentRegister(urn, md5Checksum) {
	let data = {
		md5: md5Checksum,
		urn: urn
	};
	await database.collection('models').doc(urn).set(data);
}

var re = /(?:\.([^.]+))?$/; // regex to extract file extension

module.exports = router;
