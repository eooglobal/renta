import { POST } from '@/app/api/inspections/route';
import { POST as POST_SLOT } from '@/app/api/inspections/slots/route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { dispatchNotification } from '@/lib/notificationDispatcher';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  prisma: {
    property: {
      findUnique: jest.fn(),
    },
    inspectionRequest: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/notificationDispatcher', () => ({
  dispatchNotification: jest.fn(),
}));

function jsonRequest(body) {
  return { json: async () => body };
}

describe('/api/inspections platform requests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.mockResolvedValue({ user: { id: '3', role: 'TENANT', phone: '08030000000' } });
    prisma.property.findUnique.mockResolvedValue({
      id: 'prop_1',
      title: 'GRA Apartment',
      status: 'VERIFIED',
      landlordId: 7,
    });
    prisma.inspectionRequest.findFirst.mockResolvedValue(null);
    prisma.inspectionRequest.create.mockResolvedValue({ id: 12, status: 'REQUESTED' });
    prisma.user.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    dispatchNotification.mockResolvedValue({ inApp: { id: 1 }, sms: null });
  });

  it('creates a staff-managed inspection request without notifying the landlord', async () => {
    const res = await POST(jsonRequest({
      propertyId: 'prop_1',
      tenantPhone: '08030000000',
      preferredDate: '2026-08-01',
      preferredTimeWindow: 'Morning',
    }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(prisma.inspectionRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        propertyId: 'prop_1',
        tenantId: 3,
        tenantPhone: '08030000000',
        preferredDate: expect.any(Date),
        preferredTimeWindow: 'Morning',
        status: 'REQUESTED',
      }),
    });
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { role: 'ADMIN', status: 'ACTIVE' },
      select: { id: true },
    });
    expect(dispatchNotification).toHaveBeenCalledWith(expect.objectContaining({
      userId: 1,
      type: 'INSPECTION',
      title: 'New Inspection Request',
      sms: null,
    }));
    expect(dispatchNotification).toHaveBeenCalledWith(expect.objectContaining({
      userId: 2,
      type: 'INSPECTION',
      title: 'New Inspection Request',
      sms: null,
    }));
    expect(dispatchNotification).toHaveBeenCalledWith(expect.objectContaining({
      user: expect.objectContaining({ id: 3, phone: '08030000000' }),
      type: 'INSPECTION',
      title: 'Inspection Request Received',
      sms: expect.objectContaining({ eventKey: 'SMS_INSPECTION_REQUEST_ENABLED' }),
    }));
    expect(dispatchNotification).not.toHaveBeenCalledWith(expect.objectContaining({ userId: 7 }));
    expect(body).toMatchObject({ message: expect.any(String), request: { id: 12, status: 'REQUESTED' } });
  });

  it('rejects duplicate open requests for the same property and tenant', async () => {
    prisma.inspectionRequest.findFirst.mockResolvedValue({ id: 9, status: 'REQUESTED' });

    const res = await POST(jsonRequest({
      propertyId: 'prop_1',
      tenantPhone: '08030000000',
      preferredDate: '2026-08-01',
      preferredTimeWindow: 'Morning',
    }));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toContain('already have an open inspection request');
    expect(prisma.inspectionRequest.create).not.toHaveBeenCalled();
  });

  it('blocks landlord-created inspection slots because staff now manage inspections', async () => {
    auth.mockResolvedValue({ user: { id: '7', role: 'LANDLORD' } });

    const res = await POST_SLOT(jsonRequest({
      propertyId: 'prop_1',
      date: '2026-08-01',
      startTime: '10:00',
      endTime: '11:00',
    }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toContain('Renta staff');
  });
});