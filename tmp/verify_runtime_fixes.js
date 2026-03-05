const { checkRapidPropertyCreation } = require('../src/lib/fraudRules');
const { sendEmail } = require('../src/lib/email');

async function testFixes() {
    console.log('--- STARTING VERIFICATION TESTS ---');

    // 1. Test Prisma NaN Fix
    console.log('\n1. Testing Prisma NaN Fix...');
    try {
        const result = await checkRapidPropertyCreation('abc'); // Should not crash
        console.log('Result for invalid ID:', result === false ? 'PASS (Safely handled)' : 'FAIL');
    } catch (err) {
        console.error('FAIL: checkRapidPropertyCreation crashed!', err);
    }

    // 2. Test Brevo logic presence
    console.log('\n2. Testing Brevo logic (Local check)...');
    const fs = require('fs');
    const path = require('path');
    const emailJsPath = path.join(__dirname, '..', 'src', 'lib', 'email.js');
    const content = fs.readFileSync(emailJsPath, 'utf8');
    if (content.includes('api.brevo.com') && content.includes('api-key')) {
        console.log('PASS: Brevo API endpoint and headers are present.');
    } else {
        console.log('FAIL: Brevo logic not found in email.js.');
    }

    console.log('\n--- VERIFICATION COMPLETED ---');
}

testFixes().catch(console.error);
