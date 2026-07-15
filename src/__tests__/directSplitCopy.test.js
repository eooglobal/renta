import fs from 'fs';
import path from 'path';

const PUBLIC_COPY_FILES = [
  'src/app/page.js',
  'src/app/layout.js',
  'src/app/listing/[id]/page.js',
  'src/app/about/page.js',
  'src/app/terms/page.js',
  'src/app/privacy/page.js',
  'src/app/refund-policy/page.js',
  'src/app/dispute-resolution/page.js',
  'src/app/contact/page.js',
  'src/app/(auth)/register/page.js',
  'src/app/(auth)/login/page.js',
  'src/app/(dashboard)/tenant/listing/[id]/page.js',
  'src/app/(dashboard)/tenant/payments/verify/page.js',
  'src/app/(dashboard)/tenant/rentals/page.js',
  'src/app/(dashboard)/landlord/payments/page.js',
  'src/components/SupportWidget.js',
  'src/components/RentalAgreementModal.js',
  'src/lib/email.js',
  'src/app/api/support/chat/route.js',
  'src/app/api/tenant/rentals/[id]/receipt/route.js',
  'src/app/api/tenant/rentals/[id]/contract/route.js',
];

const FORBIDDEN_COPY = [
  /escrow protection/i,
  /escrow protected/i,
  /100% escrow/i,
  /Renta Escrow/i,
  /held securely in escrow/i,
  /funds are held (?:securely )?in escrow/i,
  /money stays in escrow/i,
  /held until you confirm/i,
  /landlord doesn't receive a kobo until you move in/i,
  /provide an escrow service/i,
  /funds are held by Renta/i,
  /escrow-backed payments/i,
];

describe('direct split public copy', () => {
  it('does not promise escrow holding on public and tenant-facing surfaces', () => {
    const offenders = [];

    for (const relativePath of PUBLIC_COPY_FILES) {
      const fullPath = path.join(process.cwd(), relativePath);
      const source = fs.readFileSync(fullPath, 'utf8');

      for (const pattern of FORBIDDEN_COPY) {
        if (pattern.test(source)) {
          offenders.push(`${relativePath}: ${pattern}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});