'use client';

import { useEffect, useCallback, useRef, memo } from 'react';
import styles from './gallery.module.css';

interface ImageLightboxProps {
    images: { id: string; src: string; alt: string; isVideo?: boolean; videoSrc?: string }[];
    activeIndex: number;
    onClose: () => void;
    onPrev: () => void;
    onNext: () => void;
    onSelect?: (index: number) => void;
}

/**
 * ImageLightbox — Premium Fullscreen Gallery
 * 
 * Features:
 *  - Backdrop blur with zoom-in animation
 *  - Navigation arrows + keyboard (← → Esc)
 *  - Thumbnail strip at the bottom
 *  - Swipe left/right on mobile (touch events)
 *  - Pinch-to-zoom via CSS touch-action
 *  - Counter + body scroll lock
 *  - ARIA dialog semantics
 */
function ImageLightboxInner({
    images,
    activeIndex,
    onClose,
    onPrev,
    onNext,
    onSelect,
}: ImageLightboxProps) {
    const touchStartX = useRef<number>(0);
    const touchEndX = useRef<number>(0);

    // Keyboard navigation + scroll lock
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') onPrev();
            if (e.key === 'ArrowRight') onNext();
        };

        document.addEventListener('keydown', handleKey);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [onClose, onPrev, onNext]);

    // Swipe support
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX;
    }, []);

    const handleTouchEnd = useCallback(() => {
        const diff = touchStartX.current - touchEndX.current;
        const SWIPE_THRESHOLD = 50;
        if (diff > SWIPE_THRESHOLD) onNext();
        else if (diff < -SWIPE_THRESHOLD) onPrev();
    }, [onNext, onPrev]);

    // Click overlay background to close
    const handleOverlayClick = useCallback(
        (e: React.MouseEvent) => {
            if ((e.target as HTMLElement).classList.contains(styles.lightboxOverlay)) {
                onClose();
            }
        },
        [onClose]
    );

    const current = images[activeIndex];
    if (!current) return null;

    return (
        <div
            className={styles.lightboxOverlay}
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-label="Image lightbox"
        >
            {/* Close button */}
            <button className={styles.lightboxClose} onClick={onClose} aria-label="Close lightbox">
                ✕
            </button>

            {/* Previous */}
            {images.length > 1 && (
                <button
                    className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                    onClick={onPrev}
                    aria-label="Previous image"
                >
                    ‹
                </button>
            )}

            {/* Main Image */}
            <div
                className={styles.lightboxContent}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {current.isVideo ? (
                    <video
                        key={current.id}
                        src={current.videoSrc}
                        controls
                        autoPlay
                        loop
                        muted
                        playsInline
                        className={styles.lightboxImage}
                        style={{ background: '#000' }}
                    >
                        Your browser does not support the video tag.
                    </video>
                ) : (
                    <img
                        key={current.id}
                        src={current.src}
                        alt={current.alt}
                        className={styles.lightboxImage}
                        draggable={false}
                        decoding="async"
                    />
                )}
            </div>

            {/* Next */}
            {images.length > 1 && (
                <button
                    className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                    onClick={onNext}
                    aria-label="Next image"
                >
                    ›
                </button>
            )}

            {/* Bottom thumbnail strip */}
            {images.length > 1 && onSelect && (
                <div className={styles.lightboxThumbs}>
                    {images.map((img, index) => (
                        <button
                            key={img.id}
                            className={`${styles.lightboxThumbBtn} ${index === activeIndex ? styles.active : ''}`}
                            onClick={() => onSelect(index)}
                            aria-label={`View image ${index + 1}`}
                        >
                            {img.isVideo ? (
                                <div className={styles.lightboxThumbImg} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="none">
                                        <polygon points="5,3 19,12 5,21" />
                                    </svg>
                                </div>
                            ) : (
                                <img
                                    src={img.src}
                                    alt={img.alt}
                                    className={styles.lightboxThumbImg}
                                    draggable={false}
                                    decoding="async"
                                />
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Counter */}
            {images.length > 1 && (
                <div className={styles.lightboxCounter}>
                    {activeIndex + 1} / {images.length}
                </div>
            )}
        </div>
    );
}

const ImageLightbox = memo(ImageLightboxInner);
export default ImageLightbox;
