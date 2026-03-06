import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
export const bucketName = process.env.R2_BUCKET_NAME;
export const publicUrl = process.env.R2_PUBLIC_URL;

// Only initialize if keys are present (prevents crashing during build or if not configured)
export const s3Client = (accountId && accessKeyId && secretAccessKey)
    ? new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    })
    : null;

/**
 * Uploads a file buffer to Cloudflare R2
 * @param {string} key - The destination path in the bucket (e.g., properties/123/image.jpg)
 * @param {Buffer} buffer - The file buffer
 * @param {string} contentType - The mime type of the file
 * @returns {Promise<string>} - The url or path to access the file
 */
export async function uploadToR2(key, buffer, contentType) {
    if (!s3Client || !bucketName) {
        throw new Error('R2 is not configured. Missing environment variables.');
    }

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        // Optional: CacheControl: 'public, max-age=31536000, immutable'
    });

    await s3Client.send(command);

    // If a public URL is configured, return the absolute URL. 
    // Otherwise, return the proxy route.
    if (publicUrl) {
        const baseUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;
        return `${baseUrl}/${key}`;
    }

    return `/api/images/${key}`;
}
