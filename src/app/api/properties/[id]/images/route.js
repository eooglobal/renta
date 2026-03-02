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
            where: { id: parseInt(id) },
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
            where: { propertyId: parseInt(id) },
        });

        if (existingCount + files.length > 10) {
            return NextResponse.json(
                { error: `Maximum 10 images allowed. You have ${existingCount}, trying to add ${files.length}.` },
                { status: 400 }
            );
        }

        // Create upload directory
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'properties', id);
        await mkdir(uploadDir, { recursive: true });

        const savedImages = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Generate unique filename
            const ext = file.name.split('.').pop();
            const filename = `${Date.now()}-${i}.${ext}`;
            const filepath = path.join(uploadDir, filename);

            await writeFile(filepath, buffer);

            const imageRecord = await prisma.propertyImage.create({
                data: {
                    propertyId: parseInt(id),
                    url: `/uploads/properties/${id}/${filename}`,
                    isPrimary: isPrimary && i === 0 && existingCount === 0,
                },
            });

            savedImages.push(imageRecord);
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
                propertyId: parseInt(id),
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
