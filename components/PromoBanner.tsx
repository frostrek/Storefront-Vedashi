'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { API_URL } from '@/lib/api';

// API_URL imported from @/lib/api

type FlowType = 'static' | 'blink' | 'marquee-left' | 'marquee-right' | 'fade' | 'typewriter' | 'bounce' | 'glow';

interface BannerData {
    message: string;
    flow: FlowType;
    background_color: string;
    text_color: string;
    total_count: number;
}

export default function PromoBanner() {
    const pathname = usePathname();
    const [banner, setBanner] = useState<BannerData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (pathname?.endsWith('/login') || pathname?.endsWith('/signup')) {
            setLoading(false);
            return;
        }

        const fetchBanner = async () => {
            try {
                // Extract country slug from pathname (e.g., /ru/shop -> ru)
                const segments = pathname?.split('/').filter(Boolean) || [];
                const country = segments[0] || '';
                const countryParam = country ? `?country=${country}` : '';

                const res = await fetch(`${API_URL}/api/promo-banners/active${countryParam}`, { credentials: 'include' });
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const data = await res.json();
                if (data.success && data.data) {
                    setBanner(data.data);
                }
            } catch (err) {
                console.warn('Promo banner unavailable (background fetch failed)');
            } finally {
                setLoading(false);
            }
        };

        fetchBanner();
    }, [pathname]);

    if (loading || !banner || pathname?.endsWith('/login') || pathname?.endsWith('/signup')) return null;

    const isMarquee = banner.flow === 'marquee-left' || banner.flow === 'marquee-right';
    const count = Math.max(1, banner.total_count || 1);
    const messageArray = Array(count).fill(banner.message);

    // Get effect class for non-marquee effects
    const getEffectClass = () => {
        switch (banner.flow) {
            case 'blink': return 'animate-promo-blink';
            case 'fade': return 'animate-promo-fade';
            case 'typewriter': return 'animate-promo-typewriter';
            case 'bounce': return 'animate-promo-bounce';
            case 'glow': return 'animate-promo-glow';
            default: return '';
        }
    };

    // --- MARQUEE LAYOUT ---
    if (isMarquee) {
        const direction = banner.flow === 'marquee-left' ? 'animate-promo-marquee-left' : 'animate-promo-marquee-right';
        return (
            <div
                style={{ backgroundColor: banner.background_color || '#EAE4D3', color: banner.text_color || '#4F1A24' }}
                className="text-[12px] overflow-hidden py-2 border-b border-[#D5CAA4]"
            >
                <div className={`flex w-max ${direction}`}>
                    {/* First copy */}
                    <div className="flex shrink-0 items-center gap-16 px-8">
                        {messageArray.map((msg, i) => (
                            <span key={`a-${i}`} className="whitespace-nowrap font-bold tracking-[0.2em] font-accent text-sm">{msg}</span>
                        ))}
                    </div>
                    {/* Second copy for seamless loop */}
                    <div className="flex shrink-0 items-center gap-16 px-8">
                        {messageArray.map((msg, i) => (
                            <span key={`b-${i}`} className="whitespace-nowrap font-bold tracking-[0.2em] font-accent text-sm">{msg}</span>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // --- STATIC / OTHER EFFECTS LAYOUT ---
    return (
        <div
            style={{ backgroundColor: banner.background_color || '#EAE4D3', color: banner.text_color || '#4F1A24' }}
            className="text-[12px] overflow-hidden py-2 border-b border-[#D5CAA4]"
        >
            <div className="relative w-full px-4 mx-auto max-w-[1600px]">
                <div className={`flex whitespace-nowrap font-bold tracking-[0.2em] font-accent text-sm ${count > 1 ? 'justify-between' : 'justify-center'} w-full ${getEffectClass()}`}>
                    {messageArray.map((msg, index) => (
                        <span key={index}>{msg}</span>
                    ))}
                </div>
            </div>
        </div>
    );
}
