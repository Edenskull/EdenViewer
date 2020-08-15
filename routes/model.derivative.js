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
const ForgeSDK = require('forge-apis');

router.get('/md/viewerFormats', function (req, res) {
  var tokenSession = new Token(req.session);
  tokenSession.getTokenPublic(function(tokenPublic){
    var derivative = new ForgeSDK.DerivativesApi();
    derivative.getFormats({}, null, tokenPublic).then(function (response) {
      res.status(200).json(response.body.formats.svf);
    }).catch(function (err) {
      res.status(500).end();
    });
  });
});

module.exports = router;
