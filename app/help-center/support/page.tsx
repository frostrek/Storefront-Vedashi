'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
    ChevronLeft, Plus, MessageSquare, Clock, AlertCircle,
    X, Search, Ticket, Send, ChevronDown,
    ArrowUpRight, Filter, MoreHorizontal
} from 'lucide-react';
import { createSupportTicket, getMySupportTickets } from '@/lib/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Orders', 'Payments', 'Shipping & Delivery', 'Product Issues', 'Returns & Refunds', 'Account Support', 'Other'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    open: { label: 'Open', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    in_progress: { label: 'In Progress', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    resolved: { label: 'Resolved', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    closed: { label: 'Closed', bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    low: { label: 'Low', color: 'text-gray-400', icon: '↓' },
    medium: { label: 'Medium', color: 'text-amber-500', icon: '→' },
    high: { label: 'High', color: 'text-orange-500', icon: '↑' },
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
    const { isAuthenticated, user } = useAuth();
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'create'>('list');
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [form, setForm] = useState({
        subject: '', category: 'Other', description: '', order_id: '', priority: 'medium',
    });

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
        <div className="min-h-screen bg-[#FAF7F2]">
            {/* ═══════ AUTH GATE ═══════ */}
            {!isAuthenticated ? (
                <>
                    <section className="relative overflow-hidden bg-gradient-to-br from-[#3d5c3a] via-[#4a6b47] to-[#5a7a57] py-20 px-6">
                        <div className="max-w-xl mx-auto text-center relative z-10">
                            <AlertCircle className="h-14 w-14 text-[#c8d8a0] mx-auto mb-5" />
                            <h1 className="text-3xl font-serif font-bold text-white mb-3">Sign in to access support</h1>
                            <p className="text-white/70 text-sm mb-8">You need to be logged in to submit and track support tickets.</p>
                            <Link href="/login" className="inline-flex items-center gap-2 bg-white text-[#3d5c3a] px-8 py-3 rounded-xl text-sm font-bold hover:bg-[#c8d8a0] transition-colors">
                                Sign In
                            </Link>
                        </div>
                    </section>
                </>
            ) : view === 'create' ? (
                /* ═══════ CREATE TICKET VIEW ═══════ */
                <>
                    {/* Breadcrumb bar */}
                    <div className="bg-white border-b border-gray-100">
                        <div className="max-w-3xl mx-auto px-6 py-4">
                            <nav className="flex items-center gap-2 text-sm text-gray-400">
                                <Link href="/help-center" className="hover:text-[#3d5c3a] transition-colors">Help & Support</Link>
                                <span>›</span>
                                <Link href="/help-center/support" onClick={(e) => { e.preventDefault(); setView('list'); }} className="hover:text-[#3d5c3a] transition-colors cursor-pointer">Support Tickets</Link>
                                <span>›</span>
                                <span className="text-gray-900 font-semibold">Create Ticket</span>
                            </nav>
                        </div>
                    </div>

                    <div className="max-w-3xl mx-auto px-6 py-10">
                        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-8">
                                <h2 className="text-2xl font-serif font-bold text-gray-900 mb-1">Create New Ticket</h2>
                                <p className="text-sm text-gray-500 mb-8">Fill out the details below and our support engineers will get back to you shortly.</p>

                                {/* Subject */}
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-gray-900 mb-2">Subject</label>
                                    <input
                                        type="text"
                                        value={form.subject}
                                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                        placeholder="e.g., Unable to sync database after v2.4 update"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#3d5c3a]/30 focus:border-[#3d5c3a]"
                                        required
                                    />
                                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Use a descriptive title to help us identify the issue quickly.
                                    </p>
                                </div>

                                {/* Category + Priority row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-2">Category</label>
                                        <select
                                            value={form.category}
                                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#3d5c3a]/30 focus:border-[#3d5c3a] bg-white"
                                        >
                                            {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-2">Priority</label>
                                        <div className="flex gap-2">
                                            {PRIORITIES.map((p) => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => setForm({ ...form, priority: p })}
                                                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${form.priority === p
                                                        ? 'bg-[#3d5c3a] text-white shadow-sm'
                                                        : 'bg-white border border-gray-200 text-gray-600 hover:border-[#3d5c3a]/30'
                                                        }`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Order ID (optional) */}
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-gray-900 mb-2">Order ID <span className="font-normal text-gray-400">(optional)</span></label>
                                    <input
                                        type="text"
                                        value={form.order_id}
                                        onChange={(e) => setForm({ ...form, order_id: e.target.value })}
                                        placeholder="Enter order ID if applicable"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#3d5c3a]/30 focus:border-[#3d5c3a]"
                                    />
                                </div>

                                {/* Description */}
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-gray-900 mb-2">Description</label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        placeholder="Describe the problem in detail. Include steps to reproduce if applicable..."
                                        rows={6}
                                        maxLength={5000}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#3d5c3a]/30 focus:border-[#3d5c3a] resize-none leading-relaxed"
                                        required
                                    />
                                    <div className="flex justify-between mt-1.5">
                                        <span className="text-xs text-gray-400">Markdown supported</span>
                                        <span className="text-xs text-gray-400">{form.description.length} / 5000 characters</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-4">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center gap-2 bg-[#3d5c3a] text-white px-7 py-3 rounded-xl text-sm font-bold hover:bg-[#2d4a2a] transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    <Send className="h-4 w-4" />
                                    {submitting ? 'Creating...' : 'Create Ticket & Start Chat'}
                                </button>
                                <p className="text-xs text-gray-400">
                                    By creating a ticket, you agree to our{' '}
                                    <Link href="/help-center" className="underline hover:text-[#3d5c3a]">Support Terms</Link>.
                                </p>
                            </div>
                        </form>
                    </div>
                </>
            ) : (
                /* ═══════ TICKET LIST VIEW ═══════ */
                <>
                    {/* Header */}
                    <div className="bg-white border-b border-gray-100">
                        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-serif font-bold text-gray-900">Support Tickets</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Manage and respond to all your inquiries in one place.</p>
                            </div>
                            <button
                                onClick={() => setView('create')}
                                className="inline-flex items-center gap-2 bg-[#3d5c3a] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#2d4a2a] transition-colors cursor-pointer"
                            >
                                <Plus className="h-4 w-4" />
                                Create New Ticket
                            </button>
                        </div>
                    </div>

                    <div className="max-w-6xl mx-auto px-6 py-8">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {[
                                { label: 'Total Tickets', value: stats.total, icon: Ticket, color: '#3d5c3a' },
                                { label: 'Open Tickets', value: stats.open, icon: Clock, color: '#d97706' },
                                { label: 'In Progress', value: stats.inProgress, icon: MessageSquare, color: '#2563eb' },
                                { label: 'Resolved', value: stats.resolved, icon: ArrowUpRight, color: '#059669' },
                            ].map((stat) => {
                                const Icon = stat.icon;
                                return (
                                    <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 transition-all hover:shadow-sm">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: stat.color + '12' }}>
                                                <Icon className="h-4 w-4" style={{ color: stat.color }} />
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-0.5">{stat.label}</p>
                                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Search / Filter bar */}
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 border-b border-gray-100">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search tickets by ID, subject, or category..."
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#3d5c3a]/20 focus:border-[#3d5c3a]"
                                    />
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3d5c3a]/20 cursor-pointer"
                                >
                                    <option value="">All Status</option>
                                    <option value="open">Open</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>
                                <span className="text-xs text-gray-400 whitespace-nowrap self-center">
                                    Showing {filteredTickets.length} of {tickets.length}
                                </span>
                            </div>

                            {/* Ticket table */}
                            {loading ? (
                                <div className="p-6 space-y-4">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="flex items-center gap-4 animate-pulse">
                                            <div className="h-4 bg-gray-200 rounded w-20" />
                                            <div className="h-4 bg-gray-200 rounded w-1/3" />
                                            <div className="h-4 bg-gray-200 rounded w-16 ml-auto" />
                                        </div>
                                    ))}
                                </div>
                            ) : filteredTickets.length === 0 ? (
                                <div className="text-center py-16">
                                    <MessageSquare className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                                    <h3 className="text-base font-bold text-gray-600 mb-1">
                                        {tickets.length === 0 ? 'No tickets yet' : 'No matching tickets'}
                                    </h3>
                                    <p className="text-sm text-gray-400 mb-5">
                                        {tickets.length === 0 ? 'Create your first support ticket to get started.' : 'Try adjusting your search or filter.'}
                                    </p>
                                    {tickets.length === 0 && (
                                        <button
                                            onClick={() => setView('create')}
                                            className="inline-flex items-center gap-2 bg-[#3d5c3a] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#2d4a2a] transition-colors cursor-pointer"
                                        >
                                            <Plus className="h-4 w-4" /> Create Ticket
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {/* Table header (desktop) */}
                                    <div className="hidden md:grid grid-cols-[100px_1fr_120px_100px_100px] gap-4 px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-50">
                                        <span>Ticket ID</span>
                                        <span>Subject</span>
                                        <span>Status</span>
                                        <span>Priority</span>
                                        <span>Updated</span>
                                    </div>

                                    {/* Ticket rows */}
                                    <div className="divide-y divide-gray-50">
                                        {filteredTickets.map((ticket: any) => {
                                            const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                                            const priority = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.medium;
                                            return (
                                                <Link
                                                    key={ticket.ticket_id}
                                                    href={`/help-center/support/${ticket.ticket_id}`}
                                                    className="block hover:bg-[#3d5c3a]/[0.02] transition-colors group"
                                                >
                                                    {/* Desktop layout */}
                                                    <div className="hidden md:grid grid-cols-[100px_1fr_120px_100px_100px] gap-4 px-6 py-4 items-center">
                                                        <span className="text-xs font-mono text-gray-400">{ticket.ticket_number}</span>
                                                        <div>
                                                            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#3d5c3a] transition-colors truncate">
                                                                {ticket.subject}
                                                            </h3>
                                                            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mt-0.5">
                                                                {ticket.category}
                                                            </span>
                                                        </div>
                                                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full w-fit ${status.bg} ${status.text}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                                            {status.label}
                                                        </span>
                                                        <span className={`text-xs font-semibold flex items-center gap-1 ${priority.color}`}>
                                                            <span>{priority.icon}</span> {priority.label}
                                                        </span>
                                                        <span className="text-xs text-gray-400">{timeAgo(ticket.updated_at)}</span>
                                                    </div>

                                                    {/* Mobile layout */}
                                                    <div className="md:hidden px-5 py-4">
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <span className="text-[10px] font-mono text-gray-400">{ticket.ticket_number}</span>
                                                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                                                {status.label}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-sm font-semibold text-gray-900 mb-1">{ticket.subject}</h3>
                                                        <div className="flex items-center gap-3 text-xs text-gray-400">
                                                            <span className="uppercase text-[10px] tracking-wider font-bold">{ticket.category}</span>
                                                            <span className={`font-semibold ${priority.color}`}>{priority.icon} {priority.label}</span>
                                                            <span className="ml-auto">{timeAgo(ticket.updated_at)}</span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-8">
                            <Link
                                href="/help-center"
                                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#3d5c3a] transition-colors"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Back to Help Center
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
