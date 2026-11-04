import type { Metadata } from 'next';
import { PT_Serif, Roboto } from 'next/font/google';
import ClientLayout from './client-layout';
import './globals.css';

// The original site uses Adobe Fonts (Typekit kit xgn2wyi) for "pt-serif" and "origins".
// PT Serif from Google is the fallback if the kit doesn't load on this domain.
const ptSerif = PT_Serif({
  variable: '--font-pt-serif',
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
});

// Angular Material's button/checkbox font on the original site.
const roboto = Roboto({ variable: '--font-roboto', weight: ['500'], subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Valley Oak Winery',
  description: 'Valley Oak Winery and Ubick Vineyards — family-grown wines from Sanger, California.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/xgn2wyi.css" />
      </head>
      <body className={`${ptSerif.variable} ${roboto.variable} antialiased`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
