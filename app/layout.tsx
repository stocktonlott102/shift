import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shift - Coaching Business Management",
  description: "Streamline your coaching business with intelligent scheduling, client management, and revenue tracking.",
  metadataBase: new URL('https://myshift.space'),
  openGraph: {
    title: 'Shift',
    description: 'Streamline your coaching business with intelligent scheduling, client management, and revenue tracking.',
    url: 'https://myshift.space',
    siteName: 'Shift',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Shift - Coaching Business Management',
        type: 'image/svg+xml',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shift',
    description: 'Streamline your coaching business with intelligent scheduling, client management, and revenue tracking.',
    images: ['/og-image.svg'],
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
