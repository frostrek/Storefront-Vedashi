export function SkeletonCard() {
    return (
        <div className="overflow-hidden rounded-xl border border-light-border bg-white">
            <div className="aspect-square animate-shimmer" />
            <div className="space-y-3 p-4">
                <div className="h-4 w-3/4 rounded animate-shimmer" />
                <div className="h-3 w-1/2 rounded animate-shimmer" />
                <div className="h-5 w-1/3 rounded animate-shimmer" />
                <div className="h-10 w-full rounded-lg animate-shimmer" />
            </div>
        </div>
    );
}

export function SkeletonLine({ className = '' }: { className?: string }) {
    return <div className={`rounded animate-shimmer ${className}`} />;
}

export function SkeletonProductGrid({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}

export function SkeletonHero() {
    return (
        <div className="h-[500px] animate-shimmer" />
    );
}

/** Skeleton for the review section (summary + review cards) */
export function SkeletonReviewSection() {
    return (
        <section className="mt-16 border-t border-neutral-100 pt-10">
            <div className="flex items-center gap-3 mb-2 sm:mb-8">
                <div className="h-6 w-6 rounded animate-shimmer" />
                <div className="h-7 w-48 rounded animate-shimmer" />
            </div>
            <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
                {/* Summary skeleton */}
                <div className="space-y-5">
                    <div className="rounded-xl border border-neutral-100 p-6 space-y-3">
                        <div className="h-10 w-16 mx-auto rounded animate-shimmer" />
                        <div className="h-5 w-32 mx-auto rounded animate-shimmer" />
                        <div className="h-4 w-24 mx-auto rounded animate-shimmer" />
                    </div>
                </div>
                {/* Review cards skeleton */}
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="rounded-lg border border-neutral-100 p-5 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full animate-shimmer" />
                                <div className="space-y-1.5 flex-1">
                                    <div className="h-4 w-28 rounded animate-shimmer" />
                                    <div className="h-3 w-20 rounded animate-shimmer" />
                                </div>
                            </div>
                            <div className="h-4 w-3/4 rounded animate-shimmer" />
                            <div className="h-3 w-full rounded animate-shimmer" />
                            <div className="h-3 w-2/3 rounded animate-shimmer" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/** Skeleton for a row of 4 product cards (related / recommended) */
export function SkeletonProductRow({ title }: { title?: string }) {
    return (
        <div className="mt-16 border-t border-light-border pt-16">
            {title && (
                <div className="flex items-center gap-3 mb-2 sm:mb-8">
                    <div className="h-6 w-6 rounded animate-shimmer" />
                    <div className="h-8 w-56 rounded animate-shimmer" />
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        </div>
    );
}
