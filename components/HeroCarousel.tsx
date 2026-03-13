'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface TextElement {
    id: string;
    text: string;
    color: string;
    fontSize: string;
}

interface ButtonElement {
    id: string;
    label: string;
    url: string;
    bgColor: string;
    textColor: string;
    size: string;
}

interface HeroSlide {
    id: string;
    image_url: string;
    headings: TextElement[];
    subheadings: TextElement[];
    buttons: ButtonElement[];
    overlay_opacity: number;
}

interface HeroSettings {
    slider_speed: number;
    arrow_visibility: 'visible' | 'hover' | 'hidden';
    loop: boolean;
    slideshow_type: 'fade' | 'slide_right_to_left' | 'slide_left_to_right';
}

export default function HeroCarousel() {
    const [slides, setSlides] = useState<HeroSlide[]>([]);
    const [settings, setSettings] = useState<HeroSettings>({ slider_speed: 5000, arrow_visibility: 'hover', loop: true, slideshow_type: 'fade' });
    const [loading, setLoading] = useState(true);
    const [current, setCurrent] = useState(0);
    const [paused, setPaused] = useState(false);
    const [hovering, setHovering] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const prevIndexRef = useRef<number>(0);
    const directionRef = useRef<'next' | 'prev'>('next');

    useEffect(() => {
        // Fetch active slides and settings in parallel
        Promise.all([
            fetch(`${API_URL}/api/media/hero/active`, { credentials: 'include' }).then(r => r.json()),
            fetch(`${API_URL}/api/media/hero/settings`, { credentials: 'include' }).then(r => r.json())
        ])
            .then(([slidesData, settingsData]) => {
                if (slidesData.success && slidesData.data?.length > 0) setSlides(slidesData.data);
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
            let nextIndex = (index + displaySlides.length) % displaySlides.length;

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
            <section className="relative overflow-hidden bg-neutral-200/50 animate-pulse">
                <div className="relative z-20 mx-auto max-w-7xl px-4 py-28 sm:py-36 lg:py-44 min-h-[400px]"></div>
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
            className="relative overflow-hidden group"
            onMouseEnter={() => { setPaused(true); setHovering(true); }}
            onMouseLeave={() => { setPaused(false); setHovering(false); }}
        >
            {/* ── Slides ── */}
            {displaySlides.map((s, i) => (
                <div
                    key={s.id}
                    className={`absolute inset-0 transition-all duration-1000 ease-in-out ${getSlideClasses(i)}`}
                >
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                            backgroundImage: `url('${s.image_url}')`,
                        }}
                    />
                    <div
                        className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60"
                        style={{ opacity: s.overlay_opacity }}
                    />
                </div>
            ))}

            {/* ── Content ── */}
            <div className="relative z-20 mx-auto max-w-7xl px-4 py-28 sm:py-36 lg:py-44 text-center">
                {/* Dynamic Headings */}
                <div className="animate-fade-in-up space-y-2 mb-6 shadow-black/20 drop-shadow-2xl font-serif">
                    {slide.headings?.map(h => {
                        const isNum = !isNaN(Number(h.fontSize)) && h.fontSize !== '';
                        return (
                            <h1 key={h.id} style={{ color: h.color, fontSize: isNum ? `${h.fontSize}px` : undefined }} className={`font-bold leading-tight ${!isNum ? `text-${h.fontSize}` : ''}`}>
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
                            <p key={s.id} style={{ color: s.color, fontSize: isNum ? `${s.fontSize}px` : undefined }} className={`leading-relaxed ${!isNum ? `text-${s.fontSize}` : ''}`}>
                                {s.text}
                            </p>
                        )
                    })}
                </div>

                {/* Dynamic Buttons */}
                <div className="animate-fade-in-up mt-10 flex flex-wrap justify-center gap-4" style={{ animationDelay: '0.4s' }}>
                    {slide.buttons?.map(b => (
                        <Link
                            key={b.id}
                            href={b.url || '/products'}
                            style={{
                                backgroundColor: b.bgColor !== 'transparent' ? b.bgColor : 'transparent',
                                color: b.textColor,
                                borderColor: b.bgColor === 'transparent' ? 'rgba(255,255,255,0.3)' : 'transparent',
                                borderWidth: b.bgColor === 'transparent' ? '2px' : '0px'
                            }}
                            className={`inline-flex items-center gap-2 rounded-lg px-8 py-3.5 text-sm font-semibold shadow-lg transition-all hover:brightness-110 hover:-translate-y-0.5 hover:shadow-xl ${b.bgColor === 'transparent' ? 'hover:bg-white/10' : ''}`}
                        >
                            {b.label}
                            {b.bgColor !== 'transparent' && <ArrowRight className="h-4 w-4" />}
                        </Link>
                    ))}
                </div>
            </div>

            {/* ── Prev / Next arrows (only if multiple slides AND visibility matches setting) ── */}
            {displaySlides.length > 1 && settings.arrow_visibility !== 'hidden' && (
                <>
                    {(!(!settings.loop && current === 0)) && (
                        <button
                            onClick={prev}
                            className={`absolute left-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-all duration-300 ${showArrows ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                    )}
                    {(!(!settings.loop && current === displaySlides.length - 1)) && (
                        <button
                            onClick={next}
                            className={`absolute right-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-all duration-300 ${showArrows ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    )}
                </>
            )}

            {/* ── Dot indicators ── */}
            {slides.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                    {slides.map((_, i) => {
                        const isActive = (current % slides.length) === i;
                        return (
                            <button
                                key={i}
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
                                    ? 'bg-vedic-gold w-6 h-2'
                                    : 'bg-white/40 hover:bg-white/70 w-2 h-2'
                                    }`}
                            />
                        );
                    })}
                </div>
            )}
        </section>
    );
}

