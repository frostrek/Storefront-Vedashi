'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_URL, getHeroSlides, getHeroSettings } from '@/lib/api';
import { useParams } from 'next/navigation';
import { buildPath, getCountryFromPathname } from '@/lib/currency';

// API_URL imported from @/lib/api

export interface TextElement {
    id: string;
    text: string;
    color: string;
    fontSize: string;
}

export interface ButtonElement {
    id: string;
    label: string;
    url: string;
    bgColor: string;
    textColor: string;
    size: string;
}

export interface HeroSlide {
    id: string;
    image_url: string;
    headings: TextElement[];
    subheadings: TextElement[];
    buttons: ButtonElement[];
    overlay_opacity: number;
    link_url?: string;
    alt_text?: string;
}

export interface HeroSettings {
    slider_speed: number;
    arrow_visibility: 'visible' | 'hover' | 'hidden';
    loop: boolean;
    slideshow_type: 'fade' | 'slide_right_to_left' | 'slide_left_to_right';
}

export interface HeroCarouselProps {
    initialSlides?: HeroSlide[];
    initialSettings?: HeroSettings;
}

export default function HeroCarousel({ initialSlides = [], initialSettings = undefined }: HeroCarouselProps) {
    const params = useParams<{ country: string }>();
    const country = params?.country || 'us';
    const [slides, setSlides] = useState<HeroSlide[]>(initialSlides);
    const [settings, setSettings] = useState<HeroSettings>(
        initialSettings || { slider_speed: 3000, arrow_visibility: 'hover', loop: true, slideshow_type: 'fade' }
    );
    const [loading, setLoading] = useState(false);
    const [current, setCurrent] = useState(0);
    const [paused, setPaused] = useState(false);
    const [hovering, setHovering] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const prevIndexRef = useRef<number>(0);
    const directionRef = useRef<'next' | 'prev'>('next');
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const minSwipeDistance = 50;

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;
        if (isLeftSwipe) next();
        if (isRightSwipe) prev();
    };

    useEffect(() => {
        // If we received initial slides from SSR, check if they are real or just fallbacks
        // If they are fallbacks (starting with 'default-'), we still want to try fetching the real ones on the client
        const hasRealSlides = slides.length > 0 && !slides.some(s => s.id.startsWith('default-'));
        if (hasRealSlides) return;

        setLoading(true);
        // Fetch active slides and settings in parallel using helpers
        Promise.all([
            getHeroSlides(),
            getHeroSettings()
        ])
            .then(([slidesData, settingsData]) => {
                if (slidesData.success && slidesData.data?.length > 0) {
                    setSlides(slidesData.data);
                }
                if (settingsData.success && settingsData.data) setSettings(settingsData.data);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    // Auto-duplicate slides for 2-item loop seamlessly
    const displaySlides = (settings.loop && slides.length === 2)
        ? [...slides, ...slides.map(s => ({ ...s, id: s.id + '_clone' }))]
        : slides;

    const goTo = useCallback((index: number) => {
        if (!settings.loop) {
            let nextIndex = index;
            if (nextIndex < 0) nextIndex = 0;
            if (nextIndex >= displaySlides.length) nextIndex = displaySlides.length - 1;

            directionRef.current = nextIndex >= current ? 'next' : 'prev';
            prevIndexRef.current = current;
            setCurrent(nextIndex);
        } else {
            const nextIndex = (index + displaySlides.length) % displaySlides.length;

            // Determine logical direction for infinite loop
            if (current === displaySlides.length - 1 && nextIndex === 0) directionRef.current = 'next';
            else if (current === 0 && nextIndex === displaySlides.length - 1) directionRef.current = 'prev';
            else directionRef.current = nextIndex > current ? 'next' : 'prev';

            prevIndexRef.current = current;
            setCurrent(nextIndex);
        }
    }, [displaySlides.length, settings.loop, current]);

    const next = useCallback(() => goTo(current + 1), [current, goTo]);
    const prev = useCallback(() => goTo(current - 1), [current, goTo]);

    // Auto-advance
    useEffect(() => {
        if (displaySlides.length <= 1 || paused) return;
        if (!settings.loop && current >= displaySlides.length - 1) return; // Stop if not looping and reached end
        timerRef.current = setInterval(next, settings.slider_speed);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [displaySlides.length, paused, next, settings.slider_speed, settings.loop, current]);

    const slide = displaySlides[current];
    const showArrows = settings.arrow_visibility === 'visible' || (settings.arrow_visibility === 'hover' && hovering);

    if (loading) {
        return (
            <section className="relative overflow-hidden bg-neutral-200/50 animate-pulse aspect-[1920/550] w-full rounded-none sm:rounded-2xl lg:rounded-3xl">
                <div className="relative z-20 mx-auto max-w-7xl px-4 h-full flex items-center justify-center"></div>
            </section>
        );
    }

    if (slides.length === 0) {
        return null;
    }

    const getSlideClasses = (index: number) => {
        if (settings.slideshow_type === 'fade') {
            return index === current ? 'opacity-100 z-10' : 'opacity-0 z-0';
        }

        const isRTL = settings.slideshow_type === 'slide_right_to_left';

        if (index === current) {
            return 'opacity-100 z-10 translate-x-0';
        }

        // If it's the slide we just left, slide it OUT in the opposite direction
        if (index === prevIndexRef.current) {
            if (directionRef.current === 'next') {
                return `opacity-0 z-0 ${isRTL ? '-translate-x-full' : 'translate-x-full'}`;
            } else {
                return `opacity-0 z-0 ${isRTL ? 'translate-x-full' : '-translate-x-full'}`;
            }
        }

        // For all other inactive slides, stage them IN the direction they will come from
        if (directionRef.current === 'next') {
            return `opacity-0 z-0 ${isRTL ? 'translate-x-full' : '-translate-x-full'}`;
        } else {
            return `opacity-0 z-0 ${isRTL ? '-translate-x-full' : 'translate-x-full'}`;
        }
    };

    return (
        <section
            className="relative overflow-hidden group aspect-[1920/550] w-full flex items-center justify-center rounded-none sm:rounded-2xl lg:rounded-3xl shadow-none sm:shadow-md touch-pan-y"
            onMouseEnter={() => { setPaused(true); setHovering(true); }}
            onMouseLeave={() => { setPaused(false); setHovering(false); }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* ── Slides ── */}
            {displaySlides.map((s, i) => (
                <div
                    key={s.id}
                    className={`absolute inset-0 transition-all duration-1000 ease-in-out ${getSlideClasses(i)}`}
                >
                    <Image
                        src={s.image_url}
                        alt={s.alt_text || s.headings?.[0]?.text || 'Hero banner'}
                        fill
                        sizes="100vw"
                        className="object-cover object-center"
                        priority={i < 2}
                        fetchPriority={i === 0 ? 'high' : 'auto'}
                    />
                    <div
                        className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60"
                        style={{ opacity: s.overlay_opacity }}
                    />
                </div>
            ))}

            {/* ── Content ── */}
            {(() => {
                const slideContent = (
                    <>
                        {/* Dynamic Headings */}
                        <div className="animate-fade-in-up space-y-1 sm:space-y-2 mb-2 sm:mb-6 shadow-black/20 drop-shadow-2xl">
                            {slide.headings?.map(h => {
                                const isNum = !isNaN(Number(h.fontSize)) && h.fontSize !== '';
                                return (
                                    <h1 
                                        key={h.id} 
                                        style={{ 
                                            color: h.color, 
                                            fontSize: isNum ? `clamp(1.125rem, 5vw, ${h.fontSize}px)` : undefined 
                                        }} 
                                        className={`font-bold leading-tight ${!isNum ? `text-${h.fontSize}` : ''}`}
                                    >
                                        {h.text}
                                    </h1>
                                )
                            })}
                        </div>

                        {/* Dynamic Subheadings */}
                        <div className="animate-fade-in-up space-y-3 mx-auto max-w-2xl shadow-black/20 drop-shadow-md" style={{ animationDelay: '0.2s' }}>
                            {slide.subheadings?.map(s => {
                                const isNum = !isNaN(Number(s.fontSize)) && s.fontSize !== '';
                                return (
                                    <p 
                                        key={s.id} 
                                        style={{ 
                                            color: s.color, 
                                            fontSize: isNum ? `clamp(0.875rem, 3vw, ${s.fontSize}px)` : undefined 
                                        }} 
                                        className={`leading-relaxed mx-auto max-w-[90%] sm:max-w-none ${!isNum ? `text-${s.fontSize}` : ''}`}
                                    >
                                        {s.text}
                                    </p>
                                )
                            })}
                        </div>

                        {/* Dynamic Buttons */}
                        <div className="animate-fade-in-up mt-3 sm:mt-10 flex flex-wrap justify-center gap-2 sm:gap-4" style={{ animationDelay: '0.4s' }}>
                            {slide.buttons?.map(b => (
                                <Link
                                    key={b.id}
                                    href={b.url || '/products'}
                                    data-hero-btn="true"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                        backgroundColor: b.bgColor !== 'transparent' ? b.bgColor : 'transparent',
                                        color: b.textColor,
                                        borderColor: b.bgColor === 'transparent' ? 'rgba(255,255,255,0.3)' : 'transparent',
                                        borderWidth: b.bgColor === 'transparent' ? '2px' : '0px'
                                    }}
                                    className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 sm:px-8 sm:py-3.5 text-[12px] sm:text-sm font-semibold shadow-lg transition-all hover:brightness-110 hover:-translate-y-0.5 hover:shadow-xl ${b.bgColor === 'transparent' ? 'hover:bg-white/10' : ''}`}
                                >
                                    {b.label}
                                    {b.bgColor !== 'transparent' && <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />}
                                </Link>
                            ))}
                        </div>
                    </>
                );

                if (slide.link_url) {
                    return (
                        <Link
                            href={`${slide.link_url.startsWith('/') ? '' : '/'}${slide.link_url}`}
                            aria-label={slide.alt_text || slide.headings?.[0]?.text || 'View details'}
                            className="relative z-20 mx-auto max-w-7xl px-4 py-2 sm:py-8 md:py-10 lg:py-12 text-center w-full h-full flex flex-col justify-center cursor-pointer"
                        >
                            {slideContent}
                        </Link>
                    );
                }

                return (
                    <div className="relative z-20 mx-auto max-w-7xl px-4 py-2 sm:py-8 md:py-10 lg:py-12 text-center w-full h-full flex flex-col justify-center">
                        {slideContent}
                    </div>
                );
            })()}

            {/* ── Prev / Next arrows (only if multiple slides AND visibility matches setting) ── */}
            {displaySlides.length > 1 && settings.arrow_visibility !== 'hidden' && (
                <>
                    {(!(!settings.loop && current === 0)) && (
                        <button
                            onClick={prev}
                            aria-label="Previous slide"
                            className={`absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-all duration-300 ${showArrows ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}
                        >
                            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                    )}
                    {(!(!settings.loop && current === displaySlides.length - 1)) && (
                        <button
                            onClick={next}
                            aria-label="Next slide"
                            className={`absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-all duration-300 ${showArrows ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}
                        >
                            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                    )}
                </>
            )}

            {/* ── Dot indicators ── */}
            {slides.length > 1 && (
                <div className="absolute bottom-2 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-1.5 sm:gap-2">
                    {slides.map((_, i) => {
                        const isActive = (current % slides.length) === i;
                        return (
                            <button
                                key={i}
                                aria-label={`Go to slide ${i + 1}`}
                                onClick={() => {
                                    // Calculate closest path to requested index to avoid backwards spinning if cloned
                                    let targetIndex = i;
                                    if (settings.loop && slides.length === 2) {
                                        // We have 4 slides total (0, 1, 2, 3)
                                        // E.g. If current is 3 (index 1), and user clicks 0 (index 0).
                                        // The closest equivalent is 0 or 2, we should go to 0. 
                                        // A simple goTo(i) works robustly as a manual manual jump.
                                        targetIndex = i;
                                    }
                                    goTo(targetIndex);
                                }}
                                className={`rounded-full transition-all duration-300 ${isActive
                                    ? 'bg-vedic-gold w-4 h-1 sm:w-6 sm:h-2'
                                    : 'bg-white/40 hover:bg-white/70 w-1.5 h-1.5 sm:w-2 sm:h-2'
                                    }`}
                            />
                        );
                    })}
                </div>
            )}
        </section>
    );
}

