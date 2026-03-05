const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Renta';

/**
 * Send an email via Resend REST API (Bypasses SMTP port blocks)
 */
export async function sendEmail({ to, subject, html }) {
  const API_KEY = process.env.SMTP_PASS;

  // Use the from address from env, fallback to onboarding@resend.dev
  // IMPORTANT: Resend free tier requires the EXACT string 'onboarding@resend.dev' 
  // if you haven't verified a custom domain yet.
  const fromAddress = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  try {
    if (!API_KEY) {
      console.error('[Resend API] ERROR: SMTP_PASS (API Key) is missing from environment.');
      return { success: false, error: 'API Key missing' };
    }

    console.log(`[Resend API] Attempting to send to: ${to} from: ${fromAddress}`);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [to],
        subject: subject,
        html: wrapInTemplate(subject, html),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Resend API] API ERROR:', JSON.stringify(data, null, 2));
      throw new Error(data.message || JSON.stringify(data));
    }

    console.log('[Resend API] SUCCESS! Message ID:', data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('[Resend API] CRITICAL Error sending email:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Email template wrapper
 */
function wrapInTemplate(title, content) {
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
                  <h1 style="margin:0;color:#FDA829;font-size:28px;font-weight:800;letter-spacing:-0.5px;">${APP_NAME}</h1>
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
                    © ${new Date().getFullYear()} ${APP_NAME}. Verified apartment rentals in Ilorin.
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
  return sendEmail({
    to: user.email,
    subject: `Welcome to ${APP_NAME}!`,
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
  return sendEmail({
    to: landlord.email,
    subject: `Property Verified — ${property.title}`,
    html: `
      <h2 style="color:#000;margin:0 0 16px;">Property Verified ✓</h2>
      <p style="color:#4a4a4a;line-height:1.6;">
        Great news! Your property <strong>${property.title}</strong> has been verified and is now live on ${APP_NAME}.
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

export default sendEmail;
