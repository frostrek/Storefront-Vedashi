'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Facebook, Instagram, Twitter, Youtube, Linkedin, Globe, Mail, Phone, MapPin, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import RegionSwitcher from './RegionSwitcher';
import GoogleTranslateWidget from './GoogleTranslateWidget';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface FooterData {
    company?: {
        name: string;
        description: string;
        logo_url?: string;
    };
    links?: Array<{
        title: string;
        items: Array<{ label: string; href: string }>;
    }>;
    social?: Array<{
        platform: string;
        url: string;
        icon_name?: string;
    }>;
    contact?: {
        email?: string;
        phone?: string;
        address?: string;
        hours?: string;
    };
    legal?: Array<{ label: string; href: string }>;
    newsletter?: {
        title: string;
        description: string;
    };
    bottom_bar?: {
        copyright: string;
        text: string;
    };
}

export default function Footer() {
    const pathname = usePathname();
    const [data, setData] = useState<FooterData | null>(null);


    useEffect(() => {
        fetch(`${API_URL}/api/footer`, { credentials: 'include' })
            .then(r => r.json())
            .then(res => { if (res.success) setData(res.data); })
            .catch(() => { });
    }, []);

    // Shorthand helpers with safe fallbacks
    const company = data?.company;
    const columns = data?.links ?? [];
    const social = data?.social ?? [];
    const contact = data?.contact;
    const legal = data?.legal ?? [];
    const newsletter = data?.newsletter;
    const bottomBar = data?.bottom_bar;

    if (pathname?.endsWith('/login') || pathname?.endsWith('/signup')) return null;

    return (
        <footer className="bg-[#FAFAF5] text-[#4a4a4a] border-t border-[#e8e8e0]">
            {/* ── Main footer body ── */}
            <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-10">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">

                    {/* Brand column */}
                    <div>
                        <Link href="/" className="flex items-center gap-2 mb-4 group">
                            <img src="/vedashi-logo.png" alt="Vedashi" className="h-16 w-auto object-contain" />
                        </Link>
                        <p className="text-sm leading-relaxed text-[#6b6b6b] max-w-[260px]">
                            Nurturing your journey towards holistic health through the ancient wisdom of Ayurveda.
                        </p>

                        {/* Social icons */}
                        <div className="mt-4 flex gap-3">
                            <a href="#" aria-label="Instagram" className="text-[#6b6b6b] hover:text-[#3B5D3B] transition-colors">
                                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                            </a>
                            <a href="#" aria-label="Twitter" className="text-[#6b6b6b] hover:text-[#3B5D3B] transition-colors">
                                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                                </svg>
                            </a>
                            <a href="#" aria-label="Facebook" className="text-[#6b6b6b] hover:text-[#3B5D3B] transition-colors">
                                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Explore column */}
                    <div>
                        <h4 className="font-semibold text-[#333] text-base mb-3">Explore</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/about" className="text-sm text-[#6b6b6b] hover:text-[#3B5D3B] transition-colors">
                                    Our Story
                                </Link>
                            </li>
                            <li>
                                <Link href="/practitioners" className="text-sm text-[#6b6b6b] hover:text-[#3B5D3B] transition-colors">
                                    Practitioners
                                </Link>
                            </li>
                            <li>
                                <Link href="/products" className="text-sm text-[#6b6b6b] hover:text-[#3B5D3B] transition-colors">
                                    Natural Products
                                </Link>
                            </li>
                            <li>
                                <Link href="/quiz" className="text-sm text-[#6b6b6b] hover:text-[#3B5D3B] transition-colors">
                                    Ayurvedic Quiz
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support column */}
                    <div>
                        <h4 className="font-semibold text-[#333] text-base mb-3">Support</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/help" className="text-sm text-[#6b6b6b] hover:text-[#3B5D3B] transition-colors">
                                    Help Center
                                </Link>
                            </li>
                            <li>
                                <Link href="/faq" className="text-sm text-[#6b6b6b] hover:text-[#3B5D3B] transition-colors">
                                    Consultation FAQ
                                </Link>
                            </li>
                            <li>
                                <Link href="/shipping" className="text-sm text-[#6b6b6b] hover:text-[#3B5D3B] transition-colors">
                                    Shipping Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="text-sm text-[#6b6b6b] hover:text-[#3B5D3B] transition-colors">
                                    Privacy
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter column */}
                    <div>
                        <h4 className="font-semibold text-[#333] text-base mb-3">Newsletter</h4>
                        <p className="text-sm text-[#6b6b6b] leading-relaxed mb-4">
                            Join our community for weekly wellness rituals.
                        </p>
                        <form onSubmit={e => e.preventDefault()} className="flex gap-2" suppressHydrationWarning>
                            <input
                                suppressHydrationWarning
                                type="email"
                                placeholder="Your email"
                                className="flex-1 min-w-0 rounded-md px-3 py-2 text-sm bg-white border border-[#d9d9d0] focus:outline-none focus:border-[#3B5D3B] focus:ring-1 focus:ring-[#3B5D3B]/20 placeholder:text-[#aaa] text-[#333] transition-all"
                            />
                            <button
                                suppressHydrationWarning
                                type="submit"
                                className="px-5 py-2 bg-[#3B5D3B] text-white text-sm font-medium rounded-md hover:bg-[#2d472d] transition-colors whitespace-nowrap"
                            >
                                Join
                            </button>
                        </form>
                    </div>
                </div>

                {/* ── Bottom bar ── */}
                <div className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#e8e8e0]">
                    <p className="text-xs text-[#999]">
                        © 2026 Vedashi. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <RegionSwitcher upward={true} />
                        <GoogleTranslateWidget upward={true} />
                        <p className="text-xs text-[#999] italic">
                            Gently crafted for modern balance.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
