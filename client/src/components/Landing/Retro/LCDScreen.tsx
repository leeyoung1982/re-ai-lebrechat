import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LCDScreenProps {
    message: string;
}

const LCDScreen: React.FC<LCDScreenProps> = ({ message }) => {
    return (
        <div className="w-full bg-[#1c1c1c] rounded-md p-1 shadow-[inset_0px_2px_4px_rgba(0,0,0,0.5)] border-b border-gray-600">
            <div className="h-10 w-full bg-[#2a2a2a] rounded overflow-hidden flex items-center px-3 relative">
                {/* Scanline effect */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_2px,3px_100%]" />

                {/* Text */}
                <AnimatePresence mode="wait">
                    <motion.p
                        key={message}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="font-mono text-orange-500 text-xs tracking-wider uppercase truncate w-full"
                        style={{ textShadow: '0 0 2px rgba(249, 115, 22, 0.5)' }}
                    >
                        {'>'} {message}
                        <motion.span
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                            className="ml-1 inline-block w-2 h-3 bg-orange-500 align-middle"
                        />
                    </motion.p>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LCDScreen;
