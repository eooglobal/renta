import { GET, PATCH } from '@/app/api/admin/inspections/route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { dispatchNotification } from '@/lib/notificationDispatcher';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  prisma: {
    inspectionRequest: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/notificationDispatcher', () => ({
  dispatchNotification: jest.fn(),
}));

function jsonRequest(body) {
  return { json: async () => body };
}

function urlRequest(url) {
  return { url };
}

describe('/api/admin/inspections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.mockResolvedValue({ user: { id: '1', role: 'ADMIN' } });
    dispatchNotification.mockResolvedValue({ inApp: { id: 1 }, sms: null });
  });

  it('lists inspection requests for admins', async () => {
    prisma.inspectionRequest.findMany.mockResolvedValue([
      { id: 12, status: 'REQUESTED', property: { title: 'GRA Apartment' }, tenant: { firstName: 'Ada' } },
    ]);

    const res = await GET(urlRequest('https://renta.test/api/admin/inspections?status=REQUESTED'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(prisma.inspectionRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'REQUESTED' },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    }));
    expect(body).toHaveLength(1);
  });

  it('schedules an inspection request and notifies the tenant only', async () => {
    prisma.inspectionRequest.findUnique.mockResolvedValue({
      id: 12,
      tenantId: 3,
      status: 'REQUESTED',
      tenantPhone: '08030000000',
      property: { id: 'prop_1', title: 'GRA Apartment', landlordId: 7 },
      tenant: { id: 3, phone: '08030000000' },
    });
    prisma.inspectionRequest.update.mockResolvedValue({ id: 12, status: 'SCHEDULED' });

    const res = await PATCH(jsonRequest({
      requestId: 12,
      status: 'SCHEDULED',
      scheduledAt: '2026-08-01T10:00:00.000Z',
      assignedStaffId: 5,
      adminNote: 'Staff will call before arrival.',
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(prisma.inspectionRequest.update).toHaveBeenCalledWith({
      where: { id: 12 },
      data: expect.objectContaining({
        status: 'SCHEDULED',
        scheduledAt: expect.any(Date),
        assignedStaffId: 5,
        adminNote: 'Staff will call before arrival.',
      }),
    });
    expect(dispatchNotification).toHaveBeenCalledWith(expect.objectContaining({
      user: expect.objectContaining({ id: 3, phone: '08030000000' }),
      type: 'INSPECTION',
      title: 'Inspection Scheduled',
      sms: expect.objectContaining({ eventKey: 'SMS_INSPECTION_SCHEDULED_ENABLED' }),
    }));
    expect(dispatchNotification).not.toHaveBeenCalledWith(expect.objectContaining({ userId: 7 }));
    expect(body).toMatchObject({ request: { id: 12, status: 'SCHEDULED' } });
  });
});