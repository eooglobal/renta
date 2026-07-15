import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2';

const ALLOWED_VIDEO_TYPES = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};

function getVideoLimit() {
  const configured = Number(process.env.PROPERTY_VIDEO_MAX_COUNT || 3);
  return Number.isFinite(configured) && configured > 0 ? configured : 3;
}

function getMaxVideoBytes() {
  const configuredMb = Number(process.env.PROPERTY_VIDEO_MAX_MB || 50);
  const safeMb = Number.isFinite(configuredMb) && configuredMb > 0 ? configuredMb : 50;
  return safeMb * 1024 * 1024;
}

function getMaxVideoMbLabel() {
  return Number(process.env.PROPERTY_VIDEO_MAX_MB || 50) || 50;
}

async function requirePropertyAccess(propertyId) {
  const session = await auth();
  if (!session) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) {
    return { response: NextResponse.json({ error: 'Property not found' }, { status: 404 }) };
  }

  const isOwner = property.landlordId === parseInt(session.user.id);
  const isAdmin = session.user.role === 'ADMIN';
  if (!isOwner && !isAdmin) {
    return { response: NextResponse.json({ error: 'Not authorized' }, { status: 403 }) };
  }

  return { session, property };
}

// POST /api/properties/[id]/videos - Upload property videos to Cloudflare R2
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const access = await requirePropertyAccess(id);
    if (access.response) return access.response;

    const formData = await request.formData();
    const files = formData.getAll('videos');

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No videos provided' }, { status: 400 });
    }

    const maxCount = getVideoLimit();
    const existingCount = await prisma.propertyVideo.count({ where: { propertyId: id } });
    if (existingCount + files.length > maxCount) {
      return NextResponse.json(
        { error: `Maximum ${maxCount} videos allowed. You have ${existingCount}, trying to add ${files.length}.` },
        { status: 400 },
      );
    }

    const maxBytes = getMaxVideoBytes();
    const savedVideos = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = ALLOWED_VIDEO_TYPES[file.type];

      if (!ext) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Only MP4, WebM, and QuickTime videos are allowed.` },
          { status: 400 },
        );
      }

      if (file.size > maxBytes) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Maximum size is ${getMaxVideoMbLabel()}MB.` },
          { status: 400 },
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${i}${ext}`;
      const r2Key = `properties/${id}/videos/${filename}`;

      let videoUrl;
      try {
        videoUrl = await uploadToR2(r2Key, buffer, file.type);
      } catch (error) {
        console.error('[VIDEO UPLOAD] R2 upload failed:', error);
        return NextResponse.json(
          { error: 'Video storage is not configured. Please contact support.' },
          { status: 503 },
        );
      }

      const videoRecord = await prisma.propertyVideo.create({
        data: {
          propertyId: id,
          url: videoUrl,
          originalName: file.name || null,
          mimeType: file.type,
          sizeBytes: file.size,
        },
      });

      savedVideos.push(videoRecord);
    }

    return NextResponse.json(
      { message: `${savedVideos.length} video(s) uploaded`, videos: savedVideos },
      { status: 201 },
    );
  } catch (error) {
    console.error('Video upload error:', error);
    return NextResponse.json({ error: 'Failed to upload videos' }, { status: 500 });
  }
}

// DELETE /api/properties/[id]/videos - Delete a property video
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID required' }, { status: 400 });
    }

    const parsedVideoId = parseInt(videoId);
    if (isNaN(parsedVideoId)) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
    }

    const video = await prisma.propertyVideo.findFirst({
      where: { id: parsedVideoId, propertyId: id },
      include: { property: true },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const isOwner = video.property.landlordId === parseInt(session.user.id);
    const isAdmin = session.user.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { deleteFileByUrl } = await import('@/lib/fileCleanup');
    await deleteFileByUrl(video.url);
    await prisma.propertyVideo.delete({ where: { id: parsedVideoId } });

    return NextResponse.json({ message: 'Video deleted' });
  } catch (error) {
    console.error('Video delete error:', error);
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 });
  }
}