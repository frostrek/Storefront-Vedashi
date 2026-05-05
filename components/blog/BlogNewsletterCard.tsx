import { useEffect, useState } from 'react';
import { subscribeNewsletter } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export default function BlogNewsletterCard() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const { user, isAuthenticated } = useAuth();

    // Pre-fill email if logged in
    useEffect(() => {
        if (isAuthenticated && user?.email) {
            setEmail(user.email);
        }
    }, [isAuthenticated, user]);

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !email.includes('@')) {
            toast.error('Please enter a valid email.');
            return;
        }

        setLoading(true);
        try {
            const res = await subscribeNewsletter(email);
            if (res.success) {
                toast.success('You have joined the Sanctuary!');
                setEmail('');
            } else {
                toast.error(res.message || 'Failed to subscribe.');
            }
        } catch (error) {
            toast.error('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white text-charcoal rounded-[2rem] p-8 md:p-12 shadow-xl border border-light-border/50 text-center relative overflow-hidden">
            <div className="relative z-10">
                <div className="mx-auto w-12 h-12 rounded-full border border-light-border flex items-center justify-center mb-6 bg-gray-50">
                    <svg className="w-5 h-5 text-[#91C934]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>

                <h3 className="text-2xl md:text-3xl font-bold mb-3">
                    The Rituals List
                </h3>

                <p className="text-charcoal text-sm md:text-base mb-8 leading-relaxed">
                    Weekly drops of Vedic wisdom, seasonal recipes, and mindful rituals for the modern soul.
                </p>

                <form className="space-y-4" onSubmit={handleSubscribe}>
                    <input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        required
                        className="w-full bg-gray-50 text-charcoal border border-light-border rounded-full px-6 py-3.5 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#91C934]/20 shadow-sm disabled:opacity-50"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-full py-4 text-sm md:text-base font-bold bg-[#91C934] hover:bg-[#7bb42c] text-white transition-all duration-300 shadow-lg hover:shadow-[#91C934]/30 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center min-h-[56px]"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Join the Sanctuary'}
                    </button>
                </form>

                <div className="mt-6 border-t border-light-border/60 pt-4">
                    <p className="text-[10px] md:text-xs text-warm-gray/60 tracking-wider uppercase">
                        Strictly Private. No Spam. Pure Wisdom.
                    </p>
                </div>
            </div>
        </div >
    );
}
