import React from 'react';
import { motion } from 'framer-motion';

interface PushButtonProps {
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    onHover?: (isHovering: boolean) => void;
}

const PushButton: React.FC<PushButtonProps> = ({ label, icon, onClick, onHover }) => {
    return (
        <div className="flex flex-col items-center gap-2">
            <motion.button
                className="relative group w-28 h-12 bg-gray-100 rounded-md shadow-[0px_4px_0px_rgba(180,180,180,1),0px_4px_8px_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-[4px] border border-gray-200 flex items-center justify-center transition-all"
                onClick={onClick}
                onMouseEnter={() => onHover?.(true)}
                onMouseLeave={() => onHover?.(false)}
                whileTap={{ scale: 0.98 }}
            >
                <div className="flex items-center gap-2 grayscale group-hover:grayscale-0 transition-all text-gray-600 group-hover:text-gray-800">
                    {icon}
                    <span className="text-xs font-semibold tracking-wide">{label}</span>
                </div>
            </motion.button>
        </div>
    );
};

export default PushButton;
