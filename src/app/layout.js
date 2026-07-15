import { League_Spartan, DM_Sans } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

import ReferralTracker from '@/components/ReferralTracker';
import SupportWidget from '@/components/SupportWidget';
import GoogleMapsLoader from '@/components/GoogleMapsLoader';

const spartan = League_Spartan({
  subsets: ['latin'],
  variable: '--font-heading',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
});

import { getSetting } from '@/lib/settings';

export const metadata = {
  title: 'Renta — Verified Apartment Rentals in Ilorin',
  description: 'Renta is a verified apartment rental marketplace in Ilorin, Nigeria. Rent verified apartments at landlord-approved prices with transparent 10% service fee and secure Paystack-backed payments.',
  keywords: 'rent apartment Ilorin, student housing Ilorin, verified apartments Nigeria, Tanke apartments, Basin apartments, Malete apartments',
  metadataBase: new URL('https://userenta.com'),
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default async function RootLayout({ children }) {
  const googleMapsApiKey = await getSetting('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');

  return (
    <html lang="en" suppressHydrationWarning className={`${spartan.variable} ${dmSans.variable}`}>
      <body className="antialiased" suppressHydrationWarning>
        <Providers>
          <ReferralTracker />
          {children}
          <SupportWidget />
          <GoogleMapsLoader apiKey={googleMapsApiKey} />
        </Providers>
      </body>
    </html>
  );
}
