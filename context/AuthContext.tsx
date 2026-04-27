'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { authFetch, API_URL } from '@/lib/api';
import { setUserId, clearUserId } from '@/lib/analytics/gtag';
import { useCookieConsent } from '@/context/CookieConsentContext';

interface AuthContextType {
    user: UserInfo | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string, rememberMe?: boolean, turnstileToken?: string) => Promise<{ success: boolean; error?: string; code?: string; role?: string; access_token?: string; requireCaptcha?: boolean; blocked?: boolean; retryAfter?: number }>;
    register: (name: string, email: string, password: string, turnstileToken?: string) => Promise<RegisterResponse>;
    /** Log-in the user directly from verification data (after OTP verified and account created) */
    loginFromVerification: (customerData: Record<string, unknown>) => void;
    socialLogin: (clerkToken: string) => Promise<{ success: boolean; error?: string; is_new_user?: boolean; account_linked?: boolean; pending_verification?: boolean; customer_id?: string; email?: string; full_name?: string }>;
    logout: () => void;
    /** Update partial user info (like avatar_url) dynamically in cache and context */
    updateUser: (updates: Partial<UserInfo>) => void;
    /** Register callbacks that run after login/logout so Carts + Wishlist can react */
    onAuthChange: (cb: AuthChangeCallback) => () => void;
}

type AuthChangeCallback = (event: 'login' | 'logout', user: UserInfo | null) => void;

interface RegisterResponse {
    success: boolean;
    email?: string;
    requires_verification?: boolean;
    error?: string;
    requireCaptcha?: boolean;
}

interface UserInfo {
    id: string;
    name: string;
    email: string;
    role?: string;
    avatar_url?: string;
    auth_method?: string;
    is_email_verified?: boolean;
    is_mobile_verified?: boolean;
    phone?: string;
    loyalty_tier?: string;
    wallet_balance?: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
// API_URL imported from @/lib/api
const USER_KEY = 'vedashi_user';
// SECURITY: No TOKEN_KEY — access tokens are handled exclusively via HttpOnly cookies

/** Map backend customer shape → frontend UserInfo */
function toUserInfo(customer: Record<string, unknown>): UserInfo {
    return {
        id: (customer.customer_id ?? customer.id ?? '') as string,
        name: (customer.full_name ?? customer.name ?? '') as string,
        email: (customer.email ?? '') as string,
        role: (customer.role as string) || 'customer',
        avatar_url: (customer.avatar_url as string) || undefined,
        auth_method: (customer.auth_method as string) || undefined,
        is_email_verified: !!(customer.is_email_verified),
        is_mobile_verified: !!(customer.is_mobile_verified),
        phone: (customer.phone ?? customer.mobile_phone ?? '') as string,
        loyalty_tier: (customer.loyalty_tier as string) || 'Bronze',
        wallet_balance: Number(customer.wallet_balance || 0),
    };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const listenersRef = useRef<Set<AuthChangeCallback>>(new Set());
    const { consent } = useCookieConsent();

    /** Helper: push user_id to dataLayer only if analytics consent is granted */
    const pushUserId = useCallback((userId: string) => {
        if (consent?.analytics) setUserId(userId);
    }, [consent]);

    /** Helper: clear user_id from dataLayer only if analytics consent is granted */
    const pushClearUserId = useCallback(() => {
        if (consent?.analytics) clearUserId();
    }, [consent]);

    /** Subscribe to auth events — returns unsubscribe function */
    const onAuthChange = useCallback((cb: AuthChangeCallback) => {
        listenersRef.current.add(cb);
        return () => { listenersRef.current.delete(cb); };
    }, []);

    const notifyListeners = useCallback((event: 'login' | 'logout', u: UserInfo | null) => {
        listenersRef.current.forEach(cb => cb(event, u));
    }, []);

    // ── Automatically set user properties when user state changes ──
    useEffect(() => {
        if (user && typeof window !== 'undefined' && window.gtag) {
            window.gtag('set', 'user_properties', {
                loyalty_tier: user.loyalty_tier || 'Bronze',
                is_returning_customer: 'true'
            });
        }
    }, [user]);

    // ── Listen for session-expired event (from authFetch interceptor) ──
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handler = () => {
            setUser(null);
            localStorage.removeItem(USER_KEY);
            sessionStorage.removeItem('justSignedIn');
            sessionStorage.removeItem('social_otp_data');
            pushClearUserId();
            notifyListeners('logout', null);
        };
        window.addEventListener('session-expired', handler);
        return () => window.removeEventListener('session-expired', handler);
    }, [notifyListeners]);

    // On mount: try to restore session from localStorage cache + validate with server
    useEffect(() => {
        if (typeof window === 'undefined') {
            setIsLoading(false);
            return;
        }

        const stored = localStorage.getItem(USER_KEY);
        if (stored) {
            try {
                const cachedUser: UserInfo = JSON.parse(stored);
                setUser(cachedUser);
                // Push user_id for analytics (consent-gated)
                pushUserId(cachedUser.id);
                // Notify listeners (Cart/Wishlist) about restored session
                setTimeout(() => notifyListeners('login', cachedUser), 0);

                // Validate session with server via HttpOnly cookie
                authFetch(`${API_URL}/api/auth/me`)
                    .then(res => res.json())
                    .then(json => {
                        if (json.success && json.data) {
                            const updatedUser = toUserInfo(json.data);

                            // ── SECURITY ROLE CHECK ──────────────────────────
                            // Prevent admins from using the storefront app as a user
                            if (['admin', 'Super Admin', 'owner'].includes(updatedUser.role || '')) {
                                console.warn('[Auth] Admin role detected in storefront - clearing session');
                                setUser(null);
                                localStorage.removeItem(USER_KEY);
                                notifyListeners('logout', null);
                                return;
                            }

                            setUser(updatedUser);
                            localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
                            // Re-push user_id with verified data
                            pushUserId(updatedUser.id);
                        } else {
                            // Cookie expired or invalid — clear cached user
                            setUser(null);
                            localStorage.removeItem(USER_KEY);
                            pushClearUserId();
                            notifyListeners('logout', null);
                        }
                    }).catch(() => {
                        // Network error — keep cached user for offline resilience
                    }).finally(() => {
                        setIsLoading(false);
                    });
            } catch {
                localStorage.removeItem(USER_KEY);
                setIsLoading(false);
            }
        } else {
            // ── SILENT RECOVERY CHECK ──────────────────────────
            // If no local storage but cookies exist, try to restore customer session
            authFetch(`${API_URL}/api/auth/me`)
                .then(res => res.json())
                .then(json => {
                    if (json.success && json.data) {
                        const updatedUser = toUserInfo(json.data);
                        // ONLY auto-log if it is NOT an admin
                        if (!['admin', 'Super Admin', 'owner'].includes(updatedUser.role || '')) {
                            setUser(updatedUser);
                            localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
                            pushUserId(updatedUser.id);
                            notifyListeners('login', updatedUser);
                        }
                    }
                })
                .catch(() => { })
                .finally(() => {
                    setIsLoading(false);
                });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const login = useCallback(async (email: string, password: string, rememberMe: boolean = true, turnstileToken?: string | null) => {
        try {
            const body: Record<string, unknown> = { email, password, remember_me: rememberMe, source: 'storefront' };
            if (turnstileToken) body.turnstile_token = turnstileToken;

            const res = await authFetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body),
            });
            const json = await res.json();
            if (res.ok && json.success && json.data?.customer) {
                const u = toUserInfo(json.data.customer);

                // ── SECURITY ROLE CHECK ──────────────────────────
                // Prevent admins from being authenticated as customers in the storefront state
                if (['admin', 'Super Admin', 'owner'].includes(u.role || '')) {
                    console.info('[Auth] Admin login detected - returning success for redirection');
                    // We return success: true so the login page can redirect to the admin panel,
                    // but we DO NOT call setUser(u) or store the user locally.
                    return { success: true, role: u.role };
                }

                setUser(u);
                localStorage.setItem(USER_KEY, JSON.stringify(u));
                // SECURITY: No token stored — access token is in HttpOnly cookie
                sessionStorage.setItem('justSignedIn', String(Date.now()));
                pushUserId(u.id);
                notifyListeners('login', u);
                return { success: true, role: u.role };
            }
            if (json.message) return {
                success: false,
                error: json.message,
                code: json.code,
                requireCaptcha: json.requireCaptcha,
                blocked: json.blocked,
                retryAfter: json.retryAfter,
            };
        } catch (err) {
            console.error('[Auth] Login error:', err);
        }

        return { success: false, error: 'Login failed. Please check your credentials.' };
    }, [notifyListeners]);

    const register = useCallback(async (
        name: string,
        email: string,
        password: string,
        turnstileToken?: string
    ): Promise<RegisterResponse> => {
        try {
            const res = await authFetch(`${API_URL}/api/auth/initiate-registration`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ full_name: name, email, password, turnstile_token: turnstileToken }),
            });
            const json = await res.json();
            if (res.ok && json.success) {
                return {
                    success: true,
                    email: json.data?.email || email,
                    requires_verification: true,
                };
            }
            if (json.message) return { success: false, error: json.message, requireCaptcha: json.requireCaptcha };
        } catch (err) {
            console.error('[Auth] Register error:', err);
        }

        return { success: false, error: 'Registration failed. Please try again.' };
    }, []);

    /** Log in the user from verification page data (after OTP created the account) */
    const loginFromVerification = useCallback((customerData: Record<string, unknown>) => {
        const u = toUserInfo(customerData);
        setUser(u);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
        // SECURITY: No token stored — access token is in HttpOnly cookie
        sessionStorage.setItem('justSignedIn', String(Date.now()));
        pushUserId(u.id);
        notifyListeners('login', u);
    }, [notifyListeners, pushUserId]);

    /** Update user fields dynamically */
    const updateUser = useCallback((updates: Partial<UserInfo>) => {
        setUser(prev => {
            if (!prev) return null;
            const updated = { ...prev, ...updates };
            localStorage.setItem(USER_KEY, JSON.stringify(updated));
            // Trigger login event to simulate an update broadcast
            // Notify listeners outside the state updater to avoid React update errors
            setTimeout(() => notifyListeners('login', updated), 0);
            return updated;
        });
    }, [notifyListeners]);

    const logout = useCallback(() => {
        authFetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => { });
        setUser(null);
        localStorage.removeItem(USER_KEY);
        // Clear all auth-related session storage
        sessionStorage.removeItem('justSignedIn');
        sessionStorage.removeItem('social_otp_data');
        // SECURITY: HttpOnly cookies are cleared server-side by the /api/auth/logout endpoint
        pushClearUserId();
        notifyListeners('logout', null);
    }, [notifyListeners, pushClearUserId]);

    /** Social login via Clerk token → backend JWT (or pending OTP for new users) */
    const socialLogin = useCallback(async (clerkToken: string) => {
        try {
            const res = await authFetch(`${API_URL}/api/auth/social/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ clerk_token: clerkToken }),
            });
            const json = await res.json();

            // New user → pending OTP verification (no JWT yet)
            if (res.ok && json.success && json.pending_verification) {
                return {
                    success: true,
                    pending_verification: true,
                    customer_id: json.data.customer_id,
                    email: json.data.email,
                    full_name: json.data.full_name,
                };
            }

            // Returning user → JWT issued as HttpOnly cookie
            if (res.ok && json.success && json.data?.customer) {
                const u = toUserInfo(json.data.customer);
                setUser(u);
                localStorage.setItem(USER_KEY, JSON.stringify(u));
                // SECURITY: No token stored — access token is in HttpOnly cookie
                sessionStorage.setItem('justSignedIn', String(Date.now()));
                pushUserId(u.id);
                notifyListeners('login', u);
                return {
                    success: true,
                    is_new_user: json.data.is_new_user,
                    account_linked: json.data.account_linked,
                };
            }
            return { success: false, error: json.message || 'Social login failed' };
        } catch (err) {
            console.error('[Auth] Social login error:', err);
            return { success: false, error: 'Social login failed. Please try again.' };
        }
    }, [notifyListeners]);


    return (
        <AuthContext.Provider value={{
            user, isAuthenticated: !!user, isLoading,
            login, register, loginFromVerification, socialLogin, logout, updateUser, onAuthChange,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
