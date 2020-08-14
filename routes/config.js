module.exports = {
	forge: {
		client_id: process.env.FORGE_CLIENT,
		client_secret: process.env.FORGE_SECRET,
		scopeInternal: ['data:read', 'data:write', 'data:create', 'data:search', 'bucket:create', 'bucket:read', 'bucket:update', 'bucket:delete'],
		scopePublic: ['viewables:read'],
		bucket: process.env.FORGE_BUCKET
	},
	google: {
		callbackURL: process.env.CALLBACK_GOOGLE,
		client_id: process.env.GOOGLE_CLIENT,
		client_secret: process.env.GOOGLE_SECRET
	}
};
