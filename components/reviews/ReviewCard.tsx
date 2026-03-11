'use client';

import StarRating from './StarRating';
import { ThumbsUp, ThumbsDown, BadgeCheck, Flag, CornerDownRight } from 'lucide-react';
import { voteHelpful, reportReview } from '@/lib/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

export interface Review {
    review_id: string;
    rating: number;
    title?: string;
    body?: string;
    reviewer_name: string;
    is_verified_purchase?: boolean;
    helpful_count?: number;
    admin_reply?: string;
    admin_reply_at?: string;
    created_at: string;
}

interface ReviewCardProps {
    review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
    const [helpfulCount, setHelpfulCount] = useState(review.helpful_count ?? 0);
    const [voteStatus, setVoteStatus] = useState<'none' | 'up' | 'down'>('none');

    // Reporting state
    const [isReporting, setIsReporting] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    const [hasReported, setHasReported] = useState(false);

    const handleVote = async (type: 'up' | 'down') => {
        if (voteStatus === type) return; // Prevent double voting the same way

        // Optimistic UI update
        const previousVote = voteStatus;
        const previousCount = helpfulCount;

        setVoteStatus(type);
        if (type === 'up') {
            setHelpfulCount(c => c + (previousVote === 'down' ? 2 : 1));
        } else {
            setHelpfulCount(c => c - (previousVote === 'up' ? 2 : 1));
        }

        try {
            await voteHelpful(review.review_id, type);
        } catch (error) {
            // Revert on error
            toast.error('Failed to register vote. Please log in.');
            setVoteStatus(previousVote);
            setHelpfulCount(previousCount);
        }
    };

    const handleReport = async () => {
        if (!reportReason.trim()) {
            toast.error('Please provide a reason for reporting.');
            return;
        }

        setIsSubmittingReport(true);
        try {
            const res = await reportReview(review.review_id, reportReason);
            if (res && res.success === false) {
                toast.error(res.message || 'Failed to submit report. Ensure you are logged in.');
            } else {
                toast.success('Review reported successfully.');
                setHasReported(true);
                setIsReporting(false);
            }
        } catch (error) {
            toast.error('Network error. Please try again.');
        } finally {
            setIsSubmittingReport(false);
        }
    };

    const dateStr = new Date(review.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    return (
        <div className="border-b border-neutral-100 py-6 last:border-0 group">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <StarRating value={review.rating} size="sm" />
                    {review.title && (
                        <p className="mt-1.5 font-serif text-sm font-semibold text-neutral-800">
                            {review.title}
                        </p>
                    )}
                </div>
            </div>

            {/* Body */}
            {review.body && (
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                    {review.body}
                </p>
            )}

            {/* Admin Reply */}
            {review.admin_reply && (
                <div className="mt-4 ml-4 bg-neutral-50 p-4 rounded-md border-l-2 border-[#C5A46D]">
                    <div className="flex items-center gap-2 mb-1">
                        <CornerDownRight size={14} className="text-[#C5A46D]" />
                        <span className="text-xs font-semibold text-neutral-800">Vedashi Response</span>
                        {review.admin_reply_at && (
                            <span className="text-xs text-neutral-400 font-medium ml-1">
                                {new Date(review.admin_reply_at).toLocaleDateString('en-US', {
                                    month: 'short', day: 'numeric', year: 'numeric'
                                })}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-neutral-600 ml-5 leading-relaxed">
                        {review.admin_reply}
                    </p>
                </div>
            )}

            {/* Footer */}
            <div className="mt-4 flex items-center flex-wrap gap-4 text-xs text-neutral-400">
                <span className="font-medium text-neutral-500">{review.reviewer_name}</span>
                <span>{dateStr}</span>

                {review.is_verified_purchase && (
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        <BadgeCheck size={13} />
                        Verified Purchase
                    </span>
                )}

                <div className="ml-auto flex items-center gap-3">
                    {/* Helpful up/down votes */}
                    <div className="flex items-center gap-2 bg-neutral-50 px-2.5 py-1 rounded-full border border-neutral-100">
                        <button
                            onClick={() => handleVote('up')}
                            className={`flex items-center transition-colors hover:text-[#C5A46D] ${voteStatus === 'up' ? 'text-[#C5A46D]' : ''}`}
                            aria-label="Upvote review"
                        >
                            <ThumbsUp size={14} className={voteStatus === 'up' ? 'fill-current' : ''} />
                            <span className="ml-1.5 min-w-[12px] text-center font-medium text-neutral-500">
                                {helpfulCount > 0 ? helpfulCount : 0}
                            </span>
                        </button>
                        <div className="w-[1px] h-3 bg-neutral-200"></div>
                        <button
                            onClick={() => handleVote('down')}
                            className={`flex items-center transition-colors hover:text-red-500 ${voteStatus === 'down' ? 'text-red-500' : ''}`}
                            aria-label="Downvote review"
                        >
                            <ThumbsDown size={14} className={voteStatus === 'down' ? 'fill-current' : ''} />
                        </button>
                    </div>

                    {/* Report button */}
                    <button
                        onClick={() => setIsReporting(!isReporting)}
                        className="flex items-center gap-1 text-neutral-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Report this review"
                        disabled={hasReported}
                    >
                        <Flag size={13} className={hasReported ? "text-red-400" : ""} />
                        <span className="sr-only sm:not-sr-only">{hasReported ? 'Reported' : 'Report'}</span>
                    </button>
                </div>
            </div>

            {/* Report Form */}
            {isReporting && !hasReported && (
                <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-md text-sm">
                    <p className="font-medium text-red-800 mb-2">Report Review</p>
                    <textarea
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        placeholder="Why are you reporting this review? (e.g. harmful language, spam)"
                        className="w-full text-sm border-gray-200 rounded p-2 mb-2 resize-none focus:ring-red-500 focus:border-red-500 bg-white"
                        rows={2}
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsReporting(false)}
                            className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleReport}
                            disabled={isSubmittingReport || !reportReason.trim()}
                            className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                            {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
