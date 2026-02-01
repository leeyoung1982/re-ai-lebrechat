import React from 'react';
import RetroPanel from '../components/Landing/Retro/RetroPanel';
import { useAuthContext } from '../hooks/AuthContext';
import { Navigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
    const { isAuthenticated } = useAuthContext();

    // Optionally redirect authenticated users directly to chat
    // if (isAuthenticated) {
    //   return <Navigate to="/c/new" replace />;
    // }

    // For this design, we might want to show the cool landing page even for logged in users,
    // letting them use the panel to navigate.

    return (
        <div className="min-h-screen w-full bg-[#f0f0f0] flex flex-col items-center justify-center p-4 overflow-hidden relative font-sans">
            {/* Background Texture/Noise could be added here */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

            <div className="z-10 w-full flex flex-col items-center gap-12">
                <RetroPanel />

                {/* Footer Credit */}
                <p className="text-gray-400 text-xs font-mono tracking-widest uppercase opacity-60">
                    RELOAD AI INFRASTRUCTURE © 2026
                </p>
            </div>
        </div>
    );
};

export default LandingPage;
