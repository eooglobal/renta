/**
 * Renta Friendly Error Message Resolver
 * Maps raw API error strings / HTTP statuses to user-friendly messages
 * with actionable guidance.
 */

/**
 * @typedef {{ title: string, message: string, action?: { label: string, href: string } }} FriendlyError
 */

/** Known API error string patterns → friendly message */
const ERROR_MAP = [
    // ── Auth ──────────────────────────────────────────────────────────────────
    {
        match: /invalid.*credentials|invalid.*password|incorrect.*password/i,
        title: 'Incorrect Password',
        message: 'The email or password you entered is wrong. Please double-check and try again.',
    },
    {
        match: /user.*not.*found|no.*account.*found/i,
        title: 'Account Not Found',
        message: 'We couldn\'t find an account with that email address. Did you mean to register?',
        action: { label: 'Create an account', href: '/register' },
    },
    {
        match: /email.*already.*exists|already.*registered|duplicate.*email/i,
        title: 'Email Already Registered',
        message: 'That email address is already linked to an account. Try logging in instead.',
        action: { label: 'Log in', href: '/login' },
    },
    {
        match: /phone.*already.*in.*use|duplicate.*phone/i,
        title: 'Phone Number Already Used',
        message: 'That phone number is already linked to another account. Please use a different number.',
    },
    {
        match: /passwords.*do.*not.*match/i,
        title: 'Passwords Don\'t Match',
        message: 'Your password and confirmation password are different. Please re-enter them.',
    },
    {
        match: /password.*at.*least.*8|password.*too.*short/i,
        title: 'Password Too Short',
        message: 'Your password must be at least 8 characters long. Please choose a stronger one.',
    },

    // ── Authorization ─────────────────────────────────────────────────────────
    {
        match: /unauthorized|not.*authenticated|please.*log.*in/i,
        title: 'Session Expired',
        message: 'Your session has ended. Please log in again to continue.',
        action: { label: 'Log in', href: '/login' },
    },
    {
        match: /forbidden|access.*denied|not.*allowed/i,
        title: 'Access Denied',
        message: 'You don\'t have permission to perform this action. If you think this is a mistake, contact support.',
    },

    // ── Bank / Payments ───────────────────────────────────────────────────────
    {
        match: /bank.*account.*name.*does.*not.*match/i,
        title: 'Bank Account Name Mismatch',
        message: 'The name on the bank account doesn\'t match your registered name on Renta. Please use an account in your own name.',
    },
    {
        match: /could.*not.*verify.*bank|bank.*verification.*failed/i,
        title: 'Bank Verification Failed',
        message: 'We couldn\'t verify that bank account. Please check the account number and bank, then try again.',
    },
    {
        match: /account.*number.*must.*be.*10/i,
        title: 'Invalid Account Number',
        message: 'A valid Nigerian bank account number must be exactly 10 digits.',
    },
    {
        match: /insufficient.*balance|not.*enough.*funds/i,
        title: 'Insufficient Balance',
        message: 'Your wallet balance is too low for this withdrawal. Please check your available balance.',
    },
    {
        match: /minimum.*withdrawal/i,
        title: 'Below Minimum Withdrawal',
        message: 'The amount is below the minimum withdrawal limit. Please enter a higher amount.',
    },
    {
        match: /invalid.*signature|signature.*validation.*failed/i,
        title: 'Payment Verification Failed',
        message: 'We could not verify this payment. Please contact support if funds were deducted from your account.',
        action: { label: 'Contact Support', href: '/contact' },
    },

    // ── Identity Verification ─────────────────────────────────────────────────
    {
        match: /nin.*already.*verified|already.*verified/i,
        title: 'Already Verified',
        message: 'Your identity has already been verified. No further action is needed.',
    },
    {
        match: /verification.*pending/i,
        title: 'Verification In Progress',
        message: 'Your identity verification is currently being reviewed. We\'ll notify you once it\'s complete.',
    },

    // ── Property / Rentals ────────────────────────────────────────────────────
    {
        match: /property.*not.*found/i,
        title: 'Property Not Found',
        message: 'That property no longer exists or has been removed from the platform.',
        action: { label: 'Browse Listings', href: '/listing' },
    },
    {
        match: /rental.*not.*found/i,
        title: 'Rental Not Found',
        message: 'We couldn\'t find that rental. It may have been cancelled.',
    },
    {
        match: /already.*active.*rental|existing.*rental/i,
        title: 'Active Rental Exists',
        message: 'You already have an active rental agreement for this property.',
    },
    {
        match: /agreement.*not.*signed/i,
        title: 'Agreement Not Signed',
        message: 'You need to sign the rental agreement before you can download it.',
    },

    // ── Fraud / Security ──────────────────────────────────────────────────────
    {
        match: /suspicious.*activity|account.*suspended/i,
        title: 'Account Temporarily Suspended',
        message: 'Suspicious activity was detected on your account. Please contact our support team to resolve this.',
        action: { label: 'Contact Support', href: '/contact' },
    },

    // ── File / Upload ─────────────────────────────────────────────────────────
    {
        match: /file.*too.*large|exceeds.*maximum.*size/i,
        title: 'File Too Large',
        message: 'The file you selected is too large. Please compress it or choose a smaller file.',
    },
    {
        match: /invalid.*file.*type|unsupported.*format/i,
        title: 'Invalid File Type',
        message: 'That file format is not supported. Please use JPG, PNG, or PDF.',
    },

    // ── Network / Server ──────────────────────────────────────────────────────
    {
        match: /failed.*to.*fetch|network.*error|fetch.*failed/i,
        title: 'Connection Problem',
        message: 'We\'re having trouble reaching our servers. Please check your internet connection and try again.',
    },
    {
        match: /internal.*server.*error|something.*went.*wrong/i,
        title: 'Something Went Wrong',
        message: 'An unexpected error occurred on our end. Please try again in a moment. If the problem persists, contact support.',
        action: { label: 'Contact Support', href: '/contact' },
    },
    {
        match: /smtp.*credentials|email.*not.*configured/i,
        title: 'Email Service Unavailable',
        message: 'Our email service is temporarily unavailable. Your action was saved but you may not receive a confirmation email.',
    },
];

/**
 * Given a raw error message string or Error object, return a user-friendly
 * { title, message, action? } object suitable for displaying in a Toast.
 *
 * @param {string|Error|unknown} err
 * @param {FriendlyError} [fallback]  - Optional custom fallback
 * @returns {FriendlyError}
 */
export function friendlyError(err, fallback) {
    const raw = err instanceof Error ? err.message : (typeof err === 'string' ? err : String(err ?? ''));

    for (const entry of ERROR_MAP) {
        if (entry.match.test(raw)) {
            return {
                title:   entry.title,
                message: entry.message,
                action:  entry.action,
            };
        }
    }

    // If the error is something specific from the API and short enough, show it
    if (raw && raw.length < 120 && !raw.includes('undefined') && !raw.includes('null')) {
        return {
            title:   fallback?.title || 'Action Failed',
            message: raw,
            action:  fallback?.action,
        };
    }

    // Absolute fallback
    return fallback || {
        title:   'Something Went Wrong',
        message: 'An unexpected error occurred. Please try again, or contact support if the problem continues.',
        action:  { label: 'Contact Support', href: '/contact' },
    };
}

/**
 * Shorthand: extract error string from a fetch response JSON body.
 * Usage: const err = await apiError(res); toast.error(...friendlyError(err));
 *
 * @param {Response} res
 * @returns {Promise<string>}
 */
export async function apiError(res) {
    try {
        const data = await res.json();
        return data?.error || data?.message || `Server error (${res.status})`;
    } catch {
        return `Server error (${res.status})`;
    }
}
