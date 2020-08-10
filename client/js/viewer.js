var viewer;
const proxy = window.location.origin + "/proxy";

function launchViewer() {
    var options = {};
    Autodesk.Viewing.Initializer(options, () => {
        if(proxy) {
            Autodesk.Viewing.endpoint.setEndpointAndApi(proxy);
        }
        viewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById('forgeViewer'), { extensions: [ 'Autodesk.DocumentBrowser' ] });
        viewer.start();
        Autodesk.Viewing.Document.load()
    });
}

function onDocumentLoadSuccess(doc) {
    let viewables = doc.getRoot().getDefaultGeometry();
    viewer.loadDocumentNode(doc, viewables).then(i => {

    });
}

function onDocumentLoadFailure(viewerErrorCode) {
    console.error('onDocumentLoadFailure() - errorCode:', viewerErrorCode);
}
