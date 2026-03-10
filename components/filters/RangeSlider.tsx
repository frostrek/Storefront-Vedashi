'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface RangeSliderProps {
    min: number;
    max: number;
    step?: number;
    value: [number, number];
    onChange: (value: [number, number]) => void;
    formatLabel?: (value: number) => string;
}

export default function RangeSlider({
    min,
    max,
    step = 1,
    value,
    onChange,
    formatLabel = (v) => String(v),
}: RangeSliderProps) {
    const [localValue, setLocalValue] = useState(value);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const debouncedChange = useCallback(
        (newVal: [number, number]) => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                onChange(newVal);
            }, 400);
        },
        [onChange]
    );

    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMin = Math.min(Number(e.target.value), localValue[1] - step);
        const newVal: [number, number] = [newMin, localValue[1]];
        setLocalValue(newVal);
        debouncedChange(newVal);
    };

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMax = Math.max(Number(e.target.value), localValue[0] + step);
        const newVal: [number, number] = [localValue[0], newMax];
        setLocalValue(newVal);
        debouncedChange(newVal);
    };

    const minPercent = ((localValue[0] - min) / (max - min)) * 100;
    const maxPercent = ((localValue[1] - min) / (max - min)) * 100;

    return (
        <div className="space-y-3">
            {/* Track */}
            <div className="relative h-2 mt-1">
                {/* Background track */}
                <div className="absolute inset-0 rounded-full bg-cream-dark" />
                {/* Active track */}
                <div
                    className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-burgundy to-burgundy-light"
                    style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
                />
                {/* Min slider */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={localValue[0]}
                    onChange={handleMinChange}
                    className="range-thumb absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
                />
                {/* Max slider */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={localValue[1]}
                    onChange={handleMaxChange}
                    className="range-thumb absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
                />
            </div>

            {/* Labels */}
            <div className="flex items-center justify-between text-xs text-warm-gray">
                <span className="rounded bg-cream-dark px-2 py-1 font-medium text-charcoal/80">
                    {formatLabel(localValue[0])}
                </span>
                <span className="text-warm-gray/50">—</span>
                <span className="rounded bg-cream-dark px-2 py-1 font-medium text-charcoal/80">
                    {formatLabel(localValue[1])}
                </span>
            </div>
        </div>
    );
}
