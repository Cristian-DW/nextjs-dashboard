import { Inter, Playfair_Display } from 'next/font/google';

export const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
export const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-playfair',
});
