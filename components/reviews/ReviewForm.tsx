'use client';

import { useState } from 'react';
import StarRating from './StarRating';
import { useAuth } from '@/context/AuthContext';
import { submitReview } from '@/lib/api';
import { Leaf, LogIn } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface ReviewFormProps {
    productId: string;
    orderId?: string;
    existingReview?: {
        rating: number;
        title?: string;
        body?: string;
    } | null;
    onSubmitted: () => void;
}

export default function ReviewForm({ productId, orderId, existingReview, onSubmitted }: ReviewFormProps) {
    const { user, isAuthenticated } = useAuth();
    const [rating, setRating] = useState(existingReview?.rating ?? 0);
    const [title, setTitle] = useState(existingReview?.title ?? '');
    const [body, setBody] = useState(existingReview?.body ?? '');
    const [submitting, setSubmitting] = useState(false);

    const isEditing = !!existingReview;

    /* ── Not logged in ── */
    if (!isAuthenticated) {
        return (
            <div className="rounded-xl border border-neutral-200 bg-gradient-to-br from-[#faf8f5] to-[#f5f0ea] p-8 text-center">
                <Leaf className="mx-auto h-8 w-8 text-[#FFD801]/60 mb-3" />
                <p className="text-lg text-neutral-700 mb-1">Share Your Experience</p>
                <p className="text-sm text-neutral-500 mb-4">Login to leave a review for this product</p>
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#91C934] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#7ab52a] transition-colors"
                >
                    <LogIn size={16} />
                    Login to Review
                </Link>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (rating === 0) {
            toast.error('Please select a star rating');
            return;
        }
        if (body.trim().length < 10) {
            toast.error('Review must be at least 10 characters');
            return;
        }

        setSubmitting(true);
        try {
            const result = await submitReview({
                product_id: productId,
                rating,
                title: title.trim() || undefined,
                body: body.trim(),
                order_id: orderId || undefined,
            });

            if (result.success) {
                toast.success(isEditing ? 'Review updated!' : 'Review submitted!');
                onSubmitted();
            } else {
                toast.error(result.message || 'Failed to submit review');
            }
        } catch {
            toast.error('Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <h4 className="text-lg font-semibold text-neutral-800 mb-1">
                {isEditing ? 'Edit Your Review' : 'Write a Review'}
            </h4>
            <p className="text-xs text-neutral-400 mb-4">
                Reviewing as <span className="font-medium text-neutral-600">{user?.name}</span>
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Star picker */}
                <div>
                    <label className="block text-sm font-medium text-neutral-600 mb-2">
                        Your Rating
                    </label>
                    <StarRating value={rating} onChange={setRating} size="lg" />
                </div>

                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-neutral-600 mb-1">
                        Title <span className="text-neutral-400">(optional)</span>
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full rounded-lg border border-neutral-200 px-4 py-2.5 text-sm focus:border-[#91C934]/40 focus:outline-none focus:ring-1 focus:ring-[#91C934]/20 transition"
                        placeholder="Summarize your experience..."
                        maxLength={120}
                    />
                </div>

                {/* Body */}
                <div>
                    <label className="block text-sm font-medium text-neutral-600 mb-1">
                        Your Review
                    </label>
                    <textarea
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        className="w-full rounded-lg border border-neutral-200 px-4 py-3 text-sm focus:border-[#91C934]/40 focus:outline-none focus:ring-1 focus:ring-[#91C934]/20 transition resize-none"
                        rows={4}
                        placeholder="Tell us about this product — benefits, feel, results..."
                        minLength={10}
                    />
                    <p className="mt-1 text-xs text-neutral-400">
                        {body.length < 10 ? `${10 - body.length} more characters needed` : `${body.length} characters`}
                    </p>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={submitting || rating === 0}
                    className="rounded-lg bg-[#91C934] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#7ab52a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? 'Submitting…' : isEditing ? 'Update Review' : 'Submit Review'}
                </button>
            </form>
        </div>
    );
}
