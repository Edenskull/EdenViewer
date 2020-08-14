var viewer;
const proxy = window.location.origin + "/proxy";

function launchViewer(urn) {
	const options = {};
	Autodesk.Viewing.Initializer(options, function () {
		if(proxy) {
			Autodesk.Viewing.endpoint.setEndpointAndApi(proxy);
		}
		viewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById('forgeViewer'), { extensions: [ 'Autodesk.DocumentBrowser' ] });
		viewer.start();
		loadDocument('urn:' + urn);
	});
}

function loadDocument(documentId) {
	Autodesk.Viewing.Document.load(
		documentId,
		function onSuccess(document) {
			const viewables = document.getRoot().getDefaultGeometry();
			viewer.loadDocumentNode(document, viewables);
		},
		function onError(err) {
			console.error(err);
		}
	);
}
