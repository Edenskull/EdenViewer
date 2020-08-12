module.exports = {
    credentials: {
        client_id: process.env.FORGE_CLIENT,
        client_secret: process.env.FORGE_SECRET,
        scopes: ['viewables:read']
    },
    googleCredentials: {
        callbackURL: process.env.CALLBACK_GOOGLE,
        client_id: process.env.GOOGLE_CLIENT,
        client_secret: process.env.GOOGLE_SECRET,
    }
};