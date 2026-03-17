'use client';

import { useEffect, useRef, useState, RefObject } from 'react';

interface ScrollAnimationOptions {
    threshold?: number;
    rootMargin?: string;
    triggerOnce?: boolean;
}

/**
 * Hook that observes an element's intersection with the viewport
 * and returns whether it is visible, for triggering CSS animations.
 */
export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(
    options: ScrollAnimationOptions = {}
): [RefObject<T | null>, boolean] {
    const { threshold = 0.15, rootMargin = '0px 0px -60px 0px', triggerOnce = true } = options;
    const ref = useRef<T | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    if (triggerOnce) observer.unobserve(element);
                } else if (!triggerOnce) {
                    setIsVisible(false);
                }
            },
            { threshold, rootMargin }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [threshold, rootMargin, triggerOnce]);

    return [ref, isVisible];
}

/**
 * Wrapper component that animates children when they scroll into view.
 * Supports multiple animation variants.
 */
interface AnimateOnScrollProps {
    children: React.ReactNode;
    className?: string;
    animation?: 'fadeUp' | 'fadeIn' | 'fadeLeft' | 'fadeRight' | 'scaleUp' | 'slideUp';
    delay?: number;
    duration?: number;
    threshold?: number;
}

export function AnimateOnScroll({
    children,
    className = '',
    animation = 'fadeUp',
    delay = 0,
    duration = 0.7,
    threshold = 0.15,
}: AnimateOnScrollProps) {
    const [ref, isVisible] = useScrollAnimation<HTMLDivElement>({ threshold });

    const baseStyles: React.CSSProperties = {
        transitionProperty: 'opacity, transform',
        transitionDuration: `${duration}s`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        transitionDelay: `${delay}s`,
    };

    const hiddenStyles: Record<string, React.CSSProperties> = {
        fadeUp: { opacity: 0, transform: 'translateY(40px)' },
        fadeIn: { opacity: 0, transform: 'none' },
        fadeLeft: { opacity: 0, transform: 'translateX(-40px)' },
        fadeRight: { opacity: 0, transform: 'translateX(40px)' },
        scaleUp: { opacity: 0, transform: 'scale(0.92)' },
        slideUp: { opacity: 0, transform: 'translateY(60px)' },
    };

    const visibleStyles: React.CSSProperties = {
        opacity: 1,
        transform: 'none',
    };

    return (
        <div
            ref={ref}
            className={className}
            style={{
                ...baseStyles,
                ...(isVisible ? visibleStyles : hiddenStyles[animation]),
            }}
        >
            {children}
        </div>
    );
}

/**
 * Staggered animation for lists of items.
 * Each child gets an incremental delay.
 */
interface StaggerChildrenProps {
    children: React.ReactNode[];
    className?: string;
    animation?: 'fadeUp' | 'fadeIn' | 'fadeLeft' | 'fadeRight' | 'scaleUp';
    baseDelay?: number;
    stagger?: number;
    threshold?: number;
}

export function StaggerChildren({
    children,
    className = '',
    animation = 'fadeUp',
    baseDelay = 0,
    stagger = 0.1,
    threshold = 0.1,
}: StaggerChildrenProps) {
    return (
        <div className={className}>
            {children.map((child, i) => (
                <AnimateOnScroll
                    key={i}
                    animation={animation}
                    delay={baseDelay + i * stagger}
                    threshold={threshold}
                >
                    {child}
                </AnimateOnScroll>
            ))}
        </div>
    );
}
