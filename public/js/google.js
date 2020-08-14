$(document).ready(function () {
	if (!isGoogleAuthorized()) {
		googleSignIn()
	} else {
		getGoogleTree();
	}
});

function googleSignIn() {
	$.ajax({
		url: '/google/authenticate',
		success: function (rootUrl) {
			location.href = rootUrl;
		}
	});
}

function isGoogleAuthorized() {
	var ret = 'false';
	$.ajax({
		url: '/google/isAuthorized',
		success: function (res) {
			ret = res;
		},
		async: false // this request must be synchronous for the ForgeSDK Viewer
	});
	return (ret === 'true');
}

function getGoogleTree() {
	$.ajax({
		url: '/google/getTree',
		dataType: 'json',
		multiple: false,
		success: function (res) {
			res.forEach(element => {
				$('#tree').append(`<li class="list-group-item" onClick="translateFile('${element.id}','${element.text}');"><span class="text-muted size mr-1">(${element.size} mo)</span>${element.text}</li>`);
			});
		}
	})
}

function translateFile(googleId, googleName) {
	sessionStorage.setItem('_modelId', googleId);
	sessionStorage.setItem('_modelName', googleName);
	sessionStorage.setItem('_extension', re.exec(googleName)[1]);
	isFileSupported(function (supported) {
		if (!supported) {
			console.log('not Supported');
			//$.notify('File "' + googleNode.text + '" cannot be viewed, format not supported.', 'warn');
			return;
		}
		console.log('preparing');
		//$.notify('Preparing to view "' + googleNode.text + '", please wait...', 'info');
		$.ajax({
			url: '/integration/sendToTranslation',
			contentType: 'application/json',
			type: 'POST',
			dataType: 'json',
			data: JSON.stringify({
				'googlefile': sessionStorage.getItem('_modelId')
			}),
			success: function (res) {
				//$.notify(res.status + (res.readyToShow ? ' Launching viewer.' : ''), 'info');
				if (res.readyToShow)
					launchViewer(res.urn); // ready to show! launch viewer
				else
					wait(res.urn); // not ready to show... wait 5 seconds
			},
			error: function (res) {
				res = JSON.parse(res.responseText);
				//$.notify(res.error, 'error');
			}
		});
	});
}

function wait(urn) {
	setTimeout(function () {
		jQuery.ajax({
			url: '/integration/isReadyToShow',
			contentType: 'application/json',
			type: 'POST',
			dataType: 'json',
			data: JSON.stringify({
				'urn': urn
			}),
			success: function (res) {
				if (res.readyToShow) {
					//$.notify('Ready! Launching viewer.', 'info');
					launchViewer(res.urn);
				}
				else {
					//$.notify(res.status, 'warn');
					wait(res.urn);
				}
			},
			error: function (res) {
				res = JSON.parse(res.responseText);
				//$.notify(res.error, 'error');
			}
		});
	}, 5000);
}

var re = /(?:\.([^.]+))?$/; // regex to extract file extension

function isFileSupported(callback) {
	jQuery.ajax({
		url: '/md/viewerFormats',
		contentType: 'application/json',
		type: 'GET',
		dataType: 'json',
		success: function (supportedFormats) {
			supportedFormats.splice(supportedFormats.indexOf('zip'), 1);
			var supported = (jQuery.inArray(sessionStorage.getItem('_extension'), supportedFormats) >= 0);
			callback(supported);
		},
		error: function (res) {
			res = JSON.parse(res.responseText);
		}
	});
}