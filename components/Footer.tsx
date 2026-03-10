'use client';

import Link from 'next/link';
import { Facebook, Instagram, Twitter, Youtube, Linkedin, Globe, Mail, Phone, MapPin, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

// ─── Types (mirror footer_config sections) ────────────────────────
interface SocialLink { platform: string; url: string; icon: string; }
interface LinkItem { label: string; url: string; open_new_tab: boolean; }
interface LinkColumn { column_title: string; items: LinkItem[]; }
interface Company { logo_url: string; tagline: string; description: string; copyright: string; }
interface Contact { address: string; phone: string; email: string; hours: string; }
interface LegalLink { label: string; url: string; }
interface Newsletter { enabled: boolean; heading: string; subtext: string; }
interface BottomBar { text: string; }

interface FooterData {
    company: Company;
    links: LinkColumn[];
    social: SocialLink[];
    contact: Contact;
    legal: LegalLink[];
    newsletter: Newsletter;
    bottom_bar: BottomBar;
}

// ─── Icon map ─────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
    facebook: Facebook, instagram: Instagram,
    twitter: Twitter, youtube: Youtube, linkedin: Linkedin,
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ─── Component ────────────────────────────────────────────────────
export default function Footer() {
    const [data, setData] = useState<FooterData | null>(null);

    useEffect(() => {
        fetch(`${API_URL}/api/footer`)
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

    return (
        <footer className="border-t border-light-border bg-cream">

            {/* ── Newsletter CTA (only if enabled in CMS) ── */}
            {newsletter?.enabled && (
                <div className="bg-burgundy/5 border-b border-light-border py-8">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="font-serif text-base font-semibold text-burgundy">
                                {newsletter.heading || 'Stay In The Loop'}
                            </h3>
                            <p className="text-sm text-warm-gray mt-0.5">
                                {newsletter.subtext || ''}
                            </p>
                        </div>
                        <form
                            onSubmit={e => e.preventDefault()}
                            className="flex gap-2 w-full sm:w-auto"
                        >
                            <input
                                type="email"
                                placeholder="Your email address"
                                className="flex-1 sm:w-64 rounded-lg border border-light-border px-3 py-2 text-sm focus:outline-none focus:border-wine-gold bg-white"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-burgundy text-white text-sm font-semibold rounded-lg hover:bg-burgundy/90 transition-colors whitespace-nowrap"
                            >
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Main footer body ── */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_repeat(3,1fr)]">

                    {/* Brand column */}
                    <div>
                        <Link href="/" className="flex items-center gap-2">
                            {company?.logo_url
                                ? <img src={company.logo_url} alt="Logo" className="h-20 w-auto" />
                                : <span className="flex items-center gap-2">
                                    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" className="text-[#3B5D3B]">
                                        <path d="M16 2C16 2 8 8 8 16C8 20.4 11.6 24 16 24C20.4 24 24 20.4 24 16C24 8 16 2 16 2Z" fill="currentColor" opacity="0.2" />
                                        <path d="M16 4C16 4 10 9 10 16C10 19.3 12.7 22 16 22C19.3 22 22 19.3 22 16C22 9 16 4 16 4Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                        <path d="M16 8V18" stroke="currentColor" strokeWidth="1.2" />
                                        <path d="M13 12C13 12 14.5 14 16 14C17.5 14 19 12 19 12" stroke="currentColor" strokeWidth="1" fill="none" />
                                    </svg>
                                    <span className="font-serif text-xl font-bold tracking-wide text-[#3B5D3B]">Vedashi</span>
                                </span>
                            }
                        </Link>

                        {company?.tagline && (
                            <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-wine-gold">
                                {company.tagline}
                            </p>
                        )}

                        <p className="mt-2 text-sm text-warm-gray leading-relaxed">
                            {company?.description || 'Vedashi blends ancient Ayurvedic wisdom with modern clinical precision to bring you authentic wellness solutions for the contemporary soul.'}
                        </p>

                        {/* Social icons */}
                        {social.length > 0 && (
                            <div className="mt-4 flex gap-3">
                                {social.map((s, i) => {
                                    const Icon = ICON_MAP[s.icon?.toLowerCase()] ?? Globe;
                                    const url = s.url?.trim() || '#';
                                    return (
                                        <a
                                            key={i}
                                            href={url}
                                            target={url !== '#' ? '_blank' : undefined}
                                            rel="noopener noreferrer"
                                            title={s.platform}
                                            className="text-wine-gold hover:text-burgundy transition-colors"
                                        >
                                            <Icon className="h-4 w-4" />
                                        </a>
                                    );
                                })}
                            </div>
                        )}

                        {/* Contact info */}
                        {contact && (
                            <ul className="mt-5 space-y-2 text-xs text-warm-gray">
                                {contact.address && (
                                    <li className="flex items-start gap-2">
                                        <MapPin className="h-3.5 w-3.5 mt-0.5 text-wine-gold flex-shrink-0" />
                                        {contact.address}
                                    </li>
                                )}
                                {contact.phone && (
                                    <li className="flex items-center gap-2">
                                        <Phone className="h-3.5 w-3.5 text-wine-gold flex-shrink-0" />
                                        <a href={`tel:${contact.phone}`} className="hover:text-burgundy transition-colors">
                                            {contact.phone}
                                        </a>
                                    </li>
                                )}
                                {contact.email && (
                                    <li className="flex items-center gap-2">
                                        <Mail className="h-3.5 w-3.5 text-wine-gold flex-shrink-0" />
                                        <a href={`mailto:${contact.email}`} className="hover:text-burgundy transition-colors">
                                            {contact.email}
                                        </a>
                                    </li>
                                )}
                                {contact.hours && (
                                    <li className="flex items-center gap-2">
                                        <Clock className="h-3.5 w-3.5 text-wine-gold flex-shrink-0" />
                                        {contact.hours}
                                    </li>
                                )}
                            </ul>
                        )}
                    </div>

                    {/* Dynamic nav columns from CMS */}
                    {columns.map((col, ci) => (
                        <div key={ci}>
                            <h4 className="font-serif text-sm font-semibold text-wine-gold mb-4">
                                {col.column_title}
                            </h4>
                            <ul className="space-y-2">
                                {col.items.map((item, ii) => (
                                    <li key={ii}>
                                        <a
                                            href={item.url || '#'}
                                            target={item.open_new_tab ? '_blank' : undefined}
                                            rel={item.open_new_tab ? 'noopener noreferrer' : undefined}
                                            className="text-sm text-warm-gray hover:text-burgundy transition-colors"
                                        >
                                            {item.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* ── Bottom bar ── */}
                <div className="mt-10 border-t border-light-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-warm-gray">
                        {company?.copyright || `© ${new Date().getFullYear()} Vedashi Wellness. All rights reserved.`}
                    </p>
                    {legal.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                            {legal.map((l, i) => (
                                <a
                                    key={i}
                                    href={l.url || '#'}
                                    className="text-xs text-warm-gray hover:text-burgundy transition-colors"
                                >
                                    {l.label}
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Compliance / bottom bar text ── */}
                {bottomBar?.text && (
                    <p className="mt-3 text-center text-[11px] text-warm-gray/60">
                        {bottomBar.text}
                    </p>
                )}
            </div>
        </footer>
    );
}
