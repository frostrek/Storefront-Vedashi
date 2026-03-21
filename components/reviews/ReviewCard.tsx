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
    own_vote?: 'up' | 'down' | null;
    has_reported?: boolean;
}

interface ReviewCardProps {
    review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
    const [helpfulCount, setHelpfulCount] = useState(review.helpful_count ?? 0);
    const [voteStatus, setVoteStatus] = useState<'none' | 'up' | 'down'>(review.own_vote || 'none');

    // Reporting state
    const [isReporting, setIsReporting] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    const [hasReported, setHasReported] = useState(!!review.has_reported);

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
            const res = await voteHelpful(review.review_id, type);
            if (!res || res.success === false) {
                toast.error(res?.message || 'Failed to register vote. Please log in.');
                setVoteStatus(previousVote);
                setHelpfulCount(previousCount);
            }
        } catch (error) {
            // Revert on network error
            toast.error('Network error. Please try again.');
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
        <div className="bg-white p-6 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] group mb-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 mb-4">
                <StarRating value={review.rating} size="sm" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{dateStr}</span>
            </div>

            {/* Body */}
            {review.body && (
                <p className="text-[15px] font-medium text-gray-800 leading-relaxed italic">
                    "{review.body}"
                </p>
            )}

            {/* Admin Reply */}
            {review.admin_reply && (
                <div className="mt-4 ml-4 bg-[#3d5c3a]/5 p-4 rounded-xl border-l-2 border-[#3d5c3a]">
                    <div className="flex items-center gap-2 mb-1">
                        <CornerDownRight size={14} className="text-[#3d5c3a]" />
                        <span className="text-xs font-bold uppercase tracking-wider text-[#3d5c3a]">Vedashi Response</span>
                        {review.admin_reply_at && (
                            <span className="text-xs text-gray-500 font-medium ml-1">
                                {new Date(review.admin_reply_at).toLocaleDateString('en-US', {
                                    month: 'short', day: 'numeric', year: 'numeric'
                                })}
                            </span>
                        )}
                    </div>
                    <p className="text-[14px] text-gray-600 ml-5 leading-relaxed">
                        {review.admin_reply}
                    </p>
                </div>
            )}

            {/* Footer */}
            <div className="mt-6 flex items-center justify-between gap-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#3d5c3a] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                        {review.reviewer_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <span className="block text-sm font-bold text-gray-900">{review.reviewer_name}</span>
                        {review.is_verified_purchase && (
                            <span className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                                <BadgeCheck size={12} className="text-[#3d5c3a]" />
                                Verified Purchase
                            </span>
                        )}
                    </div>
                </div>

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
                        className={`flex items-center gap-1 transition-colors ${isReporting || hasReported ? 'text-red-500' : 'text-neutral-400 hover:text-red-500'}`}
                        title="Report this review"
                        disabled={hasReported}
                    >
                        <Flag size={13} className={hasReported ? "text-red-400" : ""} />
                        <span className="text-xs font-medium">{hasReported ? 'Reported' : 'Report'}</span>
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
