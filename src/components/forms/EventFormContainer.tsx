'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import LandingBackground from '@/components/landing/LandingBackground';
import Navbar from '@/components/Navbar';
import { WeddingForm, BirthdayForm, CorporateForm, GenericForm } from '@/components/forms/EventForms';
import StepIndicator from '@/components/ui/StepIndicator';

export default function EventFormContainer() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const type = params.type as string;
    const slug = searchParams.get('slug');
    const selectedPackage = searchParams.get('package') || 'free';

    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<any>({});

    // Fetch existing event data on mount to persist form data when navigating back
    useEffect(() => {
        const fetchEventData = async () => {
            if (!slug) {
                setFetchingData(false);
                return;
            }

            try {
                const response = await fetch(`/api/events/get-details?slug=${slug}`, {
                    credentials: 'include'
                });

                if (response.ok) {
                    const data = await response.json() as any;
                    if (data.success && data.eventDetails) {
                        setFormData(data.eventDetails);
                    }
                }
            } catch (err) {
                console.error('Error fetching event data:', err);
            } finally {
                setFetchingData(false);
            }
        };

        fetchEventData();
    }, [slug]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/events/update-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slug,
                    type,
                    eventDetails: formData
                }),
                credentials: 'include'
            });

            const data = await response.json() as any;

            if (response.ok && data.success) {
                // Navigate to next step: Agenda (Aturcara)
                router.push(`/create/agenda/${type}?slug=${slug}&package=${selectedPackage}`);
            } else {
                throw new Error(data.error || 'Gagal menyimpan butiran majlis');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Ralat berlaku. Sila cuba lagi.');
            setLoading(false);
        }
    };

    const renderForm = () => {
        const props = {
            data: formData,
            onChange: handleInputChange,
            onSubmit: handleSubmit,
            loading: loading
        };

        switch (type) {
            case 'wedding':
                return <WeddingForm {...props} />;
            case 'birthday':
                return <BirthdayForm {...props} />;
            case 'business':
            case 'corporate':
                return <CorporateForm {...props} />;
            default:
                return <GenericForm {...props} />;
        }
    };

    if (!slug) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Sesi tidak sah</h1>
                    <Link href={`/create?package=${selectedPackage}`} className="text-[var(--brand-gold)] hover:underline">Kembali ke pemilihan majlis</Link>
                </div>
            </div>
        );
    }

    return (
        <LandingBackground>
            <div className="min-h-screen pb-20">
                <Navbar />

                <div className="container mx-auto px-4" style={{ paddingTop: '120px' }}>
                    <div className="max-w-2xl mx-auto mb-8">
                        <Link
                            href={`/create?package=${selectedPackage}`}
                            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
                        >
                            <ArrowLeft size={18} />
                            Kembali
                        </Link>

                        <StepIndicator currentStep={2} eventType={type} />

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-center mb-6">
                                {error}
                            </div>
                        )}
                    </div>

                    {fetchingData ? (
                        <div className="max-w-2xl mx-auto flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-[var(--brand-gold)]/30 border-t-[var(--brand-gold)] rounded-full animate-spin" />
                        </div>
                    ) : (
                        renderForm()
                    )}
                </div>
            </div>
        </LandingBackground>
    );
}
