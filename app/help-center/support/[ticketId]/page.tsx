'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ChevronLeft, Send, User, Shield, Clock, MessageSquare } from 'lucide-react';
import { getSupportTicketDetail, replySupportTicket } from '@/lib/api';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
    open: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-500',
};

export default function TicketDetailPage() {
    const params = useParams();
    const ticketId = params.ticketId as string;
    const { isAuthenticated } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const loadTicket = async () => {
        const result = await getSupportTicketDetail(ticketId);
        setData(result);
        setLoading(false);
    };

    useEffect(() => {
        if (isAuthenticated && ticketId) loadTicket();
        else setLoading(false);
    }, [isAuthenticated, ticketId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [data?.messages]);

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim()) return;
        setSending(true);
        try {
            const result = await replySupportTicket(ticketId, replyText);
            if (result.success) {
                setReplyText('');
                await loadTicket();
                toast.success('Reply sent');
            } else {
                toast.error(result.message || 'Failed to send reply');
            }
        } catch {
            toast.error('Network error');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAF7F2]">
                <div className="max-w-3xl mx-auto px-6 py-20 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>)}
                    </div>
                </div>
            </div>
        );
    }

    if (!data?.ticket) {
        return (
            <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
                <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-700 mb-2">Ticket not found</h2>
                    <Link href="/help-center/support" className="text-[#722F37] text-sm font-semibold hover:underline">
                        ← Back to Tickets
                    </Link>
                </div>
            </div>
        );
    }

    const { ticket, messages = [] } = data;
    const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';

    return (
        <div className="min-h-screen bg-[#FAF7F2]">
            {/* Header */}
            <section className="bg-gradient-to-r from-[#4b0f1a] to-[#722F37] py-8 px-6">
                <div className="max-w-3xl mx-auto">
                    <Link href="/help-center/support" className="inline-flex items-center gap-1 text-[#C6A75E] text-sm mb-3 hover:text-white transition-colors">
                        <ChevronLeft className="h-4 w-4" /> My Tickets
                    </Link>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-xl md:text-2xl font-serif font-bold text-white mb-1">{ticket.subject}</h1>
                            <div className="flex items-center gap-3 text-xs text-[#C6A75E]/80">
                                <span>{ticket.ticket_number}</span>
                                <span className="bg-white/10 px-2 py-0.5 rounded-full">{ticket.category}</span>
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(ticket.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${STATUS_COLORS[ticket.status] || STATUS_COLORS.open}`}>
                            {ticket.status.replace('_', ' ')}
                        </span>
                    </div>
                </div>
            </section>

            {/* Messages */}
            <div className="max-w-3xl mx-auto px-6 py-8">
                <div className="space-y-4 mb-6">
                    {messages.map((msg: any) => {
                        const isAdmin = msg.sender_type === 'admin';
                        return (
                            <div
                                key={msg.message_id}
                                className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}
                            >
                                <div className={`max-w-[80%] rounded-2xl p-4 ${isAdmin
                                    ? 'bg-white border border-gray-100 rounded-tl-md'
                                    : 'bg-[#4b0f1a] text-white rounded-tr-md'
                                    }`}>
                                    <div className={`flex items-center gap-2 mb-2 ${isAdmin ? 'text-gray-500' : 'text-white/70'}`}>
                                        {isAdmin ? (
                                            <Shield className="h-3 w-3" />
                                        ) : (
                                            <User className="h-3 w-3" />
                                        )}
                                        <span className="text-[10px] font-semibold uppercase">
                                            {isAdmin ? 'Support Team' : 'You'}
                                        </span>
                                        <span className="text-[10px]">
                                            {new Date(msg.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className={`text-sm whitespace-pre-line ${isAdmin ? 'text-gray-700' : 'text-white'}`}>
                                        {msg.body}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Reply Form */}
                {!isClosed ? (
                    <form onSubmit={handleReply} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                        <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Type your reply..."
                            rows={3}
                            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C6A75E] resize-none"
                        />
                        <div className="flex justify-end mt-3">
                            <button
                                type="submit"
                                disabled={sending || !replyText.trim()}
                                className="inline-flex items-center gap-2 bg-[#4b0f1a] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#3a0b14] transition-colors disabled:opacity-50"
                            >
                                <Send className="h-4 w-4" />
                                {sending ? 'Sending...' : 'Send Reply'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
                        <p className="text-sm text-gray-500">This ticket has been {ticket.status}. If you need further assistance, please create a new ticket.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
