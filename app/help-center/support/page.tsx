'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ChevronLeft, Plus, MessageSquare, Clock, AlertCircle, CheckCircle, X } from 'lucide-react';
import { createSupportTicket, getMySupportTickets } from '@/lib/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Orders', 'Payments', 'Shipping & Delivery', 'Product Issues', 'Returns & Refunds', 'Account Support', 'Other'];
const STATUS_COLORS: Record<string, string> = {
    open: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-500',
};

export default function SupportPage() {
    const { isAuthenticated, user } = useAuth();
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ subject: '', category: 'Other', description: '', order_id: '' });

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
            });
            if (result.success) {
                toast.success('Ticket created successfully!');
                setShowForm(false);
                setForm({ subject: '', category: 'Other', description: '', order_id: '' });
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

    return (
        <div className="min-h-screen bg-[#FAF7F2]">
            <section className="bg-gradient-to-r from-[#4b0f1a] to-[#722F37] py-12 px-6">
                <div className="max-w-4xl mx-auto">
                    <Link href="/help-center" className="inline-flex items-center gap-1 text-[#C6A75E] text-sm mb-4 hover:text-white transition-colors">
                        <ChevronLeft className="h-4 w-4" /> Back to Help Center
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">Support Tickets</h1>
                    <p className="text-[#C6A75E]">Submit and track your support requests</p>
                </div>
            </section>

            <div className="max-w-4xl mx-auto px-6 py-10">
                {!isAuthenticated ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                        <AlertCircle className="h-12 w-12 text-[#C6A75E] mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to access support</h2>
                        <p className="text-sm text-gray-500 mb-6">You need to be logged in to submit and track tickets</p>
                        <Link href="/login" className="inline-flex items-center gap-2 bg-[#4b0f1a] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#3a0b14] transition-colors">
                            Sign In
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">My Tickets</h2>
                            <button
                                onClick={() => setShowForm(!showForm)}
                                className="inline-flex items-center gap-2 bg-[#4b0f1a] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#3a0b14] transition-colors"
                            >
                                {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                {showForm ? 'Cancel' : 'New Ticket'}
                            </button>
                        </div>

                        {/* New Ticket Form */}
                        {showForm && (
                            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-gray-100 mb-8 shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-4">Submit a Support Request</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Subject *</label>
                                        <input
                                            type="text"
                                            value={form.subject}
                                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                            placeholder="Brief description of your issue"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C6A75E] focus:border-transparent"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Category</label>
                                            <select
                                                value={form.category}
                                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C6A75E] bg-white"
                                            >
                                                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Order ID (optional)</label>
                                            <input
                                                type="text"
                                                value={form.order_id}
                                                onChange={(e) => setForm({ ...form, order_id: e.target.value })}
                                                placeholder="Enter order ID if applicable"
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C6A75E]"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description *</label>
                                        <textarea
                                            value={form.description}
                                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                                            placeholder="Describe your issue in detail..."
                                            rows={5}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C6A75E] resize-none"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="bg-[#4b0f1a] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#3a0b14] transition-colors disabled:opacity-50"
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Ticket'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Tickets List */}
                        {loading ? (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-xl p-5 animate-pulse">
                                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                                    </div>
                                ))}
                            </div>
                        ) : tickets.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-600 mb-1">No tickets yet</h3>
                                <p className="text-sm text-gray-400">Submit your first support request using the button above</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {tickets.map((ticket: any) => (
                                    <Link
                                        key={ticket.ticket_id}
                                        href={`/help-center/support/${ticket.ticket_id}`}
                                        className="block bg-white rounded-xl p-5 border border-gray-100 hover:border-[#C6A75E]/30 hover:shadow-sm transition-all group"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-bold text-gray-400">{ticket.ticket_number}</span>
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_COLORS[ticket.status] || STATUS_COLORS.open}`}>
                                                        {ticket.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <h3 className="font-semibold text-gray-900 text-sm group-hover:text-[#722F37] transition-colors">
                                                    {ticket.subject}
                                                </h3>
                                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded-full">{ticket.category}</span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(ticket.created_at).toLocaleDateString()}
                                                    </span>
                                                    {ticket.message_count > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <MessageSquare className="h-3 w-3" />
                                                            {ticket.message_count}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
