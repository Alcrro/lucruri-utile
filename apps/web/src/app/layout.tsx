import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

// latin-ext e obligatoriu pentru ă, â, î, ș, ț.
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin', 'latin-ext'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin', 'latin-ext'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://lucruri-utile.ro'),
  title: {
    default: 'lucruri-utile.ro',
    template: '%s · lucruri-utile.ro',
  },
  description:
    'Accesorii cu informații de compatibilitate: află ce merge cu dispozitivul tău, înainte să cumperi.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ro" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
