import fs from 'fs';
import path from 'path';
import { POST } from '@/app/api/verification/nin/route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

function jsonRequest(body) {
  return {
    json: async () => body,
  };
}

describe('Didit-only identity verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects the legacy NIN verification endpoint without storing identity data', async () => {
    auth.mockResolvedValue({ user: { id: '7', role: 'LANDLORD' } });

    const res = await POST(jsonRequest({ nin: '12345678901' }));
    const body = await res.json();

    expect(res.status).toBe(410);
    expect(body.error).toContain('Didit');
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('does not expose the legacy NIN fallback in the profile UI', () => {
    const profilePath = path.join(process.cwd(), 'src', 'components', 'ProfilePage.js');
    const source = fs.readFileSync(profilePath, 'utf8');

    expect(source).not.toContain('NinFallback');
    expect(source).not.toContain('/api/verification/nin');
    expect(source).not.toContain('Use NIN number instead');
  });
});