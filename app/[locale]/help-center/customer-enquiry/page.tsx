'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    ChevronLeft, Send, Star, CheckCircle, Sparkles,
    Lightbulb, MessageCircle, Bug, MoreHorizontal,
    User, Mail, FileText, Clock, ShieldCheck, Users, Zap
} from 'lucide-react';
import { submitFeedback } from '@/lib/api';
import toast from 'react-hot-toast';

const TYPES = [
    { value: 'suggestion', label: 'Suggestion', Icon: Lightbulb },
    { value: 'complaint', label: 'Complaint', Icon: MessageCircle },
    { value: 'bug_report', label: 'Bug Report', Icon: Bug },
    { value: 'other', label: 'Other', Icon: MoreHorizontal },
];

export default function CustomerEnquiryPage() {
    const [form, setForm] = useState({
        name: '', email: '', type: 'suggestion', subject: '', message: '', rating: 0,
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.name.trim()) e.name = 'Full name is required';
        if (!form.email.trim()) e.email = 'Email address is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
        if (!form.subject.trim()) e.subject = 'Subject is required';
        if (!form.message.trim()) e.message = 'Message is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setSubmitting(true);
        try {
            const result = await submitFeedback({
                name: form.name || undefined,
                email: form.email || undefined,
                type: form.type,
                subject: form.subject || undefined,
                message: form.message,
                rating: form.rating || undefined,
            });
            if (result.success) {
                setSubmitted(true);
            } else {
                toast.error(result.message || 'Failed to submit enquiry');
            }
        } catch {
            toast.error('Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const clearField = (field: string) => {
        if (errors[field]) {
            const next = { ...errors };
            delete next[field];
            setErrors(next);
        }
    };

    /* ═══════ SUCCESS STATE ═══════ */
    if (submitted) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-6">
                <div className="text-center bg-white rounded-[60px] p-16 border border-[#4A5D23]/5 shadow-2xl max-w-lg w-full">
                    <div className="w-24 h-24 rounded-[30px] bg-[#4A5D23]/10 flex items-center justify-center mx-auto mb-10">
                        <CheckCircle className="h-10 w-10 text-[#4A5D23]" />
                    </div>
                    <h2 className="text-3xl font-serif font-bold text-[#1a2408] mb-4">Message Sent!</h2>
                    <p className="text-[#5B4A31] mb-10 font-medium">Your inquiry has been received. Our wellness guards will review your scroll shortly.</p>
                    <div className="flex flex-col gap-4">
                        <Link
                            href="/help-center"
                            className="inline-flex items-center justify-center gap-3 bg-[#4A5D23] text-white px-10 py-5 rounded-[20px] font-black uppercase tracking-widest text-sm hover:bg-[#3a491b] transition-all shadow-xl"
                        >
                            Return to Help Hub
                        </Link>
                        <button
                            onClick={() => {
                                setSubmitted(false);
                                setForm({ name: '', email: '', type: 'suggestion', subject: '', message: '', rating: 0 });
                                setErrors({});
                            }}
                            className="inline-flex items-center justify-center gap-3 border border-[#4A5D23]/10 text-[#5B4A31] px-10 py-5 rounded-[20px] font-black uppercase tracking-widest text-sm hover:bg-gray-50 transition-all cursor-pointer"
                        >
                            Another Inquiry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7]">
            {/* ═══════ HERO SECTION ═══════ */}
            <section className="relative overflow-hidden py-24 px-6 border-b border-[#4A5D23]/10">
                {/* Ayurvedic Texture Background */}
                <div 
                    className="absolute inset-0 z-0 opacity-20 bg-repeat bg-center"
                    style={{ 
                        backgroundImage: "url('/ayurvedic-texture.png')",
                        backgroundSize: '400px',
                        filter: 'sepia(0.2) contrast(1.1)'
                    }}
                ></div>

                <div className="max-w-xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-3 bg-[#4A5D23]/10 backdrop-blur-sm border border-[#4A5D23]/10 rounded-full px-5 py-2 mb-8">
                        <Sparkles className="h-4 w-4 text-[#4A5D23]" />
                        <span className="text-[10px] font-black tracking-[0.2em] uppercase text-[#4A5D23]">Sacred Support</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-serif font-bold text-[#1a2408] mb-6 leading-tight">
                        Customer Inquiry
                    </h1>

                    <p className="text-[#5B4A31]/60 text-lg font-medium max-w-md mx-auto italic">
                        Share your thoughts or seek guidance. We are here to help you flourish.
                    </p>
                </div>
            </section>

            {/* ═══════ FORM SECTION ═══════ */}
            <div className="max-w-3xl mx-auto px-6 -mt-12 relative z-20 pb-24">
                <form onSubmit={handleSubmit} className="bg-white rounded-[60px] border border-[#4A5D23]/5 shadow-[0_32px_64px_-16px_rgba(74,93,35,0.08)] overflow-hidden">
                    <div className="p-10 md:p-16">
                        {/* ── Inquiry Type ── */}
                        <div className="mb-12">
                            <label className="block text-xs font-black uppercase tracking-[0.2em] text-[#1a2408] mb-6">
                                Inquiry Type <span className="text-red-400">*</span>
                            </label>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {TYPES.map((t) => {
                                    const active = form.type === t.value;
                                    return (
                                        <button
                                            key={t.value}
                                            type="button"
                                            onClick={() => setForm({ ...form, type: t.value })}
                                            className={`flex flex-col items-center gap-4 p-6 rounded-[32px] border-2 transition-all cursor-pointer group ${active
                                                ? 'bg-[#4A5D23] text-white border-[#4A5D23] shadow-xl shadow-[#4A5D23]/20'
                                                : 'bg-[#FDFBF7] text-[#5B4A31] border-transparent hover:border-[#4A5D23]/20 hover:bg-white'
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${active ? 'bg-white/20' : 'bg-white shadow-sm group-hover:bg-[#4A5D23]/10'}`}>
                                                <t.Icon className={`h-6 w-6 ${active ? 'text-white' : 'text-[#4A5D23]'}`} />
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-widest">{t.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── Name + Email ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div>
                                <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#1a2408] mb-4">
                                    <User className="h-4 w-4 text-[#4A5D23]" />
                                    Full Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => { setForm({ ...form, name: e.target.value }); clearField('name'); }}
                                    placeholder="Your full name"
                                    className={`w-full px-6 py-4 rounded-[20px] bg-[#FDFBF7] border-2 text-base font-medium focus:outline-none focus:ring-4 focus:ring-[#4A5D23]/5 focus:border-[#4A5D23] transition-all placeholder-[#5B4A31]/20 ${errors.name ? 'border-red-200' : 'border-transparent'}`}
                                />
                                {errors.name && <p className="text-xs text-red-500 font-bold mt-2 uppercase tracking-wide">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#1a2408] mb-4">
                                    <Mail className="h-4 w-4 text-[#4A5D23]" />
                                    Email <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => { setForm({ ...form, email: e.target.value }); clearField('email'); }}
                                    placeholder="your@email.com"
                                    className={`w-full px-6 py-4 rounded-[20px] bg-[#FDFBF7] border-2 text-base font-medium focus:outline-none focus:ring-4 focus:ring-[#4A5D23]/5 focus:border-[#4A5D23] transition-all placeholder-[#5B4A31]/20 ${errors.email ? 'border-red-200' : 'border-transparent'}`}
                                />
                                {errors.email && <p className="text-xs text-red-500 font-bold mt-2 uppercase tracking-wide">{errors.email}</p>}
                            </div>
                        </div>

                        {/* ── Subject ── */}
                        <div className="mb-8">
                            <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#1a2408] mb-4">
                                <FileText className="h-4 w-4 text-[#4A5D23]" />
                                Subject <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.subject}
                                onChange={(e) => { setForm({ ...form, subject: e.target.value }); clearField('subject'); }}
                                placeholder="What's on your mind?"
                                className={`w-full px-6 py-4 rounded-[20px] bg-[#FDFBF7] border-2 text-base font-medium focus:outline-none focus:ring-4 focus:ring-[#4A5D23]/5 focus:border-[#4A5D23] transition-all placeholder-[#5B4A31]/20 ${errors.subject ? 'border-red-200' : 'border-transparent'}`}
                            />
                            {errors.subject && <p className="text-xs text-red-500 font-bold mt-2 uppercase tracking-wide">{errors.subject}</p>}
                        </div>

                        {/* ── Message ── */}
                        <div className="mb-10">
                            <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#1a2408] mb-4">
                                <MessageCircle className="h-4 w-4 text-[#4A5D23]" />
                                Message <span className="text-red-400">*</span>
                            </label>
                            <textarea
                                value={form.message}
                                onChange={(e) => { setForm({ ...form, message: e.target.value }); clearField('message'); }}
                                placeholder="Describe your inquiry in detail..."
                                rows={6}
                                maxLength={5000}
                                className={`w-full px-6 py-4 rounded-[30px] bg-[#FDFBF7] border-2 text-base font-medium focus:outline-none focus:ring-4 focus:ring-[#4A5D23]/5 focus:border-[#4A5D23] transition-all placeholder-[#5B4A31]/20 resize-none leading-relaxed ${errors.message ? 'border-red-200' : 'border-transparent'}`}
                            />
                            <div className="flex justify-between mt-3">
                                {errors.message ? <p className="text-xs text-red-500 font-bold uppercase tracking-wide">{errors.message}</p> : <span />}
                                <span className="text-[10px] font-black text-[#5B4A31]/20 tracking-widest">{form.message.length} / 5000</span>
                            </div>
                        </div>

                        {/* ── Rating ── */}
                        <div className="mb-12">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-[#1a2408] mb-4">
                                Experience <span className="text-[#5B4A31]/30 font-bold italic normal-case ml-2">(optional)</span>
                            </label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setForm({ ...form, rating: form.rating === star ? 0 : star })}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="p-1 transition-all hover:scale-125 cursor-pointer"
                                    >
                                        <Star
                                            className={`h-10 w-10 transition-colors ${(hoverRating || form.rating) >= star
                                                ? 'text-[#c8a84e] fill-[#c8a84e]'
                                                : 'text-gray-100 fill-gray-100'
                                                }`}
                                        />
                                    </button>
                                ))}
                                {form.rating > 0 && (
                                    <span className="text-sm font-black text-[#c8a84e] self-center ml-4">{form.rating}/5</span>
                                )}
                            </div>
                        </div>

                        <label className="flex items-start gap-4 mb-10 cursor-pointer group">
                            <div className="relative flex items-center mt-1">
                                <input type="checkbox" required className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-[#4A5D23]/20 checked:bg-[#4A5D23] transition-all" />
                                <CheckCircle className="absolute h-5 w-5 text-white opacity-0 peer-checked:opacity-100 p-1 pointer-events-none" />
                            </div>
                            <span className="text-xs text-[#5B4A31]/60 font-medium leading-relaxed group-hover:text-[#5B4A31] transition-colors">
                                I agree to the{' '}
                                <Link href="/privacy-policy" className="font-bold text-[#4A5D23] hover:underline">Privacy Policy</Link>.
                                {' '}Your data is safe with us and will only be used to respond to your inquiry.
                            </span>
                        </label>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full inline-flex items-center justify-center gap-4 bg-[#4A5D23] text-white px-10 py-6 rounded-[24px] font-black uppercase tracking-[0.2em] text-sm hover:bg-[#3a491b] transition-all disabled:opacity-50 cursor-pointer shadow-2xl shadow-[#4A5D23]/20 hover:-translate-y-1"
                        >
                            {submitting ? 'Sending Scroll...' : 'Send Inquiry'}
                            <Send className="h-5 w-5" />
                        </button>
                        
                        <div className="flex items-center justify-center gap-3 mt-6 text-[10px] font-black text-[#5B4A31]/30 uppercase tracking-[0.2em]">
                            <Clock className="h-4 w-4" />
                            Avg. response: ~4 hours
                        </div>
                    </div>
                </form>
            </div>

            {/* ═══════ TRUST BADGES ═══════ */}
            <section className="bg-white/50 py-24 px-6 border-t border-[#4A5D23]/5">
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
                    {[
                        { Icon: Zap, title: 'Speed of Nature', desc: 'Inquiries answered swiftly, typically within a few sun cycles.' },
                        { Icon: Users, title: 'Human Wisdom', desc: 'Talk to real wellness experts, never artificial constructs.' },
                        { Icon: ShieldCheck, title: 'Secure Roots', desc: 'Your information is protected with the highest level of care.' },
                    ].map((badge) => (
                        <div key={badge.title} className="text-center group">
                            <div className="w-20 h-20 rounded-[30px] bg-white shadow-lg border border-[#4A5D23]/5 flex items-center justify-center mx-auto mb-8 transition-transform group-hover:-translate-y-2 duration-300">
                                <badge.Icon className="h-10 w-10 text-[#4A5D23]" />
                            </div>
                            <h3 className="text-xl font-serif font-bold text-[#1a2408] mb-3">{badge.title}</h3>
                            <p className="text-sm text-[#5B4A31]/60 font-medium leading-relaxed">{badge.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══════ FOOTER NAV ═══════ */}
            <div className="py-12 flex justify-center">
                <Link
                    href="/help-center"
                    className="inline-flex items-center gap-3 text-xs font-black uppercase tracking-widest text-[#5B4A31]/40 hover:text-[#4A5D23] transition-all group"
                >
                    <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Help Hub
                </Link>
            </div>
        </div>
    );
}

