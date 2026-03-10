'use client';

import { useState } from 'react';
import { BlogComment, postBlogComment, getBlogComments } from '@/lib/api';

interface CommentSectionProps {
    postId: string;
    initialComments: BlogComment[];
}

function Comment({ comment, postId, onReply }: { comment: BlogComment; postId: string; onReply: () => void }) {
    const [showReply, setShowReply] = useState(false);
    const [replyBody, setReplyBody] = useState('');
    const [replyName, setReplyName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleReply = async () => {
        if (!replyBody.trim()) return;
        setSubmitting(true);
        await postBlogComment(postId, {
            body: replyBody,
            parent_id: comment.comment_id,
            commenter_name: replyName || undefined,
        });
        setReplyBody('');
        setReplyName('');
        setShowReply(false);
        setSubmitting(false);
        onReply();
    };

    return (
        <div className="group">
            <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-burgundy/10 flex items-center justify-center flex-shrink-0 text-burgundy font-serif font-bold text-sm">
                    {comment.commenter_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-sm font-semibold text-charcoal">{comment.commenter_name}</span>
                        <span className="text-xs text-warm-gray">
                            {new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>
                    <p className="text-sm text-charcoal/80 leading-relaxed">{comment.body}</p>
                    <button
                        onClick={() => setShowReply(!showReply)}
                        className="mt-1.5 text-xs font-medium text-burgundy/70 hover:text-burgundy transition-colors"
                    >
                        Reply
                    </button>

                    {showReply && (
                        <div className="mt-3 space-y-2 animate-fade-in">
                            <input
                                value={replyName}
                                onChange={e => setReplyName(e.target.value)}
                                placeholder="Your name (optional if logged in)"
                                className="w-full rounded-lg border border-light-border px-3 py-2 text-sm focus:border-burgundy/40 focus:outline-none"
                            />
                            <textarea
                                value={replyBody}
                                onChange={e => setReplyBody(e.target.value)}
                                placeholder="Write a reply..."
                                rows={2}
                                className="w-full rounded-lg border border-light-border px-3 py-2 text-sm resize-none focus:border-burgundy/40 focus:outline-none"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleReply}
                                    disabled={submitting || !replyBody.trim()}
                                    className="px-4 py-1.5 rounded-lg bg-burgundy text-white text-xs font-semibold hover:bg-burgundy-dark transition-colors disabled:opacity-50"
                                >
                                    {submitting ? 'Posting...' : 'Post Reply'}
                                </button>
                                <button
                                    onClick={() => setShowReply(false)}
                                    className="px-4 py-1.5 rounded-lg border border-light-border text-sm text-warm-gray hover:bg-cream-dark transition-colors text-xs"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Nested replies */}
                    {comment.children && comment.children.length > 0 && (
                        <div className="mt-4 pl-4 border-l-2 border-light-border space-y-4">
                            {comment.children.map((child) => (
                                <Comment key={child.comment_id} comment={child} postId={postId} onReply={onReply} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function BlogCommentSection({ postId, initialComments }: CommentSectionProps) {
    const [comments, setComments] = useState<BlogComment[]>(initialComments);
    const [body, setBody] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    const refresh = async () => {
        const fresh = await getBlogComments(postId);
        setComments(fresh);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!body.trim()) return;
        setSubmitting(true);
        setMessage('');
        const res = await postBlogComment(postId, {
            body: body.trim(),
            commenter_name: name || undefined,
            commenter_email: email || undefined,
        });
        if (res.success) {
            setBody('');
            setName('');
            setEmail('');
            setMessage(res.message || 'Comment posted!');
            await refresh();
        } else {
            setMessage(res.message || 'Failed to post comment');
        }
        setSubmitting(false);
    };

    return (
        <section className="mt-12">
            <h3 className="font-serif text-xl font-bold text-charcoal mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-burgundy" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                Comments ({comments.length})
            </h3>

            {/* Comment Form */}
            <form onSubmit={handleSubmit} className="mb-8 rounded-xl border border-light-border bg-white p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Your name"
                        className="rounded-lg border border-light-border px-3 py-2.5 text-sm focus:border-burgundy/40 focus:outline-none transition-colors"
                    />
                    <input
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Email (optional)"
                        type="email"
                        className="rounded-lg border border-light-border px-3 py-2.5 text-sm focus:border-burgundy/40 focus:outline-none transition-colors"
                    />
                </div>
                <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder="Share your thoughts..."
                    rows={3}
                    className="w-full rounded-lg border border-light-border px-3 py-2.5 text-sm resize-none focus:border-burgundy/40 focus:outline-none transition-colors"
                    required
                />
                <div className="flex items-center justify-between">
                    <p className="text-xs text-warm-gray">
                        {message && <span className={message.includes('Failed') ? 'text-red-500' : 'text-green-600'}>{message}</span>}
                    </p>
                    <button
                        type="submit"
                        disabled={submitting || !body.trim()}
                        className="px-5 py-2 rounded-lg bg-burgundy text-white text-sm font-semibold hover:bg-burgundy-dark transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Posting...' : 'Post Comment'}
                    </button>
                </div>
            </form>

            {/* Comment List */}
            <div className="space-y-6">
                {comments.length === 0 ? (
                    <p className="text-center text-warm-gray py-8">No comments yet. Be the first to share your thoughts!</p>
                ) : (
                    comments.map(comment => (
                        <Comment key={comment.comment_id} comment={comment} postId={postId} onReply={refresh} />
                    ))
                )}
            </div>
        </section>
    );
}
