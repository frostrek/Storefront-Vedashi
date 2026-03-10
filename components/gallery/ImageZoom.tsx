'use client';

import { useRef, useCallback, useEffect, memo } from 'react';
import styles from './gallery.module.css';

interface ImageZoomProps {
    src: string;
    alt: string;
    isActive: boolean;
    /** Ref to the image element that the mouse events are attached to */
    imageRef: React.RefObject<HTMLElement | null>;
    /** Ref to the zoom panel element (rendered outside overflow:hidden) */
    panelRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * ImageZoom — Amazon-Style Hover Zoom (Headless)
 *
 * This component attaches mouse event listeners to an external container
 * and updates an external panel DOM element. Both refs are passed in from
 * the parent (ProductImageGallery) so the panel can live OUTSIDE the
 * overflow:hidden main preview wrapper.
 *
 * Architecture:
 *  - ZERO React re-renders on mouse move (all DOM updates via refs)
 *  - requestAnimationFrame for buttery-smooth 60fps tracking
 *  - No visible lens — clean Amazon UX
 *  - Background-position technique for zoom (no canvas)
 *  - Cleans up all listeners and rAF on unmount
 *
 * Why refs from parent?
 *  - The main preview has overflow:hidden (clips absolutely-positioned children)
 *  - The zoom panel must be a SIBLING of the main preview, not a child
 *  - So the parent renders the panel outside, and passes its ref here
 */
function ImageZoomInner({ src, alt, isActive, imageRef, panelRef }: ImageZoomProps) {
    const rafId = useRef<number>(0);
    const isHovering = useRef(false);
    const mousePos = useRef({ x: 0, y: 0 });

    const ZOOM_FACTOR = 2.5;

    // rAF loop — reads mouse position ref, writes to zoom panel DOM
    const tick = useCallback(() => {
        const container = imageRef.current;
        const panel = panelRef.current;
        if (!container || !panel || !isHovering.current) return;

        const rect = container.getBoundingClientRect();
        const x = Math.max(0, Math.min(mousePos.current.x - rect.left, rect.width));
        const y = Math.max(0, Math.min(mousePos.current.y - rect.top, rect.height));

        const pctX = (x / rect.width) * 100;
        const pctY = (y / rect.height) * 100;

        panel.style.backgroundPosition = `${pctX}% ${pctY}%`;
        rafId.current = requestAnimationFrame(tick);
    }, [imageRef, panelRef]);

    // Attach native event listeners (not React synthetic — avoids overhead)
    useEffect(() => {
        const container = imageRef.current;
        const panel = panelRef.current;
        if (!container || !panel || !isActive) return;

        const onEnter = () => {
            isHovering.current = true;
            panel.style.opacity = '1';
            panel.style.backgroundImage = `url(${src})`;
            panel.style.backgroundSize = `${ZOOM_FACTOR * 100}%`;
            rafId.current = requestAnimationFrame(tick);
        };

        const onLeave = () => {
            isHovering.current = false;
            cancelAnimationFrame(rafId.current);
            panel.style.opacity = '0';
        };

        const onMove = (e: MouseEvent) => {
            mousePos.current = { x: e.clientX, y: e.clientY };
        };

        container.addEventListener('mouseenter', onEnter);
        container.addEventListener('mouseleave', onLeave);
        container.addEventListener('mousemove', onMove, { passive: true });

        return () => {
            cancelAnimationFrame(rafId.current);
            container.removeEventListener('mouseenter', onEnter);
            container.removeEventListener('mouseleave', onLeave);
            container.removeEventListener('mousemove', onMove);
            panel.style.opacity = '0';
        };
    }, [isActive, src, tick, imageRef, panelRef, ZOOM_FACTOR]);

    // This component renders nothing — it only attaches event listeners
    return null;
}

const ImageZoom = memo(ImageZoomInner);
export default ImageZoom;
