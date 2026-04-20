import { ProductVariant } from '@/types';

export function getValidPrices(price1: any, price2: any): { displayPrice: number, originalPrice: number } {
    let p1 = Number(price1) || 0;
    let p2 = Number(price2) || 0;
    
    // If a price is 0 or negative, it's invalid. Fallback to the other price.
    if (p1 <= 0) p1 = p2;
    if (p2 <= 0) p2 = p1;
    if (p1 <= 0) p1 = 0; // Both are 0 or less
    
    // Always map the lowest valid price to selling price, and highest to MRP
    return {
        displayPrice: Math.min(p1, p2),
        originalPrice: Math.max(p1, p2)
    };
}

export function hasDiscount(variant: ProductVariant | null | undefined): boolean {
    if (!variant) return false;
    
    const { displayPrice, originalPrice } = getValidPrices(
        variant.price || variant.discount_base_price,
        variant.sale_price || variant.original_price
    );
    
    return originalPrice > 0 && displayPrice > 0 && originalPrice > displayPrice;
}

export function getDiscountPercent(variant: ProductVariant | null | undefined): number {
    if (!variant) return 0;
    
    const { displayPrice, originalPrice } = getValidPrices(
        variant.price || variant.discount_base_price,
        variant.sale_price || variant.original_price
    );
    
    if (originalPrice <= displayPrice || originalPrice === 0) return 0;
    
    return Math.round((1 - displayPrice / originalPrice) * 100);
}

