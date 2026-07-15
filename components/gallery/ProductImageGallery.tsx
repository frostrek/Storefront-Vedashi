'use client';

import { useState, useCallback, useMemo, useRef, useEffect, memo } from 'react';
import { RU_DICTIONARY } from '@/content/ru';

import Image from 'next/image';
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
        const getAssetsForVid = (vid: string | undefined | null) => assets.filter((a) => {
            const targetVid = String(vid || '').toLowerCase() || null;
            const assetVid = String(a.variant_id || '').toLowerCase() || null;
            return assetVid === targetVid;
        });

        // 1. Collect assets from relevant levels
        const variantAssets = getAssetsForVid(variantId);
        const productLevelAssets = getAssetsForVid(null);
        
        // Use a Map for de-duplication by asset_id or unique identifier
        const assetsMap = new Map<string, typeof assets[0]>();
        
        // Add variant-specific assets first
        variantAssets.forEach(a => assetsMap.set(a.asset_id || a.cdn_url || a.asset_url || a.base64_data || '', a));
        
        // Add product-level (shared) assets
        productLevelAssets.forEach(a => {
            const key = a.asset_id || a.cdn_url || a.asset_url || a.base64_data || '';
            if (!assetsMap.has(key)) assetsMap.set(key, a);
        });
        
        // 2. Special Fallback: If current set is strictly empty, pull in Default Variant assets
        if (assetsMap.size === 0 && defaultVariantId && variantId !== defaultVariantId) {
            getAssetsForVid(defaultVariantId).forEach(a => {
                assetsMap.set(a.asset_id || a.cdn_url || a.asset_url || a.base64_data || '', a);
            });
        }

        // 3. Critical Video Fallback: If no videos in current pool, check Default Variant
        const currentHasVideo = Array.from(assetsMap.values()).some(a => a.media_type === 'video');
        if (!currentHasVideo && defaultVariantId && variantId !== defaultVariantId) {
            getAssetsForVid(defaultVariantId).filter(a => a.media_type === 'video').forEach(a => {
                assetsMap.set(a.asset_id || a.cdn_url || a.asset_url || a.base64_data || '', a);
            });
        }

        // Sort: Primary first, then by sort_order
        const unique = Array.from(assetsMap.values()).sort((a, b) => {
            if (a.is_primary && !b.is_primary) return -1;
            if (!a.is_primary && b.is_primary) return 1;
            return (a.sort_order || 0) - (b.sort_order || 0);
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
                enrichedAlt = `${parts.join(' ')} - ${RU_DICTIONARY.productPage.image} ${index + 1}`;
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
            const enrichedAlt = a.alt_text || `${productName} ${RU_DICTIONARY.productPage.video} ${index + 1}`;

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
                alt: `${productName} - ${RU_DICTIONARY.productPage.image} ${index + 1}`,
                isPrimary: index === 0,
            }));
        }
    }

    return [
        {
            id: 'default-fallback',
            src: FALLBACK_IMAGE,
            alt: `${productName} - ${RU_DICTIONARY.productPage.image}`,
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
        if (imageRef.current?.complete && !imageLoaded) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setImageLoaded(true);
        }
    }, [activeIndex, images, imageLoaded]);

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
                                {RU_DICTIONARY.productPage.browserNoVideo}
                            </video>
                        ) : (
                            <Image
                                ref={imageRef}
                                key={currentImage.id}
                                src={displaySrc}
                                alt={currentImage.alt}
                                fill
                                className={`${styles.mainImage} ${imageLoaded ? styles.loaded : styles.loading}`}
                                onLoad={handleImageLoad}
                                onError={handleImageError}
                                draggable={false}
                                priority
                                sizes="(max-width: 1024px) 100vw, 50vw"
                                style={{ objectFit: 'contain' }}
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
                        aria-label={`${RU_DICTIONARY.productPage.zoomedView} ${currentImage.alt}`}
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
