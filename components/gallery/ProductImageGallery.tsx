'use client';

import { useState, useCallback, useMemo, useRef, useEffect, memo } from 'react';
import type { ProductAsset, GalleryImage } from '@/types';
import ImageThumbnailStrip from './ImageThumbnailStrip';
import ImageZoom from './ImageZoom';
import ImageLightbox from './ImageLightbox';
import styles from './gallery.module.css';

interface ProductImageGalleryProps {
    assets?: ProductAsset[];
    productName: string;
    variantId?: string;
    defaultVariantId?: string;
    /** Fallback image URLs from product.images (thumbnail_url mapped) */
    fallbackImages?: string[];
    brand?: string;
    category?: string;
}

const FALLBACK_IMAGE = '/herbal_placeholder.png';

/**
 * Resolve ProductAsset[] → GalleryImage[]
 * Robust: handles pre-migration data, missing fields, and all src formats.
 * Falls back to `fallbackImages` (e.g. from thumbnail_url) when assets are empty.
 */
function resolveGalleryImages(
    assets: ProductAsset[] | undefined,
    productName: string,
    variantId?: string,
    defaultVariantId?: string,
    fallbackImages?: string[],
    brand?: string,
    category?: string
): GalleryImage[] {
    if (assets && Array.isArray(assets) && assets.length > 0) {
        // Logic: Specific Variant -> Default Variant -> Product Level
        const getFilteredAssets = (vid: string | undefined | null) => assets.filter((a) => {
            // Important: treat undefined/null/empty string consistently for product-level
            const targetVid = vid || null;
            const assetVid = a.variant_id || null;
            return assetVid === targetVid;
        });

        let filtered = getFilteredAssets(variantId); // 1. Specific
        
        // 2. Fallback to Product Level (null variant_id) if specific is empty
        if (filtered.length === 0) {
            filtered = getFilteredAssets(null);
        }

        // 3. Fallback to Default Variant if still empty or different
        if (filtered.length === 0 && defaultVariantId && variantId !== defaultVariantId) {
            filtered = getFilteredAssets(defaultVariantId);
        }

        // Always sort within the chosen group so that is_primary is first, then by sort_order
        const sorted = [...filtered].sort((a, b) => {
            if (a.is_primary && !b.is_primary) return -1;
            if (!a.is_primary && b.is_primary) return 1;
            return (a.sort_order || 0) - (b.sort_order || 0);
        });

        // Remove duplicates
        const seen = new Set();
        const unique = sorted.filter(a => {
            const id = a.asset_id || a.cdn_url || a.asset_url || a.base64_data;
            if (!id || seen.has(id)) return false;
            seen.add(id);
            return true;
        });

        const gallery: GalleryImage[] = [];

        // Image assets
        unique.filter((a) => a.media_type !== 'video' || !a.media_type).forEach((a, index) => {
            let src = a.cdn_url || a.asset_url || a.base64_data;
            if (!src && fallbackImages && fallbackImages.length > 0) {
                src = fallbackImages[0];
            }

            let enrichedAlt = a.alt_text;
            if (!enrichedAlt) {
                const parts = [];
                if (brand) parts.push(brand);
                parts.push(productName);
                if (category) parts.push(category);
                enrichedAlt = `${parts.join(' ')} - Image ${index + 1}`;
            }

            gallery.push({
                id: a.asset_id || `asset-${index}`,
                src: src || FALLBACK_IMAGE,
                alt: enrichedAlt,
                width: a.width,
                height: a.height,
                blurhash: a.blurhash,
                imageType: a.image_type,
                isPrimary: a.is_primary,
            });
        });

        // Video assets
        unique.filter((a) => a.media_type === 'video').forEach((a, index) => {
            const videoUrl = a.cdn_url || a.asset_url || a.base64_data || '';
            let enrichedAlt = a.alt_text || `${productName} Video ${index + 1}`;

            gallery.push({
                id: a.asset_id || `video-${index}`,
                src: FALLBACK_IMAGE,
                alt: enrichedAlt,
                isVideo: true,
                videoSrc: videoUrl,
            });
        });

        if (gallery.length > 0) return gallery;
    }

    // Fallback: use product.images (populated from thumbnail_url)
    if (fallbackImages && fallbackImages.length > 0) {
        const validFallbacks = fallbackImages.filter((src) => !!src);
        if (validFallbacks.length > 0) {
            return validFallbacks.map((src, index) => ({
                id: `fallback-${index}`,
                src,
                alt: `${productName} - Image ${index + 1}`,
                isPrimary: index === 0,
            }));
        }
    }

    return [
        {
            id: 'default-fallback',
            src: FALLBACK_IMAGE,
            alt: `${productName} - Product Image`,
            isPrimary: true,
        },
    ];
}

/**
 * ProductImageGallery — Amazon-Style with video support inline
 */
function ProductImageGalleryInner({
    assets,
    productName,
    variantId,
    defaultVariantId,
    fallbackImages,
    brand,
    category
}: ProductImageGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Refs for Amazon-style zoom
    const mainPreviewRef = useRef<HTMLDivElement>(null);
    const zoomPanelRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    const images = useMemo(
        () => resolveGalleryImages(assets, productName, variantId, defaultVariantId, fallbackImages, brand, category),
        [assets, productName, variantId, defaultVariantId, fallbackImages, brand, category]
    );

    useEffect(() => {
        setActiveIndex(0);
        setImageLoaded(false);
        setImageError(false);
    }, [variantId, images.length]);

    useEffect(() => {
        setImageLoaded(false);
        setImageError(false);
    }, [activeIndex]);

    // Keyboard nav (when lightbox is closed)
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (lightboxOpen) return;
            if (e.key === 'ArrowLeft') setActiveIndex((p) => (p > 0 ? p - 1 : images.length - 1));
            if (e.key === 'ArrowRight') setActiveIndex((p) => (p < images.length - 1 ? p + 1 : 0));
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [images.length, lightboxOpen]);

    // Hydration fix: Base64 dataURIs load so fast they often finish before React attaches onLoad
    useEffect(() => {
        if (imageRef.current?.complete) {
            setImageLoaded(true);
        }
    }, [activeIndex, images]);

    const handleThumbnailSelect = useCallback((i: number) => setActiveIndex(i), []);
    const handleThumbnailHover = useCallback((i: number) => setActiveIndex(i), []);
    const openLightbox = useCallback(() => { if (images.length > 0) setLightboxOpen(true); }, [images.length]);
    const closeLightbox = useCallback(() => setLightboxOpen(false), []);
    const lightboxPrev = useCallback(() => setActiveIndex((p) => (p > 0 ? p - 1 : images.length - 1)), [images.length]);
    const lightboxNext = useCallback(() => setActiveIndex((p) => (p < images.length - 1 ? p + 1 : 0)), [images.length]);
    const handleImageLoad = useCallback(() => setImageLoaded(true), []);
    const handleImageError = useCallback(() => { setImageError(true); setImageLoaded(true); }, []);

    const currentImage = images[activeIndex] || images[0];
    const displaySrc = imageError ? FALLBACK_IMAGE : currentImage.src;

    return (
        <>
            <div
                className={styles.galleryContainer}
                role="region"
                aria-label="Product image gallery"
            >
                {/* Thumbnail strip */}
                <ImageThumbnailStrip
                    images={images}
                    activeIndex={activeIndex}
                    onSelect={handleThumbnailSelect}
                    onHover={handleThumbnailHover}
                />

                {/* Main preview area — contains preview + zoom panel side by side */}
                <div className={styles.previewZoomRow}>
                    {/* Main image (overflow:hidden for rounded corners) */}
                    <div
                        ref={mainPreviewRef}
                        className={styles.mainPreviewWrapper}
                        onClick={currentImage.isVideo ? undefined : openLightbox}
                    >
                        {!imageLoaded && !currentImage.isVideo && <div className={styles.skeleton} />}

                        {currentImage.isVideo ? (
                            <video
                                key={currentImage.id}
                                src={currentImage.videoSrc}
                                controls
                                autoPlay
                                loop
                                muted
                                playsInline
                                preload="metadata"
                                className={`${styles.mainImage} ${styles.loaded}`}
                                style={{ objectFit: 'contain', background: '#000' }}
                            >
                                Your browser does not support the video tag.
                            </video>
                        ) : (
                            <img
                                ref={imageRef}
                                key={currentImage.id}
                                src={displaySrc}
                                alt={currentImage.alt}
                                className={`${styles.mainImage} ${imageLoaded ? styles.loaded : styles.loading}`}
                                onLoad={handleImageLoad}
                                onError={handleImageError}
                                draggable={false}
                                loading="eager"
                                decoding="async"
                            />
                        )}

                        {/* Image counter */}
                        {images.length > 1 && (
                            <div className={styles.imageCounter}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <path d="M21 15l-5-5L5 21" />
                                </svg>
                                {activeIndex + 1} / {images.length}
                            </div>
                        )}

                        {/* Expand icon — only for images */}
                        {!currentImage.isVideo && (
                            <div className={styles.expandIcon}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Zoom panel — OUTSIDE overflow:hidden, positioned by CSS */}
                    <div
                        ref={zoomPanelRef}
                        className={styles.zoomPanel}
                        role="img"
                        aria-label={`Zoomed view: ${currentImage.alt}`}
                    />
                </div>

                {/* Headless zoom controller — attaches listeners to imageRef, writes to zoomPanelRef */}
                <ImageZoom
                    src={displaySrc}
                    alt={currentImage.alt}
                    isActive={imageLoaded && !imageError}
                    imageRef={imageRef}
                    panelRef={zoomPanelRef}
                />
            </div>

            {/* Lightbox */}
            {lightboxOpen && (
                <ImageLightbox
                    images={images}
                    activeIndex={activeIndex}
                    onClose={closeLightbox}
                    onPrev={lightboxPrev}
                    onNext={lightboxNext}
                    onSelect={handleThumbnailSelect}
                />
            )}

        </>
    );
}

const ProductImageGallery = memo(ProductImageGalleryInner);
export default ProductImageGallery;
