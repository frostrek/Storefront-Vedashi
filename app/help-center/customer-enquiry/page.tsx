'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Send, Star, CheckCircle } from 'lucide-react';
import { submitFeedback } from '@/lib/api';
import toast from 'react-hot-toast';

const TYPES = [
    { value: 'suggestion', label: 'Suggestion', emoji: '💡' },
    { value: 'complaint', label: 'Complaint', emoji: '😟' },
    { value: 'bug_report', label: 'Bug Report', emoji: '🐛' },
    { value: 'other', label: 'Other', emoji: '📝' },
];

export default function FeedbackPage() {
    const [form, setForm] = useState({ name: '', email: '', type: 'suggestion', subject: '', message: '', rating: 0 });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.message.trim()) {
            toast.error('Please enter your feedback message');
            return;
        }
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
                toast.error(result.message || 'Failed to submit feedback');
            }
        } catch {
            toast.error('Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-6">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-gray-900 mb-3">Thank you for your enquiry!</h2>
                    <p className="text-sm text-gray-500 mb-8">Your message is valuable to us and helps us improve our services.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            href="/help-center"
                            className="inline-flex items-center justify-center gap-2 bg-[#4b0f1a] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#3a0b14] transition-colors"
                        >
                            Back to Help Center
                        </Link>
                        <button
                            onClick={() => { setSubmitted(false); setForm({ name: '', email: '', type: 'suggestion', subject: '', message: '', rating: 0 }); }}
                            className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl text-sm font-semibold hover:border-[#C6A75E]/50 transition-colors"
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
            <section className="bg-gradient-to-r from-[#4b0f1a] to-[#722F37] py-12 px-6">
                <div className="max-w-2xl mx-auto">
                    <Link href="/help-center" className="inline-flex items-center gap-1 text-[#C6A75E] text-sm mb-4 hover:text-white transition-colors">
                        <ChevronLeft className="h-4 w-4" /> Back to Help Center
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">Customer Enquiry</h1>
                    <p className="text-[#C6A75E]">Share your thoughts or report an issue with us</p>
                </div>
            </section>

            <div className="max-w-2xl mx-auto px-6 py-10">
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
                    {/* Feedback Type */}
                    <div className="mb-6">
                        <label className="block text-xs font-semibold text-gray-700 mb-3">Enquiry Type</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {TYPES.map((t) => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, type: t.value })}
                                    className={`p-3 rounded-xl text-center transition-all border ${form.type === t.value
                                        ? 'bg-[#4b0f1a] text-white border-transparent'
                                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#C6A75E]/50'
                                        }`}
                                >
                                    <span className="text-xl block mb-1">{t.emoji}</span>
                                    <span className="text-xs font-semibold">{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rating */}
                    <div className="mb-6">
                        <label className="block text-xs font-semibold text-gray-700 mb-2">Overall Rating (optional)</label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setForm({ ...form, rating: star })}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="p-1 transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={`h-7 w-7 transition-colors ${(hoverRating || form.rating) >= star
                                            ? 'text-[#C6A75E] fill-[#C6A75E]'
                                            : 'text-gray-300'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Name (optional)</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="Your name"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C6A75E]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email (optional)</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                placeholder="your@email.com"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C6A75E]"
                            />
                        </div>
                    </div>

                    {/* Subject */}
                    <div className="mb-4">
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Subject (optional)</label>
                        <input
                            type="text"
                            value={form.subject}
                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                            placeholder="Brief topic"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C6A75E]"
                        />
                    </div>

                    {/* Message */}
                    <div className="mb-6">
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Your Message *</label>
                        <textarea
                            value={form.message}
                            onChange={(e) => setForm({ ...form, message: e.target.value })}
                            placeholder="Tell us what's on your mind..."
                            rows={5}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C6A75E] resize-none"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#4b0f1a] text-white px-8 py-3 rounded-xl font-semibold text-sm hover:bg-[#3a0b14] transition-colors disabled:opacity-50"
                    >
                        <Send className="h-4 w-4" />
                        {submitting ? 'Submitting...' : 'Submit Enquiry'}
                    </button>
                </form>
            </div>
        </div>
    );
}
