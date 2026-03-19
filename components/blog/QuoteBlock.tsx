'use client';

export default function QuoteBlock() {
    return (
        <div className="bg-white rounded-[2rem] p-8 border border-light-border/60 shadow-sm">
            <div className="mb-4">
                <svg className="w-6 h-6 text-vedic-gold" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
            </div>
            
            <blockquote className="text-lg md:text-xl text-charcoal leading-relaxed mb-6">
                "Health is a state of complete harmony of the body, mind and spirit. When one is free from physical disabilities and mental distractions, the gates of the soul open."
            </blockquote>
            
            <div className="flex items-center justify-between border-t border-light-border pt-4">
                <span className="text-[11px] font-bold uppercase tracking-widest text-warm-gray">
                    — B.K.S. Iyengar
                </span>
            </div>
        </div>
    );
}
