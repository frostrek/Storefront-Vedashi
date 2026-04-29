'use client';
import Link from 'next/link';
import { getLoyaltyWallet, getLoyaltyTransactions } from '@/lib/api';
import { useState, useEffect } from 'react';
import { Wallet, Star, History, ArrowUpRight, ArrowDownRight, Award, Loader2, Info, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

interface MyWalletProps {
    customerId: string;
}

export default function MyWallet({ customerId }: MyWalletProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [wallet, setWallet] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);

    useEffect(() => {
        if (customerId) {
            fetchWalletData();
        }
    }, [customerId]);

    const fetchWalletData = async () => {
        try {
            const [walletData, txnsData] = await Promise.all([
                getLoyaltyWallet(),
                getLoyaltyTransactions(50, 0)
            ]);

            if (walletData) setWallet(walletData);
            if (txnsData) setTransactions(txnsData);
        } catch (error) {
            toast.error('Failed to load wallet data.');
        } finally {
            setLoading(false);
        }
    };

    // If completely uninitialized and not in cache, wait for load
    if (loading && !user?.loyalty_tier && !wallet) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-burgundy" />
            </div>
        );
    }

    if (!loading && (!wallet || !wallet.wallet) && !user?.loyalty_tier) {
        return (
            <div className="text-center py-12 p-6 bg-white rounded-[2rem] border border-[#F0EAD6] shadow-sm animate-fadeIn">
                <div className="w-20 h-20 bg-[#FDFBF7] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#91c934]/10">
                    <Wallet className="h-10 w-10 text-[#91c934]/30" />
                </div>
                <h3 className="text-2xl font-bold text-[#1f2937]">Sanctuary Not Activated</h3>
                <p className="text-[#4A5D4A] mt-2 max-w-sm mx-auto">Embrace the path of wellness. Your ritual journal begins with your first soulful purchase.</p>
                <button 
                    onClick={() => window.location.href = '/'}
                    className="mt-8 px-8 py-3 bg-[#91c934] text-white font-bold rounded-xl hover:bg-[#7ab52a] transition-all shadow-lg text-xs uppercase tracking-widest"
                >
                    Begin Your Journey
                </button>
            </div>
        );
    }

    const walletObj = wallet?.wallet || {};
    const tierObj = wallet?.tier || {};
    const { balance, lifetime_earned, lifetime_redeemed } = walletObj;
    const { tier_name, benefits, badge_color } = tierObj;
    
    // Auth context fallback fields
    const displayTier = tier_name || user?.loyalty_tier || 'Bronze';
    const displayBalance = balance ?? user?.wallet_balance ?? 0;

    return (
        <div className="space-y-8 w-full max-w-5xl mx-auto animate-fadeIn">
            {/* Header Section */}
            <div className="relative group">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-[#91c934]/10 rounded-xl border border-[#91c934]/20 text-[#91c934] group-hover:bg-[#91c934] group-hover:text-white transition-all duration-500 shadow-sm">
                        <Wallet className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-[#1f2937] tracking-tight">Vedic Ritual Rewards</h2>
                        <p className="text-sm text-[#4A5D4A] font-medium flex items-center gap-1.5 mt-1">
                            <Star className="h-3.5 w-3.5 text-[#D4A847] fill-[#D4A847]" />
                            Your journey towards holistic wellness, rewarded.
                        </p>
                    </div>
                </div>
            </div>

            {/* Wallet Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Available Balance - The Master Card */}
                <div className="lg:col-span-2 bg-gradient-to-br from-[#5a9a1e] to-[#91c934] text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[280px] group border border-[#D4A847]/20 hover:border-[#D4A847]/40 transition-all duration-700">
                    {/* Leaf Pattern Background */}
                    <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.03] pointer-events-none transform translate-x-12 -translate-y-12 rotate-12 group-hover:rotate-45 transition-transform duration-1000">
                        <Star className="w-full h-full text-[#D4A847]" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                             <p className="text-white/60 text-[10px] font-bold tracking-[0.3em] uppercase">Active Plan</p>
                             <div className="h-2 w-2 rounded-full bg-[#D4A847] shadow-[0_0_10px_#D4A847] animate-pulse" />
                        </div>
                        <h3 className="text-4xl md:text-5xl font-bold text-[#D4A847] mb-4 tracking-tight">
                            {displayTier} Ritualist
                        </h3>
                        {benefits && Array.isArray(benefits) && benefits.length > 0 ? (
                            <p className="text-sm text-white/90 leading-relaxed max-w-md font-medium">
                                {benefits.join(', ')}.
                            </p>
                        ) : (
                            <p className="text-sm text-white/70 italic leading-relaxed">
                                Unlock your potential. Your wellness journey is just beginning.
                            </p>
                        )}
                    </div>
 
                    <div className="relative z-10 flex items-end justify-between border-t border-white/10 pt-6 mt-4">
                        <div>
                             <p className="text-[10px] uppercase font-bold text-white/50 tracking-[0.2em] mb-1">Aura Balance</p>
                             <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-white">{displayBalance}</span>
                                <span className="text-xs font-bold text-[#D4A847] uppercase tracking-tighter">Points</span>
                             </div>
                        </div>
                        <button className="px-8 py-3 bg-[#D4A847] hover:bg-[#C1973E] text-[#1f2937] font-extrabold rounded-xl transition-all duration-300 shadow-lg transform active:scale-95 text-[10px] uppercase tracking-widest">
                            Manage Rituals
                        </button>
                    </div>
                </div>

                {/* Lifetime Stats Container */}
                <div className="lg:col-span-1 grid grid-rows-2 gap-4">
                    {/* Lifetime Earned */}
                    <div className="bg-white border-2 border-[#F0EAD6] p-5 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-[#D4A847]/30 transition-all duration-500 flex items-center gap-4 group">
                        <div className="h-12 w-12 bg-[#91c934]/5 rounded-2xl flex items-center justify-center border border-[#91c934]/10 group-hover:bg-[#91c934] transition-colors duration-500">
                            <ArrowUpRight className="h-6 w-6 text-[#91c934] group-hover:text-white transition-colors duration-500" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-[#1f2937] mb-0.5">{lifetime_earned || 0}</h3>
                            <p className="text-[9px] font-bold text-[#4A5D4A] uppercase tracking-widest">Gained Aura</p>
                        </div>
                    </div>

                    {/* Lifetime Redeemed */}
                    <div className="bg-white border-2 border-[#F0EAD6] p-5 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-[#D4A847]/30 transition-all duration-500 flex items-center gap-4 group">
                        <div className="h-12 w-12 bg-[#8B3A42]/5 rounded-2xl flex items-center justify-center border border-[#8B3A42]/10 group-hover:bg-[#8B3A42] transition-colors duration-500">
                            <ArrowDownRight className="h-6 w-6 text-[#8B3A42] group-hover:text-white transition-colors duration-500" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-[#1f2937] mb-0.5">{Math.abs(lifetime_redeemed || 0)}</h3>
                            <p className="text-[9px] font-bold text-[#4A5D4A] uppercase tracking-widest">Shared Blessings</p>
                        </div>
                    </div>
                </div>

                {/* Tier Benefits & Badge */}
                <div className="bg-white border-2 border-[#F0EAD6] p-6 rounded-[2rem] shadow-sm flex flex-col relative overflow-hidden group hover:border-[#D4A847]/30 hover:shadow-xl transition-all duration-500">
                    <div className="absolute -bottom-4 -right-4 p-3 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-1000 rotate-12 transform scale-150 pointer-events-none">
                        <Award className="h-24 w-24 text-[#D4A847]" />
                    </div>
                    
                    {/* Badge Icon Top Right or Top Center */}
                    <div className="flex-1">
                        <div className="mb-6 flex justify-between items-start">
                            <div className="h-16 w-16 rounded-2xl flex items-center justify-center shadow-md transform group-hover:scale-110 transition-transform duration-500 border"
                                 style={{ 
                                     backgroundColor: badge_color ? `${badge_color}15` : '#D4A84715',
                                     borderColor: badge_color ? `${badge_color}30` : '#D4A84730'
                                 }}>
                                <Award className="h-8 w-8" style={{ color: badge_color || '#D4A847' }} />
                            </div>
                        </div>

                        <div className="relative z-10 mt-auto">
                            <div className="text-[10px] font-bold text-[#D4A847] uppercase tracking-widest mb-4 flex items-center gap-2">
                               <div className="h-1 w-1 rounded-full bg-[#D4A847]" /> Tier Benefits
                            </div>
                            <ul className="space-y-3">
                                 <li className="text-[11px] font-medium text-[#1f2937] flex items-center gap-2">
                                    <div className="h-5 w-5 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                                        <Check className="h-3 w-3 text-emerald-600" />
                                    </div>
                                    Multiplier: <span className="font-bold">{tierObj.points_multiplier || 1}x</span>
                                 </li>
                                 <li className="text-[11px] font-medium text-[#1f2937] flex items-center gap-2">
                                    <div className="h-5 w-5 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                                        <Check className="h-3 w-3 text-emerald-600" />
                                    </div>
                                    Discount: <span className="font-bold">{tierObj.discount_percent || 0}%</span>
                                 </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactions History Header */}
            <div className="pt-4 flex items-center justify-between border-b border-[#F0EAD6] pb-4">
                <div className="flex items-center gap-3">
                    <History className="h-5 w-5 text-[#D4A847]" />
                    <h3 className="text-xl font-bold text-[#1f2937]">Ritual Journal</h3>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#4A5D4A] uppercase tracking-widest">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Real-time History
                </div>
            </div>

            {/* Transactions History Section */}
            <div className="grid gap-4">
                {Array.isArray(transactions) && transactions.length === 0 ? (
                    <div className="p-16 text-center bg-white rounded-[2rem] border border-[#F0EAD6] shadow-sm">
                        <div className="w-16 h-16 bg-[#FDFBF7] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#F0EAD6]">
                            <History className="h-8 w-8 text-[#D4A847]/40" />
                        </div>
                        <h4 className="text-lg font-bold text-[#1f2937]">Empty Journal</h4>
                        <p className="text-sm text-[#4A5D4A] max-w-xs mx-auto mt-2">
                            Your journey has just begun. Manifest points by engaging in rituals and reviews.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-[2rem] border border-[#F0EAD6] shadow-sm overflow-hidden">
                        <div className="divide-y divide-[#F0EAD6]">
                            {Array.isArray(transactions) && transactions.map((txn) => {
                                const isCredit = Number(txn.points) > 0;
                                return (
                                    <div key={txn.transaction_id} className="p-6 flex items-center justify-between hover:bg-[#FDFBF7] transition-all duration-300 group">
                                        <div className="flex items-center gap-5">
                                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border shadow-sm transition-transform duration-500 group-hover:scale-110 ${isCredit 
                                                    ? 'bg-[#E7F3E7] border-[#C1DDC1] text-[#91c934]' 
                                                    : 'bg-[#FBE9EB] border-[#F4CED3] text-[#8B3A42]'
                                                }`}>
                                                {isCredit ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#1f2937] text-base capitalize tracking-tight">
                                                    {txn.transaction_type.replace(/_/g, ' ')}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <p className="text-[10px] font-bold text-[#4A5D4A]/90 uppercase tracking-widest">
                                                        {new Date(txn.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                    {txn.reference_type === 'order' && (
                                                        <span className="h-1 w-1 rounded-full bg-[#D4A847]" />
                                                    )}
                                                    {txn.reference_type === 'order' && (
                                                        <p className="text-[10px] font-bold text-[#D4A847] uppercase tracking-widest">
                                                            Ref: #{txn.reference_id?.substring(0, 8)}
                                                        </p>
                                                    )}
                                                </div>
                                                {txn.expires_at && isCredit && (
                                                    <div className="mt-2 flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 border border-amber-100 rounded-md inline-flex">
                                                        <div className="h-1 w-1 rounded-full bg-amber-500" />
                                                        <p className="text-[9px] font-bold text-amber-700 uppercase tracking-tight">
                                                            Aura Expires: {new Date(txn.expires_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-black text-xl tracking-tighter ${isCredit ? 'text-[#91c934]' : 'text-charcoal'}`}>
                                                {isCredit ? '+' : ''}{txn.points}
                                            </p>
                                            <div className="flex items-center justify-end gap-1 mt-1">
                                                <span className="text-[9px] font-bold text-[#4A5D4A]/40 uppercase tracking-widest">Post Aura</span>
                                                <p className="text-xs font-mono font-bold text-[#4A5D4A] tracking-tighter">{txn.balance_after}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Aesthetic Footer / Tip */}
            <div className="p-8 bg-gradient-to-r from-[#5a9a1e] to-[#91c934] rounded-[2rem] text-white overflow-hidden relative group">
                 <div className="absolute top-0 right-0 p-4 opacity-10 transform -rotate-12 translate-x-4">
                    <Star className="h-32 w-32 text-white" />
                 </div>
                 <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="max-w-md">
                        <h4 className="text-2xl font-bold mb-2 text-[#D4A847]">The Essence of Reciprocity</h4>
                        <p className="text-sm text-white/80 leading-relaxed">
                            "In Nature, everything given returns in abundance. Your loyalty reflects the harmony of our shared values."
                        </p>
                    </div>
                    <Link 
                        href="/products"
                        className="px-8 py-3 bg-[#D4A847] hover:bg-[#C1973E] text-[#1f2937] font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-[#D4A847]/30 transform active:scale-95 text-xs uppercase tracking-widest text-center"
                    >
                        Nourish Your Aura
                    </Link>
                 </div>
            </div>
        </div>
    );
}
