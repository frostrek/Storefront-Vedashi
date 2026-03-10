'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseIntersectionObserverOptions {
    /** Margin around the root (viewport). Default '200px' — triggers 200px before entering viewport. */
    rootMargin?: string;
    /** Visibility threshold (0–1). Default 0.1. */
    threshold?: number;
    /** If true, keep observing (re-triggers). Default false (one-shot). */
    continuous?: boolean;
}

/**
 * Custom hook wrapping IntersectionObserver.
 * Returns [ref callback, isIntersecting].
 * By default it disconnects after the first intersection (one-shot).
 */
export function useIntersectionObserver({
    rootMargin = '200px',
    threshold = 0.1,
    continuous = false,
}: UseIntersectionObserverOptions = {}) {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const elementRef = useRef<HTMLElement | null>(null);

    const cleanup = useCallback(() => {
        if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
        }
    }, []);

    const ref = useCallback(
        (node: HTMLElement | null) => {
            // Cleanup previous observer
            cleanup();
            elementRef.current = node;

            if (!node) return;

            // SSR guard
            if (typeof IntersectionObserver === 'undefined') {
                setIsIntersecting(true);
                return;
            }

            observerRef.current = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        setIsIntersecting(true);
                        if (!continuous) {
                            cleanup();
                        }
                    } else if (continuous) {
                        setIsIntersecting(false);
                    }
                },
                { rootMargin, threshold }
            );

            observerRef.current.observe(node);
        },
        [rootMargin, threshold, continuous, cleanup]
    );

    useEffect(() => {
        return cleanup;
    }, [cleanup]);

    return [ref, isIntersecting] as const;
}
