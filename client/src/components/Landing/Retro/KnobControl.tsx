import React from 'react';
import { motion } from 'framer-motion';

interface KnobControlProps {
    label: string;
    onClick?: () => void;
    onHover?: (isHovering: boolean) => void;
}

const KnobControl: React.FC<KnobControlProps> = ({ label, onClick, onHover }) => {
    return (
        <div className="flex flex-col items-center gap-3">
            <motion.div
                className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-gray-200 to-gray-50 shadow-[4px_4px_10px_rgba(0,0,0,0.1),-4px_-4px_10px_rgba(255,255,255,0.8)] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                whileHover={{ rotate: 15 }}
                onClick={onClick}
                onMouseEnter={() => onHover?.(true)}
                onMouseLeave={() => onHover?.(false)}
            >
                {/* Outer Ring Detail */}
                <div className="absolute inset-1 rounded-full border border-gray-300/50" />

                {/* Inner Knob Gradient */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-300 shadow-inner flex items-center justify-center">
                    {/* Indicator Line */}
                    <div className="w-1 h-8 bg-orange-500 rounded-full absolute -top-2 transform -translate-y-1/2" />
                    <div className="w-2 h-2 rounded-full bg-gray-400/30" />
                </div>
            </motion.div>
            <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">{label}</span>
        </div>
    );
};

export default KnobControl;
