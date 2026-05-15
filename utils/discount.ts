import { ProductVariant } from '@/types';

export function getValidPrices(price1: any, price2: any): { displayPrice: number, originalPrice: number } {
    let p1 = Number(price1) || 0;
    let p2 = Number(price2) || 0;
    
    // If selling price is 0 or negative, fallback to MRP
    if (p1 <= 0) {
        p1 = p2 > 0 ? p2 : 0;
    }
    
    // If MRP is missing or negative, fallback to selling price
    if (p2 <= 0) {
        p2 = p1;
    }
    
    // MRP should only be valid as a strikethrough if it's strictly greater than the selling price.
    // If MRP <= Selling Price, then there is no valid discount, so MRP should match Selling Price
    // to correctly indicate no discount.
    if (p2 <= p1) {
        p2 = p1;
    }
    
    return {
        displayPrice: p1,
        originalPrice: p2
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

