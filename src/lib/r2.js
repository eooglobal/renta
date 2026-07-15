import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSetting } from './settings';

async function getR2Config() {
    const [accountId, accessKeyId, secretAccessKey, bucketName, publicUrl] = await Promise.all([
        getSetting('R2_ACCOUNT_ID'),
        getSetting('R2_ACCESS_KEY_ID'),
        getSetting('R2_SECRET_ACCESS_KEY'),
        getSetting('R2_BUCKET_NAME'),
        getSetting('R2_PUBLIC_URL'),
    ]);

    return { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl };
}

export async function getR2Runtime() {
    const config = await getR2Config();
    const { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl } = config;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
        return { s3Client: null, bucketName: null, publicUrl: publicUrl || null };
    }

    const s3Client = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });

    return { s3Client, bucketName, publicUrl: publicUrl || null };
}

export async function deleteFromR2(key) {
    const { s3Client, bucketName } = await getR2Runtime();
    if (!s3Client || !bucketName) return;

    try {
        const command = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
        });
        await s3Client.send(command);
        console.log(`[R2] Deleted object: ${key}`);
    } catch (err) {
        console.error(`[R2] Delete failed for ${key}:`, err);
    }
}

export { GetObjectCommand };

/**
 * Uploads a file buffer to Cloudflare R2
 * @param {string} key - The destination path in the bucket (e.g. properties/123/image.jpg)
 * @param {Buffer} buffer - The file buffer
 * @param {string} contentType - The mime type of the file
 * @returns {Promise<string>} - The url or path to access the file
 */
export async function uploadToR2(key, buffer, contentType) {
    const { s3Client, bucketName, publicUrl } = await getR2Runtime();

    if (!s3Client || !bucketName) {
        throw new Error('R2 is not configured. Missing platform settings or environment variables.');
    }

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    });

    await s3Client.send(command);

    if (publicUrl) {
        const baseUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;
        return `${baseUrl}/${key}`;
    }

    return `/api/images/${key}`;
}