'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { authFetch, API_URL } from '@/lib/api';

interface AuthContextType {
    user: UserInfo | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string, rememberMe?: boolean, turnstileToken?: string) => Promise<{ success: boolean; error?: string; code?: string; role?: string; access_token?: string }>;
    register: (name: string, email: string, password: string, turnstileToken?: string) => Promise<RegisterResponse>;
    /** Log-in the user directly from verification data (after OTP verified and accounts created) */
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

    /** Subscribe to auth events — returns unsubscribe function */
    const onAuthChange = useCallback((cb: AuthChangeCallback) => {
        listenersRef.current.add(cb);
        return () => { listenersRef.current.delete(cb); };
    }, []);

    const notifyListeners = useCallback((event: 'login' | 'logout', u: UserInfo | null) => {
        listenersRef.current.forEach(cb => cb(event, u));
    }, []);

    // ── Listen for session-expired event (from authFetch interceptor) ──
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handler = () => {
            setUser(null);
            localStorage.removeItem(USER_KEY);
            sessionStorage.removeItem('justSignedIn');
            sessionStorage.removeItem('social_otp_data');
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
                // Notify listeners (Cart/Wishlist) about restored session
                setTimeout(() => notifyListeners('login', cachedUser), 0);

                // Validate session with server via HttpOnly cookie
                authFetch(`${API_URL}/api/auth/me`)
                    .then(res => res.json())
                    .then(json => {
                        if (json.success && json.data) {
                            const updatedUser = toUserInfo(json.data);
                            setUser(updatedUser);
                            localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
                        } else {
                            // Cookie expired or invalid — clear cached user
                            setUser(null);
                            localStorage.removeItem(USER_KEY);
                            notifyListeners('logout', null);
                        }
                    }).catch(() => {
                        // Network error — keep cached user for offline resilience
                    });
            } catch {
                localStorage.removeItem(USER_KEY);
            }
        }
        setIsLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const login = useCallback(async (email: string, password: string, rememberMe: boolean = true, turnstileToken?: string | null) => {
        try {
            const body: Record<string, any> = { email, password, remember_me: rememberMe };
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
                setUser(u);
                localStorage.setItem(USER_KEY, JSON.stringify(u));
                // SECURITY: No token stored — access token is in HttpOnly cookie
                sessionStorage.setItem('justSignedIn', String(Date.now()));
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
        notifyListeners('login', u);
    }, [notifyListeners]);

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
        notifyListeners('logout', null);
    }, [notifyListeners]);

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
