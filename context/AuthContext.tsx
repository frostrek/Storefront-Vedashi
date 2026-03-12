'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { authFetch } from '@/lib/api';

interface AuthContextType {
    user: UserInfo | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string; code?: string; role?: string; access_token?: string }>;
    register: (name: string, email: string, password: string) => Promise<RegisterResponse>;
    /** Log in the user directly from verification data (after OTP verified and account created) */
    loginFromVerification: (customerData: Record<string, unknown>, accessToken: string) => void;
    socialLogin: (clerkToken: string) => Promise<{ success: boolean; error?: string; is_new_user?: boolean; account_linked?: boolean; pending_verification?: boolean; customer_id?: string; email?: string; full_name?: string }>;
    logout: () => void;
    verifyUserAge: (dateOfBirth: string) => Promise<{ success: boolean; error?: string }>;
    /** Register callbacks that run after login/logout so Cart + Wishlist can react */
    onAuthChange: (cb: AuthChangeCallback) => () => void;
}

type AuthChangeCallback = (event: 'login' | 'logout', user: UserInfo | null) => void;

interface RegisterResponse {
    success: boolean;
    email?: string;
    requires_verification?: boolean;
    error?: string;
}

interface UserInfo {
    id: string;
    name: string;
    email: string;
    role?: string;
    avatar_url?: string;
    auth_method?: string;
    is_age_verified?: boolean;
    is_email_verified?: boolean;
    is_mobile_verified?: boolean;
    phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const USER_KEY = 'vedashi_user';
const TOKEN_KEY = 'vedashi_token';

/** Map backend customer shape → frontend UserInfo */
function toUserInfo(customer: Record<string, unknown>): UserInfo {
    return {
        id: (customer.customer_id ?? customer.id ?? '') as string,
        name: (customer.full_name ?? customer.name ?? '') as string,
        email: (customer.email ?? '') as string,
        role: (customer.role as string) || 'customer',
        avatar_url: (customer.avatar_url as string) || undefined,
        auth_method: (customer.auth_method as string) || undefined,
        is_age_verified: !!(customer.is_age_verified),
        is_email_verified: !!(customer.is_email_verified),
        is_mobile_verified: !!(customer.is_mobile_verified),
        phone: (customer.phone ?? customer.mobile_phone ?? '') as string,
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

    // On mount: try to restore session from localStorage cache
    useEffect(() => {
        if (typeof window === 'undefined') {
            setIsLoading(false);
            return;
        }

        const stored = localStorage.getItem(USER_KEY);
        const storedToken = localStorage.getItem(TOKEN_KEY);

        if (stored && storedToken) {
            try {
                const cachedUser: UserInfo = JSON.parse(stored);
                setUser(cachedUser);
                // Notify listeners (Cart/Wishlist) about restored session
                // Use setTimeout to ensure listeners are registered first
                setTimeout(() => notifyListeners('login', cachedUser), 0);
            } catch {
                localStorage.removeItem(USER_KEY);
                localStorage.removeItem(TOKEN_KEY);
            }
        } else if (stored && !storedToken) {
            // Force logout if token is missing (old session before token fix)
            localStorage.removeItem(USER_KEY);
        }
        setIsLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        try {
            const res = await authFetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            });
            const json = await res.json();
            if (res.ok && json.success && json.data?.customer) {
                const u = toUserInfo(json.data.customer);
                setUser(u);
                localStorage.setItem(USER_KEY, JSON.stringify(u));
                if (json.data.access_token) {
                    localStorage.setItem(TOKEN_KEY, json.data.access_token);
                }
                notifyListeners('login', u);
                return { success: true, role: u.role, access_token: json.data.access_token };
            }
            if (json.message) return { success: false, error: json.message, code: json.code };
        } catch (err) {
            console.error('[Auth] Login error:', err);
        }

        return { success: false, error: 'Login failed. Please check your credentials.' };
    }, [notifyListeners]);

    const register = useCallback(async (
        name: string,
        email: string,
        password: string
    ): Promise<RegisterResponse> => {
        try {
            const res = await authFetch(`${API_URL}/api/auth/initiate-registration`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ full_name: name, email, password }),
            });
            const json = await res.json();
            if (res.ok && json.success) {
                return {
                    success: true,
                    email: json.data?.email || email,
                    requires_verification: true,
                };
            }
            if (json.message) return { success: false, error: json.message };
        } catch (err) {
            console.error('[Auth] Register error:', err);
        }

        return { success: false, error: 'Registration failed. Please try again.' };
    }, []);

    /** Log in the user from verification page data (after OTP created the account) */
    const loginFromVerification = useCallback((customerData: Record<string, unknown>, accessToken: string) => {
        const u = toUserInfo(customerData);
        setUser(u);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
        localStorage.setItem(TOKEN_KEY, accessToken);
        notifyListeners('login', u);
    }, [notifyListeners]);

    const logout = useCallback(() => {
        authFetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => { });
        setUser(null);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
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

            // Returning user → JWT issued immediately
            if (res.ok && json.success && json.data?.customer) {
                const u = toUserInfo(json.data.customer);
                setUser(u);
                localStorage.setItem(USER_KEY, JSON.stringify(u));
                if (json.data.access_token) {
                    localStorage.setItem(TOKEN_KEY, json.data.access_token);
                }
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

    const verifyUserAge = useCallback(async (dateOfBirth: string) => {
        if (!user?.id) return { success: false, error: "User not logged in" };
        try {
            const res = await authFetch(`${API_URL}/api/customers/${user.id}/verify-age`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date_of_birth: dateOfBirth }),
            });
            const json = await res.json();
            if (res.ok && json.success) {
                const updatedUser = { ...user, is_age_verified: true };
                setUser(updatedUser);
                localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
                return { success: true };
            }
            return { success: false, error: json.message || "Verification failed" };
        } catch {
            return { success: false, error: "Network error during verification" };
        }
    }, [user]);

    return (
        <AuthContext.Provider value={{
            user, isAuthenticated: !!user, isLoading,
            login, register, loginFromVerification, socialLogin, logout, verifyUserAge, onAuthChange,
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
