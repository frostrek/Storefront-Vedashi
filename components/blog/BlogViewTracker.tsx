'use client';

import { useEffect } from 'react';
import { recordBlogView } from '@/lib/api';

/**
 * Lightweight client component that fires a view-tracking request
 * on mount. Kept separate so the blog post page can remain a
 * server component while still recording views.
 */
export default function BlogViewTracker({ postId }: { postId: string }) {
    useEffect(() => {
        recordBlogView(postId);
    }, [postId]);

    return null;
}
