'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    ChevronLeft, Plus, MessageSquare, Clock, AlertCircle,
    X, Search, Ticket, Send, ChevronDown,
    ArrowUpRight, Filter, MoreHorizontal, Leaf, Sparkles
} from 'lucide-react';
import { createSupportTicket, getMySupportTickets } from '@/lib/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Orders', 'Payments', 'Shipping & Delivery', 'Product Issues', 'Returns & Refunds', 'Account Support', 'Other'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    open: { label: 'Open', bg: 'bg-[#4A5D23]/10', text: 'text-[#4A5D23]', dot: 'bg-[#4A5D23]' },
    in_progress: { label: 'In Progress', bg: 'bg-[#8B4513]/10', text: 'text-[#8B4513]', dot: 'bg-[#8B4513]' },
    resolved: { label: 'Resolved', bg: 'bg-[#1a2408]/10', text: 'text-[#1a2408]', dot: 'bg-[#1a2408]' },
    closed: { label: 'Closed', bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    low: { label: 'Low', color: 'text-gray-400', icon: '↓' },
    medium: { label: 'Medium', color: 'text-[#8B4513]', icon: '→' },
    high: { label: 'High', color: 'text-[#4A5D23]', icon: '↑' },
    urgent: { label: 'Urgent', color: 'text-red-500', icon: '⚡' },
};

function timeAgo(date: string) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return new Date(date).toLocaleDateString();
}

export default function SupportPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-[#5B4A31]">Loading support...</div>}>
            <SupportContent />
        </Suspense>
    );
}

function SupportContent() {
    const params = useParams();
    const country = params?.country || 'in';
    const { isAuthenticated, user } = useAuth();
    const searchParams = useSearchParams();
    const urlOrderId = searchParams.get('orderId');

    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'create'>(urlOrderId ? 'create' : 'list');
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [form, setForm] = useState({
        subject: '', category: 'Orders', description: '', order_id: urlOrderId || '', priority: 'medium',
    });

    useEffect(() => {
        if (urlOrderId) {
            setView('create');
            setForm(prev => ({ ...prev, order_id: urlOrderId, category: 'Orders' }));
        }
    }, [urlOrderId]);

    useEffect(() => {
        if (isAuthenticated) {
            getMySupportTickets().then((data: any) => {
                setTickets(Array.isArray(data) ? data : []);
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.subject.trim() || !form.description.trim()) {
            toast.error('Subject and description are required');
            return;
        }
        setSubmitting(true);
        try {
            const result = await createSupportTicket({
                subject: form.subject,
                category: form.category,
                description: form.description,
                order_id: form.order_id || undefined,
                priority: form.priority,
            });
            if (result.success) {
                toast.success('Ticket created successfully!');
                setView('list');
                setForm({ subject: '', category: 'Other', description: '', order_id: '', priority: 'medium' });
                const refreshed = await getMySupportTickets();
                setTickets(Array.isArray(refreshed) ? refreshed : []);
            } else {
                toast.error(result.message || 'Failed to create ticket');
            }
        } catch {
            toast.error('Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    /* ── Derived data ── */
    const filteredTickets = tickets.filter((t) => {
        if (statusFilter && t.status !== statusFilter) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
                t.subject?.toLowerCase().includes(q) ||
                t.ticket_number?.toLowerCase().includes(q) ||
                t.category?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    const stats = {
        total: tickets.length,
        open: tickets.filter((t) => t.status === 'open').length,
        inProgress: tickets.filter((t) => t.status === 'in_progress').length,
        resolved: tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length,
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7]">
            {/* ═══════ AUTH GATE ═══════ */}
            {!isAuthenticated ? (
                <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden py-24 px-6">
                    {/* Ayurvedic Texture Background */}
                    <div 
                        className="absolute inset-0 z-0 opacity-40 bg-repeat bg-center"
                        style={{ 
                            backgroundImage: "url('/ayurvedic-texture.png')",
                            backgroundSize: '400px',
                            filter: 'sepia(0.2) contrast(1.1)'
                        }}
                    ></div>
                    
                    {/* Decorative Elements */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#4A5D23]/10 via-transparent to-[#4A5D23]/5 z-0"></div>
                    
                    <div className="max-w-xl mx-auto text-center relative z-10">
                        <div className="w-24 h-24 rounded-[30px] bg-[#4A5D23]/10 backdrop-blur-sm border border-[#4A5D23]/20 flex items-center justify-center mx-auto mb-8 shadow-2xl">
                            <AlertCircle className="h-12 w-12 text-[#4A5D23]" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-[#1a2408] mb-6 leading-tight">
                            Sign in to access <span className="text-[#4A5D23]">support</span>
                        </h1>
                        <p className="text-[#5B4A31] text-lg mb-10 font-medium max-w-sm mx-auto">
                            You need to be logged in to submit and track your support tickets.
                        </p>
                        <Link 
                            href={`/${country}/login`} 
                            className="inline-flex items-center gap-3 bg-[#4A5D23] text-white px-10 py-4 rounded-[20px] font-bold text-lg hover:bg-[#3a491b] hover:shadow-2xl hover:-translate-y-1 transition-all shadow-xl"
                        >
                            Sign In Now
                        </Link>
                    </div>
                </section>
            ) : view === 'create' ? (
                /* ═══════ CREATE TICKET VIEW ═══════ */
                <>
                    {/* Breadcrumb bar */}
                    <div className="bg-white/80 backdrop-blur-md border-b border-[#4A5D23]/5 sticky top-0 z-50">
                        <div className="max-w-4xl mx-auto px-6 py-5">
                            <nav className="flex items-center gap-3 text-sm font-bold tracking-wide">
                                <Link href={`/${country}/help-center`} className="text-[#5B4A31] hover:text-[#4A5D23] transition-colors">Help & Support</Link>
                                <ChevronDown className="h-4 w-4 text-gray-300 -rotate-90" />
                                <Link href={`/${country}/help-center/support`} onClick={(e) => { e.preventDefault(); setView('list'); }} className="text-[#5B4A31] hover:text-[#4A5D23] transition-colors cursor-pointer">Support Tickets</Link>
                                <ChevronDown className="h-4 w-4 text-gray-300 -rotate-90" />
                                <span className="text-[#4A5D23] font-black uppercase text-xs">Create Ticket</span>
                            </nav>
                        </div>
                    </div>

                    <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
                        <form onSubmit={handleSubmit} className="bg-white rounded-[40px] border border-[#4A5D23]/5 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-700">
                            <div className="p-10 md:p-14">
                                <div className="flex items-center justify-between mb-10">
                                    <div>
                                        <h2 className="text-3xl md:text-4xl font-bold text-[#1a2408] mb-2">Create New Ticket</h2>
                                        <div className="w-16 h-1 bg-[#4A5D23] rounded-full opacity-30"></div>
                                    </div>
                                    <MessageSquare className="h-10 w-10 text-[#4A5D23]/20" />
                                </div>
                                <p className="text-lg text-[#5B4A31] mb-12 font-medium leading-relaxed">
                                    Fill out the details below and our support engineers will get back to you shortly.
                                </p>

                                {/* Subject */}
                                <div className="mb-10 group">
                                    <label className="block text-sm font-black text-[#1a2408] uppercase tracking-widest mb-3">Subject</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={form.subject}
                                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                            placeholder="e.g., Unable to sync order status..."
                                            className="w-full px-6 py-5 rounded-2xl bg-gray-50/50 border border-transparent text-lg focus:outline-none focus:ring-2 focus:ring-[#4A5D23]/20 focus:bg-white focus:border-[#4A5D23]/30 transition-all font-medium"
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-[#5B4A31]/60 mt-3 font-semibold flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-[#4A5D23]" />
                                        Use a descriptive title for faster investigation.
                                    </p>
                                </div>

                                {/* Category + Priority row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                                    <div className="group">
                                        <label className="block text-sm font-black text-[#1a2408] uppercase tracking-widest mb-3">Category</label>
                                        <div className="relative">
                                            <select
                                                value={form.category}
                                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                                className="w-full pl-6 pr-12 py-5 rounded-2xl bg-gray-50/50 border border-transparent text-lg focus:outline-none focus:ring-2 focus:ring-[#4A5D23]/20 focus:bg-white focus:border-[#4A5D23]/30 transition-all font-medium appearance-none"
                                            >
                                                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-black text-[#1a2408] uppercase tracking-widest mb-3">Priority</label>
                                        <div className="flex bg-gray-50/50 p-1.5 rounded-2xl gap-1 border border-transparent">
                                            {PRIORITIES.map((p) => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => setForm({ ...form, priority: p })}
                                                    className={`flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${form.priority === p
                                                        ? 'bg-[#4A5D23] text-white shadow-lg'
                                                        : 'text-[#5B4A31]/60 hover:text-[#4A5D23] hover:bg-white'
                                                        }`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Order ID (optional) */}
                                <div className="mb-10">
                                    <label className="block text-sm font-black text-[#1a2408] uppercase tracking-widest mb-3">Order ID <span className="font-normal text-gray-400 lowercase tracking-normal">(optional)</span></label>
                                    <input
                                        type="text"
                                        value={form.order_id}
                                        onChange={(e) => setForm({ ...form, order_id: e.target.value })}
                                        placeholder="Enter order ID if applicable"
                                        className="w-full px-6 py-5 rounded-2xl bg-gray-50/50 border border-transparent text-lg focus:outline-none focus:ring-2 focus:ring-[#4A5D23]/20 focus:bg-white focus:border-[#4A5D23]/30 transition-all font-medium"
                                    />
                                </div>

                                {/* Description */}
                                <div className="mb-10">
                                    <label className="block text-sm font-black text-[#1a2408] uppercase tracking-widest mb-3">Description</label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        placeholder="Describe the issue in detail..."
                                        rows={8}
                                        maxLength={5000}
                                        className="w-full px-6 py-6 rounded-3xl bg-gray-50/50 border border-transparent text-lg focus:outline-none focus:ring-2 focus:ring-[#4A5D23]/20 focus:bg-white focus:border-[#4A5D23]/30 transition-all font-medium resize-none leading-relaxed"
                                        required
                                    />
                                    <div className="flex justify-between mt-4">
                                        <span className="text-xs font-bold text-[#5B4A31]/40 uppercase tracking-widest flex items-center gap-2">
                                            <Leaf className="h-3 w-3" />
                                            Markdown supported
                                        </span>
                                        <span className="text-xs font-bold text-[#5B4A31]/40 tracking-widest">{form.description.length} / 5000</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-10 md:px-14 py-10 bg-[#4A5D23]/5 border-t border-[#4A5D23]/10 flex flex-col sm:flex-row items-center gap-8 justify-between">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#4A5D23] text-white px-12 py-5 rounded-2xl font-black text-lg hover:bg-[#3a491b] transition-all disabled:opacity-50 cursor-pointer shadow-xl hover:-translate-y-1"
                                >
                                    <Send className="h-6 w-6" />
                                    {submitting ? 'Creating...' : 'Submit Support Ticket'}
                                </button>
                                <p className="text-sm font-bold text-[#5B4A31]/60 max-w-xs text-center sm:text-right">
                                    By creating a ticket, you agree to our{' '}
                                    <Link href={`/${country}/help-center`} className="underline hover:text-[#4A5D23]">Support Terms</Link>.
                                </p>
                            </div>
                        </form>
                    </div>
                </>
            ) : (
                /* ═══════ TICKET LIST VIEW ═══════ */
                <>
                    {/* Header */}
                    <div className="bg-white/80 backdrop-blur-md border-b border-[#4A5D23]/5 sticky top-0 z-50">
                        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-[#4A5D23]/10 flex items-center justify-center shadow-inner">
                                    <Ticket className="h-8 w-8 text-[#4A5D23]" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-[#1a2408]">Support Tickets</h1>
                                    <p className="text-base text-[#5B4A31] font-medium mt-1">Manage and track your Vedic support inquiries.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setView('create')}
                                className="inline-flex items-center gap-3 bg-[#4A5D23] text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-[#3a491b] transition-all cursor-pointer shadow-xl hover:-translate-y-1"
                            >
                                <Plus className="h-6 w-6" />
                                New Ticket
                            </button>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto px-6 py-12">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                            {[
                                { label: 'Total Tickets', value: stats.total, icon: Ticket, color: '#4A5D23' },
                                { label: 'Open Tickets', value: stats.open, icon: Clock, color: '#8B4513' },
                                { label: 'In Progress', value: stats.inProgress, icon: MessageSquare, color: '#2E5A50' },
                                { label: 'Resolved', value: stats.resolved, icon: ArrowUpRight, color: '#1a2408' },
                            ].map((stat) => {
                                const Icon = stat.icon;
                                return (
                                    <div key={stat.label} className="bg-white rounded-[32px] border border-[#4A5D23]/5 p-8 transition-all hover:shadow-2xl group">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" style={{ backgroundColor: stat.color + '15' }}>
                                            <Icon className="h-6 w-6" style={{ color: stat.color }} />
                                        </div>
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                        <p className="text-4xl font-bold text-[#1a2408]">{stat.value}</p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Search / Filter bar */}
                        <div className="bg-white rounded-[40px] border border-[#4A5D23]/5 overflow-hidden shadow-2xl">
                            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-6 p-8 border-b border-gray-100">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by ID, subject, or category..."
                                        className="w-full pl-14 pr-6 py-4 rounded-[20px] bg-gray-50 border-transparent text-lg focus:outline-none focus:ring-2 focus:ring-[#4A5D23]/20 focus:bg-white focus:border-[#4A5D23]/30 transition-all font-medium"
                                    />
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4 items-center">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="w-full sm:w-auto px-6 py-4 rounded-[20px] bg-gray-50 border-transparent text-base font-bold focus:outline-none focus:ring-2 focus:ring-[#4A5D23]/20 cursor-pointer appearance-none min-w-[180px]"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="open">Open</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-5 py-2 rounded-full">
                                        {filteredTickets.length} Results
                                    </span>
                                </div>
                            </div>

                            {/* Ticket list container */}
                            <div className="bg-white">
                                {loading ? (
                                    <div className="p-10 space-y-6">
                                        {[...Array(4)].map((_, i) => (
                                            <div key={i} className="flex items-center gap-6 animate-pulse">
                                                <div className="h-4 bg-gray-200 rounded w-24" />
                                                <div className="h-6 bg-gray-200 rounded w-1/2" />
                                                <div className="h-8 bg-gray-200 rounded-full w-24 ml-auto" />
                                            </div>
                                        ))}
                                    </div>
                                ) : filteredTickets.length === 0 ? (
                                    <div className="text-center py-32">
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
                                            <MessageSquare className="h-10 w-10 text-gray-200" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-[#1a2408] mb-4">
                                            {tickets.length === 0 ? 'No tickets yet' : 'No matching results'}
                                        </h3>
                                        <p className="text-lg text-[#5B4A31] mb-10 max-w-sm mx-auto font-medium">
                                            {tickets.length === 0 ? 'Start your journey by creating your first support ticket.' : 'Try adjusting your search or filters.'}
                                        </p>
                                        {tickets.length === 0 && (
                                            <button
                                                onClick={() => setView('create')}
                                                className="inline-flex items-center gap-3 bg-[#4A5D23] text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-[#3a491b] transition-all cursor-pointer shadow-xl hover:-translate-y-1"
                                            >
                                                <Plus className="h-6 w-6" /> Create Ticket
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-50">
                                        {filteredTickets.map((ticket: any) => {
                                            const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                                            const priority = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.medium;
                                            return (
                                                <Link
                                                    key={ticket.ticket_id}
                                                    href={`/help-center/support/${ticket.ticket_id}`}
                                                    className="block hover:bg-[#4A5D23]/[0.02] transition-colors group p-8 md:px-10"
                                                >
                                                    <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <span className="text-xs font-black font-mono text-gray-400 uppercase tracking-widest">{ticket.ticket_number}</span>
                                                                <span className="text-[10px] font-black uppercase text-[#4A5D23]/40 tracking-[0.2em]">{ticket.category}</span>
                                                            </div>
                                                            <h3 className="text-xl font-bold text-[#1a2408] group-hover:text-[#4A5D23] transition-colors leading-snug">
                                                                {ticket.subject}
                                                            </h3>
                                                            <div className="flex items-center gap-4 mt-4">
                                                                <span className={`inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${status.bg} ${status.text}`}>
                                                                    <span className={`w-2 h-2 rounded-full ${status.dot} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
                                                                    {status.label}
                                                                </span>
                                                                <span className={`text-xs font-black uppercase tracking-widest flex items-center gap-1.5 ${priority.color} bg-gray-50 px-3 py-1.5 rounded-full`}>
                                                                    {priority.icon} {priority.label}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0">
                                                            <div className="flex items-center gap-2 text-[#5B4A31]/60 font-bold text-sm">
                                                                <Clock className="h-4 w-4" />
                                                                {timeAgo(ticket.updated_at)}
                                                            </div>
                                                            <div className="p-3 bg-[#4A5D23]/0 group-hover:bg-[#4A5D23] rounded-xl transition-all group-hover:shadow-lg group-hover:-translate-x-2">
                                                                <MoreHorizontal className="h-6 w-6 text-gray-300 group-hover:text-white" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-20 flex justify-center">
                            <Link
                                href={`/${country}/help-center`}
                                className="inline-flex items-center gap-3 text-lg font-bold text-[#5B4A31] hover:text-[#4A5D23] transition-all group"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-white shadow-xl flex items-center justify-center group-hover:bg-[#4A5D23] group-hover:text-white transition-all">
                                    <ChevronLeft className="h-6 w-6" />
                                </div>
                                Help Center Home
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
