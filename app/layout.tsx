import { inter, playfair } from './ui/fonts';
import './ui/global.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Deltux Invoicing',
    default: 'Deltux Invoicing Platform',
  },
  description: 'The premium invoicing platform for modern businesses.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>{children}</body>
    </html>
  );
}
