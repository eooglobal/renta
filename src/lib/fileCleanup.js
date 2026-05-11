import { unlink } from 'fs/promises';
import path from 'path';
import { deleteFromR2 } from './r2';

/**
 * Deletes a file from either R2 or the local filesystem
 * @param {string} url - The URL of the image
 */
export async function deleteFileByUrl(url) {
    if (!url) return;

    try {
        if (url.startsWith('http') && url.includes('r2.cloudflarestorage.com') || url.includes(process.env.R2_PUBLIC_URL)) {
            // Extract key from URL
            // Example URL: https://pub-xxx.r2.dev/properties/id/filename.jpg
            const baseUrl = process.env.R2_PUBLIC_URL;
            if (baseUrl) {
                const key = url.replace(baseUrl, '').replace(/^\//, '');
                await deleteFromR2(key);
            }
        } else if (url.startsWith('/api/images/')) {
            // Local file
            // Example URL: /api/images/properties/id/filename.jpg
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
