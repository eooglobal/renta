import { getSetting } from './settings';

function truthy(value) {
  return String(value || '').toLowerCase() === 'true';
}

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

export function normalizeSmsPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');

  if (digits.length === 11 && digits.startsWith('0')) {
    return `234${digits.slice(1)}`;
  }

  if (digits.length === 13 && digits.startsWith('234')) {
    return digits;
  }

  if (digits.length === 10 && /^[789]/.test(digits)) {
    return `234${digits}`;
  }

  throw new Error('Invalid Nigerian phone number');
}

export async function sendSms({ to, message, channel }) {
  const smsEnabled = await getSetting('SMS_ENABLED');
  if (!truthy(smsEnabled)) {
    return { success: false, skipped: true, reason: 'disabled' };
  }

  const apiKey = await getSetting('TERMII_API_KEY');
  const senderId = await getSetting('TERMII_SENDER_ID');
  const baseUrl = trimTrailingSlash((await getSetting('TERMII_BASE_URL')) || 'https://api.ng.termii.com');
  const defaultChannel = await getSetting('TERMII_CHANNEL');

  if (!apiKey || !senderId) {
    return { success: false, skipped: true, reason: 'missing_configuration' };
  }

  let normalizedTo;
  try {
    normalizedTo = normalizeSmsPhone(to);
  } catch (error) {
    return { success: false, skipped: true, reason: 'invalid_phone', error: error.message };
  }

  if (!message || !String(message).trim()) {
    return { success: false, skipped: true, reason: 'empty_message' };
  }

  try {
    const response = await fetch(`${baseUrl}/api/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        to: normalizedTo,
        from: senderId,
        sms: String(message).trim(),
        type: 'plain',
        channel: channel || defaultChannel || 'dnd',
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || (data.code && data.code !== 'ok')) {
      return {
        success: false,
        provider: 'termii',
        status: response.status,
        error: data.message || 'Termii SMS request failed',
        response: data,
      };
    }

    return {
      success: true,
      provider: 'termii',
      messageId: data.message_id_str || data.message_id || null,
      response: data,
    };
  } catch (error) {
    console.error('[SMS] Failed to send Termii SMS:', error);
    return { success: false, provider: 'termii', error: error.message };
  }
}