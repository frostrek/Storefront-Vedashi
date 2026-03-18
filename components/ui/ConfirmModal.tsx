'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDestructive?: boolean;
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    isDestructive = true,
}: ConfirmModalProps) {
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-300 border border-white/20">
                <div className="p-6">
                    <h3 className="font-serif text-xl font-bold text-[#1A1A1A] mb-2">{title}</h3>
                    <p className="text-[#4A4A4A] text-sm leading-relaxed">{message}</p>
                </div>
                <div className="bg-[#F5F4F0] px-6 py-4 flex items-center justify-end gap-3 rounded-b-xl border-t border-[#E8E4DC]">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-[#4A4A4A] hover:bg-black/5 transition-colors focus:ring-2 focus:ring-[#E8E4DC] focus:outline-none"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors shadow-sm focus:ring-2 focus:ring-offset-1 focus:outline-none ${
                            isDestructive 
                                ? 'bg-[#C0392B] hover:bg-[#A93226] focus:ring-[#C0392B]/50' 
                                : 'bg-[#6B8F5E] hover:bg-[#5A7A4E] focus:ring-[#6B8F5E]/50'
                        }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
