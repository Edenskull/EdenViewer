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
        if(response == "false") {
            response = false;
        } else {
            response = true;
        }
        isConnected = response;
    });
    return isConnected;
}


$(document).ready(function(){
    console.log(isConnected());
    if(isConnected() == false) {
        googleSignIn();
    }
});