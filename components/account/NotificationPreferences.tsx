'use client';

import { useState, useEffect, useCallback } from 'react';
import { getNotificationPreferences, toggleNotificationPreference } from '@/lib/api';
import { Mail, Smartphone, MessageSquare, Bell, Loader2, Package, Tag, TrendingDown, Newspaper, Shield, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

interface Preference {
    preference_id: string;
    channel: string;
    category: string;
    is_enabled: boolean;
    updated_at: string;
}

const CHANNEL_META: Record<string, { label: string; description: string; icon: React.ElementType; color: string }> = {
    email: { label: 'Email', description: 'Receive notifications via email', icon: Mail, color: '#6B2737' },
    sms: { label: 'SMS', description: 'Receive notifications via text message', icon: Smartphone, color: '#2563EB' },
    whatsapp: { label: 'WhatsApp', description: 'Receive notifications on WhatsApp', icon: MessageSquare, color: '#25D366' },
    push: { label: 'Push Notifications', description: 'Browser and app push notifications', icon: Bell, color: '#F59E0B' },
};

const CATEGORY_META: Record<string, { label: string; description: string; icon: React.ElementType }> = {
    order_updates: { label: 'Order & Delivery Updates', description: 'Order confirmation, status changes, shipping & delivery', icon: Package },
    account_security: { label: 'Account & Security', description: 'Login alerts, password changes', icon: Shield },
    promotions: { label: 'Promotions & Offers', description: 'Sales, discounts, special deals', icon: Tag },
    price_alerts: { label: 'Price Alerts', description: 'Price drops on wishlist items', icon: TrendingDown },
    newsletter: { label: 'Newsletter', description: 'Weekly curated content & picks', icon: Newspaper },
};

const CATEGORY_ORDER = ['order_updates', 'account_security', 'promotions', 'price_alerts', 'newsletter'];
const CHANNEL_ORDER = ['email', 'sms'];

// SMS channel only shows a subset of categories
const SMS_CATEGORIES = ['order_updates', 'account_security'];

export default function NotificationPreferences() {
    const [preferences, setPreferences] = useState<Preference[]>([]);
    const [loading, setLoading] = useState(true);
    const [togglingKey, setTogglingKey] = useState<string | null>(null);

    const fetchPreferences = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getNotificationPreferences();
            if (res.success && res.data?.preferences) {
                setPreferences(res.data.preferences);
            }
        } catch {
            toast.error('Failed to load notification preferences');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPreferences();
    }, [fetchPreferences]);

    const handleToggle = async (channel: string, category: string, currentValue: boolean) => {
        const key = `${channel}:${category}`;
        setTogglingKey(key);

        // Optimistic update
        setPreferences(prev =>
            prev.map(p =>
                p.channel === channel && p.category === category
                    ? { ...p, is_enabled: !currentValue }
                    : p
            )
        );

        try {
            const res = await toggleNotificationPreference(channel, category, !currentValue);
            if (!res.success) {
                // Revert optimistic update
                setPreferences(prev =>
                    prev.map(p =>
                        p.channel === channel && p.category === category
                            ? { ...p, is_enabled: currentValue }
                            : p
                    )
                );
                toast.error(res.message || 'Failed to update preference');
            } else {
                toast.success('Preference updated successfully');
            }
        } catch {
            // Revert
            setPreferences(prev =>
                prev.map(p =>
                    p.channel === channel && p.category === category
                        ? { ...p, is_enabled: currentValue }
                        : p
                )
            );
            toast.error('Network error. Please try again.');
        } finally {
            setTogglingKey(null);
        }
    };

    const getPreferenceValue = (channel: string, category: string): boolean => {
        const pref = preferences.find(p => p.channel === channel && p.category === category);
        return pref?.is_enabled ?? true;
    };

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-burgundy" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl space-y-6">
            {/* Header */}
            <div>
                <h2 className="font-serif text-lg font-bold text-charcoal">Notification Preferences</h2>
                <p className="text-sm text-warm-gray mt-0.5">
                    Manage how you&apos;d like to receive alerts and updates from us
                </p>
            </div>

            {/* ── Receive Notifications Via ── */}
            <div className="rounded-2xl border border-light-border bg-white overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-light-border bg-cream/50">
                    <h3 className="font-serif text-base font-bold text-charcoal">Receive notifications via:</h3>
                    <p className="text-xs text-warm-gray mt-0.5">Select the channels you want to receive notifications on</p>
                </div>
                <div className="px-6 py-4 flex flex-wrap gap-5">
                    {/* SMS — active */}
                    <label className="flex items-center gap-2.5 cursor-default select-none">
                        <span
                            className="relative flex h-5 w-5 items-center justify-center rounded border-2"
                            style={{ borderColor: '#2563EB', backgroundColor: '#2563EB' }}
                        >
                            <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <input type="checkbox" disabled checked readOnly className="sr-only" />
                        </span>
                        <Smartphone className="h-4 w-4" style={{ color: '#2563EB' }} />
                        <span className="text-sm font-medium text-charcoal">SMS</span>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 leading-tight">Active</span>
                    </label>

                    {/* Email — active */}
                    <label className="flex items-center gap-2.5 cursor-default select-none">
                        <span
                            className="relative flex h-5 w-5 items-center justify-center rounded border-2"
                            style={{ borderColor: '#6B2737', backgroundColor: '#6B2737' }}
                        >
                            <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <input type="checkbox" disabled checked readOnly className="sr-only" />
                        </span>
                        <Mail className="h-4 w-4" style={{ color: '#6B2737' }} />
                        <span className="text-sm font-medium text-charcoal">Email</span>
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 leading-tight">Active</span>
                    </label>

                    {/* WhatsApp — coming soon */}
                    <label className="flex items-center gap-2.5 cursor-not-allowed select-none opacity-60">
                        <span className="relative flex h-5 w-5 items-center justify-center rounded border border-gray-300 bg-gray-100">
                            <input
                                type="checkbox"
                                disabled
                                checked={false}
                                readOnly
                                className="sr-only"
                            />
                        </span>
                        <MessageSquare className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-warm-gray">WhatsApp</span>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 leading-tight">Coming Soon</span>
                    </label>
                </div>
            </div>

            {/* Channel Sections */}
            {CHANNEL_ORDER.map(channel => {
                const meta = CHANNEL_META[channel];
                const Icon = meta.icon;
                // SMS only exposes order_updates + account_security
                const categories = channel === 'sms' ? SMS_CATEGORIES : CATEGORY_ORDER;

                return (
                    <div
                        key={channel}
                        className="rounded-2xl border border-light-border bg-white overflow-hidden shadow-sm"
                    >
                        {/* Channel header */}
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-light-border bg-cream/50">
                            <div
                                className="flex h-10 w-10 items-center justify-center rounded-xl"
                                style={{ backgroundColor: meta.color + '15' }}
                            >
                                <Icon className="h-5 w-5" style={{ color: meta.color }} />
                            </div>
                            <div>
                                <h3 className="font-serif text-base font-bold text-charcoal">{meta.label}</h3>
                                <p className="text-xs text-warm-gray">{meta.description}</p>
                            </div>
                        </div>

                        {/* Category toggles */}
                        <div className="divide-y divide-light-border/50">
                            {categories.map(category => {
                                const catMeta = CATEGORY_META[category];
                                const CatIcon = catMeta.icon;
                                const isEnabled = getPreferenceValue(channel, category);
                                const key = `${channel}:${category}`;
                                const isToggling = togglingKey === key;

                                return (
                                    <div
                                        key={category}
                                        className="flex items-center justify-between px-6 py-3.5 hover:bg-cream/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <CatIcon className="h-4 w-4 text-warm-gray flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-charcoal">{catMeta.label}</p>
                                                <p className="text-xs text-warm-gray">{catMeta.description}</p>
                                            </div>
                                        </div>

                                        {/* Toggle */}
                                        <button
                                            onClick={() => handleToggle(channel, category, isEnabled)}
                                            disabled={isToggling}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${isEnabled
                                                ? 'focus:ring-burgundy'
                                                : 'focus:ring-gray-300'
                                                } ${isToggling ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                                            style={{
                                                backgroundColor: isEnabled ? meta.color : '#D1D5DB',
                                            }}
                                            aria-label={`${isEnabled ? 'Disable' : 'Enable'} ${catMeta.label} via ${meta.label}`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${isEnabled ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* Footer info */}
            <div className="rounded-xl bg-cream/60 border border-light-border px-5 py-4">
                <p className="text-xs text-warm-gray leading-relaxed">
                    <strong className="text-charcoal">Note:</strong> Account security notifications (login alerts, password changes) are always
                    sent via email for your safety and cannot be fully disabled. SMS notifications require a verified phone number on your account.
                </p>
            </div>
        </div>
    );
}
