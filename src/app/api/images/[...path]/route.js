import { readFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import { s3Client, bucketName } from '@/lib/r2';
import { GetObjectCommand } from "@aws-sdk/client-s3";

export async function GET(request, { params }) {
    try {
        const { path: pathParams } = await params;
        const filePath = pathParams.join('/');

        // Security check
        if (filePath.includes('..')) {
            return new NextResponse('Invalid path', { status: 400 });
        }

        // Determine content type
        const ext = path.extname(filePath).toLowerCase();
        const contentTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.gif': 'image/gif'
        };
        const contentType = contentTypes[ext] || 'application/octet-stream';

        // 1. Try fetching from Cloudflare R2
        if (s3Client && bucketName) {
            try {
                const command = new GetObjectCommand({
                    Bucket: bucketName,
                    Key: filePath
                });

                const response = await s3Client.send(command);

                return new NextResponse(response.Body, {
                    headers: {
                        'Content-Type': response.ContentType || contentType,
                        'Cache-Control': 'public, max-age=31536000, immutable',
                    },
                });
            } catch (r2Error) {
                console.warn(`[IMAGE API] R2 fetch failed for ${filePath}:`, r2Error.message);
                // Fallthrough to attempt local disk load
            }
        }

        // 2. Fallback: Fetch from local disk (for old images before migration)
        const fullPath = path.join(process.cwd(), 'public', 'uploads', filePath);

        try {
            const buffer = await readFile(fullPath);
            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=31536000, immutable',
                },
            });
        } catch (localErr) {
            console.error(`[IMAGE API] File not found locally or on R2: ${filePath}`);
            return new NextResponse('Image not found', { status: 404 });
        }
    } catch (error) {
        console.error('[IMAGE API] Error serving image:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
