import {Roboto, Audiowide} from 'next/font/google';

export const roboto = Roboto({
   subsets: ['latin'],
   weight: ['400', '500', '700'],
   variable: '--font-roboto',
})

export const audiowide = Audiowide({
   subsets: ['latin'],
   weight: '400',
   variable: '--font-audiowide',
})