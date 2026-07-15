import { normalizeSmsPhone, sendSms } from '@/lib/sms';
import { getSetting } from '@/lib/settings';

jest.mock('@/lib/settings', () => ({
  getSetting: jest.fn(),
}));

function mockSetting(values) {
  getSetting.mockImplementation(async (key) => values[key]);
}

describe('sms helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('normalizes Nigerian phone numbers to Termii international format', () => {
    expect(normalizeSmsPhone('0803 000 0000')).toBe('2348030000000');
    expect(normalizeSmsPhone('+234 803 000 0000')).toBe('2348030000000');
    expect(normalizeSmsPhone('2348030000000')).toBe('2348030000000');
  });

  it('sends a transactional SMS through Termii when enabled', async () => {
    mockSetting({
      SMS_ENABLED: 'true',
      TERMII_API_KEY: 'termii_secret',
      TERMII_SENDER_ID: 'Renta',
      TERMII_BASE_URL: 'https://api.ng.termii.com',
      TERMII_CHANNEL: 'dnd',
    });
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ code: 'ok', message_id: 'msg_123' }),
    });

    const result = await sendSms({ to: '08030000000', message: 'Inspection scheduled.' });

    expect(global.fetch).toHaveBeenCalledWith('https://api.ng.termii.com/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: 'termii_secret',
        to: '2348030000000',
        from: 'Renta',
        sms: 'Inspection scheduled.',
        type: 'plain',
        channel: 'dnd',
      }),
    });
    expect(result).toMatchObject({ success: true, provider: 'termii', messageId: 'msg_123' });
  });

  it('skips SMS without calling Termii when SMS is disabled', async () => {
    mockSetting({ SMS_ENABLED: 'false' });

    const result = await sendSms({ to: '08030000000', message: 'Hello' });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: false, skipped: true, reason: 'disabled' });
  });
});