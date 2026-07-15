import nodemailer from 'nodemailer';
import { sendEmail, sendPaymentConfirmation } from '@/lib/email';
import { getSetting } from '@/lib/settings';

jest.mock('@/lib/settings', () => ({
  getSetting: jest.fn(),
}));

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

function mockSettings(values) {
  getSetting.mockImplementation(async (key) => values[key]);
}

describe('email provider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('sends mail through ZeptoMail API when ZeptoMail is configured', async () => {
    mockSettings({
      EMAIL_PROVIDER: 'zeptomail',
      ZEPTOMAIL_SEND_TOKEN: 'zepto_token',
      ZEPTOMAIL_API_URL: 'https://api.zeptomail.com/v1.1/email',
      EMAIL_FROM: 'noreply@userenta.com',
      EMAIL_FROM_NAME: 'Renta',
      NEXT_PUBLIC_APP_NAME: 'Renta',
    });
    global.fetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ data: [{ code: 'EM_104', message: 'Email request received' }], request_id: 'req_123' }),
    });

    const result = await sendEmail({
      to: 'tenant@example.com',
      subject: 'Welcome',
      html: '<p>Hello tenant</p>',
    });

    expect(global.fetch).toHaveBeenCalledWith('https://api.zeptomail.com/v1.1/email', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Zoho-enczapikey zepto_token',
      },
      body: expect.any(String),
    });
    const payload = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(payload).toMatchObject({
      from: { address: 'noreply@userenta.com', name: 'Renta' },
      to: [{ email_address: { address: 'tenant@example.com', name: 'tenant' } }],
      subject: 'Welcome',
    });
    expect(payload.htmlbody).toContain('Hello tenant');
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: true, provider: 'zeptomail', messageId: 'req_123' });
  });

  it('falls back to SMTP when ZeptoMail is not configured', async () => {
    const sendMail = jest.fn().mockResolvedValue({ messageId: 'smtp_123' });
    nodemailer.createTransport.mockReturnValue({ sendMail });
    mockSettings({
      EMAIL_PROVIDER: 'smtp',
      EMAIL_SERVER_HOST: 'smtp.example.com',
      EMAIL_SERVER_PORT: '587',
      EMAIL_SERVER_USER: 'smtp-user',
      EMAIL_SERVER_PASSWORD: 'smtp-pass',
      EMAIL_FROM: 'noreply@userenta.com',
      NEXT_PUBLIC_APP_NAME: 'Renta',
    });

    const result = await sendEmail({ to: 'tenant@example.com', subject: 'SMTP', html: '<p>Fallback</p>' });

    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'tenant@example.com',
      subject: 'SMTP',
    }));
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: true, provider: 'smtp', messageId: 'smtp_123' });
  });

  it('uses direct split wording for direct split payment confirmations', async () => {
    mockSettings({
      EMAIL_PROVIDER: 'zeptomail',
      ZEPTOMAIL_SEND_TOKEN: 'zepto_token',
      EMAIL_FROM: 'noreply@userenta.com',
      EMAIL_FROM_NAME: 'Renta',
      NEXT_PUBLIC_APP_NAME: 'Renta',
    });
    global.fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ request_id: 'req_456' }) });

    await sendPaymentConfirmation({
      tenant: { email: 'tenant@example.com' },
      property: { title: 'Ikoyi Flat' },
      rental: { rentAmount: 100000, serviceFee: 10000, totalPaid: 110000, paymentMode: 'DIRECT_SPLIT' },
    });

    const payload = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(payload.htmlbody).toContain('Paystack split settlement');
    expect(payload.htmlbody).not.toContain('held securely in escrow');
  });
});