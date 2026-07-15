import { getSetting } from '@/lib/settings';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

jest.mock('@/lib/settings', () => ({
  getSetting: jest.fn(),
}));

const sendMock = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({ send: sendMock })),
  PutObjectCommand: jest.fn((input) => ({ input, type: 'PutObjectCommand' })),
  GetObjectCommand: jest.fn((input) => ({ input, type: 'GetObjectCommand' })),
  DeleteObjectCommand: jest.fn((input) => ({ input, type: 'DeleteObjectCommand' })),
}));

function mockSettings(values) {
  getSetting.mockImplementation(async (key) => values[key]);
}

describe('Cloudflare R2 settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sendMock.mockResolvedValue({});
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_BUCKET_NAME;
    delete process.env.R2_PUBLIC_URL;
  });

  it('uploads using R2 credentials saved in platform settings', async () => {
    mockSettings({
      R2_ACCOUNT_ID: 'account_from_settings',
      R2_ACCESS_KEY_ID: 'access_from_settings',
      R2_SECRET_ACCESS_KEY: 'secret_from_settings',
      R2_BUCKET_NAME: 'renta-videos',
      R2_PUBLIC_URL: 'https://cdn.userenta.com',
    });

    const { uploadToR2 } = await import('@/lib/r2');
    const url = await uploadToR2('properties/123/video.mp4', Buffer.from('video'), 'video/mp4');

    expect(S3Client).toHaveBeenCalledWith({
      region: 'auto',
      endpoint: 'https://account_from_settings.r2.cloudflarestorage.com',
      credentials: {
        accessKeyId: 'access_from_settings',
        secretAccessKey: 'secret_from_settings',
      },
    });
    expect(PutObjectCommand).toHaveBeenCalledWith({
      Bucket: 'renta-videos',
      Key: 'properties/123/video.mp4',
      Body: Buffer.from('video'),
      ContentType: 'video/mp4',
    });
    expect(sendMock).toHaveBeenCalledWith({
      input: expect.objectContaining({ Bucket: 'renta-videos' }),
      type: 'PutObjectCommand',
    });
    expect(url).toBe('https://cdn.userenta.com/properties/123/video.mp4');
  });
});