'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Sparkles, Plus, Trash2, Clock } from 'lucide-react';
import Link from 'next/link';
import LandingBackground from '@/components/landing/LandingBackground';
import Navbar from '@/components/Navbar';
import StepIndicator from '@/components/ui/StepIndicator';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import GlassTimePicker from '@/components/ui/GlassTimePicker';

interface AgendaItem {
    id: string;
    time: string;
    activity: string;
}

// Default itineraries per event type
const DEFAULT_ITINERARIES: Record<string, AgendaItem[]> = {
    wedding: [
        { id: '1', time: '11:00', activity: 'Ketibaan Tetamu' },
        { id: '2', time: '12:00', activity: 'Ketibaan Pengantin' },
        { id: '3', time: '12:30', activity: 'Majlis Bersanding' },
        { id: '4', time: '13:00', activity: 'Makan Beradab' },
        { id: '5', time: '14:30', activity: 'Sesi Fotografi' },
        { id: '6', time: '16:00', activity: 'Bersurai' },
    ],
    birthday: [
        { id: '1', time: '14:00', activity: 'Ketibaan Tetamu' },
        { id: '2', time: '14:30', activity: 'Permainan & Aktiviti' },
        { id: '3', time: '15:30', activity: 'Potong Kek & Nyanyian' },
        { id: '4', time: '16:00', activity: 'Makan & Minum' },
        { id: '5', time: '17:00', activity: 'Pembukaan Hadiah' },
        { id: '6', time: '17:30', activity: 'Bersurai' },
    ],
    business: [
        { id: '1', time: '08:00', activity: 'Pendaftaran' },
        { id: '2', time: '08:30', activity: 'Ucapan Aluan' },
        { id: '3', time: '09:00', activity: 'Sesi Pembentangan' },
        { id: '4', time: '10:30', activity: 'Rehat Kopi' },
        { id: '5', time: '11:00', activity: 'Sesi Perbincangan' },
        { id: '6', time: '12:30', activity: 'Makan Tengahari' },
        { id: '7', time: '14:00', activity: 'Penutup' },
    ],
    corporate: [
        { id: '1', time: '18:00', activity: 'Ketibaan Tetamu' },
        { id: '2', time: '18:30', activity: 'Koktel & Networking' },
        { id: '3', time: '19:00', activity: 'Ucapan Pengerusi' },
        { id: '4', time: '19:30', activity: 'Makan Malam' },
        { id: '5', time: '21:00', activity: 'Majlis Anugerah' },
        { id: '6', time: '22:00', activity: 'Bersurai' },
    ],
    family: [
        { id: '1', time: '10:00', activity: 'Ketibaan Keluarga' },
        { id: '2', time: '11:00', activity: 'Aktiviti Bersama' },
        { id: '3', time: '12:30', activity: 'Makan Tengahari' },
        { id: '4', time: '14:00', activity: 'Sesi Fotografi' },
        { id: '5', time: '15:00', activity: 'Bersurai' },
    ],
    community: [
        { id: '1', time: '07:00', activity: 'Pendaftaran & Sarapan' },
        { id: '2', time: '08:00', activity: 'Taklimat' },
        { id: '3', time: '08:30', activity: 'Aktiviti Utama' },
        { id: '4', time: '11:00', activity: 'Rehat' },
        { id: '5', time: '12:00', activity: 'Penutup & Bersurai' },
    ],
};

export default function AgendaFormContainer() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const type = params.type as string;
    const slug = searchParams.get('slug');
    const selectedPackage = searchParams.get('package') || 'free';

    // State for loading signals
    const [fetchingData, setFetchingData] = useState(true);
    const [loading, setLoading] = useState(false);

    // State for agenda items
    const [items, setItems] = useState<AgendaItem[]>([]);

    // Fetch existing data
    useEffect(() => {
        const fetchEventData = async () => {
            if (!slug) {
                setFetchingData(false);
                return;
            }

            try {
                const response = await fetch(`/api/events/get-details?slug=${slug}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.eventDetails) {
                        // If we have saved schedule, use it. Otherwise use defaults.
                        if (data.eventDetails.schedule && Array.isArray(data.eventDetails.schedule) && data.eventDetails.schedule.length > 0) {
                            setItems(data.eventDetails.schedule);
                        } else {
                            // Only set defaults if no data exists
                            setItems(DEFAULT_ITINERARIES[type] || DEFAULT_ITINERARIES.wedding);
                        }
                    }
                }
            } catch (err) {
                console.error('Error fetching event data:', err);
                // Fallback to defaults on error
                setItems(DEFAULT_ITINERARIES[type] || DEFAULT_ITINERARIES.wedding);
            } finally {
                setFetchingData(false);
            }
        };

        fetchEventData();
    }, [slug, type]);

    const handleItemChange = (id: string, field: 'time' | 'activity', value: string) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const handleAddItem = () => {
        const newItem: AgendaItem = {
            id: Date.now().toString(),
            time: '',
            activity: ''
        };
        setItems([...items, newItem]);
    };

    const handleDeleteItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Optional: filter out empty items? Or keep them to let user decide?
        // Let's filter slightly but keep items if at least one field is filled, or just save all.
        // User might want to save draft. Let's save all for now, maybe filter completely empty ones.
        const itemsToSave = items.filter(item => item.time.trim() !== '' || item.activity.trim() !== '');

        try {
            const response = await fetch('/api/events/update-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slug,
                    type,
                    eventDetails: {
                        schedule: itemsToSave
                    }
                }),
            });

            if (response.ok) {
                router.push(`/create/theme/${type}?slug=${slug}&package=${selectedPackage}`);
            } else {
                console.error('Failed to save details');
                // You might want to show a toast or error message here
            }
        } catch (err) {
            console.error('Error saving details:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!slug) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Sesi tidak sah</h1>
                    <Link href="/create" className="text-[var(--brand-gold)] hover:underline">Kembali ke pemilihan majlis</Link>
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
                            href={`/create/form/${type}?slug=${slug}&package=${selectedPackage}`}
                            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
                        >
                            <ArrowLeft size={18} />
                            Kembali
                        </Link>

                        <StepIndicator currentStep={3} eventType={type} />
                    </div>

                    <div className="max-w-2xl mx-auto">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">Aturcara Majlis</h2>
                            <p className="text-slate-400">Susun atur perjalanan majlis anda.</p>
                        </div>

                        {fetchingData ? (
                            <div className="flex justify-center py-10">
                                <div className="w-8 h-8 border-2 border-[var(--brand-gold)]/30 border-t-[var(--brand-gold)] rounded-full animate-spin" />
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="w-full">
                                <GlassCard variant="deep" className="mb-6">
                                    {/* HTML Table for guaranteed column alignment */}
                                    <table className="w-full border-separate border-spacing-y-3">
                                        <thead>
                                            <tr>
                                                <th className="w-[240px] text-left pb-2 text-sm font-semibold text-slate-300">
                                                    Time
                                                </th>
                                                <th className="text-left pb-2 text-sm font-semibold text-slate-300">
                                                    Aktiviti / Butiran
                                                </th>
                                                <th className="w-[80px] text-center pb-2 text-sm font-semibold text-slate-300">
                                                    Delete
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="w-[240px] pr-3 align-top">
                                                        <GlassTimePicker
                                                            value={item.time}
                                                            onChange={(e) => handleItemChange(item.id, 'time', e.target.value)}
                                                            name={`time-${item.id}`}
                                                            placeholder="--:-- --"
                                                        />
                                                    </td>
                                                    <td className="pr-3 align-top">
                                                        <input
                                                            type="text"
                                                            value={item.activity}
                                                            onChange={(e) => handleItemChange(item.id, 'activity', e.target.value)}
                                                            placeholder="Masukkan aktiviti..."
                                                            className="w-full h-[48px] px-4 py-3 bg-[#020617]/30 backdrop-blur-sm border border-white/10 rounded-xl text-white text-base placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/50 focus:border-transparent transition-all duration-300"
                                                        />
                                                    </td>
                                                    <td className="align-top">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteItem(item.id)}
                                                            className="w-full h-[48px] flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
                                                            title="Padam slot ini"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Add Slot Button - Right Aligned */}
                                    <div className="flex justify-end mt-4 mb-2">
                                        <GlassButton
                                            type="button"
                                            onClick={handleAddItem}
                                            variant="secondary"
                                            size="sm"
                                            leftIcon={<Plus size={16} />}
                                        >
                                            Tambah Slot
                                        </GlassButton>
                                    </div>
                                </GlassCard>

                                {/* Submit Button */}
                                <GlassButton
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    className="w-full font-bold shadow-xl shadow-[var(--brand-gold)]/10"
                                    isLoading={loading}
                                    rightIcon={<Sparkles size={18} />}
                                >
                                    Simpan & Teruskan
                                </GlassButton>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </LandingBackground>
    );
}
