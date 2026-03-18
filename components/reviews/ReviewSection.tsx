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
}

interface ReviewSectionProps {
    productId: string;
}

const SORT_OPTIONS = [
    { label: 'Most Recent', value: 'recent' },
    { label: 'Most Helpful', value: 'helpful' },
    { label: 'Highest Rated', value: 'highest' },
    { label: 'Lowest Rated', value: 'lowest' },
];

export default function ReviewSection({ productId }: ReviewSectionProps) {
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

    const maxDistribution = summary
        ? Math.max(...Object.values(summary.distribution), 1)
        : 1;

    return (
        <section className="pt-10">
            {/* Section header */}
            <div className="mb-12 max-w-2xl">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Community Experiences</h2>
                <p className="text-[15px] text-gray-500">Stories of restoration and balance from our collective.</p>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-20 animate-pulse rounded-lg bg-neutral-100" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
                    {/* ── Left: Summary ── */}
                    <div className="lg:sticky lg:top-24 self-start space-y-6">
                        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
                            <p className="text-5xl font-bold text-gray-900">
                                {(summary?.average_rating ?? 0).toFixed(1)}
                            </p>
                            <StarRating
                                value={summary?.average_rating ?? 0}
                                size="lg"
                                className="justify-center mt-2"
                            />
                            <p className="mt-2 text-sm text-neutral-500">
                                Based on {summary?.total_reviews ?? 0} review{(summary?.total_reviews ?? 0) !== 1 ? 's' : ''}
                            </p>
                        </div>

                        {/* Star distribution bars */}
                        {summary && summary.total_reviews > 0 && (
                            <div className="space-y-2">
                                {[5, 4, 3, 2, 1].map(star => {
                                    const count = summary.distribution[star] ?? 0;
                                    const pct = (count / maxDistribution) * 100;
                                    return (
                                        <div key={star} className="flex items-center gap-3 text-sm">
                                            <span className="w-3 text-right text-gray-500 font-medium">{star}</span>
                                            <StarRating value={star} size="sm" className="flex-shrink-0" />
                                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-[#3d5c3a] transition-all duration-500"
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

                    {/* ── Right: Reviews + Form ── */}
                    <div>
                        {/* Sort */}
                        {reviews.length > 0 && (
                            <div className="flex items-center justify-between mb-8">
                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                    {reviews.length} Review{reviews.length !== 1 ? 's' : ''}
                                </p>
                                <select
                                    value={sort}
                                    onChange={e => setSort(e.target.value)}
                                    className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-[#3d5c3a] focus:ring-1 focus:ring-[#3d5c3a] bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                                >
                                    {SORT_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Review list */}
                        {reviews.length > 0 ? (
                            <div className="mb-8">
                                {reviews.map(r => (
                                    <ReviewCard key={r.review_id} review={r} />
                                ))}
                            </div>
                        ) : (
                            <div className="mb-8 rounded-xl border border-dashed border-neutral-200 py-12 text-center">
                                <MessageSquare className="mx-auto h-8 w-8 text-neutral-300 mb-2" />
                                <p className="text-neutral-500 text-sm">No reviews yet. Be the first to share your thoughts!</p>
                            </div>
                        )}

                        {/* Review form */}
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
                </div>
            )}
        </section>
    );
}
