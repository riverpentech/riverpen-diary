import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerAuthSession } from '@/lib/serverAuth';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const CLOUDINARY_FOLDER = 'rivepen-diary';

function authFailure(status: 'unauthenticated' | 'unavailable') {
    return NextResponse.json(
        { error: status === 'unauthenticated' ? 'Unauthorized' : 'Authentication service is temporarily unavailable.' },
        { status: status === 'unauthenticated' ? 401 : 503 },
    );
}

function cloudinaryConfig() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) throw new Error('Cloudinary is not configured.');
    return { cloudName, apiKey, apiSecret };
}

async function uploadToCloudinary(file: File) {
    const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = createHash('sha1')
        .update(`folder=${CLOUDINARY_FOLDER}&timestamp=${timestamp}${apiSecret}`)
        .digest('hex');
    const body = new FormData();
    body.append('file', file);
    body.append('api_key', apiKey);
    body.append('timestamp', timestamp);
    body.append('folder', CLOUDINARY_FOLDER);
    body.append('signature', signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body,
        cache: 'no-store',
    });
    const result = await response.json() as { secure_url?: string; error?: { message?: string } };
    if (!response.ok || !result.secure_url) throw new Error(result.error?.message || 'Cloudinary upload failed.');
    return result.secure_url;
}

export async function POST(request: Request) {
    const session = await getServerAuthSession(request.headers);
    if (session.status !== 'authenticated') return authFailure(session.status);

    const formData = await request.formData();
    const entryId = formData.get('entryId');
    const file = formData.get('file');
    if (typeof entryId !== 'string' || !entryId || !(file instanceof File)) {
        return NextResponse.json({ error: 'An entry and image file are required.' }, { status: 400 });
    }
    if (!file.type.startsWith('image/') || file.size === 0 || file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: 'Images must be valid files smaller than 10 MB.' }, { status: 400 });
    }

    try {
        const entry = await prisma.diaryEntry.findFirst({ where: { id: entryId, userId: session.userId }, select: { id: true } });
        if (!entry) return NextResponse.json({ error: 'Entry not found.' }, { status: 404 });
        const fileUrl = await uploadToCloudinary(file);
        const attachment = await prisma.diaryAttachment.create({
            data: { entryId, fileUrl, fileType: file.type, fileName: file.name.slice(0, 255), fileSize: file.size },
            select: { id: true, fileUrl: true, fileType: true, fileName: true },
        });
        return NextResponse.json({ attachment }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to upload this image.' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await getServerAuthSession(request.headers);
    if (session.status !== 'authenticated') return authFailure(session.status);
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'An attachment ID is required.' }, { status: 400 });

    try {
        const attachment = await prisma.diaryAttachment.findFirst({ where: { id, entry: { userId: session.userId } }, select: { id: true } });
        if (!attachment) return NextResponse.json({ error: 'Attachment not found.' }, { status: 404 });
        await prisma.diaryAttachment.delete({ where: { id: attachment.id } });
        return NextResponse.json({ id });
    } catch {
        return NextResponse.json({ error: 'Unable to remove this image.' }, { status: 500 });
    }
}
