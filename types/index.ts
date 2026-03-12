/* === Storefront Type Definitions === */
/* Maps to existing backend inventory.products schema */

export interface Product {
    product_id: string;
    sku: string;
    product_name: string;
    slug?: string;
    brand?: string;
    category?: string;
    sub_category?: string;
    description?: string;
    unit_of_measure?: string;
    intended_use?: string;
    country_of_origin?: string;

    created_at?: string;
    updated_at?: string;
    /* Extended fields (may not exist in all DB rows) */
    price?: number;
    original_price?: number;
    effective_price?: number;
    is_on_sale?: boolean;
    discount_percentage?: number;
    variant?: any;
    quantity?: number;
    images?: string[];
    is_featured?: boolean;
    is_best_seller?: boolean;
    is_new_arrival?: boolean;
    is_coming_soon?: boolean;
    is_availability_expired?: boolean;
    available_from?: string;
    available_until?: string;
}

/** Shape returned by GET /api/products/filter */
export interface FilteredProduct extends Product {

    country_of_origin?: string;
    avg_rating?: number;
    review_count?: number;
    total_stock?: number;
    thumbnail_url?: string;
}

export interface FilterMeta {
    total_count: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next_page: boolean;
    has_prev_page: boolean;
    filters_applied: Record<string, unknown>;
    sort: string;
    cache_hit: boolean;
}

export interface ProductWithDetails extends Product {
    stock_quantity?: number;
    specifications?: ProductSpecification | null;
    packaging?: ProductPackaging | null;
    variants?: ProductVariant[];
    compliance?: ProductCompliance | null;
    assets?: ProductAsset[];
}

export interface ProductSpecification {
    spec_id: string;
    product_id: string;
    material?: string;
    length_cm?: number;
    width_cm?: number;
    height_cm?: number;
    weight_kg?: number;
    color?: string;
    strength?: string;
    grade?: string;
    shelf_life_months?: number;
    country_of_origin?: string;
}

export interface ProductPackaging {
    packaging_id: string;
    product_id: string;
    packaging_type?: string;
    pack_size?: string;
    net_quantity?: number;
    gross_weight?: number;
    packaging_material?: string;
    carton_size?: string;
    units_per_carton?: number;
    barcode?: string;
}

export interface ProductVariant {
    variant_id: string;
    product_id: string;
    variant_name?: string;
    variant_sku?: string;
    size_label?: string;
    volume_ml?: number;
    price?: number;
    original_price?: number;
    sale_price?: number;
    sale_start?: string;
    sale_end?: string;
    effective_price?: number;
    is_on_sale?: boolean;
    discount_percentage?: number;
    discounted_price?: number;
    stock_quantity?: number;
    is_active?: boolean;
    is_default?: boolean;
    pack_quantity?: number;
    cost_price?: number;
    weight_kg?: number;
    barcode?: string;
    status?: 'Active' | 'Inactive';
}

export interface ProductCompliance {
    compliance_id: string;
    product_id: string;
    manufacturer_name?: string;
    manufacturer_address?: string;
    regulatory_details?: string;
    storage_instructions?: string;
    handling_instructions?: string;
    warranty_details?: string;
    safety_warnings?: string;
    remarks?: string;
}

export interface ProductAsset {
    asset_id: string;
    product_id: string;
    variant_id?: string;
    asset_type?: string;
    asset_url?: string;
    base64_data?: string;
    cdn_url?: string;
    mime_type?: string;
    image_type?: 'thumbnail' | 'gallery' | 'zoom' | 'lifestyle' | 'video' | '360';
    media_type?: 'image' | 'video';
    is_primary?: boolean;
    file_name?: string;
    file_size_bytes?: number;
    sort_order?: number;
    alt_text?: string;
    width?: number;
    height?: number;
    blurhash?: string;
    created_at?: string;
}

/** Resolved image data for gallery display */
export interface GalleryImage {
    id: string;
    src: string;
    alt: string;
    width?: number;
    height?: number;
    blurhash?: string;
    imageType?: string;
    isPrimary?: boolean;
    /** True if this gallery item is a video */
    isVideo?: boolean;
    /** Video source URL (cdn_url / asset_url / base64_data) */
    videoSrc?: string;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
}

/* ─── Cart (Backend-matching) ─── */

export interface BackendCartItem {
    cart_item_id: string;
    cart_id: string;
    product_id: string;
    variant_id: string | null;
    quantity: number;
    price: number;
    added_at: string;
    product?: {
        product_id: string;
        product_name: string;
        brand?: string;
        category?: string;
        product_sku?: string;
        slug?: string;
        thumbnail_url?: string;
    };
    variant?: {
        variant_id: string;
        variant_sku?: string;
        size_label?: string;
        volume_ml?: number;
    };
    pricing?: {
        unit_price: number;
        effective_price: number;
        discount_amount: number;
        discount_source: string | null;
        line_subtotal: number;
        line_tax: number;
        line_total: number;
        currency?: string;
    };
    /* Convenience getters added by frontend (computed) */
    product_name?: string;
    original_price?: number;
    size_label?: string;
    sku?: string;
    image_url?: string;
    slug?: string;
}

export interface BackendCart {
    cart_id: string;
    customer_id?: string;
    created_at?: string;
    items: BackendCartItem[];
    summary?: {
        item_count: number;
        unique_items: number;
        subtotal: number;
        total_tax: number;
        grand_total: number;
    };
    /* Legacy flat fields (fallback) */
    total_amount?: number;
    total_items?: number;
}

/** Legacy CartItem shape — kept for backward compat on ProductCard */
export interface CartItem {
    product: Product;
    quantity: number;
}

export interface WishlistItem {
    product_id: string;
    product: Product;
}

/* ─── Orders (Backend-matching) ─── */

export interface Order {
    order_id: string;
    customer_id?: string;
    billing_address_id?: string;
    customer_name?: string;
    customer_email?: string;
    // Legacy fields (kept for backward compat)
    total_amount: string | number;
    total_tax?: string | number;
    grand_total?: number;
    // VND breakdown fields (new)
    subtotal?: number;
    sale_discount_amount?: number;
    coupon_discount_amount?: number;
    discount_amount?: number;
    coupon_code?: string;
    taxable_amount?: number;
    vat_amount?: number;
    shipping_amount?: number;
    final_total?: number;
    currency?: string;
    // Order status
    order_status: string;
    payment_status: string;
    payment_method?: string;
    order_notes?: string;
    items?: OrderItem[];
    item_count?: number | string;
    first_item?: {
        product_name?: string;
        thumbnail_url?: string;
    };
    created_at: string;
    // Cancellation
    cancelled_at?: string;
    cancelled_by?: string;
    cancellation_reason?: string;
    refund_status?: 'NOT_APPLICABLE' | 'PENDING' | 'COMPLETED';
    refunded_at?: string;
}

export interface OrderItem {
    order_item_id: string;
    variant_id?: string;
    product_id?: string;
    quantity: number;
    unit_price: number;
    tax_amount?: number;
    product_name?: string;
    product_name_snapshot?: string;
    variant_name_snapshot?: string;
    product?: {
        product_id: string;
        product_name: string;
    };
}

/* ─── Address (Backend-matching) ─── */

export interface Address {
    address_id: string;
    customer_id: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
    phone?: string;
    is_default?: boolean;
    label?: string;
}
