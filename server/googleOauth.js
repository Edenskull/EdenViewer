const config = require('./config');
const { google } = require('googleapis');

class DriveService {
    constructor() {
        this.oauth2client = new google.auth.OAuth2(
            config.googleCredentials.client_id,
            config.googleCredentials.client_secret,
            config.googleCredentials.callbackURL
        );
        this.service = null;
    }

    createService(auth) {
        this.service = google.drive('v3', auth);
    }

    isConnected() {
        return (this.service) ? true : false;
    }

    searchFile(nextPageToken, tableResult) {
        this.service.files.list({
            q: "name contains '.rvt' and mimeType != 'application/vnd.google-apps.folder'",
            pageSize: 1000,
            fields: 'nextPageToken, files(id, name, size, mimeType, iconLink)',
            pageToken: nextPageToken
        }, function(err, lst) {
            if(lst !== null) {
                if(err) {
                    console.log(err);
                }
                lst.files.forEach(file => {
                    tableResult.push({
                        id: file.id,
                        text: file.name,
                        type: file.mimeType,
                        icon: file.iconLink
                    });
                });
                if(lst.nextPageToken) {
                    searchFile(lst.nextPageToken, tableResult);
                } else {
                    return tableResult;
                }
            }
        });
    }
}

module.exports = {
    driveService: new DriveService()
};