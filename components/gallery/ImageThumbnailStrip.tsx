'use client';

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import styles from './gallery.module.css';

interface ThumbnailStripProps {
    images: { id: string; src: string; alt: string; isVideo?: boolean; videoSrc?: string }[];
    activeIndex: number;
    onSelect: (index: number) => void;
    onHover?: (index: number) => void;
}

 /**
  * ImageThumbnailStrip
  * Displays a horizontal scrollable strip of thumbnails below the main image.
  * Highlights the active thumbnail and preloads the next image on hover.
  */
function ImageThumbnailStripInner({
    images,
    activeIndex,
    onSelect,
    onHover,
}: ThumbnailStripProps) {
    const stripRef = useRef<HTMLDivElement>(null);
    const activeRef = useRef<HTMLButtonElement>(null);

    // Scroll active thumbnail into view
    useEffect(() => {
        if (activeRef.current) {
            activeRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'nearest',
            });
        }
    }, [activeIndex]);

    // Preload next image on hover
    const handleMouseEnter = useCallback(
        (index: number) => {
            onHover?.(index);

            // Preload adjacent images (skip for videos)
            const nextIdx = index + 1;
            if (nextIdx < images.length && !images[nextIdx].isVideo) {
                const link = document.createElement('link');
                link.rel = 'prefetch';
                link.as = 'image';
                link.href = images[nextIdx].src;
                document.head.appendChild(link);
            }
        },
        [images, onHover]
    );


    return (
        <div className={styles.thumbStrip} ref={stripRef} role="tablist" aria-label="Product images">
            {images.map((img, index) => (
                <button
                    key={img.id}
                    ref={index === activeIndex ? activeRef : null}
                    className={`${styles.thumbBtn} ${index === activeIndex ? styles.active : ''}`}
                    onClick={() => onSelect(index)}
                    onMouseEnter={() => handleMouseEnter(index)}
                    role="tab"
                    aria-selected={index === activeIndex}
                    aria-label={img.isVideo ? `Play video ${index + 1}` : `View image ${index + 1}: ${img.alt}`}
                    tabIndex={index === activeIndex ? 0 : -1}
                >
                    {img.isVideo ? (
                        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', borderRadius: '6px' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="none">
                                <polygon points="5,3 19,12 5,21" />
                            </svg>
                        </div>
                    ) : (
                        <img
                            src={img.src}
                            alt={img.alt}
                            className={styles.thumbImg}
                            loading="lazy"
                            draggable={false}
                            decoding="async"
                        />
                    )}
                </button>
            ))}
        </div>
    );
}

const ImageThumbnailStrip = memo(ImageThumbnailStripInner);
export default ImageThumbnailStrip;
