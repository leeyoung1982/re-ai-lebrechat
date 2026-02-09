import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Library, Radio } from 'lucide-react';
import KnobControl from './KnobControl';
import PushButton from './PushButton';
import SimpleToggle from './SimpleToggle';
import LCDScreen from './LCDScreen';
import { useNavigate } from 'react-router-dom';

const RetroPanel: React.FC = () => {
    const [lcdMessage, setLcdMessage] = useState('READY FOR INPUT');
    const [isDoormatVisible, setIsDoormatVisible] = useState(false);
    const navigate = useNavigate();

    const handleHover = (msg: string | null) => {
        if (msg) {
            setLcdMessage(msg);
        } else {
            setLcdMessage('WAITING FOR SIGNAL...');
        }
    };

    const handleTurnOn = () => {
        // Navigate to login or new chat if authenticated
        // For now, we'll simulate a turn on effect
        navigate('/login');
    };

    return (
        <div className="relative">
            {/* Device Body */}
            <div className="relative w-full max-w-2xl bg-[#EAEAEA] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15),0_1px_0_rgba(255,255,255,0.5) inset] border border-gray-300 p-8 sm:p-12 transition-all">

                {/* Branding Area */}
                <div className="absolute top-6 left-8 flex items-center gap-3">
                    {/* Logo placeholder - using a simple div for now or an image if available */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-pink-600 animate-pulse shadow-md" />
                    <div>
                        <h1 className="text-gray-900 font-bold text-sm tracking-tight">AI RADIO</h1>
                        <p className="text-[9px] text-gray-500 font-mono tracking-widest uppercase">Model AR-001</p>
                    </div>
                </div>

                {/* Speaker Grille Detail */}
                <div className="absolute top-6 right-8 flex gap-1">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="w-1 h-8 bg-gray-300 rounded-full shadow-inner" />
                    ))}
                </div>

                {/* Main Controls Layout */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-[1.2fr_1.5fr_0.5fr] gap-12 items-end">

                    {/* 1. Channel Knob */}
                    <div className="flex justify-center md:border-r border-gray-300 md:pr-8">
                        <KnobControl
                            label="CHANNELS"
                            onClick={() => navigate('/agents')}
                            onHover={(h) => handleHover(h ? "TUNING INTO AI AGENTS..." : null)}
                        />
                    </div>

                    {/* 2. Freestyle Buttons */}
                    <div className="flex flex-col gap-6 justify-center items-center">
                        <div className="flex gap-4">
                            <PushButton
                                label="FREESTYLE"
                                icon={<MessageSquare size={16} />}
                                onClick={() => navigate('/c/new')}
                                onHover={(h) => handleHover(h ? "DIRECT LINK TO LLMS" : null)}
                            />
                            <PushButton
                                label="LIBRARY"
                                icon={<Library size={16} />}
                                onClick={() => navigate('/search')}
                                onHover={(h) => handleHover(h ? "ACCESSING ARCHIVES" : null)}
                            />
                        </div>
                        {/* LCD Screen sits below buttons */}
                        <div className="w-full max-w-[240px]">
                            <LCDScreen message={lcdMessage} />
                        </div>
                    </div>

                    {/* 3. Power Switch */}
                    <div className="flex justify-center md:border-l border-gray-300 md:pl-8">
                        <SimpleToggle
                            label="POWER"
                            isOn={false}
                            onToggle={handleTurnOn}
                        />
                    </div>
                </div>

            </div>

            {/* Reflection / Ground Shadow */}
            <div className="absolute -bottom-8 left-10 right-10 h-8 bg-black/5 blur-xl rounded-full" />
        </div>
    );
};

export default RetroPanel;
