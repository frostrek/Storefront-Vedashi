'use client';

import Link from 'next/link';

const trendingPosts = [
    { id: '1', title: 'Morning Sun Salutations for Beginners', href: '#' },
    { id: '2', title: 'The Science of Copper Water Vessels', href: '#' },
    { id: '3', title: 'Overcoming Vata Imbalance Naturally', href: '#' },
];

export default function TrendingList() {
    return (
        <div className="py-2">
            <div className="flex items-center gap-2 mb-6">
                <svg className="w-5 h-5 text-wine-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <h3 className="font-serif text-lg font-bold text-charcoal">Trending Rituals</h3>
            </div>
            
            <ul className="space-y-6">
                {trendingPosts.map((post, index) => (
                    <li key={post.id} className="group flex gap-4">
                        <span className="font-serif text-3xl font-bold text-wine-gold/50 group-hover:text-wine-gold transition-colors duration-300">
                            {String(index + 1).padStart(2, '0')}
                        </span>
                        <Link href={post.href} className="pt-1.5 flex-1">
                            <h4 className="font-sans font-medium text-sm text-charcoal leading-snug group-hover:text-burgundy transition-colors duration-300">
                                {post.title}
                            </h4>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
