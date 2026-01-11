'use client';

import LandingBackground from '@/components/landing/LandingBackground';
import Navbar from '@/components/Navbar';
import GlassCard from '@/components/GlassCard';

export default function StyleGuidePage() {
    return (
        <LandingBackground>
            <Navbar />

            <main className="relative z-10 pt-24 pb-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-white mb-4">Design System</h1>
                        <p className="text-slate-400">A2Z Creative Glassmorphism Design Tokens</p>
                    </div>

                    {/* Colors Section */}
                    <GlassCard className="mb-8">
                        <h2 className="text-2xl font-bold text-white mb-6">Colors</h2>

                        <h3 className="text-lg font-semibold text-slate-300 mb-4">Brand Colors</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <ColorSwatch name="--brand-gold" color="#d4af37" />
                            <ColorSwatch name="--brand-gold-light" color="#f4d03f" />
                            <ColorSwatch name="--brand-gold-dark" color="#b8972e" />
                        </div>

                        <h3 className="text-lg font-semibold text-slate-300 mb-4">Neon Accents</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <ColorSwatch name="--neon-cyan" color="#00f2ff" />
                            <ColorSwatch name="--neon-magenta" color="#ff00cc" />
                            <ColorSwatch name="--neon-violet" color="#7c3aed" />
                            <ColorSwatch name="--neon-purple" color="#a855f7" />
                            <ColorSwatch name="--neon-blue" color="#3b82f6" />
                            <ColorSwatch name="--neon-green" color="#22c55e" />
                            <ColorSwatch name="--neon-orange" color="#f97316" />
                            <ColorSwatch name="--neon-pink" color="#ec4899" />
                        </div>

                        <h3 className="text-lg font-semibold text-slate-300 mb-4">Background Colors</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <ColorSwatch name="--bg-base" color="#020617" />
                            <ColorSwatch name="--bg-dark" color="#0a0f1a" />
                            <ColorSwatch name="--bg-surface" color="#0f172a" />
                            <ColorSwatch name="--bg-elevated" color="#1e293b" />
                        </div>
                    </GlassCard>

                    {/* Buttons Section */}
                    <GlassCard className="mb-8">
                        <h2 className="text-2xl font-bold text-white mb-6">Buttons</h2>
                        <div className="flex flex-wrap gap-4">
                            <button className="btn btn-primary">btn-primary</button>
                            <button className="btn btn-secondary">btn-secondary</button>
                            <button className="btn btn-gold">btn-gold</button>
                            <button className="btn btn-ghost">btn-ghost</button>
                        </div>
                        <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
                            <code className="text-sm text-slate-300">
                                {`<button className="btn btn-primary">Label</button>`}
                            </code>
                        </div>
                    </GlassCard>

                    {/* Form Inputs Section */}
                    <GlassCard className="mb-8">
                        <h2 className="text-2xl font-bold text-white mb-6">Form Inputs</h2>

                        <div className="space-y-4 max-w-md">
                            <div className="input-group">
                                <input
                                    type="text"
                                    className="form-input-glass"
                                    placeholder="form-input-glass"
                                />
                            </div>
                            <textarea
                                className="form-input-glass !pl-4"
                                placeholder="form-input-glass (textarea)"
                                rows={3}
                            />
                        </div>
                        <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
                            <code className="text-sm text-slate-300">
                                {`<input className="form-input-glass" />`}
                            </code>
                        </div>
                    </GlassCard>

                    {/* Glass Cards Section */}
                    <GlassCard className="mb-8">
                        <h2 className="text-2xl font-bold text-white mb-6">Glass Cards</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="glass-card-glow p-6">
                                <h4 className="text-white font-semibold mb-2">glass-card-glow</h4>
                                <p className="text-slate-400 text-sm">Hover for cyan glow effect</p>
                            </div>
                            <div className="glass-card-gold p-6">
                                <h4 className="text-white font-semibold mb-2">glass-card-gold</h4>
                                <p className="text-slate-400 text-sm">Gold accent border</p>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Typography Section */}
                    <GlassCard className="mb-8">
                        <h2 className="text-2xl font-bold text-white mb-6">Typography</h2>
                        <div className="space-y-4">
                            <p className="text-gradient text-2xl font-bold">text-gradient</p>
                            <p className="text-gold text-xl">text-gold</p>
                            <p className="text-cyan text-xl">text-cyan</p>
                            <p className="text-muted">text-muted</p>
                        </div>
                    </GlassCard>

                    {/* Animations Section */}
                    <GlassCard>
                        <h2 className="text-2xl font-bold text-white mb-6">Animations</h2>
                        <div className="flex flex-wrap gap-6 items-center">
                            <div className="text-center">
                                <div className="spinner mx-auto mb-2"></div>
                                <span className="text-slate-400 text-sm">spinner</span>
                            </div>
                            <div className="text-center">
                                <div className="spinner spinner-lg mx-auto mb-2"></div>
                                <span className="text-slate-400 text-sm">spinner-lg</span>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 bg-slate-700 rounded-lg animate-pulse mb-2"></div>
                                <span className="text-slate-400 text-sm">animate-pulse</span>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </main>
        </LandingBackground>
    );
}

function ColorSwatch({ name, color }: { name: string; color: string }) {
    return (
        <div className="flex flex-col">
            <div
                className="w-full h-16 rounded-lg border border-slate-700/50 mb-2"
                style={{ backgroundColor: color }}
            />
            <span className="text-xs text-slate-400 font-mono truncate">{name}</span>
            <span className="text-xs text-slate-500">{color}</span>
        </div>
    );
}
