import { readFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    try {
        const { path: pathParams } = await params;
        const filePath = pathParams.join('/');

        // Security check: ensure the path is within the uploads directory
        if (filePath.includes('..')) {
            return new NextResponse('Invalid path', { status: 400 });
        }

        const fullPath = path.join(process.cwd(), 'public', 'uploads', filePath);

        try {
            const buffer = await readFile(fullPath);

            // Determine content type
            const ext = path.extname(fullPath).toLowerCase();
            const contentTypes = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.webp': 'image/webp',
                '.gif': 'image/gif'
            };

            const contentType = contentTypes[ext] || 'application/octet-stream';

            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=31536000, immutable',
                },
            });
        } catch (err) {
            console.error(`[IMAGE API] File not found: ${fullPath}`);
            return new NextResponse('Image not found', { status: 404 });
        }
    } catch (error) {
        console.error('[IMAGE API] Error serving image:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
