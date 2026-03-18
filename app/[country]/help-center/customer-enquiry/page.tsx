'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
    Send, MessageSquare, Sparkles, AlertCircle, 
    ArrowRight, ChevronLeft, ShieldCheck, Mail, 
    User, HelpCircle, Bug, Activity, Leaf 
} from 'lucide-react';
import { submitFeedback } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const CATEGORIES = [
    { id: 'other', label: 'General Inquiry', icon: HelpCircle, color: '#A8B28B' },
    { id: 'complaint', label: 'Issue / Complaint', icon: Activity, color: '#B35A5A' },
    { id: 'suggestion', label: 'Improvement Suggestion', icon: Sparkles, color: '#D4A847' },
    { id: 'bug_report', label: 'Technical Bug Report', icon: Bug, color: '#36453A' },
    { id: 'contact', label: 'Collaborations', icon: Mail, color: '#4A5D23' },
];

export default function CustomerEnquiryPage() {
    const params = useParams();
    const country = params?.country || 'in';
    const { user, isAuthenticated } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        type: 'other',
        subject: '',
        message: ''
    });

    // Sync auth state to form
    useEffect(() => {
        if (isAuthenticated && user) {
            setForm(prev => ({
                ...prev,
                name: user.name || prev.name,
                email: user.email || prev.email
            }));
        }
    }, [isAuthenticated, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.message.trim() || !form.subject.trim()) {
            toast.error('Please fill in both subject and message.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await submitFeedback({
                name: form.name,
                email: form.email,
                type: form.type,
                subject: form.subject,
                message: form.message
            });

            if (res.success) {
                toast.success('Your enquiry has been received.');
                setSubmitted(true);
            } else {
                toast.error(res.message || 'Failed to submit enquiry.');
            }
        } catch {
            toast.error('A network error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6">
                <div className="max-w-xl w-full text-center bg-white rounded-[40px] border border-[#4A5D23]/10 p-12 shadow-2xl animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 rounded-full bg-[#4A5D23]/10 flex items-center justify-center mx-auto mb-8 shadow-inner overflow-hidden relative">
                        <Leaf className="h-12 w-12 text-[#4A5D23] animate-bounce" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#4A5D23]/5 to-transparent"></div>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-[#1a2408] mb-6">Enquiry Received</h2>
                    <p className="text-[#5B4A31] text-lg mb-10 leading-relaxed font-medium">
                        Thank you for reaching out. Your enquiry has been registered in our harmony system. 
                        Our team will review it and respond shortly.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link 
                            href={`/${country}/help-center`} 
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#4A5D23] text-white font-bold hover:bg-[#3a491b] transition-all shadow-xl hover:-translate-y-1"
                        >
                            Back to Help Center
                        </Link>
                        {isAuthenticated && (
                            <Link 
                                href={`/${country}/account/support`} 
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white border border-[#4A5D23]/20 text-[#4A5D23] font-bold hover:bg-[#4A5D23]/5 transition-all shadow-sm"
                            >
                                Track in My Account <ArrowRight className="h-4 w-4" />
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7]">
            {/* Header section */}
            <section className="relative py-20 px-6 overflow-hidden">
                <div 
                    className="absolute inset-0 z-0 opacity-30 bg-repeat bg-center"
                    style={{ 
                        backgroundImage: "url('/ayurvedic-texture.png')",
                        backgroundSize: '400px',
                        filter: 'sepia(0.2)'
                    }}
                ></div>
                <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#FDFBF7] to-transparent z-0"></div>
                
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <Link 
                        href={`/${country}/help-center`} 
                        className="inline-flex items-center gap-2 text-[#4A5D23] font-bold text-sm uppercase tracking-widest mb-8 hover:gap-3 transition-all"
                    >
                        <ChevronLeft className="h-4 w-4" /> Help Center
                    </Link>
                    <h1 className="text-4xl md:text-6xl font-bold text-[#1a2408] mb-6 tracking-tight">
                        Customer <span className="text-[#4A5D23]">Enquiry</span>
                    </h1>
                    <p className="text-[#5B4A31] text-lg max-w-2xl mx-auto font-medium leading-relaxed">
                        Share your thoughts, report an issue, or suggest an improvement. 
                        Our heart and ears are open to your Vedic journey.
                    </p>
                </div>
            </section>

            <main className="max-w-5xl mx-auto px-6 pb-24 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12">
                    
                    {/* Left: Form Area */}
                    <div className="bg-white rounded-[40px] border border-[#4A5D23]/10 shadow-2xl p-8 md:p-12">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-[#1a2408] uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                        <User className="h-3 w-3 text-[#4A5D23]" /> Full Name
                                    </label>
                                    <input 
                                        type="text"
                                        value={form.name}
                                        onChange={e => setForm({...form, name: e.target.value})}
                                        placeholder="Enter your name"
                                        required
                                        className="w-full px-6 py-4 rounded-2xl bg-gray-50/50 border border-transparent focus:bg-white focus:border-[#4A5D23]/30 focus:outline-none focus:ring-4 focus:ring-[#4A5D23]/5 transition-all font-medium text-gray-900"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-[#1a2408] uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                        <Mail className="h-3 w-3 text-[#4A5D23]" /> Email Address
                                    </label>
                                    <input 
                                        type="email"
                                        value={form.email}
                                        onChange={e => setForm({...form, email: e.target.value})}
                                        placeholder="Enter your contact email"
                                        required
                                        className="w-full px-6 py-4 rounded-2xl bg-gray-50/50 border border-transparent focus:bg-white focus:border-[#4A5D23]/30 focus:outline-none focus:ring-4 focus:ring-[#4A5D23]/5 transition-all font-medium text-gray-900"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-black text-[#1a2408] uppercase tracking-[0.2em] ml-1">Enquiry Category</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                    {CATEGORIES.map(cat => {
                                        const Icon = cat.icon;
                                        const isActive = form.type === cat.id;
                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setForm({...form, type: cat.id})}
                                                className={`flex flex-col items-center justify-center p-4 rounded-3xl border transition-all ${
                                                    isActive 
                                                    ? 'bg-[#4A5D23] border-[#4A5D23] shadow-lg -translate-y-1' 
                                                    : 'bg-white border-gray-100 hover:border-[#4A5D23]/30 hover:bg-[#FDFBF7]'
                                                }`}
                                            >
                                                <Icon className={`h-6 w-6 mb-2 ${isActive ? 'text-white' : 'text-[#4A5D23]'}`} />
                                                <span className={`text-[10px] font-black uppercase tracking-wider text-center ${isActive ? 'text-white' : 'text-[#1a2408]'}`}>
                                                    {cat.label.split(' ')[0]}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black text-[#1a2408] uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <MessageSquare className="h-3 w-3 text-[#4A5D23]" /> Subject
                                </label>
                                <input 
                                    type="text"
                                    value={form.subject}
                                    onChange={e => setForm({...form, subject: e.target.value})}
                                    placeholder="Briefly describe your enquiry"
                                    required
                                    className="w-full px-6 py-4 rounded-2xl bg-gray-50/50 border border-transparent focus:bg-white focus:border-[#4A5D23]/30 focus:outline-none focus:ring-4 focus:ring-[#4A5D23]/5 transition-all font-medium text-gray-900"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black text-[#1a2408] uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <Send className="h-3 w-3 text-[#4A5D23]" /> Message Details
                                </label>
                                <textarea 
                                    value={form.message}
                                    onChange={e => setForm({...form, message: e.target.value})}
                                    placeholder="Provide more context or details here..."
                                    required
                                    rows={6}
                                    className="w-full px-6 py-6 rounded-[32px] bg-gray-50/50 border border-transparent focus:bg-white focus:border-[#4A5D23]/30 focus:outline-none focus:ring-4 focus:ring-[#4A5D23]/5 transition-all font-medium text-gray-900 resize-none leading-relaxed"
                                />
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-8">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#1a2408] text-white px-12 py-5 rounded-2xl font-black text-lg hover:bg-[#4A5D23] transition-all disabled:opacity-50 cursor-pointer shadow-xl hover:-translate-y-1 group"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Send Enquiry'}
                                    <Send className={`h-6 w-6 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 ${isSubmitting ? 'animate-pulse' : ''}`} />
                                </button>
                                <div className="flex items-center gap-3 text-sm font-bold text-[#5B4A31]/60">
                                    <ShieldCheck className="h-5 w-5 text-[#4A5D23]" />
                                    <span>Encrypted & Private</span>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Right: Info Sidebar */}
                    <div className="space-y-8">
                        <div className="bg-[#4A5D23]/5 rounded-[32px] p-8 border border-[#4A5D23]/10">
                            <h3 className="text-xl font-bold text-[#1a2408] mb-6">Support Guidance</h3>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <Leaf className="h-5 w-5 text-[#4A5D23]" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase text-[#1a2408] mb-1">Response Time</h4>
                                        <p className="text-xs text-[#5B4A31] leading-relaxed">Most enquiries are addressed within 24 to 48 business hours.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <HelpCircle className="h-5 w-5 text-[#4A5D23]" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase text-[#1a2408] mb-1">Check FAQs</h4>
                                        <p className="text-xs text-[#5B4A31] leading-relaxed">Your question might already have an <Link href={`/${country}/help-center/faq`} className="text-[#4A5D23] underline font-bold">answer here</Link>.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <ShieldCheck className="h-5 w-5 text-[#4A5D23]" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase text-[#1a2408] mb-1">Order Issues</h4>
                                        <p className="text-xs text-[#5B4A31] leading-relaxed">For specific orders, use our <Link href={`/${country}/help-center/support`} className="text-[#4A5D23] underline font-bold">Ticket System</Link>.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#1a2408] rounded-[32px] p-8 text-white relative overflow-hidden group">
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold text-[#D4A847] mb-4">Are you a member?</h3>
                                <p className="text-xs text-white/70 mb-6 leading-relaxed">
                                    Logged-in users can track their enquiries and view replies directly from their dashboard.
                                </p>
                                {!isAuthenticated ? (
                                    <Link 
                                        href={`/${country}/login`} 
                                        className="inline-flex items-center gap-2 text-xs font-black uppercase bg-white text-[#1a2408] px-6 py-3 rounded-xl hover:bg-[#F2E8CF] transition-all"
                                    >
                                        Log In Now <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                ) : (
                                    <Link 
                                        href={`/${country}/account/support`} 
                                        className="inline-flex items-center gap-2 text-xs font-black uppercase bg-[#4A5D23] text-white px-6 py-3 rounded-xl hover:bg-[#3a491b] transition-all"
                                    >
                                        View My Dashboard <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                )}
                            </div>
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
                                <Sparkles className="h-16 w-16" />
                            </div>
                        </div>
                    </div>

                </div>

                <div className="mt-20 text-center">
                    <p className="text-sm font-bold text-[#5B4A31]/40 uppercase tracking-widest mb-6 flex items-center justify-center gap-3">
                        <span className="h-px w-8 bg-current"></span>
                        Vedic Support Ethics
                        <span className="h-px w-8 bg-current"></span>
                    </p>
                    <div className="max-w-3xl mx-auto p-10 rounded-[40px] border border-dashed border-[#4A5D23]/20">
                        <p className="italic text-[#5B4A31] text-lg font-medium leading-relaxed">
                            "Every enquiry is a seed of trust. At Vedashi, we nurture this seed with transparency, 
                            mindfulness, and a commitment to your holistic wellbeing."
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
