import { deleteFileByUrl } from '@/lib/fileCleanup';
import { deleteFromR2 } from '@/lib/r2';
import { getSetting } from '@/lib/settings';

jest.mock('@/lib/r2', () => ({
  deleteFromR2: jest.fn(),
}));

jest.mock('@/lib/settings', () => ({
  getSetting: jest.fn(),
}));

describe('file cleanup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.R2_PUBLIC_URL;
  });

  it('deletes R2 objects whose public URL comes from platform settings', async () => {
    getSetting.mockImplementation(async (key) => {
      if (key === 'R2_PUBLIC_URL') return 'https://cdn.userenta.com';
      return undefined;
    });

    await deleteFileByUrl('https://cdn.userenta.com/properties/prop_1/videos/walkthrough.mp4');

    expect(deleteFromR2).toHaveBeenCalledWith('properties/prop_1/videos/walkthrough.mp4');
  });
});