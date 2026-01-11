'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Sparkles, Gift, CreditCard, User, Hash, QrCode, Upload, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import LandingBackground from '@/components/landing/LandingBackground';
import Navbar from '@/components/Navbar';
import StepIndicator from '@/components/ui/StepIndicator';
import GlassCard from '@/components/GlassCard';

// List of major banks in Malaysia with brand colors
const BANKS = [
    { id: 'maybank', name: 'Maybank', color: '#FFC300', textColor: '#000', short: 'M' },
    { id: 'cimb', name: 'CIMB Bank', color: '#ED1C24', textColor: '#FFF', short: 'CIMB' },
    { id: 'public', name: 'Public Bank', color: '#E31837', textColor: '#FFF', short: 'PBB' },
    { id: 'rhb', name: 'RHB Bank', color: '#00529B', textColor: '#FFF', short: 'RHB' },
    { id: 'hongleong', name: 'Hong Leong Bank', color: '#003D79', textColor: '#FFF', short: 'HLB' },
    { id: 'ambank', name: 'AmBank', color: '#E31837', textColor: '#FFF', short: 'AM' },
    { id: 'uob', name: 'UOB Bank', color: '#002B5C', textColor: '#FFF', short: 'UOB' },
    { id: 'bankislam', name: 'Bank Islam', color: '#00A651', textColor: '#FFF', short: 'BI' },
    { id: 'bankrakyat', name: 'Bank Rakyat', color: '#003B71', textColor: '#FFF', short: 'BR' },
    { id: 'bsn', name: 'BSN', color: '#004B87', textColor: '#FFF', short: 'BSN' },
    { id: 'hsbc', name: 'HSBC Bank', color: '#DB0011', textColor: '#FFF', short: 'HSBC' },
    { id: 'ocbc', name: 'OCBC Bank', color: '#ED1C24', textColor: '#FFF', short: 'OCBC' },
];

export default function GiftFormContainer() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const type = params.type as string;
    const slug = searchParams.get('slug');
    const selectedPackage = searchParams.get('package') || 'free';

    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);
    const [isEnabled, setIsEnabled] = useState(true);
    const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
    const bankDropdownRef = useRef<HTMLDivElement>(null);
    const [formData, setFormData] = useState({
        bankName: '',
        accountNumber: '',
        accountHolder: '',
        qrCodeUrl: '',
    });

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (bankDropdownRef.current && !bankDropdownRef.current.contains(event.target as Node)) {
                setIsBankDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                        setFormData(prev => ({
                            ...prev,
                            bankName: data.eventDetails.bankName || '',
                            accountNumber: data.eventDetails.accountNumber || '',
                            accountHolder: data.eventDetails.accountHolder || '',
                            qrCodeUrl: data.eventDetails.qrCodeUrl || '',
                        }));

                        // If bank info exists, enable the section by default
                        if (data.eventDetails.bankName || data.eventDetails.accountNumber) {
                            setIsEnabled(true);
                        }
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // If not enabled, clear the data before saving
        const dataToSave = isEnabled ? formData : {
            bankName: '',
            accountNumber: '',
            accountHolder: '',
            qrCodeUrl: ''
        };

        try {
            const response = await fetch('/api/events/update-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slug,
                    type,
                    eventDetails: dataToSave
                }),
            });

            if (response.ok) {
                router.push(`/create/preview/${type}?slug=${slug}&package=${selectedPackage}`);
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
                            href={`/create/contact/${type}?slug=${slug}&package=${selectedPackage}`}
                            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
                        >
                            <ArrowLeft size={18} />
                            Kembali
                        </Link>

                        <StepIndicator currentStep={6} eventType={type} />
                    </div>

                    <GlassCard className="max-w-2xl mx-auto">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">Salam Kaut / Hadiah</h2>
                            <p className="text-slate-400">Terima hadiah wang ringgit secara digital melalui QR Pay atau pindahan bank.</p>
                        </div>

                        {fetchingData ? (
                            <div className="flex justify-center py-10">
                                <div className="w-8 h-8 border-2 border-[var(--brand-gold)]/30 border-t-[var(--brand-gold)] rounded-full animate-spin" />
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Toggle Switch - No border */}
                                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${isEnabled ? 'bg-[var(--brand-gold)]/20 text-[var(--brand-gold)]' : 'bg-slate-800 text-slate-500'}`}>
                                            <Gift size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium">Paparkan info Akaun Bank / QR</h3>
                                            <p className="text-xs text-slate-400">Benarkan tetamu memberi sumbangan dalam talian.</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsEnabled(!isEnabled)}
                                        className={`
                                            relative w-12 h-6 rounded-full transition-colors duration-300
                                            ${isEnabled ? 'bg-[var(--brand-gold)]' : 'bg-slate-700'}
                                        `}
                                    >
                                        <div
                                            className={`
                                                absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300
                                                ${isEnabled ? 'translate-x-6' : 'translate-x-0'}
                                            `}
                                        />
                                    </button>
                                </div>

                                {/* Form Fields (collapsible) */}
                                {isEnabled && (
                                    <div className="space-y-6 animate-fadeIn">
                                        {/* Custom Glass Bank Dropdown */}
                                        <div className="form-group">
                                            <label className="block text-slate-300 mb-2 text-sm font-medium">Nama Bank</label>
                                            <div className="relative" ref={bankDropdownRef}>
                                                <div
                                                    className="input-group"
                                                    onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    {/* Show selected bank badge or default icon */}
                                                    {formData.bankName ? (
                                                        <div
                                                            style={{
                                                                position: 'absolute',
                                                                left: '14px',
                                                                top: '50%',
                                                                transform: 'translateY(-50%)',
                                                                width: '26px',
                                                                height: '26px',
                                                                borderRadius: '4px',
                                                                backgroundColor: BANKS.find(b => b.name === formData.bankName)?.color || '#64748b',
                                                                color: BANKS.find(b => b.name === formData.bankName)?.textColor || '#FFF',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '8px',
                                                                fontWeight: 700,
                                                                letterSpacing: '-0.5px',
                                                            }}
                                                        >
                                                            {BANKS.find(b => b.name === formData.bankName)?.short || ''}
                                                        </div>
                                                    ) : (
                                                        <CreditCard className="input-icon" size={18} />
                                                    )}
                                                    <div
                                                        style={{
                                                            width: '100%',
                                                            padding: '0.75rem 1rem',
                                                            paddingLeft: '3rem',
                                                            paddingRight: '3rem',
                                                            fontSize: '1rem',
                                                            color: formData.bankName ? 'white' : '#94a3b8',
                                                            backgroundColor: isBankDropdownOpen ? 'rgba(2, 6, 23, 0.5)' : 'rgba(2, 6, 23, 0.3)',
                                                            backdropFilter: 'blur(4px)',
                                                            border: isBankDropdownOpen ? '1px solid var(--brand-gold)' : '1px solid rgba(255, 255, 255, 0.1)',
                                                            borderRadius: '0.75rem',
                                                            transition: 'all 0.3s ease',
                                                            boxShadow: isBankDropdownOpen ? '0 0 0 1px rgba(212, 175, 55, 0.5)' : 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                        }}
                                                    >
                                                        <span>{formData.bankName || 'Pilih Bank'}</span>
                                                        <ChevronDown
                                                            size={18}
                                                            style={{
                                                                color: '#64748b',
                                                                transition: 'transform 0.2s',
                                                                transform: isBankDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Dropdown Panel */}
                                                {isBankDropdownOpen && (
                                                    <div
                                                        style={{
                                                            position: 'absolute',
                                                            zIndex: 100,
                                                            top: '100%',
                                                            left: 0,
                                                            right: 0,
                                                            marginTop: '0.5rem',
                                                            backgroundColor: '#0f172a',
                                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                                            borderRadius: '0.75rem',
                                                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(212, 175, 55, 0.2)',
                                                            padding: '0.5rem',
                                                            maxHeight: '280px',
                                                            overflowY: 'auto',
                                                        }}
                                                    >
                                                        {BANKS.map(bank => (
                                                            <button
                                                                key={bank.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setFormData(prev => ({ ...prev, bankName: bank.name }));
                                                                    setIsBankDropdownOpen(false);
                                                                }}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '0.75rem 1rem',
                                                                    borderRadius: '0.5rem',
                                                                    fontSize: '0.9rem',
                                                                    transition: 'all 0.2s ease',
                                                                    background: formData.bankName === bank.name ? 'var(--brand-gold)' : 'transparent',
                                                                    color: formData.bankName === bank.name ? 'black' : '#cbd5e1',
                                                                    border: 'none',
                                                                    cursor: 'pointer',
                                                                    textAlign: 'left',
                                                                    fontWeight: formData.bankName === bank.name ? 600 : 400,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.75rem',
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    if (formData.bankName !== bank.name) {
                                                                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                                                    }
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    if (formData.bankName !== bank.name) {
                                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                                    }
                                                                }}
                                                            >
                                                                {/* Bank Badge */}
                                                                <div style={{
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    borderRadius: '6px',
                                                                    backgroundColor: bank.color,
                                                                    color: bank.textColor,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    fontSize: '9px',
                                                                    fontWeight: 700,
                                                                    letterSpacing: '-0.5px',
                                                                    flexShrink: 0,
                                                                }}>
                                                                    {bank.short}
                                                                </div>
                                                                {bank.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label className="block text-slate-300 mb-2 text-sm font-medium">Nombor Akaun</label>
                                            <div className="input-group">
                                                <Hash className="input-icon" size={18} />
                                                <input
                                                    type="text"
                                                    name="accountNumber"
                                                    value={formData.accountNumber}
                                                    onChange={handleInputChange}
                                                    className="form-input-glass pl-12"
                                                    placeholder="Contoh: 1234567890"
                                                    required={isEnabled}
                                                />
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label className="block text-slate-300 mb-2 text-sm font-medium">Nama Pemegang Akaun</label>
                                            <div className="input-group">
                                                <User className="input-icon" size={18} />
                                                <input
                                                    type="text"
                                                    name="accountHolder"
                                                    value={formData.accountHolder}
                                                    onChange={handleInputChange}
                                                    className="form-input-glass pl-12"
                                                    placeholder="Contoh: Ahmad Ali"
                                                    required={isEnabled}
                                                />
                                            </div>
                                        </div>

                                        {/* QR Code Upload */}
                                        <div className="form-group">
                                            <label className="block text-slate-300 mb-2 text-sm font-medium">Muat Naik QR Code DuitNow</label>
                                            <div className="relative group">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            // Logic to handle file upload would go here
                                                            // For now we simulate by creating a local URL
                                                            const url = URL.createObjectURL(file);
                                                            setFormData(prev => ({ ...prev, qrCodeUrl: url }));
                                                        }
                                                    }}
                                                    className="hidden"
                                                    id="qr-upload"
                                                />
                                                <label
                                                    htmlFor="qr-upload"
                                                    className={`
                                                        flex flex-col items-center justify-center w-full h-48 rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden
                                                        ${formData.qrCodeUrl
                                                            ? 'border-[var(--brand-gold)] bg-black/50'
                                                            : 'border-slate-700 hover:border-slate-500 bg-slate-900/30 hover:bg-slate-900/50'}
                                                    `}
                                                >
                                                    {formData.qrCodeUrl ? (
                                                        <div className="relative w-full h-full p-4 flex flex-col items-center justify-center group-hover:opacity-50 transition-opacity">
                                                            {/* We use an img tag here for preview */}
                                                            <img
                                                                src={formData.qrCodeUrl}
                                                                alt="QR Code"
                                                                className="max-h-full object-contain"
                                                            />
                                                            <p className="absolute bottom-2 text-xs text-[var(--brand-gold)] bg-black/70 px-2 py-1 rounded-full">Klik untuk tukar</p>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center text-slate-400">
                                                            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
                                                                <Upload size={20} />
                                                            </div>
                                                            <span className="text-sm font-medium">Klik untuk Muat Naik</span>
                                                            <span className="text-xs opacity-70 mt-1">PNG, JPG atau JPEG (Max 2MB)</span>
                                                        </div>
                                                    )}
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}

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
