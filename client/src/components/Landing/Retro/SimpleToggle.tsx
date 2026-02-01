import React from 'react';
import { motion } from 'framer-motion';

interface SimpleToggleProps {
    label: string;
    isOn?: boolean;
    onToggle?: () => void;
}

const SimpleToggle: React.FC<SimpleToggleProps> = ({ label, isOn, onToggle }) => {
    return (
        <div className="flex flex-col items-center gap-3">
            <div
                className="relative w-16 h-28 bg-gray-200 rounded-xl shadow-inner border border-gray-300 flex justify-center p-2 cursor-pointer"
                onClick={onToggle}
            >
                {/* Track Slot */}
                <div className="absolute inset-x-5 top-4 bottom-4 bg-gray-800/10 rounded-full shadow-inner" />

                {/* The Physical Switch */}
                <motion.div
                    className="absolute w-12 h-12 rounded-lg bg-gradient-to-b from-[#E91E63] to-[#C2185B] shadow-[0px_4px_6px_rgba(0,0,0,0.3),inset_0px_1px_0px_rgba(255,255,255,0.3)] z-10 border border-[#ad1457]"
                    initial={false}
                    animate={{
                        y: isOn ? 0 : 50,
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30
                    }}
                >
                    {/* Grip Lines */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-4 flex flex-col justify-between opacity-30">
                        <div className="w-full h-0.5 bg-black rounded-full" />
                        <div className="w-full h-0.5 bg-black rounded-full" />
                        <div className="w-full h-0.5 bg-black rounded-full" />
                    </div>
                </motion.div>

                {/* Labels */}
                <span className="absolute top-2 right-2 text-[8px] font-bold text-gray-400">ON</span>
                <span className="absolute bottom-2 right-2 text-[8px] font-bold text-gray-400">OFF</span>
            </div>
            <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">{label}</span>

            {/* LED Indicator */}
            <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${isOn ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'bg-red-900'}`} />
        </div>
    );
};

export default SimpleToggle;
