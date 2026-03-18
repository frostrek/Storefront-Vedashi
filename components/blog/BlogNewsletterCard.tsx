'use client';

export default function BlogNewsletterCard() {
    return (
        <div className="bg-herbal-green text-white rounded-[2rem] p-8 md:p-12 shadow-2xl text-center relative overflow-hidden">
            {/* Decorative pattern/blur for premium feel */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl z-0" />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-vedic-gold/10 rounded-full blur-3xl z-0" />
            <div className="relative z-10">
            <div className="mx-auto w-12 h-12 rounded-full border border-white/20 flex items-center justify-center mb-6">
                <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            </div>
            
            <h3 className="text-2xl md:text-3xl font-bold mb-3">
                The Rituals List
            </h3>
            
            <p className="text-white/80 text-sm md:text-base mb-8 leading-relaxed">
                Weekly drops of Vedic wisdom, seasonal recipes, and mindful rituals for the modern soul.
            </p>
            
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <input
                    type="email"
                    placeholder="your@email.com"
                    required
                    className="w-full bg-white text-charcoal rounded-full px-6 py-3.5 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-vedic-gold/50 shadow-inner"
                />
                
                <button
                    type="submit"
                    className="w-full rounded-full py-4 text-sm md:text-base font-bold bg-vedic-gold hover:bg-vedic-gold-light text-white transition-all duration-300 shadow-lg hover:shadow-vedic-gold/30 active:scale-[0.98]"
                >
                    Join the Sanctuary
                </button>
            </form>
            
            <div className="mt-6 border-t border-white/10 pt-4">
                <p className="text-[10px] md:text-xs text-white/60 tracking-wider uppercase">
                    Strictly Private. No Spam. Pure Wisdom.
                </p>
            </div>
            </div>
        </div>
    );
}
