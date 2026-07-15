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