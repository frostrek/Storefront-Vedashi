'use client';

import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { submitFeedback } from '@/lib/api';

export default function ContactPage() {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const result = await submitFeedback({
                name: form.name,
                email: form.email,
                subject: form.subject,
                message: form.message,
                type: 'contact'
            });

            if (result.success) {
                toast.success('Message sent! We\'ll get back to you soon.');
                setForm({ name: '', email: '', subject: '', message: '' });
            } else {
                toast.error(result.message || 'Failed to send message. Please try again.');
            }
        } catch (error) {
            toast.error('An error occurred. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-cream">
            {/* Hero */}
            <section className="border-b border-light-border bg-white">
                <div className="mx-auto max-w-7xl px-4 py-16 text-center">
                    <p className="text-sm uppercase tracking-[0.2em] text-wine-gold font-medium mb-3">Get in Touch</p>
                    <h1 className="font-serif text-4xl sm:text-5xl font-bold text-charcoal">Contact Us</h1>
                    <p className="mt-3 text-warm-gray max-w-xl mx-auto">
                        We&apos;d love to hear from you. Send us a message or visit us at our tasting room.
                    </p>
                </div>
            </section>

            <div className="mx-auto max-w-7xl px-4 py-16">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_400px]">
                    {/* Contact Form */}
                    <div className="rounded-2xl border border-light-border bg-white p-8">
                        <h2 className="font-serif text-2xl font-bold text-charcoal mb-6">Send a Message</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-charcoal mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        className="w-full rounded-lg border border-light-border px-4 py-2.5 text-sm focus:border-burgundy focus:outline-none"
                                        placeholder="Your name"
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-charcoal mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        className="w-full rounded-lg border border-light-border px-4 py-2.5 text-sm focus:border-burgundy focus:outline-none"
                                        placeholder="you@example.com"
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-charcoal mb-1">Subject</label>
                                <input
                                    type="text"
                                    value={form.subject}
                                    onChange={e => setForm({ ...form, subject: e.target.value })}
                                    className="w-full rounded-lg border border-light-border px-4 py-2.5 text-sm focus:border-burgundy focus:outline-none"
                                    placeholder="How can we help?"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-charcoal mb-1">Message</label>
                                <textarea
                                    value={form.message}
                                    onChange={e => setForm({ ...form, message: e.target.value })}
                                    rows={5}
                                    className="w-full rounded-lg border border-light-border px-4 py-2.5 text-sm focus:border-burgundy focus:outline-none resize-none"
                                    placeholder="Your message..."
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-2 rounded-lg bg-burgundy px-8 py-3 text-sm font-semibold text-white hover:bg-burgundy-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className={`h-4 w-4 ${isSubmitting ? 'animate-pulse' : ''}`} />
                                {isSubmitting ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-6">
                        {[
                            { icon: MapPin, title: 'Visit Us', lines: ['123 Wine Boulevard', 'District 1, Ho Chi Minh City', 'Vietnam'] },
                            { icon: Phone, title: 'Call Us', lines: ['+84 (0) 28 1234 5678', '+84 (0) 90 123 4567'] },
                            { icon: Mail, title: 'Email Us', lines: ['info@kspwines.com', 'orders@kspwines.com'] },
                            { icon: Clock, title: 'Opening Hours', lines: ['Mon — Fri: 9:00 AM – 6:00 PM', 'Sat: 10:00 AM – 4:00 PM', 'Sun: Closed'] },
                        ].map((info, i) => (
                            <div key={i} className="flex gap-4 rounded-xl border border-light-border bg-white p-5">
                                <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-burgundy/10">
                                    <info.icon className="h-5 w-5 text-burgundy" />
                                </div>
                                <div>
                                    <h3 className="font-serif text-sm font-semibold text-charcoal">{info.title}</h3>
                                    {info.lines.map((line, j) => (
                                        <p key={j} className="text-sm text-warm-gray">{line}</p>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Map placeholder */}
                <div className="mt-12 rounded-2xl border border-light-border bg-white overflow-hidden">
                    <div className="h-64 bg-cream-dark flex items-center justify-center">
                        <div className="text-center">
                            <MapPin className="mx-auto h-8 w-8 text-burgundy mb-2" />
                            <p className="font-serif text-lg text-charcoal">KSP Wines Tasting Room</p>
                            <p className="text-sm text-warm-gray">123 Wine Boulevard, District 1, HCMC</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
