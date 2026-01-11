'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Sparkles, User, MessageCircle, Calendar, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';
import LandingBackground from '@/components/landing/LandingBackground';
import Navbar from '@/components/Navbar';
import StepIndicator from '@/components/ui/StepIndicator';
import GlassCard from '@/components/GlassCard';
import GlassDatePicker from '@/components/ui/GlassDatePicker';

export default function ContactFormContainer() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const type = params.type as string;
    const slug = searchParams.get('slug');
    const selectedPackage = searchParams.get('package') || 'free';

    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);
    const [formData, setFormData] = useState<{
        contacts: Array<{ id: string; name: string; phone: string }>;
        rsvpDeadline: string;
    }>({
        contacts: [{ id: '1', name: '', phone: '' }],
        rsvpDeadline: '',
    });

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
                        // Normalize existing data to array format
                        let initialContacts: Array<{ id: string; name: string; phone: string }> = [];
                        if (data.eventDetails.contacts && Array.isArray(data.eventDetails.contacts)) {
                            initialContacts = data.eventDetails.contacts;
                            // Ensure at least one contact exists
                            if (initialContacts.length === 0) {
                                initialContacts = [{ id: crypto.randomUUID(), name: '', phone: '' }];
                            }
                        } else if (data.eventDetails.contactName) {
                            initialContacts = [{
                                id: '1',
                                name: data.eventDetails.contactName,
                                phone: data.eventDetails.contactPhone || ''
                            }];
                        } else {
                            initialContacts = [{ id: '1', name: '', phone: '' }];
                        }

                        setFormData(prev => ({
                            ...prev,
                            contacts: initialContacts,
                            rsvpDeadline: data.eventDetails.rsvpDeadline || '',
                        }));
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

    const handleContactChange = (id: string, field: 'name' | 'phone', value: string) => {
        setFormData(prev => ({
            ...prev,
            contacts: prev.contacts.map(contact =>
                contact.id === id ? { ...contact, [field]: value } : contact
            )
        }));
    };

    const addContact = () => {
        setFormData(prev => ({
            ...prev,
            contacts: [...prev.contacts, { id: crypto.randomUUID(), name: '', phone: '' }]
        }));
    };

    const removeContact = (id: string) => {
        if (formData.contacts.length <= 1) return;
        setFormData(prev => ({
            ...prev,
            contacts: prev.contacts.filter(contact => contact.id !== id)
        }));
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, rsvpDeadline: e.target.value }));
    };

    const validatePhone = (phone: string) => {
        // Simple regex for Malaysia mobile numbers: +60, 60, or 01 followed by digits
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        return /^(601|01)[0-9]{7,9}$/.test(cleanPhone);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/events/update-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slug,
                    type,
                    eventDetails: formData
                }),
            });

            if (response.ok) {
                // Conditional Routing:
                // If Wedding or Birthday -> Go to Gift (Step 6)
                // Else -> Go to Preview (Step 7)
                if (type === 'wedding' || type === 'birthday') {
                    router.push(`/create/gift/${type}?slug=${slug}&package=${selectedPackage}`);
                } else {
                    router.push(`/create/preview/${type}?slug=${slug}&package=${selectedPackage}`);
                }
            } else {
                console.error('Failed to save details');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!slug) return null;

    return (
        <LandingBackground>
            <div className="min-h-screen pb-20">
                <Navbar />

                <div className="container mx-auto px-4" style={{ paddingTop: '120px' }}>
                    <div className="max-w-2xl mx-auto mb-8">
                        <Link
                            href={`/create/theme/${type}?slug=${slug}&package=${selectedPackage}`}
                            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
                        >
                            <ArrowLeft size={18} />
                            Kembali
                        </Link>

                        <StepIndicator currentStep={5} eventType={type} />
                    </div>

                    <GlassCard className="max-w-2xl mx-auto">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">Hubungi (RSVP)</h2>
                            <p className="text-slate-400">Maklumat hubungan untuk tetamu mengesahkan kehadiran.</p>
                        </div>

                        {fetchingData ? (
                            <div className="flex justify-center py-10">
                                <div className="w-8 h-8 border-2 border-[var(--brand-gold)]/30 border-t-[var(--brand-gold)] rounded-full animate-spin" />
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    {/* RSVP Date Picker - Moved to Top */}
                                    <div className="mb-6 w-full md:w-[240px]">
                                        <label className="block text-slate-300 mb-2 text-sm font-medium">Tarikh Tutup RSVP (Pilihan)</label>
                                        <GlassDatePicker
                                            name="rsvpDeadline"
                                            value={formData.rsvpDeadline}
                                            onChange={handleDateChange}
                                            placeholder="Pilih tarikh"
                                        />
                                    </div>

                                    <label className="block text-slate-300 mb-4 text-sm font-medium">Senarai Wakil (Untuk Dihubungi)</label>

                                    {/* HTML Table for guaranteed column alignment - like Aturcara */}
                                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ textAlign: 'left', paddingBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#cbd5e1' }}>
                                                    Nama Penuh
                                                </th>
                                                <th style={{ textAlign: 'left', paddingBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#cbd5e1' }}>
                                                    No. WhatsApp
                                                </th>
                                                <th style={{ width: '80px', textAlign: 'center', paddingBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#cbd5e1' }}>
                                                    Hapus
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.contacts.map((contact) => (
                                                <tr key={contact.id}>
                                                    <td style={{ paddingRight: '12px' }}>
                                                        <input
                                                            type="text"
                                                            value={contact.name}
                                                            onChange={(e) => handleContactChange(contact.id, 'name', e.target.value)}
                                                            placeholder="Contoh: Ahmad"
                                                            style={{
                                                                width: '100%',
                                                                height: '48px',
                                                                padding: '0.75rem 1rem',
                                                                backgroundColor: 'rgba(2, 6, 23, 0.3)',
                                                                backdropFilter: 'blur(4px)',
                                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                                borderRadius: '0.75rem',
                                                                color: 'white',
                                                                fontSize: '1rem',
                                                                outline: 'none',
                                                                transition: 'all 0.3s ease',
                                                                boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
                                                            }}
                                                            onFocus={(e) => {
                                                                e.target.style.borderColor = 'var(--brand-gold)';
                                                                e.target.style.boxShadow = '0 0 0 1px rgba(212, 175, 55, 0.5)';
                                                            }}
                                                            onBlur={(e) => {
                                                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                                                e.target.style.boxShadow = 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)';
                                                            }}
                                                            required
                                                        />
                                                    </td>
                                                    <td style={{ paddingRight: '12px' }}>
                                                        <input
                                                            type="tel"
                                                            value={contact.phone}
                                                            onChange={(e) => handleContactChange(contact.id, 'phone', e.target.value)}
                                                            placeholder="Contoh: 0123456789"
                                                            style={{
                                                                width: '100%',
                                                                height: '48px',
                                                                padding: '0.75rem 1rem',
                                                                backgroundColor: 'rgba(2, 6, 23, 0.3)',
                                                                backdropFilter: 'blur(4px)',
                                                                border: contact.phone && !validatePhone(contact.phone)
                                                                    ? '1px solid rgba(239, 68, 68, 0.5)'
                                                                    : '1px solid rgba(255, 255, 255, 0.1)',
                                                                borderRadius: '0.75rem',
                                                                color: 'white',
                                                                fontSize: '1rem',
                                                                outline: 'none',
                                                                transition: 'all 0.3s ease',
                                                                boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
                                                            }}
                                                            onFocus={(e) => {
                                                                e.target.style.borderColor = 'var(--brand-gold)';
                                                                e.target.style.boxShadow = '0 0 0 1px rgba(212, 175, 55, 0.5)';
                                                            }}
                                                            onBlur={(e) => {
                                                                if (contact.phone && !validatePhone(contact.phone)) {
                                                                    e.target.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                                                                } else {
                                                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                                                }
                                                                e.target.style.boxShadow = 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)';
                                                            }}
                                                            required
                                                        />
                                                    </td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeContact(contact.id)}
                                                            disabled={formData.contacts.length <= 1}
                                                            style={{
                                                                width: '100%',
                                                                height: '44px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                                                                border: '1px solid rgba(100, 116, 139, 0.5)',
                                                                borderRadius: '8px',
                                                                color: formData.contacts.length <= 1 ? '#475569' : '#94a3b8',
                                                                cursor: formData.contacts.length <= 1 ? 'not-allowed' : 'pointer',
                                                                opacity: formData.contacts.length <= 1 ? 0.5 : 1
                                                            }}
                                                            title="Padam wakil ini"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Add Contact Button - Right Aligned (Matching Agenda Form) */}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', marginBottom: '32px' }}>
                                        <button
                                            type="button"
                                            onClick={addContact}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '8px 16px',
                                                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                                                border: '1px solid rgba(100, 116, 139, 0.5)',
                                                borderRadius: '8px',
                                                color: '#cbd5e1',
                                                fontSize: '14px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Tambah Wakil
                                            <span style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '28px',
                                                height: '28px',
                                                border: '1px solid rgba(100, 116, 139, 0.5)',
                                                borderRadius: '6px'
                                            }}>
                                                <Plus size={16} />
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                <div className="border-t border-slate-700/50 pt-6">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full btn btn-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 group transition-all"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Simpan & Teruskan
                                                <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </GlassCard>
                </div >
            </div >
        </LandingBackground >
    );
}
