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
import { RU_DICTIONARY } from '@/content/ru';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    open: { label: 'Open', bg: 'bg-[#4A5D23]/10', text: 'text-[#4A5D23]', dot: 'bg-[#4A5D23]' },
    in_progress: { label: 'In Progress', bg: 'bg-[#8B4513]/10', text: 'text-[#8B4513]', dot: 'bg-[#8B4513]' },
    resolved: { label: 'Resolved', bg: 'bg-[#2E5A50]/10', text: 'text-[#2E5A50]', dot: 'bg-[#2E5A50]' },
    closed: { label: 'Closed', bg: 'bg-[#1a2408]/10', text: 'text-[#1a2408]', dot: 'bg-[#1a2408]' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    low: { label: 'Low', color: 'text-gray-400', icon: '○' },
    medium: { label: 'Medium', color: 'text-amber-600', icon: '●' },
    high: { label: 'High', color: 'text-[#4A5D23]', icon: '●' },
    urgent: { label: 'Urgent', color: 'text-red-600', icon: '▲' },
};

function formatTime(date: string) {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
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
                toast.success('Your scroll has been sent');
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
            <div className="min-h-screen bg-[#FDFBF7]">
                <div className="max-w-4xl mx-auto px-6 py-20">
                    <div className="animate-pulse space-y-12">
                        <div className="h-4 bg-gray-100 rounded-full w-32" />
                        <div className="h-10 bg-gray-200 rounded-2xl w-3/4" />
                        <div className="flex gap-4">
                            <div className="h-8 bg-gray-100 rounded-full w-24" />
                            <div className="h-8 bg-gray-100 rounded-full w-24" />
                        </div>
                        <div className="space-y-6 mt-12 bg-white rounded-[40px] h-[400px] border border-[#4A5D23]/5 shadow-sm"></div>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Not found ── */
    if (!data?.ticket) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6">
                <div className="text-center bg-white rounded-[60px] p-16 border border-[#4A5D23]/5 shadow-2xl max-w-lg w-full">
                    <div className="w-24 h-24 rounded-[30px] bg-[#4A5D23]/10 flex items-center justify-center mx-auto mb-10">
                        <MessageSquare className="h-10 w-10 text-[#4A5D23]" />
                    </div>
                    <h2 className="text-3xl font-bold text-[#1a2408] mb-4">{RU_DICTIONARY.helpCenter.support.detail.notFoundTitle}</h2>
                    <p className="text-[#5B4A31] mb-10 font-medium">{RU_DICTIONARY.helpCenter.support.detail.notFoundDesc}</p>
                    <Link href="/help-center/support" className="inline-flex items-center gap-3 bg-[#4A5D23] text-white px-10 py-5 rounded-[20px] font-black uppercase tracking-widest text-sm hover:bg-[#3a491b] transition-all shadow-xl">
                        <ChevronLeft className="h-5 w-5" /> {RU_DICTIONARY.helpCenter.support.detail.backToTickets}
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
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
            {/* ═══════ TICKET HEADER ═══════ */}
            <div className="bg-white/80 backdrop-blur-md border-b border-[#4A5D23]/5 relative z-20">
                {/* Ayurvedic Texture Overlay (Very subtle) */}
                <div className="absolute inset-0 opacity-5 bg-repeat pointer-events-none" style={{ backgroundImage: "url('/ayurvedic-texture.png')", backgroundSize: '300px' }}></div>
                
                <div className="max-w-4xl mx-auto px-6 py-10 relative z-10">
                    <Link
                        href="/help-center/support"
                        className="inline-flex items-center gap-3 text-xs font-black uppercase tracking-widest text-[#5B4A31]/60 hover:text-[#4A5D23] transition-all mb-8 group"
                    >
                        <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        {RU_DICTIONARY.helpCenter.support.detail.myTickets}
                    </Link>

                    <h1 className="text-3xl md:text-4xl font-bold text-[#1a2408] mb-6 leading-tight">
                        {ticket.subject}
                    </h1>

                    <div className="flex flex-wrap items-center gap-4">
                        {/* Status badge */}
                        <span className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border border-transparent shadow-sm ${status.bg} ${status.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            {status.label}
                        </span>

                        {/* Priority badge */}
                        <span className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full bg-gray-50 border border-gray-100 ${priority.color}`}>
                            {priority.icon} {(RU_DICTIONARY.helpCenter.support.priorities as Record<string, string>)[priority.label] || priority.label} {RU_DICTIONARY.helpCenter.support.detail.priorityLabel}
                        </span>

                        {/* Ticket number */}
                        <span className="text-[10px] font-black font-mono text-gray-400 bg-gray-50 uppercase tracking-widest px-4 py-2 rounded-full border border-gray-100">
                            {RU_DICTIONARY.helpCenter.support.detail.inquiryLabel}{ticket.ticket_number}
                        </span>

                        {/* Meta info */}
                        <span className="text-xs font-bold text-[#5B4A31]/40 flex items-center gap-2 ml-auto">
                            <Clock className="h-4 w-4" />
                            {RU_DICTIONARY.helpCenter.support.detail.createdLabel} {new Date(ticket.created_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* ═══════ CHAT AREA ═══════ */}
            <div className="flex-1 relative">
                <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
                    {/* Chat Container */}
                    <div className="bg-white rounded-[40px] border border-[#4A5D23]/5 overflow-hidden shadow-[0_32px_64px_-16px_rgba(74,93,35,0.08)] flex flex-col min-h-[600px]">
                        <div className="flex items-center justify-between px-10 py-6 border-b border-gray-50 bg-[#FDFBF7]/30">
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#4A5D23] animate-pulse" />
                                <span className="text-xs font-black uppercase tracking-widest text-[#1a2408]">{RU_DICTIONARY.helpCenter.support.detail.liveChat}</span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5B4A31]/40">
                                {messages.length} {RU_DICTIONARY.helpCenter.support.detail.messages}
                            </span>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 px-6 md:px-10 py-10 overflow-y-auto space-y-10 scrollbar-hide">
                            {messages.length === 0 ? (
                                <div className="text-center py-20">
                                    <div className="w-20 h-20 bg-gray-50 rounded-[30px] flex items-center justify-center mx-auto mb-6">
                                        <MessageSquare className="h-8 w-8 text-gray-200" />
                                    </div>
                                    <p className="text-lg font-medium text-[#5B4A31]/60">{RU_DICTIONARY.helpCenter.support.detail.emptyChat}</p>
                                </div>
                            ) : (
                                <div className="space-y-12">
                                    {groupedMessages.map((group) => (
                                        <div key={group.date}>
                                            {/* Date divider */}
                                            <div className="flex items-center gap-6 mb-10">
                                                <div className="flex-1 h-px bg-gray-100" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#5B4A31]/30">
                                                    {group.date}
                                                </span>
                                                <div className="flex-1 h-px bg-gray-100" />
                                            </div>

                                            {group.items.map((msg: any) => {
                                                const isAdmin = msg.sender_type === 'admin';
                                                return (
                                                    <div
                                                        key={msg.message_id}
                                                        className={`flex gap-4 md:gap-6 mb-8 ${isAdmin ? '' : 'flex-row-reverse'}`}
                                                    >
                                                        {/* Avatar */}
                                                        <div
                                                            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner transition-transform hover:scale-105 duration-300 ${isAdmin
                                                                ? 'bg-[#4A5D23] text-white'
                                                                : 'bg-[#FDFBF7] border border-gray-100 text-[#5B4A31]'
                                                                }`}
                                                        >
                                                            {isAdmin ? (
                                                                <Shield className="h-6 w-6" />
                                                            ) : (
                                                                <User className="h-6 w-6" />
                                                            )}
                                                        </div>

                                                        <div className={`max-w-[85%] md:max-w-[70%] ${isAdmin ? '' : 'text-right'}`}>
                                                            {/* Sender name + time */}
                                                            <div className={`flex items-center gap-3 mb-2 ${isAdmin ? '' : 'justify-end'}`}>
                                                                <span className="text-xs font-black uppercase tracking-widest text-[#1a2408]">
                                                                    {isAdmin ? (msg.sender_name ? `${msg.sender_name} (${RU_DICTIONARY.helpCenter.support.detail.supportRole})` : RU_DICTIONARY.helpCenter.support.detail.guardRole) : msg.sender_name || RU_DICTIONARY.helpCenter.support.detail.seekerRole}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-[#5B4A31]/30">
                                                                    {formatTime(msg.created_at)}
                                                                </span>
                                                            </div>

                                                            {/* Message bubble */}
                                                            <div
                                                                className={`rounded-[24px] px-6 py-4 text-base leading-relaxed whitespace-pre-line shadow-sm transition-all hover:shadow-md ${isAdmin
                                                                    ? 'bg-[#4A5D23] text-white rounded-tl-md'
                                                                    : 'bg-[#FDFBF7] text-[#1a2408] border border-[#4A5D23]/5 rounded-tr-md text-left'
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
                            <form onSubmit={handleReply} className="p-8 md:p-10 border-t border-gray-50 bg-[#FDFBF7]/30">
                                <div className="bg-white rounded-[30px] border border-[#4A5D23]/10 p-2 shadow-2xl focus-within:ring-2 focus-within:ring-[#4A5D23]/20 transition-all">
                                    <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                if (replyText.trim()) handleReply(e);
                                            }
                                        }}
                                        placeholder={RU_DICTIONARY.helpCenter.support.detail.inputPlaceholder}
                                        rows={3}
                                        className="w-full px-6 py-4 text-base text-[#1a2408] placeholder-[#5B4A31]/30 bg-transparent border-none focus:outline-none focus:ring-0 resize-none font-medium"
                                    />
                                    <div className="flex items-center justify-between px-6 pb-4">
                                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#5B4A31]/30">
                                            <Zap className="h-3.5 w-3.5" />
                                            {RU_DICTIONARY.helpCenter.support.detail.pressEnter}
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={sending || !replyText.trim()}
                                            className="inline-flex items-center gap-3 bg-[#4A5D23] text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#3a491b] transition-all disabled:opacity-50 cursor-pointer shadow-lg hover:-translate-y-1"
                                        >
                                            {RU_DICTIONARY.helpCenter.support.detail.sendScroll}
                                            <Send className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <div className="p-10 border-t border-gray-50 bg-gray-50/20">
                                <div className="text-center max-w-sm mx-auto">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
                                        <Shield className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <p className="text-base font-bold text-[#1a2408] mb-1">
                                        {RU_DICTIONARY.helpCenter.support.detail.completedTitle}
                                    </p>
                                    <p className="text-sm text-[#5B4A31]/60 font-medium">
                                        {RU_DICTIONARY.helpCenter.support.detail.completedDesc1}{' '}
                                        <Link href="/help-center/support" className="text-[#4A5D23] font-black hover:underline">
                                            {RU_DICTIONARY.helpCenter.support.detail.completedDesc2}
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
