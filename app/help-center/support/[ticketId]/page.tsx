'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    ChevronLeft, Send, User, Shield, Clock,
    MessageSquare, AlertCircle, Zap
} from 'lucide-react';
import { getSupportTicketDetail, replySupportTicket } from '@/lib/api';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
    open: { label: 'Open', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    in_progress: { label: 'In Progress', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    resolved: { label: 'Resolved', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    closed: { label: 'Closed', bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' },
};

const PRIORITY_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
    low: { label: 'Low', bg: 'bg-gray-100', text: 'text-gray-500' },
    medium: { label: 'Medium', bg: 'bg-amber-50', text: 'text-amber-600' },
    high: { label: 'High', bg: 'bg-orange-50', text: 'text-orange-600' },
    urgent: { label: 'Urgent', bg: 'bg-red-50', text: 'text-red-600' },
};

function formatTime(date: string) {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

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

    /* ── Loading state ── */
    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAF7F2]">
                <div className="bg-white border-b border-gray-100">
                    <div className="max-w-3xl mx-auto px-6 py-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-32 mb-4" />
                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
                        <div className="flex gap-3">
                            <div className="h-5 bg-gray-200 rounded-full w-20" />
                            <div className="h-5 bg-gray-200 rounded-full w-20" />
                            <div className="h-5 bg-gray-200 rounded-full w-24" />
                        </div>
                    </div>
                </div>
                <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />)}
                </div>
            </div>
        );
    }

    /* ── Not found ── */
    if (!data?.ticket) {
        return (
            <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
                <div className="text-center">
                    <MessageSquare className="h-14 w-14 text-gray-200 mx-auto mb-5" />
                    <h2 className="text-xl font-bold text-gray-700 mb-2">Ticket not found</h2>
                    <p className="text-sm text-gray-400 mb-6">This ticket may have been removed or you don&apos;t have access.</p>
                    <Link href="/help-center/support" className="text-[#3d5c3a] text-sm font-bold hover:underline">
                        ← Back to Tickets
                    </Link>
                </div>
            </div>
        );
    }

    const { ticket, messages = [] } = data;
    const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';
    const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
    const priority = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.medium;

    /* ── Group messages by date ── */
    const groupedMessages: { date: string; items: any[] }[] = [];
    messages.forEach((msg: any) => {
        const dateStr = formatDate(msg.created_at);
        const last = groupedMessages[groupedMessages.length - 1];
        if (last && last.date === dateStr) {
            last.items.push(msg);
        } else {
            groupedMessages.push({ date: dateStr, items: [msg] });
        }
    });

    return (
        <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
            {/* ═══════ TICKET HEADER ═══════ */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-3xl mx-auto px-6 py-6">
                    <Link
                        href="/help-center/support"
                        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#3d5c3a] transition-colors mb-4"
                    >
                        <ChevronLeft className="h-4 w-4" /> My Tickets
                    </Link>

                    <h1 className="text-xl md:text-2xl font-serif font-bold text-gray-900 mb-3">
                        {ticket.subject}
                    </h1>

                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Ticket number */}
                        <span className="text-xs font-mono text-gray-400 border border-gray-200 rounded-full px-2.5 py-0.5">
                            #{ticket.ticket_number}
                        </span>

                        {/* Status badge */}
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${status.bg} ${status.text} ${status.border}`}>
                            {status.label}
                        </span>

                        {/* Priority badge */}
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${priority.bg} ${priority.text}`}>
                            <Zap className="h-3 w-3" />
                            {priority.label}
                        </span>

                        {/* Meta info */}
                        <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto">
                            <Clock className="h-3 w-3" />
                            {formatDate(ticket.created_at)}
                        </span>
                    </div>
                </div>
            </div>

            {/* ═══════ CHAT AREA ═══════ */}
            <div className="flex-1">
                <div className="max-w-3xl mx-auto px-6 py-6">
                    {/* Live Chat header */}
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-sm font-bold text-gray-900">Live Chat Activity</span>
                            </div>
                            <span className="text-xs text-gray-400">
                                {messages.length} message{messages.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {/* Messages */}
                        <div className="px-6 py-6 min-h-[300px] max-h-[500px] overflow-y-auto">
                            {messages.length === 0 ? (
                                <div className="text-center py-12">
                                    <MessageSquare className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                                    <p className="text-sm text-gray-400">No messages yet. Start the conversation below.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {groupedMessages.map((group) => (
                                        <div key={group.date}>
                                            {/* Date divider */}
                                            <div className="flex items-center gap-3 my-4">
                                                <div className="flex-1 h-px bg-gray-100" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
                                                    {group.date}
                                                </span>
                                                <div className="flex-1 h-px bg-gray-100" />
                                            </div>

                                            {group.items.map((msg: any) => {
                                                const isAdmin = msg.sender_type === 'admin';
                                                return (
                                                    <div
                                                        key={msg.message_id}
                                                        className={`flex gap-3 mb-4 ${isAdmin ? '' : 'flex-row-reverse'}`}
                                                    >
                                                        {/* Avatar */}
                                                        <div
                                                            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isAdmin
                                                                ? 'bg-[#3d5c3a]/10'
                                                                : 'bg-gray-100'
                                                                }`}
                                                        >
                                                            {isAdmin ? (
                                                                <Shield className="h-4 w-4 text-[#3d5c3a]" />
                                                            ) : (
                                                                <User className="h-4 w-4 text-gray-500" />
                                                            )}
                                                        </div>

                                                        <div className={`max-w-[75%] ${isAdmin ? '' : 'text-right'}`}>
                                                            {/* Sender name + time */}
                                                            <div className={`flex items-center gap-2 mb-1.5 ${isAdmin ? '' : 'justify-end'}`}>
                                                                <span className="text-xs font-bold text-gray-700">
                                                                    {isAdmin ? (msg.sender_name ? `${msg.sender_name} (Support)` : 'Support Team') : msg.sender_name || 'You'}
                                                                </span>
                                                                <span className="text-[10px] text-gray-400">
                                                                    {formatTime(msg.created_at)}
                                                                </span>
                                                            </div>

                                                            {/* Message bubble */}
                                                            <div
                                                                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${isAdmin
                                                                    ? 'bg-[#3d5c3a] text-white rounded-tl-md'
                                                                    : 'bg-gray-50 text-gray-700 border border-gray-100 rounded-tr-md text-left'
                                                                    }`}
                                                            >
                                                                {msg.body}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Reply input */}
                        {!isClosed ? (
                            <form onSubmit={handleReply} className="border-t border-gray-100">
                                <div className="px-6 py-4">
                                    <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                if (replyText.trim()) handleReply(e);
                                            }
                                        }}
                                        placeholder="Type your reply..."
                                        rows={3}
                                        className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3d5c3a]/20 focus:border-[#3d5c3a] resize-none"
                                    />
                                </div>
                                <div className="flex items-center justify-between px-6 pb-4">
                                    <p className="text-xs text-gray-400">Press Enter to send, Shift+Enter for new line</p>
                                    <button
                                        type="submit"
                                        disabled={sending || !replyText.trim()}
                                        className="inline-flex items-center gap-2 bg-[#3d5c3a] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#2d4a2a] transition-colors disabled:opacity-50 cursor-pointer"
                                    >
                                        Send Reply
                                        <Send className="h-4 w-4" />
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="px-6 py-6 border-t border-gray-100 bg-gray-50/50">
                                <div className="text-center">
                                    <p className="text-sm text-gray-500">
                                        This ticket has been <span className="font-semibold">{ticket.status.replace('_', ' ')}</span>.
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        If you need further assistance, please{' '}
                                        <Link href="/help-center/support" className="text-[#3d5c3a] font-semibold hover:underline">
                                            create a new ticket
                                        </Link>.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
