import nodemailer from 'nodemailer';
import { getSetting } from './settings';
function recipientNameFromEmail(email) {
    return String(email || '').split('@')[0] || 'Renta user';
}

function normalizeEmailRecipients(to) {
    const recipients = Array.isArray(to) ? to : [to];
    return recipients.map((recipient) => {
        if (typeof recipient === 'string') {
            return {
                email_address: {
                    address: recipient,
                    name: recipientNameFromEmail(recipient),
                },
            };
        }

        return {
            email_address: {
                address: recipient.email || recipient.address,
                name: recipient.name || recipient.firstName || recipientNameFromEmail(recipient.email || recipient.address),
            },
        };
    });
}

async function sendWithZeptoMail({ to, subject, html, fromAddress, appName }) {
    const token = await getSetting('ZEPTOMAIL_SEND_TOKEN') || await getSetting('ZEPTOMAIL_API_TOKEN');
    const apiUrl = await getSetting('ZEPTOMAIL_API_URL') || 'https://api.zeptomail.com/v1.1/email';
    const fromName = await getSetting('EMAIL_FROM_NAME') || appName;

    if (!token) {
        throw new Error('ZeptoMail send token is not configured.');
    }

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Zoho-enczapikey ${token}`,
        },
        body: JSON.stringify({
            from: { address: fromAddress, name: fromName },
            to: normalizeEmailRecipients(to),
            subject,
            htmlbody: wrapInTemplate(appName, subject, html),
        }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.error) {
        throw new Error(data.error?.message || data.message || 'ZeptoMail request failed');
    }

    return {
        success: true,
        provider: 'zeptomail',
        messageId: data.request_id || data.data?.[0]?.additional_info?.[0]?.request_id || null,
        response: data,
    };
}

/**
 * Creates a Nodemailer transporter from platform settings (SMTP credentials).
 * Falls back to environment variables if not set in DB.
 */
async function createTransporter() {
    const host     = await getSetting('EMAIL_SERVER_HOST');
    const port     = await getSetting('EMAIL_SERVER_PORT') || '587';
    const user     = await getSetting('EMAIL_SERVER_USER');
    const pass     = await getSetting('EMAIL_SERVER_PASSWORD');

    if (!host || !user || !pass) {
        throw new Error('SMTP credentials are not fully configured in Admin Settings.');
    }

    return nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465, // true for port 465 (SSL), false for 587 (TLS/STARTTLS)
        auth: { user, pass },
        tls: {
            rejectUnauthorized: false, // allow self-signed certs (common on cPanel hosts)
        },
    });
}

/**
 * Core send function — uses SMTP via Nodemailer
 */
export async function sendEmail({ to, subject, html }) {
    const fromAddress = await getSetting('EMAIL_FROM') || 'noreply@userenta.com';
    const appName     = await getSetting('NEXT_PUBLIC_APP_NAME') || 'Renta';
    const provider    = String(await getSetting('EMAIL_PROVIDER') || '').toLowerCase();
    const zeptoToken  = await getSetting('ZEPTOMAIL_SEND_TOKEN') || await getSetting('ZEPTOMAIL_API_TOKEN');
    const useZeptoMail = provider === 'zeptomail' || Boolean(zeptoToken);

    try {
        if (useZeptoMail) {
            const result = await sendWithZeptoMail({ to, subject, html, fromAddress, appName });
            console.log(`[ZeptoMail] Email sent to ${to} | RequestId: ${result.messageId || 'unknown'}`);
            return result;
        }

        const transporter = await createTransporter();

        const info = await transporter.sendMail({
            from: `"${appName}" <${fromAddress}>`,
            to,
            subject,
            html: wrapInTemplate(appName, subject, html),
        });

        console.log(`[SMTP] Email sent to ${to} | MessageId: ${info.messageId}`);
        return { success: true, provider: 'smtp', messageId: info.messageId };
    } catch (error) {
        console.error(`[Email] CRITICAL: Failed to send email to ${to}:`, error.message);
        return { success: false, provider: useZeptoMail ? 'zeptomail' : 'smtp', error: error.message };
    }
}

/**
 * Premium branded email wrapper template
 */
function wrapInTemplate(appName, title, content) {
    const year = new Date().getFullYear();
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body { margin:0; padding:0; background-color:#F4F4F0; font-family:'Inter',Arial,sans-serif; -webkit-font-smoothing:antialiased; }
        a { color:#FDA829; }
      </style>
    </head>
    <body>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F0;padding:32px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" style="max-width:600px;" cellpadding="0" cellspacing="0">

              <!-- Header -->
              <tr>
                <td style="background:#000000;border-radius:16px 16px 0 0;padding:28px 40px;text-align:center;">
                  <h1 style="margin:0;color:#FDA829;font-size:30px;font-weight:800;letter-spacing:-0.5px;">${appName}</h1>
                  <p style="margin:4px 0 0;color:#888;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Verified Apartment Rentals</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="background:#FFFFFF;padding:40px;color:#1a1a1a;font-size:15px;line-height:1.7;">
                  ${content}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#1a1a1a;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
                  <p style="margin:0 0 8px;font-size:13px;color:#aaa;">
                    © ${year} ${appName} · Ilorin, Nigeria
                  </p>
                  <p style="margin:0;font-size:12px;color:#666;">
                    You received this email because you have an account with us.<br>
                    If you have questions, contact us at <a href="mailto:hello@userenta.com" style="color:#FDA829;">hello@userenta.com</a>
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
// ✉️  EMAIL TEMPLATES
// ==========================================

/**
 * 🎉 Welcome Email — sent on successful registration
 */
export async function sendWelcomeEmail(user) {
    const appName = await getSetting('NEXT_PUBLIC_APP_NAME') || 'Renta';
    const appUrl  = process.env.NEXT_PUBLIC_APP_URL || 'https://userenta.com';

    const roleDescriptions = {
        TENANT:    { emoji: '🏠', label: 'Tenant',    desc: 'Browse verified listings, book inspections, and rent safely.' },
        LANDLORD:  { emoji: '🔑', label: 'Landlord',  desc: 'List your property and receive verified, qualified tenants.' },
        SCOUT:     { emoji: '🔍', label: 'Scout',     desc: 'Help verify properties and earn commissions for every successful listing.' },
        AFFILIATE: { emoji: '📣', label: 'Affiliate', desc: 'Share your unique link and earn on every rental you refer.' },
    };

    const role = roleDescriptions[user.role] || { emoji: '👤', label: user.role, desc: 'Explore the platform and get started.' };

    return sendEmail({
        to: user.email,
        subject: `🎉 Welcome to ${appName}, ${user.firstName}!`,
        html: `
            <!-- Greeting -->
            <h2 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#000;">Hey ${user.firstName}! 👋</h2>
            <p style="margin:0 0 24px;color:#555;font-size:15px;">We're so excited to have you join <strong>${appName}</strong> — Nigeria's most trusted, verified apartment rental platform.</p>

            <!-- Role Banner -->
            <div style="background:linear-gradient(135deg,#000 0%,#1a1a1a 100%);border-radius:12px;padding:24px 28px;margin-bottom:28px;border-left:4px solid #FDA829;">
                <p style="margin:0 0 4px;font-size:22px;">${role.emoji}</p>
                <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#FDA829;">Your Role: ${role.label}</p>
                <p style="margin:0;font-size:13px;color:#bbb;">${role.desc}</p>
            </div>

            <!-- What Renta Guarantees -->
            <p style="margin:0 0 16px;font-weight:700;font-size:15px;color:#000;">What makes ${appName} different? ✨</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
                        <span style="font-size:18px;">✅</span>
                        <strong style="margin-left:10px;color:#000;">Every property is physically verified</strong>
                        <p style="margin:4px 0 0 34px;color:#666;font-size:13px;">No fake listings. No surprises. Our scouts inspect every home before it goes live.</p>
                    </td>
                </tr>
                <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
                        <span style="font-size:18px;">🔒</span>
                        <strong style="margin-left:10px;color:#000;">Secure platform payments</strong>
                        <p style="margin:4px 0 0 34px;color:#666;font-size:13px;">Payments are processed through Renta with verified listings, payment records, and support for access issues.</p>
                    </td>
                </tr>
                <tr>
                    <td style="padding:10px 0;">
                        <span style="font-size:18px;">🚫</span>
                        <strong style="margin-left:10px;color:#000;">Zero hidden fees</strong>
                        <p style="margin:4px 0 0 34px;color:#666;font-size:13px;">No agency fees. No development levies. Just rent + a flat 10% service fee. That's it.</p>
                    </td>
                </tr>
            </table>

            <!-- CTA Button -->
            <div style="text-align:center;margin:32px 0 24px;">
                <a href="${appUrl}/dashboard"
                   style="display:inline-block;background:#FDA829;color:#000;font-weight:700;font-size:15px;padding:14px 40px;border-radius:50px;text-decoration:none;letter-spacing:0.2px;">
                    Go to My Dashboard →
                </a>
            </div>

            <!-- Support -->
            <p style="margin:0;text-align:center;font-size:13px;color:#999;">
                Need help getting started? Reply to this email or chat with us at<br>
                <a href="mailto:hello@userenta.com" style="color:#FDA829;font-weight:600;">hello@userenta.com</a>
            </p>
        `,
    });
}

/**
 * 💳 Payment Confirmed — tenant paid, funds in escrow
 */
export async function sendPaymentConfirmation({ tenant, property, rental }) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://userenta.com';
    const isDirectSplit = rental.paymentMode === 'DIRECT_SPLIT';
    const statusCopy = isDirectSplit
        ? `Your payment for <strong>${property.title}</strong> has been received. Paystack split settlement has been initiated for the landlord and eligible commission recipients.`
        : `Your payment for <strong>${property.title}</strong> has been received and is now recorded successfully on Renta.`;
    const assuranceCopy = isDirectSplit
        ? `<strong>Payment settlement is processing.</strong> Renta has recorded the transaction and will support you if there is any issue with access or move-in.`
        : `<strong>Your payment is recorded.</strong> If anything goes wrong with access or move-in, contact Renta support immediately and we will help review the transaction.`;

    return sendEmail({
        to: tenant.email,
        subject: `Payment Confirmed - ${property.title}`,
        html: `
            <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#000;">Payment Received</h2>
            <p style="margin:0 0 24px;color:#555;">${statusCopy}</p>

            <div style="background:#f8f8f8;border-radius:12px;padding:24px;margin-bottom:24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding:8px 0;color:#777;border-bottom:1px solid #eee;">Rent Amount</td>
                        <td style="padding:8px 0;text-align:right;font-weight:600;border-bottom:1px solid #eee;">NGN ${Number(rental.rentAmount).toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0;color:#777;border-bottom:1px solid #eee;">Service Fee (10%)</td>
                        <td style="padding:8px 0;text-align:right;font-weight:600;border-bottom:1px solid #eee;">NGN ${Number(rental.serviceFee).toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td style="padding:12px 0 0;font-weight:700;font-size:16px;">Total Paid</td>
                        <td style="padding:12px 0 0;text-align:right;font-weight:800;font-size:16px;color:#FDA829;">NGN ${Number(rental.totalPaid).toLocaleString()}</td>
                    </tr>
                </table>
            </div>

            <div style="background:#fff7e6;border:1px solid #FDA829;border-radius:12px;padding:18px 22px;margin-bottom:24px;">
                <p style="margin:0;font-size:14px;color:#7a4a00;">${assuranceCopy}</p>
            </div>

            <div style="text-align:center;">
                <a href="${appUrl}/tenant/rentals" style="display:inline-block;background:#000;color:#FDA829;font-weight:700;padding:13px 36px;border-radius:50px;text-decoration:none;">
                    View My Rental
                </a>
            </div>
        `,
    });
}

/**
 * Funds released - landlord funds sent
 */
export async function sendEscrowReleaseEmail({ landlord, property, rental }) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://userenta.com';
    return sendEmail({
        to: landlord.email,
        subject: `💰 Funds Released — ${property.title}`,
        html: `
            <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#000;">Great news! 💸</h2>
            <p style="margin:0 0 24px;color:#555;">Your tenant has confirmed access to <strong>${property.title}</strong>. Your payment has been released to your Renta wallet.</p>

            <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:20px 24px;margin-bottom:24px;text-align:center;">
                <p style="margin:0 0 4px;font-size:13px;color:#166534;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Amount Released</p>
                <p style="margin:0;font-size:36px;font-weight:800;color:#15803d;">₦${Number(rental.rentAmount).toLocaleString()}</p>
            </div>

            <div style="text-align:center;">
                <a href="${appUrl}/wallet" style="display:inline-block;background:#000;color:#FDA829;font-weight:700;padding:13px 36px;border-radius:50px;text-decoration:none;">
                    View My Wallet →
                </a>
            </div>
        `,
    });
}

/**
 * ✅ Property Verified
 */
export async function sendPropertyVerifiedEmail({ landlord, property }) {
    const appName = await getSetting('NEXT_PUBLIC_APP_NAME') || 'Renta';
    const appUrl  = process.env.NEXT_PUBLIC_APP_URL || 'https://userenta.com';
    return sendEmail({
        to: landlord.email,
        subject: `✅ Property Verified — ${property.title}`,
        html: `
            <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#000;">Your listing is live! 🚀</h2>
            <p style="margin:0 0 24px;color:#555;">Our team has verified <strong>${property.title}</strong>. It's now visible to thousands of tenants on ${appName}.</p>

            <div style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:8px;padding:16px 20px;margin-bottom:28px;">
                <p style="margin:0;color:#166534;font-weight:600;">✅ Verification complete — Your property is now publicly listed.</p>
            </div>

            <div style="text-align:center;">
                <a href="${appUrl}/landlord/properties" style="display:inline-block;background:#FDA829;color:#000;font-weight:700;padding:13px 36px;border-radius:50px;text-decoration:none;">
                    View My Listing →
                </a>
            </div>
        `,
    });
}

/**
 * ❌ Property Rejected
 */
export async function sendPropertyRejectedEmail(landlord, property, reason) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://userenta.com';
    return sendEmail({
        to: landlord.email,
        subject: `⚠️ Action Required — ${property.title}`,
        html: `
            <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#000;">Listing Update Needed 📋</h2>
            <p style="margin:0 0 24px;color:#555;">Our team reviewed <strong>${property.title}</strong> and it needs some changes before it can go live.</p>

            <div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0 0 6px;font-weight:700;color:#9a3412;">📌 Reviewer Feedback:</p>
                <p style="margin:0;color:#c2410c;">${reason}</p>
            </div>

            <p style="color:#555;margin-bottom:28px;">Please update your listing and resubmit. Our team will re-verify within 24 hours.</p>

            <div style="text-align:center;">
                <a href="${appUrl}/landlord/properties" style="display:inline-block;background:#000;color:#FDA829;font-weight:700;padding:13px 36px;border-radius:50px;text-decoration:none;">
                    Update My Listing →
                </a>
            </div>
        `,
    });
}

/**
 * Identity verification status
 */
export async function sendNinStatusEmail(user, status, reason = '') {
    const appUrl      = process.env.NEXT_PUBLIC_APP_URL || 'https://userenta.com';
    const isApproved  = status === 'VERIFIED';
    return sendEmail({
        to: user.email,
        subject: `${isApproved ? '✅' : '❌'} Identity Verification ${isApproved ? 'Approved' : 'Failed'}`,
        html: `
            <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#000;">
                ${isApproved ? '🎉 Verification Successful!' : '❌ Verification Failed'}
            </h2>
            <p style="margin:0 0 24px;color:#555;">
                ${isApproved
                    ? `Congratulations, <strong>${user.firstName}</strong>! Your identity has been verified. You now have full access to all Renta features.`
                    : `Hello <strong>${user.firstName}</strong>, unfortunately your identity verification could not be completed at this time.`
                }
            </p>

            ${!isApproved && reason ? `
            <div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
                <p style="margin:0 0 4px;font-weight:700;color:#991b1b;">Reason:</p>
                <p style="margin:0;color:#b91c1c;">${reason}</p>
            </div>` : ''}

            <div style="text-align:center;">
                <a href="${appUrl}/profile" style="display:inline-block;background:${isApproved ? '#FDA829' : '#000'};color:${isApproved ? '#000' : '#FDA829'};font-weight:700;padding:13px 36px;border-radius:50px;text-decoration:none;">
                    ${isApproved ? 'Go to My Profile →' : 'Retry Verification →'}
                </a>
            </div>
        `,
    });
}

/**
 * 📅 Inspection Booked — notify tenant & landlord
 */
export async function sendInspectionBookedEmail({ tenant, landlord, property, date, time }) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://userenta.com';

    await sendEmail({
        to: tenant.email,
        subject: `📅 Inspection Confirmed — ${property.title}`,
        html: `
            <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#000;">Inspection Booked! 🗓️</h2>
            <p style="margin:0 0 24px;color:#555;">You've successfully scheduled an inspection for <strong>${property.title}</strong>.</p>

            <div style="background:#f8f8f8;border-radius:12px;padding:24px;margin-bottom:24px;">
                <p style="margin:0 0 10px;"><span style="font-size:18px;">📍</span> <strong>${property.address}</strong></p>
                <p style="margin:0 0 10px;"><span style="font-size:18px;">📆</span> <strong>${date}</strong></p>
                <p style="margin:0;"><span style="font-size:18px;">🕐</span> <strong>${time}</strong></p>
            </div>

            <div style="background:#fff7e6;border:1px solid #FDA829;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
                <p style="margin:0;font-size:13px;color:#7a4a00;">⚠️ Please be on time. To cancel or reschedule, visit your dashboard before the appointment.</p>
            </div>

            <div style="text-align:center;">
                <a href="${appUrl}/tenant/inspections" style="display:inline-block;background:#FDA829;color:#000;font-weight:700;padding:13px 36px;border-radius:50px;text-decoration:none;">
                    View My Inspections →
                </a>
            </div>
        `,
    });

    return sendEmail({
        to: landlord.email,
        subject: `🔔 New Inspection Booking — ${property.title}`,
        html: `
            <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#000;">New Inspection Booking! 🔔</h2>
            <p style="margin:0 0 24px;color:#555;">A potential tenant has booked an inspection for your property <strong>${property.title}</strong>.</p>

            <div style="background:#f8f8f8;border-radius:12px;padding:24px;margin-bottom:24px;">
                <p style="margin:0 0 10px;"><span style="font-size:18px;">👤</span> <strong>${tenant.firstName} ${tenant.lastName}</strong></p>
                <p style="margin:0 0 10px;"><span style="font-size:18px;">📆</span> <strong>${date}</strong></p>
                <p style="margin:0;"><span style="font-size:18px;">🕐</span> <strong>${time}</strong></p>
            </div>

            <div style="text-align:center;">
                <a href="${appUrl}/landlord/properties" style="display:inline-block;background:#000;color:#FDA829;font-weight:700;padding:13px 36px;border-radius:50px;text-decoration:none;">
                    View My Properties →
                </a>
            </div>
        `,
    });
}

/**
 * 🔧 Maintenance Update
 */
export async function sendMaintenanceUpdateEmail({ tenant, request, newStatus }) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://userenta.com';
    const statusConfig = {
        IN_PROGRESS: { color: '#3b82f6', bg: '#eff6ff', emoji: '🔧', label: 'In Progress' },
        RESOLVED:    { color: '#22c55e', bg: '#f0fdf4', emoji: '✅', label: 'Resolved' },
    };
    const s = statusConfig[newStatus] || { color: '#000', bg: '#f8f8f8', emoji: '📋', label: newStatus };

    return sendEmail({
        to: tenant.email,
        subject: `${s.emoji} Maintenance Update — ${request.title}`,
        html: `
            <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#000;">Repair Update ${s.emoji}</h2>
            <p style="margin:0 0 24px;color:#555;">The status of your maintenance request <strong>"${request.title}"</strong> has been updated.</p>

            <div style="background:${s.bg};border-left:4px solid ${s.color};border-radius:8px;padding:16px 20px;margin-bottom:28px;">
                <p style="margin:0;font-weight:700;color:${s.color};font-size:15px;">${s.emoji} New Status: ${s.label}</p>
            </div>

            <div style="text-align:center;">
                <a href="${appUrl}/tenant/maintenance" style="display:inline-block;background:#FDA829;color:#000;font-weight:700;padding:13px 36px;border-radius:50px;text-decoration:none;">
                    View Request →
                </a>
            </div>
        `,
    });
}

/**
 * 💰 Commission Earned — for scouts & affiliates
 */
export async function sendCommissionEarnedEmail(user, amount, type) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://userenta.com';
    return sendEmail({
        to: user.email,
        subject: `💰 You've Earned ₦${Number(amount).toLocaleString()} Commission!`,
        html: `
            <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#000;">Nice work, ${user.firstName}! 🎉</h2>
            <p style="margin:0 0 24px;color:#555;">You just earned a <strong>${type}</strong> commission from a successful rental.</p>

            <div style="background:linear-gradient(135deg,#000 0%,#1a1a1a 100%);border-radius:12px;padding:28px;margin-bottom:24px;text-align:center;">
                <p style="margin:0 0 6px;font-size:13px;color:#aaa;text-transform:uppercase;letter-spacing:1px;">Commission Earned</p>
                <p style="margin:0;font-size:42px;font-weight:800;color:#FDA829;">₦${Number(amount).toLocaleString()}</p>
            </div>

            <p style="color:#555;margin-bottom:28px;">The funds have been credited to your Renta wallet and are available for withdrawal.</p>

            <div style="text-align:center;">
                <a href="${appUrl}/wallet" style="display:inline-block;background:#FDA829;color:#000;font-weight:700;padding:13px 36px;border-radius:50px;text-decoration:none;">
                    View My Wallet →
                </a>
            </div>
        `,
    });
}

/**
 * 💬 New Message Alert
 */
export async function sendNewMessageEmail(receiver, senderName) {
    const appName = await getSetting('NEXT_PUBLIC_APP_NAME') || 'Renta';
    const appUrl  = process.env.NEXT_PUBLIC_APP_URL || 'https://userenta.com';
    return sendEmail({
        to: receiver.email,
        subject: `💬 New Message from ${senderName}`,
        html: `
            <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#000;">You've got a message! 💬</h2>
            <p style="margin:0 0 24px;color:#555;"><strong>${senderName}</strong> sent you a message about your rental on ${appName}. Don't keep them waiting!</p>

            <div style="text-align:center;">
                <a href="${appUrl}/messages" style="display:inline-block;background:#FDA829;color:#000;font-weight:700;padding:13px 36px;border-radius:50px;text-decoration:none;">
                    Reply Now →
                </a>
            </div>
        `,
    });
}

export default sendEmail;
