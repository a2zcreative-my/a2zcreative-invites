'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Sparkles, Music, Upload, Play, Pause, Store } from 'lucide-react';
import Link from 'next/link';
import LandingBackground from '@/components/landing/LandingBackground';
import Navbar from '@/components/Navbar';
import StepIndicator from '@/components/ui/StepIndicator';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import GlassInput from '@/components/ui/GlassInput';

// Preset Marketplace Components
import { CategoryFilter, ColorFilter, PresetGrid } from '@/components/preset';

// Preset System
import { DESIGN_PRESETS, DesignPreset, filterPresets, getPresetById } from '@/lib/presets';
import { DEFAULT_MUSIC } from '@/lib/themes';

export default function ThemeMusicFormContainer() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const type = params.type as string;
    const slug = searchParams.get('slug');
    const selectedPackage = searchParams.get('package') || 'free';

    // Form State
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);
    const [formData, setFormData] = useState({
        presetId: 'royal-gold',
        themeId: 'royal-gold',
        templateId: 'royal-gold',
        themeColor: '#D4AF37',
        font: 'playfair',
        layout: 'hero',
        cover: 'frame',
        motion: 'luxury',
        music: 'romantic',
        customMusicUrl: '',
    });

    // Filter State
    const [categoryFilter, setCategoryFilter] = useState<string>('All');
    const [colorFilter, setColorFilter] = useState<string | null>(null);

    // Music Preview State
    const [isPlaying, setIsPlaying] = useState<string | null>(null);

    // Compute filtered presets
    const filteredPresets = useMemo(() => {
        return filterPresets(type, categoryFilter, colorFilter);
    }, [type, categoryFilter, colorFilter]);

    // Compute locked preset IDs (premium presets for free users)
    const lockedPresetIds = useMemo(() => {
        if (selectedPackage !== 'free') return [];
        return DESIGN_PRESETS.filter(p => p.isPremium).map(p => p.id);
    }, [selectedPackage]);

    // Fetch existing event data
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
                        const savedPresetId = data.eventDetails.presetId || data.eventDetails.templateId || 'royal-gold';
                        const preset = getPresetById(savedPresetId);

                        if (preset) {
                            setFormData(prev => ({
                                ...prev,
                                presetId: preset.id,
                                themeId: preset.id,
                                templateId: preset.id,
                                themeColor: preset.colors[0],
                                font: preset.font,
                                layout: preset.layout,
                                cover: preset.cover,
                                motion: preset.motion,
                                music: data.eventDetails.music || preset.music,
                                customMusicUrl: data.eventDetails.customMusicUrl || '',
                            }));
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

    // Handle preset selection
    const handlePresetSelect = (preset: DesignPreset) => {
        if (preset.isPremium && selectedPackage === 'free') {
            alert('Preset ini hanya tersedia untuk pakej Premium & Platinum. Sila naik taraf untuk menggunakan rekaan ini.');
            return;
        }

        setFormData(prev => ({
            ...prev,
            presetId: preset.id,
            themeId: preset.id,
            templateId: preset.id,
            themeColor: preset.colors[0],
            font: preset.font,
            layout: preset.layout,
            cover: preset.cover,
            motion: preset.motion,
            music: preset.music, // Update music from preset
        }));
    };

    // Handle music preview
    const playPreview = (musicId: string) => {
        if (isPlaying === musicId) {
            setIsPlaying(null);
        } else {
            setIsPlaying(musicId);
        }
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            console.log('Submitting form data:', formData);
            const response = await fetch('/api/events/update-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slug,
                    type,
                    eventDetails: formData
                }),
            });

            const result = await response.json();
            console.log('API response:', result);

            if (response.ok && result.success) {
                router.push(`/create/contact/${type}?slug=${slug}&package=${selectedPackage}`);
            } else {
                console.error('Failed to save details:', result.error || 'Unknown error');
                alert('Gagal menyimpan. Sila cuba lagi.');
            }
        } catch (err) {
            console.error('Submit error:', err);
            alert('Ralat rangkaian. Sila cuba lagi.');
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
                    <div className="max-w-4xl mx-auto mb-8">
                        <Link
                            href={`/create/agenda/${type}?slug=${slug}&package=${selectedPackage}`}
                            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
                        >
                            <ArrowLeft size={18} />
                            Kembali
                        </Link>

                        <StepIndicator currentStep={4} eventType={type} />
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/20 text-violet-400 rounded-full text-xs font-semibold mb-3 border border-violet-500/20">
                                <Store size={14} />
                                Design Marketplace
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Pilih Rekaan Jemputan</h2>
                            <p className="text-slate-400">
                                Terokai koleksi rekaan premium dengan pratonton langsung.
                            </p>
                        </div>

                        {fetchingData ? (
                            <div className="flex justify-center py-10">
                                <div className="w-8 h-8 border-2 border-[var(--brand-gold)]/30 border-t-[var(--brand-gold)] rounded-full animate-spin" />
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="w-full">
                                <GlassCard variant="deep" className="mb-8 p-8">
                                    <div className="space-y-8">
                                        {/* === FILTERS === */}
                                        <div className="space-y-4">
                                            {/* Category Filter Pills */}
                                            <CategoryFilter
                                                selected={categoryFilter}
                                                onChange={setCategoryFilter}
                                            />

                                            {/* Color Filter Dots */}
                                            <ColorFilter
                                                selected={colorFilter}
                                                onChange={setColorFilter}
                                            />
                                        </div>

                                        {/* === PRESET GRID === */}
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    {filteredPresets.length} Rekaan Tersedia
                                                </label>
                                                {formData.presetId && (
                                                    <span className="text-xs text-violet-400">
                                                        Dipilih: {getPresetById(formData.presetId)?.name}
                                                    </span>
                                                )}
                                            </div>

                                            <PresetGrid
                                                presets={filteredPresets}
                                                eventType={type}
                                                selectedPresetId={formData.presetId}
                                                lockedPresetIds={lockedPresetIds}
                                                onSelectPreset={handlePresetSelect}
                                            />
                                        </div>

                                        {/* === MUSIC SELECTION === */}
                                        <div className="border-t border-slate-700/50 pt-8">
                                            <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
                                                <Music size={18} className="text-[var(--brand-gold)]" />
                                                Pilih Muzik Latar
                                            </h3>
                                            <div className="space-y-3">
                                                {/* No Music Option */}
                                                <div
                                                    className={`cursor-pointer group relative overflow-hidden rounded-xl border transition-all duration-300 ${formData.music === 'none'
                                                        ? 'bg-[var(--brand-gold)]/10 border-[var(--brand-gold)]'
                                                        : 'bg-slate-900/50 border-white/5 hover:border-white/10'
                                                        }`}
                                                    onClick={() => setFormData({ ...formData, music: 'none', customMusicUrl: '' })}
                                                >
                                                    <div className="flex items-center justify-between p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-full ${formData.music === 'none' ? 'bg-[var(--brand-gold)]/20 text-[var(--brand-gold)]' : 'bg-slate-800 text-slate-400'}`}>
                                                                <Music size={16} />
                                                            </div>
                                                            <span className="font-medium text-slate-200">Tiada Muzik (Senyap)</span>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.music === 'none' ? 'border-[var(--brand-gold)]' : 'border-slate-600'
                                                            }`}>
                                                            {formData.music === 'none' && <div className="w-3 h-3 rounded-full bg-[var(--brand-gold)]" />}
                                                        </div>
                                                    </div>
                                                </div>

                                                {DEFAULT_MUSIC.map((track) => (
                                                    <div
                                                        key={track.id}
                                                        className={`cursor-pointer group relative overflow-hidden rounded-xl border transition-all duration-300 ${formData.music === track.id
                                                            ? 'bg-[var(--brand-gold)]/10 border-[var(--brand-gold)]'
                                                            : 'bg-slate-900/50 border-white/5 hover:border-white/10'
                                                            }`}
                                                        onClick={() => setFormData({ ...formData, music: track.id, customMusicUrl: '' })}
                                                    >
                                                        <div className="flex items-center justify-between p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`p-2 rounded-full ${formData.music === track.id ? 'bg-[var(--brand-gold)]/20 text-[var(--brand-gold)]' : 'bg-slate-800 text-slate-400'}`}>
                                                                    <Music size={16} />
                                                                </div>
                                                                <span className="font-medium text-slate-200">{track.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        playPreview(track.id);
                                                                    }}
                                                                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                                                                >
                                                                    {isPlaying === track.id ? <Pause size={16} /> : <Play size={16} />}
                                                                </button>
                                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.music === track.id ? 'border-[var(--brand-gold)]' : 'border-slate-600'
                                                                    }`}>
                                                                    {formData.music === track.id && <div className="w-3 h-3 rounded-full bg-[var(--brand-gold)]" />}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* YouTube URL Option */}
                                                <div
                                                    className={`cursor-pointer group relative overflow-hidden rounded-xl border transition-all duration-300 ${formData.music === 'youtube'
                                                        ? 'bg-[var(--brand-gold)]/10 border-[var(--brand-gold)]'
                                                        : 'bg-slate-900/50 border-white/5 hover:border-white/10'
                                                        }`}
                                                    onClick={() => setFormData({ ...formData, music: 'youtube' })}
                                                >
                                                    <div className="flex items-center justify-between p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 rounded-full bg-red-500/10 text-red-500">
                                                                <Play size={16} />
                                                            </div>
                                                            <span className="font-medium text-slate-200">Pautan YouTube</span>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.music === 'youtube' ? 'border-[var(--brand-gold)]' : 'border-slate-600'
                                                            }`}>
                                                            {formData.music === 'youtube' && <div className="w-3 h-3 rounded-full bg-[var(--brand-gold)]" />}
                                                        </div>
                                                    </div>

                                                    {/* YouTube Input Field */}
                                                    {formData.music === 'youtube' && (
                                                        <div className="px-4 pb-4">
                                                            <GlassInput
                                                                name="customMusicUrl"
                                                                value={formData.customMusicUrl}
                                                                onChange={(e) => setFormData({ ...formData, customMusicUrl: e.target.value })}
                                                                placeholder="Contoh: https://youtu.be/..."
                                                                icon={Play}
                                                                className="mt-2"
                                                            />
                                                            <p className="text-xs text-slate-500 mt-2 ml-1">
                                                                Sila masukkan pautan YouTube yang sah.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Custom Upload Option */}
                                                <div
                                                    className={`cursor-pointer group relative overflow-hidden rounded-xl border border-dashed transition-all duration-300 ${formData.music === 'custom'
                                                        ? 'bg-[var(--brand-gold)]/10 border-[var(--brand-gold)]'
                                                        : 'bg-slate-900/50 border-white/10 hover:border-white/20'
                                                        }`}
                                                    onClick={() => setFormData({ ...formData, music: 'custom' })}
                                                >
                                                    <div className="flex items-center justify-between p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 rounded-full bg-slate-800 text-slate-400">
                                                                <Upload size={16} />
                                                            </div>
                                                            <span className="font-medium text-slate-200">Muat Naik MP3 (Custom)</span>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.music === 'custom' ? 'border-[var(--brand-gold)]' : 'border-slate-600'
                                                            }`}>
                                                            {formData.music === 'custom' && <div className="w-3 h-3 rounded-full bg-[var(--brand-gold)]" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </GlassCard>

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
