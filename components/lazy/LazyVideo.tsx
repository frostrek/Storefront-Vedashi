'use client';

import { useState, useRef } from 'react';
import { Play } from 'lucide-react';
import { RU_DICTIONARY } from '@/content/ru';

interface LazyVideoProps {
    /** Video source URL */
    src: string;
    /** Poster image URL */
    poster?: string;
    /** Alt text / title */
    title?: string;
    /** CSS class for the container */
    className?: string;
    /** Width of the video */
    width?: number;
    /** Height of the video */
    height?: number;
}

/**
 * Video component that does NOT preload.
 * Shows a poster image with a play button overlay.
 * Loads and plays the actual video only when the user clicks play.
 */
export default function LazyVideo({
    src,
    poster,
    title,
    className = '',
    width,
    height,
}: LazyVideoProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handlePlay = () => {
        setIsPlaying(true);
        // Wait for next tick so the video element mounts
        setTimeout(() => {
            videoRef.current?.play();
        }, 0);
    };

    return (
        <div
            className={`relative overflow-hidden bg-black ${className}`}
            style={{ aspectRatio: width && height ? `${width}/${height}` : '16/9' }}
        >
            {!isPlaying ? (
                /* Poster + Play button */
                <button
                    onClick={handlePlay}
                    className="relative w-full h-full group cursor-pointer"
                    aria-label={`Play video: ${title || 'Product video'}`}
                >
                    {poster ? (
                        <img
                            src={poster}
                            alt={title || 'Video thumbnail'}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
                            <span className="text-neutral-500 text-sm">{RU_DICTIONARY.media?.video || "Видео"}</span>
                        </div>
                    )}
                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/90 shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="h-7 w-7 text-burgundy ml-1" fill="currentColor" />
                        </div>
                    </div>
                </button>
            ) : (
                /* Actual video (loaded on demand) */
                <video
                    ref={videoRef}
                    src={src}
                    poster={poster}
                    controls
                    preload="none"
                    className="w-full h-full object-contain"
                    title={title}
                >
                    Your browser does not support the video tag.
                </video>
            )}
        </div>
    );
}
