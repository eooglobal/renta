import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// POST /api/properties/[id]/images — Upload property images
export async function POST(request, { params }) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const property = await prisma.property.findUnique({
            where: { id: id },
        });

        if (!property) {
            return NextResponse.json({ error: 'Property not found' }, { status: 404 });
        }

        const isOwner = property.landlordId === parseInt(session.user.id);
        const isAdmin = session.user.role === 'ADMIN';
        if (!isOwner && !isAdmin) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        const formData = await request.formData();
        const files = formData.getAll('images');
        const isPrimary = formData.get('isPrimary') === 'true';

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No images provided' }, { status: 400 });
        }

        // Check total images count (max 10)
        const existingCount = await prisma.propertyImage.count({
            where: { propertyId: id },
        });

        if (existingCount + files.length > 10) {
            return NextResponse.json(
                { error: `Maximum 10 images allowed. You have ${existingCount}, trying to add ${files.length}.` },
                { status: 400 }
            );
        }

        // Create upload directory
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'properties', id);
        console.log(`[IMAGE UPLOAD] Target directory: ${uploadDir}`);

        try {
            await mkdir(uploadDir, { recursive: true });
            console.log(`[IMAGE UPLOAD] Directory created/verified: ${uploadDir}`);
        } catch (dirError) {
            console.error('[IMAGE UPLOAD] Fatal Error: Failed to create upload directory:', dirError);
            return NextResponse.json({ error: `Server could not create storage directory: ${dirError.message}` }, { status: 500 });
        }

        const savedImages = [];
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            console.log(`[IMAGE UPLOAD] Processing file ${i + 1}/${files.length}: ${file.name} (${file.type}, ${file.size} bytes)`);

            if (!allowedMimeTypes.includes(file.type)) {
                console.error(`[IMAGE UPLOAD] Invalid type: ${file.type}`);
                return NextResponse.json({ error: `Invalid file type: ${file.name}. Only JPEG, PNG, and WebP are allowed.` }, { status: 400 });
            }

            if (file.size > MAX_FILE_SIZE) {
                console.error(`[IMAGE UPLOAD] File too large: ${file.size}`);
                return NextResponse.json({ error: `File too large: ${file.name}. Maximum size is 5MB.` }, { status: 400 });
            }

            try {
                const bytes = await file.arrayBuffer();
                const buffer = Buffer.from(bytes);

                // Generate unique filename, deriving extension securely from MIME type
                const ext = file.type.split('/')[1] || 'jpg';
                const filename = `${Date.now()}-${i}.${ext}`;
                const filepath = path.join(uploadDir, filename);

                await writeFile(filepath, buffer);
                console.log(`[IMAGE UPLOAD] File written to disk: ${filepath}`);

                const imageUrl = `/api/images/properties/${id}/${filename}`;
                const imageRecord = await prisma.propertyImage.create({
                    data: {
                        propertyId: id,
                        url: imageUrl,
                        isPrimary: isPrimary && i === 0 && existingCount === 0,
                    },
                });

                console.log(`[IMAGE UPLOAD] DB record created: ${imageRecord.id} -> ${imageUrl}`);
                savedImages.push(imageRecord);
            } catch (fileError) {
                console.error(`[IMAGE UPLOAD] Error processing file ${file.name}:`, fileError);
                // Continue with other files or fail? For now, fail to be safe.
                return NextResponse.json({ error: `Failed to save image ${file.name}: ${fileError.message}` }, { status: 500 });
            }
        }

        // If this is the first image and none are primary, make it primary
        if (existingCount === 0 && savedImages.length > 0) {
            await prisma.propertyImage.update({
                where: { id: savedImages[0].id },
                data: { isPrimary: true },
            });
            savedImages[0].isPrimary = true;
        }

        return NextResponse.json(
            { message: `${savedImages.length} image(s) uploaded`, images: savedImages },
            { status: 201 }
        );
    } catch (error) {
        console.error('Image upload error:', error);
        return NextResponse.json({ error: 'Failed to upload images' }, { status: 500 });
    }
}

// DELETE /api/properties/[id]/images — Delete an image
export async function DELETE(request, { params }) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const imageId = searchParams.get('imageId');

        if (!imageId) {
            return NextResponse.json({ error: 'Image ID required' }, { status: 400 });
        }

        const image = await prisma.propertyImage.findFirst({
            where: {
                id: parseInt(imageId),
                propertyId: id,
            },
            include: { property: true },
        });

        if (!image) {
            return NextResponse.json({ error: 'Image not found' }, { status: 404 });
        }

        const isOwner = image.property.landlordId === parseInt(session.user.id);
        const isAdmin = session.user.role === 'ADMIN';
        if (!isOwner && !isAdmin) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        await prisma.propertyImage.delete({ where: { id: parseInt(imageId) } });

        return NextResponse.json({ message: 'Image deleted' });
    } catch (error) {
        console.error('Image delete error:', error);
        return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
    }
}
