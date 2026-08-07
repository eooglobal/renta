import { POST as videoUploadHandler } from '@/app/api/properties/[id]/videos/route';
import { cleanupRentedPropertiesMedia } from '@/lib/fileCleanup';
import { prisma } from '@/lib/db';
import { deleteFromR2 } from '@/lib/r2';

jest.mock('@/lib/db', () => ({
    prisma: {
        platformSetting: {
            findMany: jest.fn().mockResolvedValue([]),
        },
        property: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
        },
        propertyVideo: {
            count: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
        },
        propertyImage: {
            delete: jest.fn(),
        },
    },
}));

jest.mock('@/lib/r2', () => ({
    uploadToR2: jest.fn().mockResolvedValue('https://r2.userenta.com/properties/1/videos/test.mp4'),
    deleteFromR2: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/auth', () => ({
    auth: jest.fn().mockResolvedValue({
        user: { id: '10', role: 'LANDLORD' },
    }),
}));

describe('Video Upload Engine & Rented Media Retention', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Video Upload accepts mobile formats (.mov, .3gp, .m4v) up to 150MB', async () => {
        prisma.property.findUnique.mockResolvedValue({ id: 1, landlordId: 10 });
        prisma.propertyVideo.count.mockResolvedValue(0);
        prisma.propertyVideo.create.mockImplementation(({ data }) => Promise.resolve({ id: 101, ...data }));

        const dummyVideo = new File([new ArrayBuffer(1024)], 'walkthrough.mov', { type: 'video/quicktime' });
        const formData = new FormData();
        formData.append('videos', dummyVideo);

        const req = new Request('http://localhost/api/properties/1/videos', {
            method: 'POST',
            body: formData,
        });

        const res = await videoUploadHandler(req, { params: Promise.resolve({ id: 1 }) });
        const data = await res.json();

        expect(res.status).toBe(201);
        expect(data.videos).toHaveLength(1);
        expect(prisma.propertyVideo.create).toHaveBeenCalled();
    });

    test('Video Upload rejects unsupported file formats', async () => {
        prisma.property.findUnique.mockResolvedValue({ id: 1, landlordId: 10 });
        prisma.propertyVideo.count.mockResolvedValue(0);

        const dummyFile = new File([new ArrayBuffer(1024)], 'document.pdf', { type: 'application/pdf' });
        const formData = new FormData();
        formData.append('videos', dummyFile);

        const req = new Request('http://localhost/api/properties/1/videos', {
            method: 'POST',
            body: formData,
        });

        const res = await videoUploadHandler(req, { params: Promise.resolve({ id: 1 }) });
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.error).toContain('Invalid file type');
    });

    test('cleanupRentedPropertiesMedia purges media for properties rented longer than 14 days', async () => {
        const oldCutoff = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
        const mockRentedProperties = [
            {
                id: 5,
                title: 'Rented Studio',
                status: 'RENTED',
                updatedAt: oldCutoff,
                images: [
                    { id: 1, url: 'https://r2.cloudflarestorage.com/bucket/properties/5/cover.jpg', isPrimary: true },
                    { id: 2, url: 'https://r2.cloudflarestorage.com/bucket/properties/5/kitchen.jpg', isPrimary: false },
                ],
                videos: [
                    { id: 10, url: 'https://r2.cloudflarestorage.com/bucket/properties/5/videos/tour.mp4' },
                ],
            },
        ];

        prisma.property.findMany.mockResolvedValue(mockRentedProperties);
        prisma.propertyImage.delete.mockResolvedValue({});
        prisma.propertyVideo.delete.mockResolvedValue({});

        const result = await cleanupRentedPropertiesMedia(14);

        expect(result.success).toBe(true);
        expect(result.purgedImages).toBe(1); // Secondary image deleted
        expect(result.purgedVideos).toBe(1); // Walkthrough video deleted
        expect(deleteFromR2).toHaveBeenCalled();
    });
});
