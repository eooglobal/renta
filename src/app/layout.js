import { League_Spartan, DM_Sans } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import ReferralTracker from '@/components/ReferralTracker';
import SupportWidget from '@/components/SupportWidget';
import GoogleMapsLoader from '@/components/GoogleMapsLoader';
import GlobalStructuredData from '@/components/GlobalStructuredData';
import { getSetting } from '@/lib/settings';
import { buildPageMetadata } from '@/lib/seo';

const spartan = League_Spartan({
  subsets: ['latin'],
  variable: '--font-heading',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata = {
  ...buildPageMetadata({
    title: 'Renta — Verified Apartment Rentals in Ilorin',
    description: 'Renta is a verified apartment rental marketplace in Ilorin, Nigeria. Rent verified self-contains, flats, and student housing at landlord-approved prices with transparent 10% service fee and secure payments.',
    image: '/og-image.png',
    path: '/',
    keywords: 'rent apartment Ilorin, student housing Ilorin, verified apartments Nigeria, Tanke apartments, Basin apartments, Malete apartments, self contain Ilorin',
  }),
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
      <head>
        <GlobalStructuredData />
      </head>
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
