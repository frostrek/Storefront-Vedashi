'use client';

import { useState, useEffect, useCallback } from 'react';
import StarRating from './StarRating';
import ReviewCard from './ReviewCard';
import ReviewForm from './ReviewForm';
import { getProductReviews, getRatingSummary, getMyReviewForProduct } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { MessageSquare } from 'lucide-react';

interface RatingSummary {
    total_reviews: number;
    average_rating: number;
    distribution: Record<number, number>;
}

interface Review {
    review_id: string;
    rating: number;
    title?: string;
    body?: string;
    reviewer_name: string;
    is_verified_purchase?: boolean;
    helpful_count?: number;
    created_at: string;
    own_vote?: 'up' | 'down' | null;
    has_reported?: boolean;
}

interface ReviewSectionProps {
    productId: string;
    product?: any;
    selectedVariant?: any;
    onAddToCart?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const SORT_OPTIONS = [
    { label: 'Most Recent', value: 'recent' },
    { label: 'Most Helpful', value: 'helpful' },
    { label: 'Highest Rated', value: 'highest' },
    { label: 'Lowest Rated', value: 'lowest' },
];

export default function ReviewSection({ productId, product, selectedVariant, onAddToCart }: ReviewSectionProps) {
    const { isAuthenticated } = useAuth();

    const [summary, setSummary] = useState<RatingSummary | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [myReview, setMyReview] = useState<Review | null>(null);
    const [sort, setSort] = useState('recent');
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [reviewsRes, summaryRes] = await Promise.all([
                getProductReviews(productId, { sort, limit: 50 }),
                getRatingSummary(productId),
            ]);

            if (reviewsRes.success && reviewsRes.data) {
                setReviews(reviewsRes.data.reviews ?? reviewsRes.data ?? []);
                if (reviewsRes.data.summary) {
                    setSummary(reviewsRes.data.summary);
                }
            }
            if (summaryRes.success && summaryRes.data) {
                setSummary(summaryRes.data);
            }

            // Check if user has an existing review
            if (isAuthenticated) {
                try {
                    const myRes = await getMyReviewForProduct(productId);
                    if (myRes.success && myRes.data?.has_reviewed) {
                        setMyReview(myRes.data.review);
                    } else {
                        setMyReview(null);
                    }
                } catch { setMyReview(null); }
            }
        } catch (err) {
            console.error('[Reviews] Failed to fetch:', err);
        } finally {
            setLoading(false);
        }
    }, [productId, sort, isAuthenticated]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const displayPrice = selectedVariant?.price ?? product?.price ?? 0;

    return (
        <section className="pt-6">
            {/* Section header */}
            <div className="mb-10 max-w-2xl">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Community Experiences</h2>
                <p className="text-[15px] text-gray-500">Stories of restoration and balance from our collective.</p>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-20 animate-pulse rounded-lg bg-neutral-100" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-10 lg:grid-cols-[1fr_320px] items-stretch">
                    {/* ── Left: Reviews + Form ── */}
                    <div className="flex flex-col">
                        {/* Sort */}
                        {reviews.length > 0 && (
                            <div className="mb-8 flex items-center justify-between">
                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                    {reviews.length} Review{reviews.length !== 1 ? 's' : ''}
                                </p>
                                <select
                                    value={sort}
                                    onChange={e => setSort(e.target.value)}
                                    className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-[#1d351d] focus:ring-1 focus:ring-[#1d351d] bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                                >
                                    {SORT_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Review list —— flex-1 to push form down */}
                        <div className="flex-1 pb-10">
                            {reviews.length > 0 ? (
                                <div className="space-y-6">
                                    {reviews.map(r => (
                                        <ReviewCard key={r.review_id} review={r} />
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-neutral-200 py-12 text-center bg-white h-full flex flex-col justify-center">
                                    <MessageSquare className="mx-auto h-8 w-8 text-neutral-300 mb-2" />
                                    <p className="text-neutral-500 text-sm">No reviews yet. Be the first to share your thoughts!</p>
                                </div>
                            )}
                        </div>

                        {/* Review form —— Bottom-aligned */}
                        <ReviewForm
                            productId={productId}
                            existingReview={myReview ? {
                                rating: myReview.rating,
                                title: myReview.title,
                                body: myReview.body,
                            } : null}
                            onSubmitted={fetchData}
                        />
                    </div>

                    {/* ── Right: Sidebar (Summary + Product Card) ── */}
                    <div className="flex flex-col">
                        <div className="lg:sticky lg:top-24 flex-1 flex flex-col items-stretch">
                            {/* Rating Summary Card (TOP) */}
                            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                                <div className="text-center">
                                    <p className="text-5xl font-bold text-gray-900 leading-none">
                                        {(summary?.average_rating ?? 0).toFixed(1)}
                                    </p>
                                    <StarRating
                                        value={summary?.average_rating ?? 0}
                                        size="lg"
                                        className="justify-center mt-3"
                                    />
                                    <p className="mt-3 text-sm text-neutral-500 font-medium">
                                        Based on {summary?.total_reviews ?? 0} review{(summary?.total_reviews ?? 0) !== 1 ? 's' : ''}
                                    </p>
                                </div>

                                {/* Star distribution bars */}
                                {summary && summary.total_reviews > 0 && (
                                    <div className="mt-8 space-y-2.5">
                                        {[5, 4, 3, 2, 1].map(star => {
                                            const count = summary.distribution[star] ?? 0;
                                            const pct = (count / (summary.total_reviews || 1)) * 100;
                                            return (
                                                <div key={star} className="flex items-center gap-3 text-sm">
                                                    <span className="w-3 text-right text-gray-500 font-medium">{star}</span>
                                                    <StarRating value={star} size="sm" className="flex-shrink-0" />
                                                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-[#1d351d] transition-all duration-500"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <span className="w-8 text-right text-xs font-semibold text-gray-400">{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Spacing element to push product card to the very bottom */}
                            <div className="flex-1 min-h-[40px]" />

                            {/* ✅ STICKY PRODUCT CARD —— Balanced & Context-Aware */}
                            {product && (
                                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-all hover:shadow-md">
                                    <div className="p-5">
                                        <div className="aspect-square w-full mb-4 overflow-hidden rounded-lg bg-gray-50 flex items-center justify-center">
                                            <img 
                                                src={product.thumbnail_url || product.images?.[0] || '/placeholder.png'} 
                                                alt={product.product_name}
                                                className="max-h-full max-w-full object-contain p-4 transition-transform hover:scale-110 duration-500"
                                            />
                                        </div>
                                        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug mb-2">
                                            {product.product_name}
                                        </h3>
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-base font-bold text-gray-900">
                                                {formatPrice(displayPrice)}
                                            </p>
                                            {selectedVariant?.size_label && (
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                                                    / {selectedVariant.size_label}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="px-0 pb-6">
                                        {product.variants?.length > 1 ? (
                                            <button
                                                onClick={() => {
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                className="w-full bg-[#1d351d] py-3.5 text-[11px] font-bold text-white transition-colors hover:bg-[#152a15] flex items-center justify-center gap-2 uppercase tracking-[0.2em]"
                                            >
                                                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                                Preview Options
                                            </button>
                                        ) : (
                                            <button
                                                onClick={onAddToCart}
                                                className="w-full bg-[#1d351d] py-4 text-[11px] font-bold text-white transition-colors hover:bg-[#152a15] flex items-center justify-center gap-2 uppercase tracking-[0.2em]"
                                            >
                                                Add to Bag
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
