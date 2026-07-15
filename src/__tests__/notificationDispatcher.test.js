import { dispatchNotification, isSmsEventEnabled } from '@/lib/notificationDispatcher';
import { createNotification } from '@/lib/notifications';
import { sendSms } from '@/lib/sms';
import { getSetting } from '@/lib/settings';

jest.mock('@/lib/notifications', () => ({
  createNotification: jest.fn(),
}));

jest.mock('@/lib/sms', () => ({
  sendSms: jest.fn(),
}));

jest.mock('@/lib/settings', () => ({
  getSetting: jest.fn(),
}));

describe('notification dispatcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createNotification.mockResolvedValue({ id: 1 });
    sendSms.mockResolvedValue({ success: true, messageId: 'msg_1' });
  });

  it('checks global and event SMS toggles', async () => {
    getSetting.mockImplementation(async (key) => ({
      SMS_ENABLED: 'true',
      SMS_INSPECTION_REQUEST_ENABLED: 'false',
    })[key]);

    await expect(isSmsEventEnabled('SMS_INSPECTION_REQUEST_ENABLED')).resolves.toBe(false);
  });

  it('sends in-app notification and SMS for an enabled event', async () => {
    getSetting.mockImplementation(async (key) => ({
      SMS_ENABLED: 'true',
      SMS_INSPECTION_SCHEDULED_ENABLED: 'true',
    })[key]);

    const result = await dispatchNotification({
      user: { id: 3, phone: '08030000000' },
      type: 'INSPECTION',
      title: 'Inspection Scheduled',
      message: 'Your inspection has been scheduled.',
      link: '/tenant/rentals',
      sms: {
        eventKey: 'SMS_INSPECTION_SCHEDULED_ENABLED',
        message: 'Renta: your inspection has been scheduled.',
      },
    });

    expect(createNotification).toHaveBeenCalledWith(3, {
      type: 'INSPECTION',
      title: 'Inspection Scheduled',
      message: 'Your inspection has been scheduled.',
      link: '/tenant/rentals',
    });
    expect(sendSms).toHaveBeenCalledWith({
      to: '08030000000',
      message: 'Renta: your inspection has been scheduled.',
      channel: undefined,
    });
    expect(result.sms).toMatchObject({ success: true });
  });

  it('does not send SMS when the event toggle is disabled', async () => {
    getSetting.mockImplementation(async (key) => ({
      SMS_ENABLED: 'true',
      SMS_RENTAL_PAID_ENABLED: 'false',
    })[key]);

    const result = await dispatchNotification({
      user: { id: 3, phone: '08030000000' },
      type: 'PAYMENT',
      title: 'Payment Received',
      message: 'Your payment was successful.',
      sms: { eventKey: 'SMS_RENTAL_PAID_ENABLED' },
    });

    expect(sendSms).not.toHaveBeenCalled();
    expect(result.sms).toMatchObject({ skipped: true, reason: 'event_disabled' });
  });
});