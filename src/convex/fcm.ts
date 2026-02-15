'use node';

import crypto from 'crypto';

import { v } from 'convex/values';

import { internalAction } from './_generated/server';

function base64url(input: string | Buffer) {
	return Buffer.from(input)
		.toString('base64')
		.replace(/=/g, '')
		.replace(/\+/g, '-')
		.replace(/\//g, '_');
}

export async function getAccessToken() {
	const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));

	const now = Math.floor(Date.now() / 1000);
	const claimSet = {
		iss: process.env.FIREBASE_CLIENT_EMAIL,
		scope: 'https://www.googleapis.com/auth/firebase.messaging',
		aud: 'https://oauth2.googleapis.com/token',
		iat: now,
		exp: now + 3600
	};

	const payload = base64url(JSON.stringify(claimSet));
	const unsignedToken = `${header}.${payload}`;

	const sign = crypto.createSign('RSA-SHA256');
	sign.update(unsignedToken);
	const signature = sign.sign(process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'));
	const jwt = `${unsignedToken}.${base64url(signature)}`;

	// Exchange JWT for access token
	const res = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
			assertion: jwt
		})
	});

	const data = await res.json();
	if (!res.ok) throw new Error(`OAuth error: ${JSON.stringify(data)}`);
	return data.access_token;
}

export const sendFCM = internalAction({
	args: {
		fcmToken: v.string(),
		title: v.string(),
		description: v.string(),
		data: v.any(),
		tag: v.string()
	},
	handler: async (_, args) => {
		const accessToken = await getAccessToken();

		const projectId = process.env.FIREBASE_PROJECT_ID;
		if (!projectId) throw new Error('Missing FIREBASE_PROJECT_ID');

		const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
				ttl: '10' // seconds
			},
			body: JSON.stringify({
				message: {
					token: args.fcmToken,
					data: {
						title: args.title,
						body: args.description,
						service: JSON.stringify(args.data),
						tag: args.tag
					}
				}
			})
		});

		if (!res.ok) {
			throw new Error(await res.text());
		}
	}
});
