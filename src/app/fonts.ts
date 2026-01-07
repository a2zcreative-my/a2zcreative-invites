import { Inter, Sora, Poppins } from 'next/font/google';

export const inter = Inter({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-body',
    display: 'swap',
});

export const sora = Sora({
    subsets: ['latin'],
    weight: ['600', '700', '800'],
    variable: '--font-display',
    display: 'swap',
});

// Poppins for branding text only - geometric, modern, creative
export const poppins = Poppins({
    subsets: ['latin'],
    weight: ['600', '700', '800'],
    variable: '--font-brand',
    display: 'swap',
});
