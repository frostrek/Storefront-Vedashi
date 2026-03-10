'use client';

import { ReactNode } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface LazySectionProps {
    /** Content to render once visible */
    children: ReactNode;
    /** Skeleton placeholder shown before intersection */
    skeleton?: ReactNode;
    /** Minimum height to reserve space and prevent CLS */
    minHeight?: string;
    /** Root margin for the intersection observer */
    rootMargin?: string;
    /** Optional className for the wrapper div */
    className?: string;
}

/**
 * Wrapper that delays mounting its children until the section
 * is about to enter the viewport (IntersectionObserver).
 * Shows a skeleton placeholder in the meantime to prevent CLS.
 */
export default function LazySection({
    children,
    skeleton,
    minHeight = '200px',
    rootMargin = '300px',
    className = '',
}: LazySectionProps) {
    const [ref, isVisible] = useIntersectionObserver({ rootMargin });

    return (
        <div ref={ref} className={className} style={{ minHeight: isVisible ? undefined : minHeight }}>
            {isVisible ? children : (skeleton || null)}
        </div>
    );
}
