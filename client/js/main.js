function googleSignIn() {
    $.get({
        url: '/google/auth',
        async: false,
    }).done(function(rootUrl) {
        location.href = rootUrl;
    });
}

function isConnected() {
    let isConnected;
    $.get({
        url: '/google/isAuthorized',
        async: false
    }).done(function(response) {
        isConnected = response;
    });
    return isConnected;
}


$(document).ready(function(){
    if(isConnected() == false) {
        googleSignIn();
    }
});