import { createNotification } from './notifications';
import { sendSms } from './sms';
import { getSetting } from './settings';

function truthy(value) {
  return String(value || '').toLowerCase() === 'true';
}

export async function isSmsEventEnabled(eventKey) {
  const smsEnabled = await getSetting('SMS_ENABLED');
  if (!truthy(smsEnabled)) return false;

  if (!eventKey) return true;
  const eventEnabled = await getSetting(eventKey);
  return eventEnabled === undefined || eventEnabled === null || eventEnabled === '' || truthy(eventEnabled);
}

export async function dispatchNotification({ user, userId, type, title, message, link, inApp = true, sms = null }) {
  const recipientId = userId || user?.id;
  const result = { inApp: null, sms: null };

  if (inApp && recipientId) {
    result.inApp = await createNotification(recipientId, { type, title, message, link });
  }

  if (sms) {
    const enabled = await isSmsEventEnabled(sms.eventKey);
    const to = sms.to || user?.phone;
    if (!enabled) {
      result.sms = { success: false, skipped: true, reason: 'event_disabled' };
    } else if (!to) {
      result.sms = { success: false, skipped: true, reason: 'missing_phone' };
    } else {
      result.sms = await sendSms({
        to,
        message: sms.message || message,
        channel: sms.channel,
      });
    }
  }

  return result;
}
function formatNaira(value) {
  return `NGN ${Number(value || 0).toLocaleString()}`;
}

export async function dispatchRentalPaidNotifications(payment) {
  const rental = payment?.rental;
  if (!rental) return [];

  const property = rental.property || {};
  const tenant = rental.tenant;
  const landlord = property.landlord;
  const amount = rental.totalPaid || payment.amount || rental.rentAmount;
  const results = [];

  if (tenant) {
    results.push(await dispatchNotification({
      user: tenant,
      type: 'PAYMENT',
      title: 'Payment Successful',
      message: `Your payment for "${property.title || 'this property'}" was successful.`,
      link: '/tenant/rentals',
      sms: {
        eventKey: 'SMS_RENTAL_PAID_ENABLED',
        message: `Renta: your payment of ${formatNaira(amount)} for ${property.title || 'your rental'} was successful.`,
      },
    }));
  }

  if (landlord) {
    results.push(await dispatchNotification({
      user: landlord,
      type: 'PAYMENT',
      title: 'Property Rented',
      message: `"${property.title || 'Your property'}" has been rented and payment settlement has been initiated.`,
      link: '/landlord/properties',
      sms: {
        eventKey: 'SMS_PROPERTY_RENTED_ENABLED',
        message: `Renta: ${property.title || 'your property'} has been rented. Payment settlement has been initiated.`,
      },
    }));
  }

  return results;
}
