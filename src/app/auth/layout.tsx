import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Log Masuk | A2Z Creative',
    description: 'Log masuk ke akaun A2Z Creative anda untuk menguruskan jemputan digital.',
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="app-background">
            {children}
        </div>
    );
}
