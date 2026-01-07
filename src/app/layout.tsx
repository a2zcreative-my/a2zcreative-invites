import type { Metadata } from 'next';
import { Cormorant_Garamond, Great_Vibes } from 'next/font/google';
import { inter, sora, poppins } from './fonts';
import './globals.css';

// Keep existing display fonts for invitations
const cormorantGaramond = Cormorant_Garamond({
    subsets: ['latin'],
    variable: '--font-serif',
    weight: ['400', '600', '700'],
    display: 'swap',
});

const greatVibes = Great_Vibes({
    subsets: ['latin'],
    variable: '--font-script',
    weight: ['400'],
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'A2Z Creative | Digital Invitations & Event Management',
    description: 'Create stunning digital invitations for weddings, corporate events, and family gatherings. RSVP management, QR check-in, and real-time analytics.',
    icons: {
        icon: '/favicon.png',
        shortcut: '/favicon.png',
        apple: '/favicon.png',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ms" className={`${inter.variable} ${sora.variable} ${poppins.variable} ${cormorantGaramond.variable} ${greatVibes.variable}`}>
            <body className={inter.className}>{children}</body>
        </html>
    );
}
