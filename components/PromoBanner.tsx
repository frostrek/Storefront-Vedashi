'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

interface BannerData {
    message: string;
    flow: 'static' | 'blink';
    background_color: string;
    text_color: string;
    total_count: number;
}

export default function PromoBanner() {
    const pathname = usePathname();
    const [banner, setBanner] = useState<BannerData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Skip fetching on auth pages
        if (pathname?.endsWith('/login') || pathname?.endsWith('/signup')) {
            setLoading(false);
            return;
        }

        const fetchBanner = async () => {
            try {
                const res = await fetch(`${API_URL}/api/promo-banners/active`, { credentials: 'include' });
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const data = await res.json();
                if (data.success && data.data) {
                    setBanner(data.data);
                }
            } catch (err) {
                // Silent error to avoid console noise, just hide banner
                console.warn('Promo banner unavailable (background fetch failed)');
            } finally {
                setLoading(false);
            }
        };

        fetchBanner();
    }, [pathname]);

    if (loading || !banner || pathname?.endsWith('/login') || pathname?.endsWith('/signup')) return null;

    let contentClass = 'text-center font-bold tracking-[0.2em]';

    if (banner.flow === 'blink') contentClass = 'animate-blink text-center font-bold tracking-[0.2em]';

    const renderMessage = () => {
        const count = Math.max(1, banner.total_count || 1); // Ensure at least 1 replica
        const messageArray = Array(count).fill(banner.message);

        return (
            <div className={`flex whitespace-nowrap ${count > 1 ? 'justify-between w-full' : 'justify-center w-full'}`}>
                {messageArray.map((msg, index) => (
                    <span key={index}>
                        {msg}
                    </span>
                ))}
            </div>
        );
    };

    return (
        <div style={{ backgroundColor: banner.background_color || '#EAE4D3', color: banner.text_color || '#4F1A24' }} className="text-[12px] overflow-hidden py-2 border-b border-[#D5CAA4]">
            <div className={`relative w-full px-4 mx-auto max-w-[1600px]`}>
                <div className={contentClass}>
                    {renderMessage()}
                </div>
            </div>
        </div>
    );
}
