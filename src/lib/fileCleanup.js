import { unlink } from 'fs/promises';
import path from 'path';
import { deleteFromR2 } from './r2';
import { getSetting } from './settings';

/**
 * Deletes a file from either R2 or the local filesystem
 * @param {string} url - The URL of the image or video
 */
export async function deleteFileByUrl(url) {
    if (!url) return;

    try {
        const publicUrl = await getSetting('R2_PUBLIC_URL');
        const hasConfiguredPublicUrl = publicUrl && url.startsWith(publicUrl);
        const isCloudflareR2Url = url.startsWith('http') && url.includes('r2.cloudflarestorage.com');

        if (hasConfiguredPublicUrl || isCloudflareR2Url) {
            const key = hasConfiguredPublicUrl
                ? url.replace(publicUrl, '').replace(/^\//, '')
                : new URL(url).pathname.replace(/^\//, '');

            if (key) {
                await deleteFromR2(key);
            }
            return;
        }

        if (url.startsWith('/api/images/')) {
            const relativePath = url.replace('/api/images/', '');
            const absolutePath = path.join(process.cwd(), 'public', 'uploads', relativePath);

            try {
                await unlink(absolutePath);
                console.log(`[FILE] Deleted local file: ${absolutePath}`);
            } catch (err) {
                console.warn(`[FILE] Failed to delete local file: ${absolutePath}`, err.message);
            }
        }
    } catch (error) {
        console.error(`[FILE CLEANUP] Error deleting ${url}:`, error);
    }
}

/**
 * Automatically purges media (secondary images and walkthrough videos) from Cloudflare R2 / filesystem
 * for properties whose status has been set to RENTED longer than `retentionDays` ago.
 * @param {number} retentionDays - Days after property is rented before purging media (default: 14)
 */
export async function cleanupRentedPropertiesMedia(retentionDays = 14) {
    const { prisma } = await import('./db');
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    try {
        // Find all properties marked RENTED before cutoffDate that still have images or videos
        const rentedProperties = await prisma.property.findMany({
            where: {
                status: 'RENTED',
                updatedAt: { lte: cutoffDate },
                OR: [
                    { images: { some: {} } },
                    { videos: { some: {} } },
                ],
            },
            include: {
                images: true,
                videos: true,
            },
        });

        let purgedImagesCount = 0;
        let purgedVideosCount = 0;

        for (const property of rentedProperties) {
            // Delete secondary images (keep primary thumbnail for archival records)
            const secondaryImages = property.images.filter(img => !img.isPrimary);
            for (const img of secondaryImages) {
                await deleteFileByUrl(img.url);
                await prisma.propertyImage.delete({ where: { id: img.id } }).catch(() => {});
                purgedImagesCount++;
            }

            // Delete all walkthrough videos
            for (const video of property.videos) {
                await deleteFileByUrl(video.url);
                await prisma.propertyVideo.delete({ where: { id: video.id } }).catch(() => {});
                purgedVideosCount++;
            }
        }

        console.log(`[MEDIA CLEANUP] Purged media for ${rentedProperties.length} rented properties older than ${retentionDays} days: ${purgedImagesCount} images, ${purgedVideosCount} videos.`);
        return { success: true, count: rentedProperties.length, purgedImages: purgedImagesCount, purgedVideos: purgedVideosCount };
    } catch (error) {
        console.error('[MEDIA CLEANUP] Error during rented property media cleanup:', error);
        return { success: false, error: error.message };
    }
}