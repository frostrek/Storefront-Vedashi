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
    email: { label: 'Email', description: 'Receive notifications via email', icon: Mail, color: '#3B5D3B' }, // herbal-green
    sms: { label: 'SMS', description: 'Receive notifications via text message', icon: Smartphone, color: '#2D4A2D' }, // deep herbal-green
    whatsapp: { label: 'WhatsApp', description: 'Receive notifications on WhatsApp', icon: MessageSquare, color: '#25D366' },
    push: { label: 'Push Notifications', description: 'Browser and app push notifications', icon: Bell, color: '#8B7A3D' }, // keeping gold as secondary or shift? user said greenish accents. lets go light green.
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

interface NotificationPreferencesProps {
    hideHeader?: boolean;
    isMobileVerified?: boolean;
}

export default function NotificationPreferences({ 
    hideHeader = false,
    isMobileVerified = false 
}: NotificationPreferencesProps) {
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
            {!hideHeader && (
                <div>
                    <h2 className="text-lg font-bold text-charcoal">Notification Preferences</h2>
                    <p className="text-sm text-warm-gray mt-0.5">
                        Manage how you&apos;d like to receive alerts and updates from us
                    </p>
                </div>
            )}

            {/* ── Receive Notifications Via ── */}
            <div className="rounded-3xl border border-light-border bg-white overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-light-border bg-cream/50">
                    <h3 className="text-base font-bold text-herbal-green">Receive notifications via:</h3>
                    <p className="text-[10px] font-bold text-warm-gray uppercase tracking-widest mt-1">Select the channels for your periodic awareness</p>
                </div>
                <div className="flex flex-col divide-y divide-light-border/50">
                    {/* SMS — active if verified */}
                    <div className={`flex items-center justify-between px-6 py-4 cursor-default select-none ${!isMobileVerified ? 'opacity-40' : 'bg-cream/20'}`}>
                        <div className="flex items-center gap-3">
                            <span
                                className="relative flex h-5 w-5 items-center justify-center rounded-md border-2"
                                style={{ 
                                    borderColor: isMobileVerified ? '#3B5D3B' : '#D4CFC0', 
                                    backgroundColor: isMobileVerified ? '#3B5D3B' : '#F8F5F0' 
                                }}
                            >
                                {isMobileVerified && (
                                    <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </span>
                            <div className="flex items-center gap-2">
                                <Smartphone className="h-4 w-4 shrink-0" style={{ color: isMobileVerified ? '#3B5D3B' : '#BDB7A3' }} />
                                <span className="text-sm font-bold text-herbal-green">SMS</span>
                            </div>
                        </div>
                        {isMobileVerified ? (
                            <span className="rounded-full bg-herbal-green/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-herbal-green border border-herbal-green/10">Active</span>
                        ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-warm-gray/60">Unverified</span>
                        )}
                    </div>

                    {/* Email — active */}
                    <div className="flex items-center justify-between px-6 py-4 cursor-default select-none bg-cream/20">
                        <div className="flex items-center gap-3">
                            <span
                                className="relative flex h-5 w-5 items-center justify-center rounded-md border-2"
                                style={{ borderColor: '#3B5D3B', backgroundColor: '#3B5D3B' }}
                            >
                                <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </span>
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 shrink-0" style={{ color: '#3B5D3B' }} />
                                <span className="text-sm font-bold text-herbal-green">Email</span>
                            </div>
                        </div>
                        <span className="rounded-full bg-herbal-green/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-herbal-green border border-herbal-green/10">Active</span>
                    </div>

                    {/* WhatsApp — coming soon */}
                    <div className="flex items-center justify-between px-6 py-4 cursor-not-allowed select-none opacity-50">
                        <div className="flex items-center gap-3">
                            <span className="relative flex h-5 w-5 items-center justify-center rounded-md border-2 border-light-border bg-cream/30"></span>
                            <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 shrink-0 text-warm-gray" />
                                <span className="text-sm font-bold text-warm-gray/80">WhatsApp</span>
                            </div>
                        </div>
                        <span className="rounded-full bg-light-border/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-warm-gray/70">Soon</span>
                    </div>
                </div>
            </div>

            {/* Channel Sections */}
            {CHANNEL_ORDER.map(channel => {
                const meta = CHANNEL_META[channel];
                const Icon = meta.icon;
                // SMS only exposes order_updates + account_security
                const categories = channel === 'sms' ? SMS_CATEGORIES : CATEGORY_ORDER;
                const isChannelDisabled = channel === 'sms' && !isMobileVerified;

                return (
                    <div
                        key={channel}
                        className={`rounded-[32px] border border-light-border bg-white overflow-hidden shadow-sm ${isChannelDisabled ? 'opacity-50 grayscale-[0.8]' : ''}`}
                    >
                        {/* Channel header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-light-border bg-cream/50">
                            <div className="flex items-center gap-3">
                                <div
                                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                                    style={{ backgroundColor: isChannelDisabled ? '#F3F4F6' : meta.color + '15' }}
                                >
                                    <Icon className="h-5 w-5" style={{ color: isChannelDisabled ? '#9CA3AF' : meta.color }} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-herbal-green">{meta.label}</h3>
                                    <p className="text-[11px] font-medium text-warm-gray">{meta.description}</p>
                                </div>
                            </div>
                            {isChannelDisabled && (
                                <div className="text-[9px] font-bold text-burgundy bg-burgundy/5 px-3 py-1.5 rounded-full border border-burgundy/10 uppercase tracking-widest">
                                    Sanctity verification required
                                </div>
                            )}
                        </div>

                        {/* Category toggles */}
                        <div className="divide-y divide-light-border/50">
                            {categories.map(category => {
                                const catMeta = CATEGORY_META[category];
                                const CatIcon = catMeta.icon;
                                const isEnabled = getPreferenceValue(channel, category);
                                const key = `${channel}:${category}`;
                                const isToggling = togglingKey === key;
                                const isInternalDisabled = isChannelDisabled || isToggling;

                                return (
                                    <div
                                        key={category}
                                        className={`flex items-center justify-between px-6 py-3.5 hover:bg-cream/30 transition-colors ${isChannelDisabled ? 'pointer-events-none' : ''}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-8 w-8 rounded-full bg-cream flex items-center justify-center border border-light-border/30">
                                                <CatIcon className="h-4 w-4 text-herbal-green flex-shrink-0" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-herbal-green tracking-tight">{catMeta.label}</p>
                                                <p className="text-xs text-warm-gray font-medium">{catMeta.description}</p>
                                            </div>
                                        </div>

                                        {/* Toggle */}
                                        <button
                                            onClick={() => !isChannelDisabled && handleToggle(channel, category, isEnabled)}
                                            disabled={isInternalDisabled}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${isEnabled && !isChannelDisabled
                                                ? 'focus:ring-burgundy'
                                                : 'focus:ring-gray-300'
                                                } ${isInternalDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                            style={{
                                                backgroundColor: isEnabled && !isChannelDisabled ? meta.color : '#D1D5DB',
                                            }}
                                            aria-label={`${isEnabled ? 'Disable' : 'Enable'} ${catMeta.label} via ${meta.label}`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${(isEnabled && !isChannelDisabled) ? 'translate-x-6' : 'translate-x-1'
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
