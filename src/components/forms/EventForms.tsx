'use client';

import React from 'react';
import { Calendar, Clock, MapPin, Users, Heart, Sparkles, Building2, Cake, TreePine, Map, Link2 } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import GlassInput from '../ui/GlassInput';
import GlassDatePicker from '../ui/GlassDatePicker';
import GlassTimePicker from '../ui/GlassTimePicker';

interface BaseFormProps {
    data: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    loading: boolean;
}

export const WeddingForm: React.FC<BaseFormProps> = ({ data, onChange, onSubmit, loading }) => {
    return (
        <form onSubmit={onSubmit} className="w-full max-w-2xl mx-auto">
            <GlassCard variant="deep" className="mb-6">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-pink-500/10 rounded-xl border border-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.2)]">
                        <Heart className="text-pink-500" size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Butiran Perkahwinan</h2>
                        <p className="text-sm text-slate-400">Sediakan jemputan perkahwinan impian anda</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GlassInput
                            label="Nama Pengantin Lelaki"
                            name="groom_name"
                            value={data.groom_name || ''}
                            onChange={onChange}
                            placeholder="Contoh: Ahmad Ali"
                            required
                        />
                        <GlassInput
                            label="Nama Pengantin Perempuan"
                            name="bride_name"
                            value={data.bride_name || ''}
                            onChange={onChange}
                            placeholder="Contoh: Siti Aishah"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-slate-300 text-sm font-medium ml-1">Tarikh Majlis</label>
                            <GlassDatePicker
                                name="event_date"
                                value={data.event_date || ''}
                                onChange={onChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-slate-300 text-sm font-medium ml-1">Masa Majlis</label>
                            <GlassTimePicker
                                name="event_time"
                                value={data.event_time || ''}
                                onChange={onChange}
                                required
                            />
                        </div>
                    </div>

                    <GlassInput
                        label="Lokasi Majlis (Nama Tempat)"
                        name="location"
                        value={data.location || ''}
                        onChange={onChange}
                        placeholder="Contoh: Dewan Perdana, Kuala Lumpur"
                        icon={MapPin}
                        required
                    />

                    <div className="space-y-2">
                        <label className="block text-slate-300 text-sm font-medium ml-1">Alamat Penuh</label>
                        <div className="relative group">
                            <div className="absolute left-3.5 top-3.5 text-slate-500 pointer-events-none">
                                <Map size={18} />
                            </div>
                            <textarea
                                name="venueAddress"
                                value={data.venueAddress || ''}
                                onChange={onChange}
                                rows={3}
                                className="w-full bg-[#020617]/30 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/50 focus:border-transparent py-3 pl-11 pr-4 min-h-[120px] resize-y transition-all duration-300"
                                placeholder="Contoh: No. 1, Jalan Ampang, 50450 Kuala Lumpur"
                            />
                        </div>
                    </div>

                    <GlassInput
                        label="Pautan Google Maps / Waze"
                        type="url"
                        name="mapLink"
                        value={data.mapLink || ''}
                        onChange={onChange}
                        placeholder="Contoh: https://maps.app.goo.gl/..."
                        icon={Link2}
                    />
                </div>
            </GlassCard>

            {/* External CTA */}
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
    );
};

export const BirthdayForm: React.FC<BaseFormProps> = ({ data, onChange, onSubmit, loading }) => {
    return (
        <form onSubmit={onSubmit} className="w-full max-w-2xl mx-auto">
            <GlassCard variant="deep" className="mb-6">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                        <Cake className="text-yellow-500" size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Butiran Hari Jadi</h2>
                        <p className="text-sm text-slate-400">Raikan hari istimewa dengan jemputan ceria</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GlassInput
                            label="Nama Yang Dirai"
                            name="celebrant_name"
                            value={data.celebrant_name || ''}
                            onChange={onChange}
                            placeholder="Contoh: Adam Rayyan"
                            required
                        />
                        <GlassInput
                            label="Umur"
                            type="number"
                            name="age"
                            value={data.age || ''}
                            onChange={onChange}
                            placeholder="Contoh: 5"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-slate-300 text-sm font-medium ml-1">Tarikh Majlis</label>
                            <GlassDatePicker
                                name="event_date"
                                value={data.event_date || ''}
                                onChange={onChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-slate-300 text-sm font-medium ml-1">Masa Majlis</label>
                            <GlassTimePicker
                                name="event_time"
                                value={data.event_time || ''}
                                onChange={onChange}
                                required
                            />
                        </div>
                    </div>

                    <GlassInput
                        label="Lokasi Majlis"
                        name="location"
                        value={data.location || ''}
                        onChange={onChange}
                        placeholder="Contoh: McD Bangsar, Kuala Lumpur"
                        icon={MapPin}
                        required
                    />

                    <div className="space-y-2">
                        <label className="block text-slate-300 text-sm font-medium ml-1">Alamat Penuh</label>
                        <div className="relative group">
                            <div className="absolute left-3.5 top-3.5 text-slate-500 pointer-events-none">
                                <Map size={18} />
                            </div>
                            <textarea
                                name="venueAddress"
                                value={data.venueAddress || ''}
                                onChange={onChange}
                                rows={3}
                                className="w-full bg-[#020617]/30 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/50 focus:border-transparent py-3 pl-11 pr-4 min-h-[120px] resize-y transition-all duration-300"
                                placeholder="Contoh: No. 1, Jalan Ampang, 50450 Kuala Lumpur"
                            />
                        </div>
                    </div>

                    <GlassInput
                        label="Pautan Google Maps / Waze"
                        type="url"
                        name="mapLink"
                        value={data.mapLink || ''}
                        onChange={onChange}
                        placeholder="Contoh: https://maps.app.goo.gl/..."
                        icon={Link2}
                    />
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
    );
};

export const CorporateForm: React.FC<BaseFormProps> = ({ data, onChange, onSubmit, loading }) => {
    return (
        <form onSubmit={onSubmit} className="w-full max-w-2xl mx-auto">
            <GlassCard variant="deep" className="mb-6">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                        <Building2 className="text-blue-500" size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Butiran Majlis Korporat</h2>
                        <p className="text-sm text-slate-400">Professional dan berprestij</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <GlassInput
                        label="Nama Majlis / Program"
                        name="event_title"
                        value={data.event_title || ''}
                        onChange={onChange}
                        placeholder="Contoh: Makan Malam Tahunan A2Z"
                        required
                    />

                    <GlassInput
                        label="Anjuran / Organisasi"
                        name="organizer"
                        value={data.organizer || ''}
                        onChange={onChange}
                        placeholder="Contoh: A2Z Creative Enterprise"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-slate-300 text-sm font-medium ml-1">Tarikh Majlis</label>
                            <GlassDatePicker
                                name="event_date"
                                value={data.event_date || ''}
                                onChange={onChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-slate-300 text-sm font-medium ml-1">Masa Majlis</label>
                            <GlassTimePicker
                                name="event_time"
                                value={data.event_time || ''}
                                onChange={onChange}
                                required
                            />
                        </div>
                    </div>

                    <GlassInput
                        label="Lokasi Majlis"
                        name="location"
                        value={data.location || ''}
                        onChange={onChange}
                        placeholder="Contoh: Hotel Hilton, KL Sentral"
                        icon={MapPin}
                        required
                    />

                    <div className="space-y-2">
                        <label className="block text-slate-300 text-sm font-medium ml-1">Alamat Penuh</label>
                        <div className="relative group">
                            <div className="absolute left-3.5 top-3.5 text-slate-500 pointer-events-none">
                                <Map size={18} />
                            </div>
                            <textarea
                                name="venueAddress"
                                value={data.venueAddress || ''}
                                onChange={onChange}
                                rows={3}
                                className="w-full bg-[#020617]/30 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/50 focus:border-transparent py-3 pl-11 pr-4 min-h-[120px] resize-y transition-all duration-300"
                                placeholder="Contoh: No. 1, Jalan Ampang, 50450 Kuala Lumpur"
                            />
                        </div>
                    </div>

                    <GlassInput
                        label="Pautan Google Maps / Waze"
                        type="url"
                        name="mapLink"
                        value={data.mapLink || ''}
                        onChange={onChange}
                        placeholder="Contoh: https://maps.app.goo.gl/..."
                        icon={Link2}
                    />
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
    );
};

export const GenericForm: React.FC<BaseFormProps> = ({ data, onChange, onSubmit, loading }) => {
    return (
        <form onSubmit={onSubmit} className="w-full max-w-2xl mx-auto">
            <GlassCard variant="deep" className="mb-6">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-slate-500/10 rounded-xl border border-slate-500/20 shadow-[0_0_15px_rgba(100,116,139,0.2)]">
                        <Users className="text-slate-400" size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Butiran Majlis</h2>
                        <p className="text-sm text-slate-400">Sediakan borang jemputan untuk tetamu anda</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <GlassInput
                        label="Tajuk Majlis"
                        name="event_title"
                        value={data.event_title || ''}
                        onChange={onChange}
                        placeholder="Contoh: Reunion Batch 2010"
                        required
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-slate-300 text-sm font-medium ml-1">Tarikh Majlis</label>
                            <GlassDatePicker
                                name="event_date"
                                value={data.event_date || ''}
                                onChange={onChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-slate-300 text-sm font-medium ml-1">Masa Majlis</label>
                            <GlassTimePicker
                                name="event_time"
                                value={data.event_time || ''}
                                onChange={onChange}
                                required
                            />
                        </div>
                    </div>

                    <GlassInput
                        label="Lokasi Majlis"
                        name="location"
                        value={data.location || ''}
                        onChange={onChange}
                        placeholder="Contoh: Balai Raya Kg Baru"
                        icon={MapPin}
                        required
                    />

                    <div className="space-y-2">
                        <label className="block text-slate-300 text-sm font-medium ml-1">Alamat Penuh</label>
                        <div className="relative group">
                            <div className="absolute left-3.5 top-3.5 text-slate-500 pointer-events-none">
                                <Map size={18} />
                            </div>
                            <textarea
                                name="venueAddress"
                                value={data.venueAddress || ''}
                                onChange={onChange}
                                rows={3}
                                className="w-full bg-[#020617]/30 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/50 focus:border-transparent py-3 pl-11 pr-4 min-h-[120px] resize-y transition-all duration-300"
                                placeholder="Contoh: No. 1, Jalan Ampang, 50450 Kuala Lumpur"
                            />
                        </div>
                    </div>

                    <GlassInput
                        label="Pautan Google Maps / Waze"
                        type="url"
                        name="mapLink"
                        value={data.mapLink || ''}
                        onChange={onChange}
                        placeholder="Contoh: https://maps.app.goo.gl/..."
                        icon={Link2}
                    />
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
    );
};
