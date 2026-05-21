"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

const FROSTY_API_URL = process.env.NEXT_PUBLIC_FROSTY_API_URL ?? "https://dashboard.vedashi.com";
const FROSTY_EMBED_KEY = process.env.NEXT_PUBLIC_FROSTY_EMBED_KEY ?? "GZWbbJ6J4hQ-MTLEo321NAT_t-_Pmwt6VxYhDedULUU";

function toProductIds(items: Array<{ productId?: string; product_id?: string; id?: string }>): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of items ?? []) {
        const id = (item.productId ?? item.product_id ?? item.id ?? "").trim();
        if (!id || seen.has(id)) continue;
        seen.add(id);
        out.push(id);
    }
    return out;
}

function FrostyShopBridge() {
    const { user, isAuthenticated } = useAuth();
    const { items: cartItems, cartId } = useCart();
    const { items: wishlistItems } = useWishlist();
    // Track previous customerId to detect login/logout transitions
    const prevCustomerIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const customerId = (isAuthenticated && user?.id) ? user.id : null;
        const prevCustomerId = prevCustomerIdRef.current;

        const ctx = customerId
            ? {
                storefrontAccessToken: null, // HttpOnly cookie — Frosty cannot use it cross-origin
                customerId,                  // MUST match customer_id on partner GET /orders
                customerEmail: user!.email ?? null,
                customerName: user!.name ?? null,
                cartId: cartId ?? null,
                cartProductIds: toProductIds(cartItems),
                wishlistProductIds: toProductIds(wishlistItems),
            }
            : {
                storefrontAccessToken: null,
                customerId: null,
                customerEmail: null,
                customerName: null,
                cartId: null,
                cartProductIds: [],
                wishlistProductIds: [],
            };

        (window as any).FrostyShopContext = ctx;

        // When customer identity changes (login / logout), dispatch a custom event so
        // the widget knows to bust its cached session token and re-mint with the new
        // customerId. The widget.js reads FrostyShopContext inside J() on every send,
        // but its session cache (the `e` closure) is keyed on customerId|email|token.
        // Changing customerId forces a re-mint on the next message sent.
        if (prevCustomerId !== customerId) {
            prevCustomerIdRef.current = customerId;
            window.dispatchEvent(new CustomEvent("frosty:context-update", { detail: ctx }));
        }
    }, [user, isAuthenticated, cartItems, wishlistItems, cartId]);

    return null;
}

export default function FrostyWidget() {
    // language=js
    const initScript = `
(function(){
  try {
    var raw = localStorage.getItem('vedashi_user');
    if (!raw) return;
    var u = JSON.parse(raw);
    if (!u || !u.id) return;
    // Pre-seed FrostyShopContext synchronously so widget.js reads the correct
    // customerId when it initialises — before React useEffect can fire.
    window.FrostyShopContext = {
      storefrontAccessToken: null,
      customerId: u.id,
      customerEmail: u.email || null,
      customerName: u.name || null,
      cartId: null,
      cartProductIds: [],
      wishlistProductIds: [],
    };
  } catch(e) {}
})();`;

    return (
        <>
            {/* Synchronous pre-seed — eliminates the race condition where the widget
                mints a guest session because React hydration hasn't run useEffect yet.
                USER_KEY 'vedashi_user' matches AuthContext.tsx line 49. */}
            <script
                id="frosty-context-init"
                dangerouslySetInnerHTML={{ __html: initScript }}
            />
            <FrostyShopBridge />
            <script
                src="https://ai.vedashi.com/widget.js"
                data-api-url={FROSTY_API_URL}
                data-tenant-id="1ccc64c6-b4c0-4a2e-b10b-e0abf32d7e87"
                data-embed-key={FROSTY_EMBED_KEY}
                data-bot-name="Veda"
                data-primary-color="#91ca35"
                data-accent-color="#ffffff"
                data-theme="default"
                data-position="bottom-right"
                data-show-product-images="true"
                defer
            ></script>
        </>
    );
}