'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface LegalModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export default function LegalModal({
    isOpen,
    onClose,
    title,
    children,
}: LegalModalProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isMounted || !isOpen) return null;

    return createPortal(
        <div 
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-[#FAF7F2] w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col transform transition-all scale-100 animate-in zoom-in-95 duration-300 border border-white/20">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#E8E4DC] bg-white">
                    <div>
                        <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] tracking-tight">{title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-[#F5F4F0] transition-colors text-[#6b7b6b] hover:text-[#1A1A1A] cursor-pointer"
                        aria-label="Close modal"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-hide">
                    <div className="legal-rich-text max-w-none text-[#4A4A4A]">
                        {children}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#E8E4DC] bg-white flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl text-sm font-semibold text-white bg-[#1e3d1e] hover:bg-[#2d5a2d] transition-all shadow-lg shadow-[#1e3d1e]/20 cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
