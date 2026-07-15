import { POST, DELETE } from '@/app/api/properties/[id]/videos/route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { uploadToR2 } from '@/lib/r2';
import { deleteFileByUrl } from '@/lib/fileCleanup';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  prisma: {
    property: {
      findUnique: jest.fn(),
    },
    propertyVideo: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('@/lib/r2', () => ({
  uploadToR2: jest.fn(),
}));

jest.mock('@/lib/fileCleanup', () => ({
  deleteFileByUrl: jest.fn(),
}));

function videoFile({ name = 'walkthrough.mp4', type = 'video/mp4', size = 1024 } = {}) {
  return {
    name,
    type,
    size,
    arrayBuffer: jest.fn(async () => new ArrayBuffer(size)),
  };
}

function formRequest(files) {
  return {
    formData: async () => ({
      getAll: (key) => (key === 'videos' ? files : []),
    }),
  };
}

describe('/api/properties/[id]/videos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.PROPERTY_VIDEO_MAX_MB;
    delete process.env.PROPERTY_VIDEO_MAX_COUNT;
  });

  it('uploads landlord property videos to R2 and records metadata', async () => {
    auth.mockResolvedValue({ user: { id: '7', role: 'LANDLORD' } });
    prisma.property.findUnique.mockResolvedValue({ id: 'prop_1', landlordId: 7 });
    prisma.propertyVideo.count.mockResolvedValue(0);
    uploadToR2.mockResolvedValue('https://cdn.example.com/properties/prop_1/videos/walkthrough.mp4');
    prisma.propertyVideo.create.mockResolvedValue({
      id: 12,
      propertyId: 'prop_1',
      url: 'https://cdn.example.com/properties/prop_1/videos/walkthrough.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 1024,
    });

    const res = await POST(formRequest([videoFile()]), { params: Promise.resolve({ id: 'prop_1' }) });
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(uploadToR2).toHaveBeenCalledWith(
      expect.stringMatching(/^properties\/prop_1\/videos\/\d+-0\.mp4$/),
      expect.any(Buffer),
      'video/mp4',
    );
    expect(prisma.propertyVideo.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        propertyId: 'prop_1',
        url: 'https://cdn.example.com/properties/prop_1/videos/walkthrough.mp4',
        mimeType: 'video/mp4',
        sizeBytes: 1024,
        originalName: 'walkthrough.mp4',
      }),
    });
    expect(body.videos).toHaveLength(1);
  });

  it('rejects unsupported video formats', async () => {
    auth.mockResolvedValue({ user: { id: '7', role: 'LANDLORD' } });
    prisma.property.findUnique.mockResolvedValue({ id: 'prop_1', landlordId: 7 });
    prisma.propertyVideo.count.mockResolvedValue(0);

    const res = await POST(formRequest([videoFile({ type: 'application/pdf', name: 'lease.pdf' })]), {
      params: Promise.resolve({ id: 'prop_1' }),
    });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Only MP4, WebM, and QuickTime videos are allowed');
    expect(uploadToR2).not.toHaveBeenCalled();
  });

  it('enforces the configured video size cap', async () => {
    process.env.PROPERTY_VIDEO_MAX_MB = '1';
    auth.mockResolvedValue({ user: { id: '7', role: 'LANDLORD' } });
    prisma.property.findUnique.mockResolvedValue({ id: 'prop_1', landlordId: 7 });
    prisma.propertyVideo.count.mockResolvedValue(0);

    const res = await POST(formRequest([videoFile({ size: 2 * 1024 * 1024 })]), {
      params: Promise.resolve({ id: 'prop_1' }),
    });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Maximum size is 1MB');
    expect(uploadToR2).not.toHaveBeenCalled();
  });

  it('deletes a property video owned by the landlord', async () => {
    auth.mockResolvedValue({ user: { id: '7', role: 'LANDLORD' } });
    prisma.propertyVideo.findFirst.mockResolvedValue({
      id: 12,
      propertyId: 'prop_1',
      url: 'https://cdn.example.com/properties/prop_1/videos/walkthrough.mp4',
      property: { landlordId: 7 },
    });

    const req = new Request('http://localhost/api/properties/prop_1/videos?videoId=12');
    const res = await DELETE(req, { params: Promise.resolve({ id: 'prop_1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(deleteFileByUrl).toHaveBeenCalledWith('https://cdn.example.com/properties/prop_1/videos/walkthrough.mp4');
    expect(prisma.propertyVideo.delete).toHaveBeenCalledWith({ where: { id: 12 } });
    expect(body.message).toBe('Video deleted');
  });
});