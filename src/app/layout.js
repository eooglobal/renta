import { League_Spartan, DM_Sans } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

import ReferralTracker from '@/components/ReferralTracker';

const spartan = League_Spartan({
  subsets: ['latin'],
  variable: '--font-heading',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata = {
  title: 'Renta — Verified Apartment Rentals in Ilorin',
  description: 'Renta is a verified apartment rental marketplace in Ilorin, Nigeria. Rent verified apartments at landlord-approved prices with transparent 10% service fee and escrow-backed payments.',
  keywords: 'rent apartment Ilorin, student housing Ilorin, verified apartments Nigeria, Tanke apartments, Basin apartments, Malete apartments',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${spartan.variable} ${dmSans.variable}`}>
      <body suppressHydrationWarning>
        <Providers>
          <ReferralTracker />
          {children}
        </Providers>
      </body>
    </html>
  );
}

