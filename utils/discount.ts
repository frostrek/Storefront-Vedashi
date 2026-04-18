import { ProductVariant } from '@/types';

export function hasDiscount(variant: ProductVariant | null | undefined): boolean {
    if (!variant) return false;
    if (!variant.sale_price && !variant.discount_base_price) return false;
    return (
        variant.discount_base_price !== null &&
        variant.discount_base_price !== undefined &&
        variant.discount_base_price > 0 &&
        variant.price !== undefined &&
        variant.price > 0 &&
        variant.discount_base_price > variant.price
    );
}

export function getDiscountPercent(variant: ProductVariant | null | undefined): number {
    if (!variant) return 0;
    if (!variant.price || !variant.discount_base_price) return 0;
    return Math.round((1 - variant.price / variant.discount_base_price) * 100);
}
