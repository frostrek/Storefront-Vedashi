'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';

interface StarRatingProps {
    value: number;           // 0–5, supports decimals for averages
    onChange?: (v: number) => void; // if provided, stars are interactive
    size?: 'sm' | 'md' | 'lg';
    showValue?: boolean;
    className?: string;
}

const SIZES = { sm: 14, md: 18, lg: 24 };

export default function StarRating({ value, onChange, size = 'md', showValue, className = '' }: StarRatingProps) {
    const [hover, setHover] = useState(0);
    const px = SIZES[size];
    const interactive = !!onChange;
    const display = hover || value;

    return (
        <span className={`inline-flex items-center gap-0.5 ${className}`}>
            {[1, 2, 3, 4, 5].map(star => {
                const filled = display >= star;
                const half = !filled && display >= star - 0.5;

                return (
                    <button
                        key={star}
                        type="button"
                        disabled={!interactive}
                        onClick={() => onChange?.(star)}
                        onMouseEnter={() => interactive && setHover(star)}
                        onMouseLeave={() => interactive && setHover(0)}
                        className={`relative transition-transform duration-150 ${interactive ? 'cursor-pointer hover:scale-125' : 'cursor-default'} disabled:opacity-100`}
                        aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    >
                        {/* Background (empty) star */}
                        <Star
                            width={px}
                            height={px}
                            className="text-neutral-200"
                            strokeWidth={1.5}
                        />

                        {/* Filled overlay */}
                        {(filled || half) && (
                            <span
                                className="absolute inset-0 overflow-hidden"
                                style={{ width: filled ? '100%' : '50%' }}
                            >
                                <Star
                                    width={px}
                                    height={px}
                                    className="fill-[#FFD801] text-[#FFD801] drop-shadow-[0_0_3px_rgba(255,216,1,0.4)]"
                                    strokeWidth={1.5}
                                />
                            </span>
                        )}
                    </button>
                );
            })}

            {showValue && (
                <span className={`ml-1 font-medium text-neutral-600 ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}>
                    {value.toFixed(1)}
                </span>
            )}
        </span>
    );
}
