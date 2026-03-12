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
            <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-6">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 rounded-full bg-[#3d5c3a]/10 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-10 w-10 text-[#3d5c3a]" />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-gray-900 mb-3">Thank you for your enquiry!</h2>
                    <p className="text-sm text-gray-500 mb-2">Your message has been received and our wellness team will review it shortly.</p>
                    <p className="text-xs text-gray-400 mb-8 flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3" />
                        Avg. response time: ~4 hours
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            href="/help-center"
                            className="inline-flex items-center justify-center gap-2 bg-[#3d5c3a] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#2d4a2a] transition-colors"
                        >
                            Back to Help Center
                        </Link>
                        <button
                            onClick={() => {
                                setSubmitted(false);
                                setForm({ name: '', email: '', type: 'suggestion', subject: '', message: '', rating: 0 });
                                setErrors({});
                            }}
                            className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 px-6 py-3 rounded-xl text-sm font-bold hover:border-[#3d5c3a]/30 transition-colors cursor-pointer"
                        >
                            Submit Another
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF7F2]">
            {/* ═══════ HERO SECTION ═══════ */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#3d5c3a] via-[#4a6b47] to-[#5a7a57] py-16 md:py-20 px-6">
                {/* Botanical SVG background */}
                <div className="absolute inset-0 opacity-[0.06]">
                    <svg className="absolute top-0 right-0 h-full w-1/2" viewBox="0 0 400 500" fill="none">
                        <path d="M250 50 C300 100, 350 200, 300 300 C250 400, 150 450, 100 400 C50 350, 80 250, 150 200 C220 150, 200 0, 250 50Z" stroke="white" strokeWidth="1.5" fill="none" />
                        <path d="M280 100 C330 150, 370 250, 320 340 C270 430, 170 470, 130 420" stroke="white" strokeWidth="1" fill="none" />
                    </svg>
                    <svg className="absolute bottom-0 left-0 h-3/4 w-1/3" viewBox="0 0 300 400" fill="none">
                        <path d="M50 350 C0 300, 20 200, 80 150 C140 100, 200 120, 180 200 C160 280, 100 320, 50 350Z" stroke="white" strokeWidth="1.5" fill="none" />
                    </svg>
                </div>

                <div className="max-w-xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-5">
                        <Sparkles className="h-3.5 w-3.5 text-[#c8d8a0]" />
                        <span className="text-xs font-semibold tracking-widest uppercase text-white/90">Direct Support</span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3 leading-tight">
                        Customer Enquiry
                    </h1>

                    <p className="text-white/70 text-sm max-w-md mx-auto">
                        We&apos;re here to help you flourish. Send us a message and our dedicated team will get back to you within 24 hours.
                    </p>
                </div>
            </section>

            {/* ═══════ FORM SECTION ═══════ */}
            <div className="max-w-2xl mx-auto px-6 -mt-6 relative z-20 pb-16">
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
                    <div className="p-7 md:p-9">
                        {/* Form header */}
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 rounded-xl bg-[#3d5c3a]/8 border border-[#3d5c3a]/10 flex items-center justify-center">
                                <Mail className="h-4 w-4 text-[#3d5c3a]" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">General Support Enquiry</span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-serif font-bold text-gray-900 mb-1">Send us a Message</h2>
                        <p className="text-sm text-gray-500 mb-8">Fill out the form below and our wellness guides will assist you. We typically respond within 24 hours during business days.</p>

                        {/* ── Enquiry Type ── */}
                        <div className="mb-7">
                            <label className="block text-sm font-bold text-gray-900 mb-3">
                                Enquiry Type <span className="text-red-400">*</span>
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {TYPES.map((t) => {
                                    const active = form.type === t.value;
                                    return (
                                        <button
                                            key={t.value}
                                            type="button"
                                            onClick={() => setForm({ ...form, type: t.value })}
                                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${active
                                                ? 'bg-[#3d5c3a] text-white border-[#3d5c3a] shadow-sm'
                                                : 'bg-white text-gray-600 border-gray-150 hover:border-[#3d5c3a]/30'
                                                }`}
                                        >
                                            <t.Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-gray-400'}`} />
                                            <span className="text-xs font-bold">{t.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-gray-400 mt-2">Selecting the correct category helps us route your inquiry to the right specialist.</p>
                        </div>

                        {/* ── Name + Email ── */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-bold text-gray-900 mb-2">
                                    <User className="h-3.5 w-3.5 text-gray-400" />
                                    Full Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => { setForm({ ...form, name: e.target.value }); clearField('name'); }}
                                    placeholder="e.g. Rowan Green"
                                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#3d5c3a]/30 focus:border-[#3d5c3a] ${errors.name ? 'border-red-300 bg-red-50/50' : 'border-gray-200'}`}
                                />
                                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-bold text-gray-900 mb-2">
                                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                                    Email Address <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => { setForm({ ...form, email: e.target.value }); clearField('email'); }}
                                    placeholder="name@example.com"
                                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#3d5c3a]/30 focus:border-[#3d5c3a] ${errors.email ? 'border-red-300 bg-red-50/50' : 'border-gray-200'}`}
                                />
                                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                            </div>
                        </div>

                        {/* ── Subject ── */}
                        <div className="mb-5">
                            <label className="flex items-center gap-1.5 text-sm font-bold text-gray-900 mb-2">
                                <FileText className="h-3.5 w-3.5 text-gray-400" />
                                Subject <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.subject}
                                onChange={(e) => { setForm({ ...form, subject: e.target.value }); clearField('subject'); }}
                                placeholder="How can we help you today?"
                                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#3d5c3a]/30 focus:border-[#3d5c3a] ${errors.subject ? 'border-red-300 bg-red-50/50' : 'border-gray-200'}`}
                            />
                            {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
                        </div>

                        {/* ── Message ── */}
                        <div className="mb-6">
                            <label className="flex items-center gap-1.5 text-sm font-bold text-gray-900 mb-2">
                                <MessageCircle className="h-3.5 w-3.5 text-gray-400" />
                                Message <span className="text-red-400">*</span>
                            </label>
                            <textarea
                                value={form.message}
                                onChange={(e) => { setForm({ ...form, message: e.target.value }); clearField('message'); }}
                                placeholder="Please provide as much detail as possible so we can better assist you..."
                                rows={5}
                                maxLength={5000}
                                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#3d5c3a]/30 focus:border-[#3d5c3a] resize-none leading-relaxed ${errors.message ? 'border-red-300 bg-red-50/50' : 'border-gray-200'}`}
                            />
                            <div className="flex justify-between mt-1.5">
                                {errors.message ? <p className="text-xs text-red-500">{errors.message}</p> : <span />}
                                <span className="text-xs text-gray-400">{form.message.length} / 5000</span>
                            </div>
                        </div>

                        {/* ── Rating (optional) ── */}
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                Overall Experience <span className="text-gray-400 font-normal text-xs">(optional)</span>
                            </label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setForm({ ...form, rating: form.rating === star ? 0 : star })}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="p-1 transition-transform hover:scale-110 cursor-pointer"
                                    >
                                        <Star
                                            className={`h-7 w-7 transition-colors ${(hoverRating || form.rating) >= star
                                                ? 'text-[#c8a84e] fill-[#c8a84e]'
                                                : 'text-gray-200'
                                                }`}
                                        />
                                    </button>
                                ))}
                                {form.rating > 0 && (
                                    <span className="text-xs text-gray-400 self-center ml-2">{form.rating}/5</span>
                                )}
                            </div>
                        </div>

                        {/* ── Privacy checkbox ── */}
                        <label className="flex items-start gap-3 mb-6 cursor-pointer group">
                            <input type="checkbox" required className="mt-0.5 accent-[#3d5c3a] w-4 h-4 cursor-pointer" />
                            <span className="text-xs text-gray-500 leading-relaxed">
                                I agree to the{' '}
                                <Link href="/privacy-policy" className="underline text-[#3d5c3a] hover:text-[#2d4a2a]">Privacy Policy</Link>.
                                {' '}By submitting this form, you consent to our team contacting you via the provided email regarding your enquiry.
                            </span>
                        </label>
                    </div>

                    {/* ── Submit footer ── */}
                    <div className="px-7 md:px-9 py-5 bg-gray-50/80 border-t border-gray-100">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#3d5c3a] text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-[#2d4a2a] transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                        >
                            <Send className="h-4 w-4" />
                            {submitting ? 'Sending...' : 'Send Enquiry'}
                        </button>
                        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Avg. response time: ~4 hours
                        </p>
                    </div>
                </form>
            </div>

            {/* ═══════ TRUST BADGES ═══════ */}
            <section className="bg-white border-t border-gray-100 py-12 px-6">
                <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
                    {[
                        { Icon: Zap, title: 'Fast Response', desc: 'Most inquiries answered in under 12 hours.' },
                        { Icon: Users, title: 'Human Experts', desc: 'Talk to real people, never chatbots.' },
                        { Icon: ShieldCheck, title: 'Safe & Secure', desc: 'Your privacy is our utmost priority.' },
                    ].map((badge) => (
                        <div key={badge.title} className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-[#3d5c3a]/8 border border-[#3d5c3a]/10 flex items-center justify-center mb-3">
                                <badge.Icon className="h-5 w-5 text-[#3d5c3a]" />
                            </div>
                            <h3 className="text-sm font-bold text-gray-900 mb-1">{badge.title}</h3>
                            <p className="text-xs text-gray-400">{badge.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══════ FOOTER NAV ═══════ */}
            <div className="max-w-3xl mx-auto px-6 py-8">
                <div className="flex items-center justify-center">
                    <Link
                        href="/help-center"
                        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#3d5c3a] transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to Help Center
                    </Link>
                </div>
            </div>
        </div>
    );
}
