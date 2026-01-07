import React from 'react';

interface LandingBackgroundProps {
    children: React.ReactNode;
}

export default function LandingBackground({ children }: LandingBackgroundProps) {
    return (
        <div className="relative min-h-screen bg-[#050814] text-white selection:bg-teal-500/30 overflow-hidden">
            {/* 
        Background Layers:
        1. Base color (set in parent div)
        2. Teal Glow (Top Right)
        3. Pink Glow (Bottom Left)
        4. Noise Overlay (Optional premium feel)
      */}

            {/* Glow Effects Container - Fixed so it stays while scrolling if desired, 
          or absolute if it should move with page. 
          User said "background theme... exactly like my screenshot... global landing background".
          Usually background gradients are fixed or absolute covering the entire scrollable area.
          Given "wrapper... wrapping ALL landing sections", absolute covering the relative parent works well.
      */}

            <div className="fixed inset-0 z-0 pointer-events-none">
                {/* Teal Glow - Top Right */}
                <div
                    className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] rounded-full"
                    style={{
                        background: 'radial-gradient(circle at center, rgba(20, 184, 166, 0.15) 0%, rgba(20, 184, 166, 0.05) 40%, transparent 70%)',
                        filter: 'blur(60px)',
                    }}
                />

                {/* Pink Glow - Bottom Left */}
                <div
                    className="absolute bottom-[-10%] left-[-5%] w-[800px] h-[800px] rounded-full"
                    style={{
                        background: 'radial-gradient(circle at center, rgba(236, 72, 153, 0.15) 0%, rgba(236, 72, 153, 0.05) 40%, transparent 70%)',
                        filter: 'blur(60px)',
                    }}
                />

                {/* Noise Overlay (Optional) */}
                <div
                    className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'repeat',
                    }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
