import { createHash } from 'node:crypto';

const CLOUDINARY_FOLDER = 'rivepen-diary';

function config() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) throw new Error('Cloudinary is not configured.');
    return { cloudName, apiKey, apiSecret };
}

export async function uploadVoiceDataUrl(dataUrl: string) {
    const match = dataUrl.match(/^data:(audio\/[a-zA-Z0-9.+-]+)(?:;[^,]*)?;base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!match) throw new Error('The voice recording format is invalid.');
    const [, mimeType, encoded] = match;
    const { cloudName, apiKey, apiSecret } = config();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = createHash('sha1')
        .update(`folder=${CLOUDINARY_FOLDER}&timestamp=${timestamp}${apiSecret}`)
        .digest('hex');
    const extension = mimeType.split('/')[1].split(';')[0] || 'webm';
    const body = new FormData();
    body.append('file', new Blob([Buffer.from(encoded, 'base64')], { type: mimeType }), `diary-voice.${extension}`);
    body.append('api_key', apiKey);
    body.append('timestamp', timestamp);
    body.append('folder', CLOUDINARY_FOLDER);
    body.append('signature', signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
        method: 'POST',
        body,
        cache: 'no-store',
    });
    const result = await response.json() as { secure_url?: string; error?: { message?: string } };
    if (!response.ok || !result.secure_url) throw new Error(result.error?.message || 'Voice upload failed.');
    return result.secure_url;
}
