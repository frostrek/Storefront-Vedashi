'use client';

import { useState } from 'react';

import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { submitFeedback } from '@/lib/api';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { RU_DICTIONARY } from '@/content/ru';

export default function ContactClientPage() {

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
                toast.success(RU_DICTIONARY.contact.toasts.success);
                setForm({ name: '', email: '', subject: '', message: '' });
            } else {
                toast.error(result.message || RU_DICTIONARY.contact.toasts.fail);
            }
        } catch (error) {
            toast.error(RU_DICTIONARY.contact.toasts.error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-white overflow-hidden selection:bg-[#5F6F52] selection:text-white pb-24">
            {/* Hero Section */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                style={{ willChange: "transform, opacity" }}
                className="relative z-10 pt-20 pb-12 sm:pt-28 sm:pb-16 text-center px-4 max-w-3xl mx-auto"
            >
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white/50 px-5 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#91C934] mb-6 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow cursor-default"
                >
                    {RU_DICTIONARY.contact.hero.getInTouch}
                </motion.div>
                <h1 className="text-[42px] leading-tight sm:text-6xl font-bold text-[#1A1A1A] mb-5 tracking-tight">
                    {RU_DICTIONARY.contact.hero.title}
                </h1>
                <p className="text-[#5c5c5c] text-lg sm:text-lg max-w-[600px] mx-auto leading-relaxed">
                    {RU_DICTIONARY.contact.hero.description}
                </p>
            </motion.section>

            {/* Main Content Layout */}
            <div className="relative z-10 mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_1fr] xl:gap-14">

                    {/* Left Column: Contact Forms */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                        style={{ willChange: "transform, opacity" }}
                        className="rounded-[24px] bg-white p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-fit border border-gray-100"
                    >
                        <h2 className="text-3xl font-bold text-[#1A1A1A] mb-3">{RU_DICTIONARY.contact.form.title}</h2>
                        <p className="text-[#5c5c5c] mb-8 text-[15px]">{RU_DICTIONARY.contact.form.subtitle}</p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1A1A1A]">{RU_DICTIONARY.contact.form.fullName}</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        className="w-full rounded-[10px] border border-gray-200 px-4 py-3.5 text-[15px] placeholder:text-gray-400 focus:border-[#5F6F52] focus:ring-1 focus:ring-[#5F6F52] focus:outline-none transition-all shadow-sm"
                                        placeholder={RU_DICTIONARY.contact.form.namePlaceholder}
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1A1A1A]">{RU_DICTIONARY.contact.form.email}</label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        className="w-full rounded-[10px] border border-gray-200 px-4 py-3.5 text-[15px] placeholder:text-gray-400 focus:border-[#5F6F52] focus:ring-1 focus:ring-[#5F6F52] focus:outline-none transition-all shadow-sm"
                                        placeholder={RU_DICTIONARY.contact.form.emailPlaceholder}
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1A1A1A]">{RU_DICTIONARY.contact.form.subject}</label>
                                <input
                                    type="text"
                                    value={form.subject}
                                    onChange={e => setForm({ ...form, subject: e.target.value })}
                                    className="w-full rounded-[10px] border border-gray-200 px-4 py-3.5 text-[15px] placeholder:text-gray-400 focus:border-[#5F6F52] focus:ring-1 focus:ring-[#5F6F52] focus:outline-none transition-all shadow-sm"
                                    placeholder={RU_DICTIONARY.contact.form.subjectPlaceholder}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1A1A1A]">{RU_DICTIONARY.contact.form.message}</label>
                                <textarea
                                    value={form.message}
                                    onChange={e => setForm({ ...form, message: e.target.value })}
                                    rows={6}
                                    className="w-full rounded-[10px] border border-gray-200 px-4 py-3.5 text-[15px] placeholder:text-gray-400 focus:border-[#5F6F52] focus:ring-1 focus:ring-[#5F6F52] focus:outline-none resize-none transition-all shadow-sm"
                                    placeholder={RU_DICTIONARY.contact.form.messagePlaceholder}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="pt-2">
                                <motion.button
                                    whileHover={{ scale: isSubmitting ? 1 : 1.02, y: isSubmitting ? 0 : -2 }}
                                    whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#91C934] px-7 py-3.5 text-[15px] font-semibold text-white hover:bg-[#536148] transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_4px_12px_rgb(95,111,82,0.2)] hover:shadow-[0_8px_16px_rgb(95,111,82,0.3)]"
                                >
                                    {isSubmitting ? RU_DICTIONARY.contact.form.sending : RU_DICTIONARY.contact.form.sendBtn}
                                    <Send className={`h-4 w-4 ml-1 ${isSubmitting ? 'animate-pulse' : ''}`} />
                                </motion.button>
                            </div>
                        </form>
                    </motion.div>

                    {/* Right Column: Info Cards */}
                    <div className="space-y-4">
                        {[
                            {
                                icon: MapPin,
                                title: RU_DICTIONARY.contact.info.visit.title,
                                lines: RU_DICTIONARY.contact.info.visit.lines
                            },
                            {
                                icon: Mail,
                                title: RU_DICTIONARY.contact.info.email.title,
                                lines: RU_DICTIONARY.contact.info.email.lines
                            },
                            {
                                icon: Phone,
                                title: RU_DICTIONARY.contact.info.phone.title,
                                lines: RU_DICTIONARY.contact.info.phone.lines
                            },
                            {
                                icon: Clock,
                                title: RU_DICTIONARY.contact.info.hours.title,
                                lines: RU_DICTIONARY.contact.info.hours.lines
                            },
                        ].map((info, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 + (i * 0.1) }}
                                whileHover={{ scale: 1.02, y: -4 }}
                                style={{ willChange: "transform, opacity" }}
                                className="flex gap-5 rounded-[20px] bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-50/50 hover:shadow-[0_10px_30px_rgb(0,0,0,0.08)] transition-all duration-300 cursor-default"
                            >
                                <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f5f2]">
                                    <info.icon className="h-4 w-4 text-[#5c5c5c]" strokeWidth={2} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-[11px] tracking-wider text-[#1A1A1A] uppercase mb-2">{info.title}</h3>
                                    {info.lines.map((line, j) => {
                                        if (info.title === RU_DICTIONARY.contact.info.email.title) {
                                            return (
                                                <a key={j} href={`mailto:${line}`} className="block text-[14px] text-[#5c5c5c] leading-relaxed hover:text-[#91C934] transition-colors">
                                                    {line}
                                                </a>
                                            );
                                        } else if (info.title === RU_DICTIONARY.contact.info.phone.title) {
                                            return (
                                                <a key={j} href={`tel:${line}`} className="block text-[14px] text-[#5c5c5c] leading-relaxed hover:text-[#91C934] transition-colors">
                                                    {line}
                                                </a>
                                            );
                                        } else {
                                            return (
                                                <p key={j} className="text-[14px] text-[#5c5c5c] leading-relaxed">{line}</p>
                                            );
                                        }
                                    })}
                                </div>
                            </motion.div>
                        ))}



                    </div>
                </div>
            </div>
        </div>
    );
}
