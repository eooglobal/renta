import { getSetting } from './settings';

/**
 * Send an email via Brevo API
 */
export async function sendEmail({ to, subject, html }) {
  const appName = await getSetting('NEXT_PUBLIC_APP_NAME', 'Renta');
  const apiKey = await getSetting('SMTP_PASS');
  const fromAddress = await getSetting('EMAIL_FROM', 'noreply@renta-app.com');

  try {
    if (!apiKey) {
      console.error('[Brevo API] ERROR: API Key (SMTP_PASS) is missing from platform settings.');
      return { success: false, error: 'API Key missing' };
    }

    console.log(`[Brevo API] Attempting to send to: ${to} from: ${fromAddress}`);

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { email: fromAddress, name: appName },
        replyTo: { email: fromAddress },
        to: [{ email: to }],
        subject: subject,
        htmlContent: wrapInTemplate(appName, subject, html),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Brevo API] API ERROR:', JSON.stringify(data, null, 2));
      throw new Error(data.message || JSON.stringify(data));
    }

    console.log('[Brevo API] SUCCESS! Message ID:', data.messageId);
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error('[Brevo API] CRITICAL Error sending email:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Email template wrapper
 */
function wrapInTemplate(appName, title, content) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin:0;padding:0;background-color:#EFEFEF;font-family:'DM Sans',Arial,sans-serif;">
      <table role="presentation" style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:20px 0;">
            <table role="presentation" style="width:100%;max-width:600px;margin:0 auto;background-color:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
              <!-- Header -->
              <tr>
                <td style="background-color:#000000;padding:24px 32px;text-align:center;">
                  <h1 style="margin:0;color:#FDA829;font-size:28px;font-weight:800;letter-spacing:-0.5px;">${appName}</h1>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding:32px;">
                  ${content}
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color:#E8E7E3;padding:20px 32px;text-align:center;">
                  <p style="margin:0;font-size:13px;color:#7a7a7a;">
                    © ${new Date().getFullYear()} ${appName}. Verified apartment rentals in Ilorin.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// ==========================================
// EMAIL TEMPLATES
// ==========================================

export async function sendWelcomeEmail(user) {
  const appName = await getSetting('NEXT_PUBLIC_APP_NAME', 'Renta');
  return sendEmail({
    to: user.email,
    subject: `Welcome to ${appName}!`,
    html: `
      <h2 style="color:#000;margin:0 0 16px;">Welcome, ${user.firstName}!</h2>
      <p style="color:#4a4a4a;line-height:1.6;">
        Your ${APP_NAME} account has been created successfully. You're now part of a trusted community for verified apartment rentals in Ilorin.
      </p>
      <p style="color:#4a4a4a;line-height:1.6;">
        <strong>Your role:</strong> ${user.role}
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" 
           style="display:inline-block;background-color:#FDA829;color:#000;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">
          Go to Dashboard
        </a>
      </div>
    `,
  });
}

export async function sendPaymentConfirmation({ tenant, property, rental }) {
  return sendEmail({
    to: tenant.email,
    subject: `Payment Confirmed — ${property.title}`,
    html: `
      <h2 style="color:#000;margin:0 0 16px;">Payment Received!</h2>
      <p style="color:#4a4a4a;line-height:1.6;">
        Your payment for <strong>${property.title}</strong> has been received and is now held in escrow.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px 0;color:#7a7a7a;">Rent</td><td style="padding:8px 0;text-align:right;font-weight:600;">₦${Number(rental.rentAmount).toLocaleString()}</td></tr>
        <tr><td style="padding:8px 0;color:#7a7a7a;">Service Fee (10%)</td><td style="padding:8px 0;text-align:right;font-weight:600;">₦${Number(rental.serviceFee).toLocaleString()}</td></tr>
        <tr style="border-top:2px solid #EFEFEF;"><td style="padding:8px 0;font-weight:700;">Total Paid</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#FDA829;">₦${Number(rental.totalPaid).toLocaleString()}</td></tr>
      </table>
      <p style="color:#4a4a4a;line-height:1.6;">
        Once you move in and confirm access, the funds will be released to the landlord.
      </p>
    `,
  });
}

export async function sendEscrowReleaseEmail({ landlord, property, rental }) {
  return sendEmail({
    to: landlord.email,
    subject: `Funds Released — ${property.title}`,
    html: `
      <h2 style="color:#000;margin:0 0 16px;">Payment Released!</h2>
      <p style="color:#4a4a4a;line-height:1.6;">
        The tenant has confirmed access to <strong>${property.title}</strong>. 
        ₦${Number(rental.rentAmount).toLocaleString()} will be transferred to your bank account.
      </p>
    `,
  });
}

export async function sendPropertyVerifiedEmail({ landlord, property }) {
  const appName = await getSetting('NEXT_PUBLIC_APP_NAME', 'Renta');
  return sendEmail({
    to: landlord.email,
    subject: `Property Verified — ${property.title}`,
    html: `
      <h2 style="color:#000;margin:0 0 16px;">Property Verified ✓</h2>
      <p style="color:#4a4a4a;line-height:1.6;">
        Great news! Your property <strong>${property.title}</strong> has been verified and is now live on ${appName}.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/landlord/properties" 
           style="display:inline-block;background-color:#FDA829;color:#000;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">
          View Property
        </a>
      </div>
    `,
  });
}

/**
 * NIN Verification Status Template
 */
export async function sendNinStatusEmail(user, status, reason = '') {
  const isApproved = status === 'VERIFIED';
  return sendEmail({
    to: user.email,
    subject: `Identity Verification ${isApproved ? 'Approved' : 'Action Required'}`,
    html: `
      <h2 style="color:#000;margin:0 0 16px;">Identity Verification</h2>
      <p style="color:#4a4a4a;line-height:1.6;">
        ${isApproved
        ? `Congratulations ${user.firstName}! Your NIN verification was successful. You now have full access to the platform.`
        : `Hello ${user.firstName}, unfortunately, your identity verification could not be completed at this time.`
      }
      </p>
      ${!isApproved && reason ? `<p style="padding:12px;background:#fef2f2;border-left:4px solid #ef4444;color:#991b1b;"><strong>Reason:</strong> ${reason}</p>` : ''}
      <div style="text-align:center;margin:24px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile" 
           style="display:inline-block;background-color:#000;color:#FDA829;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">
          ${isApproved ? 'Go to Profile' : 'Retry Verification'}
        </a>
      </div>
    `,
  });
}

/**
 * Property Rejection Template
 */
export async function sendPropertyRejectedEmail(landlord, property, reason) {
  return sendEmail({
    to: landlord.email,
    subject: `Update Required: ${property.title}`,
    html: `
      <h2 style="color:#000;margin:0 0 16px;">Listing Update Required</h2>
      <p style="color:#4a4a4a;line-height:1.6;">
        Your listing for <strong>${property.title}</strong> was reviewed by our team and requires some changes before it can go live.
      </p>
      <div style="padding:16px;background:#fff7ed;border-left:4px solid #f97316;margin:16px 0;">
        <strong style="color:#9a3412;">Feedback from Reviewer:</strong><br/>
        <p style="margin:8px 0 0;color:#c2410c;">${reason}</p>
      </div>
      <p style="color:#7a7a7a;font-size:14px;">Once updated, our team will re-verify the property within 24 hours.</p>
    `,
  });
}

/**
 * Inspection Booking Template
 */
export async function sendInspectionBookedEmail({ tenant, landlord, property, date, time }) {
  // Send to Tenant
  await sendEmail({
    to: tenant.email,
    subject: `Inspection Scheduled — ${property.title}`,
    html: `
      <h2 style="color:#000;margin:0 0 16px;">Inspection Confirmed!</h2>
      <p style="color:#4a4a4a;line-height:1.6;">
        You have successfully booked an inspection for <strong>${property.title}</strong>.
      </p>
      <div style="margin:20px 0;padding:16px;background:#f8fafc;border-radius:8px;">
        <p style="margin:0;color:#64748b;"><strong>Date:</strong> ${date}</p>
        <p style="margin:4px 0 0;color:#64748b;"><strong>Time:</strong> ${time}</p>
        <p style="margin:4px 0 0;color:#64748b;"><strong>Address:</strong> ${property.address}</p>
      </div>
      <p style="font-size:13px;color:#ef4444;">Please ensure you are on time. If you need to cancel, do so via your dashboard.</p>
    `,
  });

  // Notify Landlord
  return sendEmail({
    to: landlord.email,
    subject: `New Inspection Booking — ${property.title}`,
    html: `
      <h2 style="color:#000;margin:0 0 16px;">New Booking Alert</h2>
      <p style="color:#4a4a4a;line-height:1.6;">
        A potential tenant has booked an inspection for your property.
      </p>
      <p><strong>Tenant:</strong> ${tenant.firstName} ${tenant.lastName}</p>
      <p><strong>Schedule:</strong> ${date} at ${time}</p>
    `,
  });
}

/**
 * Maintenance Update Template
 */
export async function sendMaintenanceUpdateEmail({ tenant, request, newStatus }) {
  const statusColors = {
    'IN_PROGRESS': '#3b82f6',
    'RESOLVED': '#10b981',
  };

  return sendEmail({
    to: tenant.email,
    subject: `Maintenance Status Update: ${request.title}`,
    html: `
      <h2 style="color:#000;margin:0 0 16px;">Repair Update</h2>
      <p style="color:#4a4a4a;line-height:1.6;">
        The status of your maintenance request <strong>"${request.title}"</strong> has been updated.
      </p>
      <div style="display:inline-block;padding:4px 12px;background:${statusColors[newStatus] || '#000'};color:#fff;border-radius:20px;font-size:12px;font-weight:600;">
        ${newStatus.replace('_', ' ')}
      </div>
    `,
  });
}

/**
 * Commission Earned Template
 */
export async function sendCommissionEarnedEmail(user, amount, type) {
  return sendEmail({
    to: user.email,
    subject: `You've Earned a Commission! 💰`,
    html: `
      <h2 style="color:#000;margin:0 0 16px;">Nice Work, ${user.firstName}!</h2>
      <p style="color:#4a4a4a;line-height:1.6;">
        You just earned a <strong>${type}</strong> commission of <strong>₦${Number(amount).toLocaleString()}</strong> from a successful rental.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/wallet" 
           style="display:inline-block;background-color:#000;color:#FDA829;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">
          View Your Wallet
        </a>
      </div>
    `,
  });
}

/**
 * New Message Alert Template
 */
export async function sendNewMessageEmail(receiver, senderName) {
  const appName = await getSetting('NEXT_PUBLIC_APP_NAME', 'Renta');
  return sendEmail({
    to: receiver.email,
    subject: `New Message from ${senderName}`,
    html: `
      <h2 style="color:#000;margin:0 0 16px;">You have a new message!</h2>
      <p style="color:#4a4a4a;line-height:1.6;">
        <strong>${senderName}</strong> has sent you a message regarding your rental on ${appName}.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/messages" 
           style="display:inline-block;background-color:#FDA829;color:#000;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">
          Reply Now
        </a>
      </div>
    `,
  });
}

export default sendEmail;
