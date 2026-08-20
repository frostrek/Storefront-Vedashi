'use client';

import { createPortal } from 'react-dom';

import { RU_DICTIONARY } from '@/content/ru';
import { ROUTES, ACCOUNT_TABS } from '@/lib/routes';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/ProductCard';
import {
    getMyOrders, getAddresses, addAddress as apiAddAddress,
    updateAddress as apiUpdateAddress, deleteAddress as apiDeleteAddress,
    getCustomerProfile, updateCustomerProfile, deactivateAccount,
    uploadProfileImage, getProfileImage, removeProfileImage, getOrderById,
    cancelOrder as apiCancelOrder, downloadInvoice, requestReturn as apiRequestReturn,
    cancelReturn as apiCancelReturn,
    getMyEnquiries, replyToEnquiry, changePassword,
    requestEmailChange, verifyEmailChangeProfile,
    requestPhoneChange, verifyPhoneChangeProfile,
    getLoyaltyWallet, getMyNotifications, getUnreadNotificationCount,
    markNotificationAsRead, markAllNotificationsAsRead, deleteNotification,
    lookupPostalCode, getMySupportTickets, replySupportTicket,
    getMyReviews, trackOrder
} from '@/lib/api';
import { trackRefund, EcommerceItem } from '@/lib/analytics/gtag';
import { Order, Address } from '@/types';
import { COUNTRIES } from '@/lib/countries';
import { formatLocal } from '@/lib/currency';
import Select from 'react-select';
import {
    Package, MapPin, Heart, User, Plus, Pencil, Trash2,
    Loader2, ShieldOff, Camera, X, Check, Star, Phone, Calendar, Mail,
    CheckCircle2, AlertCircle, Shield, FileText, MessageSquare, Send, Clock, User2, MessageCircle, Sparkles,
    ChevronRight,
    BadgeCheck, BellRing, Download, Search, ShoppingCart, LayoutGrid, List, Wallet, Eye, EyeOff, PackageMinus, Truck
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';
import PrivacyDashboard from '@/components/account/PrivacyDashboard';
import ReviewForm from '@/components/reviews/ReviewForm';
import NotificationPreferences from '@/components/account/NotificationPreferences';
import ExportOrdersModal from '@/components/account/ExportOrdersModal';
import MyWallet from '@/components/account/MyWallet';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { COUNTRY_CODES } from '@/lib/country-codes';
import { getAddressConfig, getDefaultCountry } from '@/lib/addressConfig';
import { useCurrency } from '@/context/CurrencyContext';

type Tab = 'overview' | 'orders' | 'wishlist' | 'addresses' | 'profile' | 'privacy' | 'support' | 'wallet' | 'notifications';

const VALID_TABS: Tab[] = ['overview', 'orders', 'wishlist', 'addresses', 'profile', 'privacy', 'support', 'wallet', 'notifications'];

export default function AccountPage() {
    const { formatPrice, format } = useCurrency();
    const router = useRouter();
    const params = useParams<{ country: string, tab?: string[] }>();
    const searchParams = useSearchParams();
    const urlOrderId = searchParams.get('orderId');
    const country = params?.country || 'ru';
    const { user, isAuthenticated, isLoading, logout, updateUser } = useAuth();
    const { items: wishlistItems, removeItem: removeWishlistItem, loading: wishlistLoading } = useWishlist();
    const { addItem: addCartItem, items: cartItems, getItemInCart, loading: cartLoading } = useCart();

    // Wishlist state

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const [confirmingIndividualRemove, setConfirmingIndividualRemove] = useState<string | null>(null);

    // Derive active tab from URL path segment, default to 'overview'
    const activeTab: Tab = useMemo(() => {
        const slug = params?.tab?.[0] as Tab | undefined;
        return slug && VALID_TABS.includes(slug) ? slug : 'overview';
    }, [params?.tab]);



    // Orders state
    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null);
    const [isOrderLoading, setIsOrderLoading] = useState(false);
    const [isTrackOrderModalOpen, setIsTrackOrderModalOpen] = useState(false);
    const [trackOrderId, setTrackOrderId] = useState<string | null>(null);
    const [trackingData, setTrackingData] = useState<any | null>(null);
    const [isTrackingLoading, setIsTrackingLoading] = useState(false);
    const [trackOrderStatus, setTrackOrderStatus] = useState<string | null>(null);
    const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
    const [buyAgainLoading, setBuyAgainLoading] = useState(false);
    const [reorderingOrderId, setReorderingOrderId] = useState<string | null>(null);

    // Orders Filtering State
    const [orderSearch, setOrderSearch] = useState('');
    const [orderStatusFilter, setOrderStatusFilter] = useState('All');
    const [orderSort, setOrderSort] = useState('newest');

    // Addresses state
    const defaultCountryCode = getDefaultCountry();
    const defaultCountryName = COUNTRIES.find(c => c.code === defaultCountryCode)?.name || '';

    const formatAddressPhone = (phone: string) => {
        if (!phone) return '';
        // Find the matching dial code from our master list
        // Sort by length descending to ensure we match the most specific code (e.g., +91 over +9)
        const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.dial_code.length - a.dial_code.length);
        const match = sortedCodes.find(c => phone.startsWith(c.dial_code));

        if (match) {
            const dialCode = match.dial_code;
            const rest = phone.slice(dialCode.length);
            return `${dialCode} ${rest}`;
        }

        // Fallback for unexpected formats
        return phone.startsWith('+') ? phone.replace(/^(\+\d{1,3})/, '$1 ') : phone;
    };

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [addressesLoading, setAddressesLoading] = useState(false);
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [addressForm, setAddressForm] = useState({
        address_line1: '', address_line2: '', city: '', state: '', pincode: '',
        country: defaultCountryName, country_code: defaultCountryCode, phone: '', label: '', is_default: false, full_name: '',
    });

    const addressConfig = getAddressConfig(addressForm.country_code || 'RU');
    const addressDialCode = useMemo(() => {
        const match = Array.isArray(COUNTRY_CODES) ? COUNTRY_CODES.find(c => c.code === addressForm.country_code) : null;
        const fallbackMatch = COUNTRY_CODES.find(c => c.code === defaultCountryCode);
        return match ? match.dial_code : (fallbackMatch?.dial_code || '+1');
    }, [addressForm.country_code, defaultCountryCode]);

    const [isLookupLoading, setIsLookupLoading] = useState(false);
    const [manualEdits, setManualEdits] = useState({
        city: false,
        state: false
    });

    const countryOptions = COUNTRIES.map(c => ({
        value: c.code,
        label: `${c.flag} ${c.name}`,
        name: c.name
    }));

    const customSelectStyles = {
        control: (provided: any, state: any) => ({
            ...provided,
            borderRadius: '12px',
            borderColor: state.isFocused ? '#91c934' : '#e5e7eb',
            boxShadow: 'none',
            '&:hover': {
                borderColor: '#91c934',
            },
            backgroundColor: 'white',
            paddingLeft: '34px',
            minHeight: '44px',
            fontSize: '14px',
        }),
        option: (provided: any, state: any) => ({
            ...provided,
            backgroundColor: state.isSelected ? '#91c934' : state.isFocused ? '#f3f4f6' : 'white',
            color: state.isSelected ? 'white' : '#111827',
            '&:active': {
                backgroundColor: '#91c934',
            },
            fontSize: '14px',
        }),
        menuList: (provided: any) => ({
            ...provided,
            "::-webkit-scrollbar": {
                width: "6px"
            },
            "::-webkit-scrollbar-track": {
                background: "transparent"
            },
            "::-webkit-scrollbar-thumb": {
                background: "#d1d5db",
                borderRadius: "3px"
            },
            "::-webkit-scrollbar-thumb:hover": {
                background: "#91c934"
            }
        }),
    };

    // Global Postal Code Auto-Fill
    useEffect(() => {
        if (addressForm.pincode.length >= 4 && showAddressForm) {
            const timer = setTimeout(async () => {
                setIsLookupLoading(true);
                const res = await lookupPostalCode(addressForm.pincode, addressForm.country_code);
                if (res.success && res.city && res.state) {
                    setAddressForm(prev => ({
                        ...prev,
                        city: manualEdits.city ? prev.city : (res.city || prev.city),
                        state: manualEdits.state ? prev.state : (res.state || prev.state),
                        country: res.country || prev.country
                    }));
                }
                setIsLookupLoading(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [addressForm.pincode, addressForm.country_code, showAddressForm, manualEdits.city, manualEdits.state]);

    // Profile state
    const [orderCount, setOrderCount] = useState(0);
    const [profileEditing, setProfileEditing] = useState(false);
    const [profileSaving, setProfileSaving] = useState(false);
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [profileData, setProfileData] = useState({
        full_name: '', email: '', phone: '', date_of_birth: '',
        is_email_verified: false, is_mobile_verified: false, has_password: false,
        created_at: '',
    });
    const [originalEmail, setOriginalEmail] = useState('');
    const [originalPhone, setOriginalPhone] = useState('');
    const defaultDialCode = useMemo(() => {
        const match = COUNTRY_CODES.find(c => c.code === defaultCountryCode);
        return match ? match.dial_code : '+1';
    }, [defaultCountryCode]);
    const [selectedCountryCode, setSelectedCountryCode] = useState(defaultDialCode);

    // Email OTP modal state
    const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);
    const [emailOtpCode, setEmailOtpCode] = useState('');
    const [emailOtpSubmitting, setEmailOtpSubmitting] = useState(false);
    const [emailOtpResendTimer, setEmailOtpResendTimer] = useState(0);

    // Phone OTP modal state
    const [showPhoneOtpModal, setShowPhoneOtpModal] = useState(false);
    const [phoneOtpCode, setPhoneOtpCode] = useState('');
    const [phoneOtpSubmitting, setPhoneOtpSubmitting] = useState(false);
    const [phoneOtpResendTimer, setPhoneOtpResendTimer] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (showEmailOtpModal && emailOtpResendTimer > 0) {
            interval = setInterval(() => {
                setEmailOtpResendTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [showEmailOtpModal, emailOtpResendTimer]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (showPhoneOtpModal && phoneOtpResendTimer > 0) {
            interval = setInterval(() => {
                setPhoneOtpResendTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [showPhoneOtpModal, phoneOtpResendTimer]);

    // Profile image state
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
    const [base64Fallback, setBase64Fallback] = useState<string | null>(null);
    const [imageUploading, setImageUploading] = useState(false);
    const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync social avatar if no custom image is loaded yet
    useEffect(() => {
        if (user?.avatar_url) {
            setProfileImageUrl((prev) => prev || user.avatar_url!);
        }
    }, [user?.avatar_url]);

    // Deactivation state
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [deactivatePassword, setDeactivatePassword] = useState('');
    const [deactivating, setDeactivating] = useState(false);

    // Delete address confirmation
    const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);

    // Cancel order state
    const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelSubmitting, setCancelSubmitting] = useState(false);

    // Return order state
    const [returningOrderId, setReturningOrderId] = useState<string | null>(null);
    const [returnReason, setReturnReason] = useState('');
    const [returnDetails, setReturnDetails] = useState('');
    const [returnSubmitting, setReturnSubmitting] = useState(false);

    const handleCancelOrder = async (orderId: string) => {
        setCancelSubmitting(true);
        try {
            const res = await apiCancelOrder(orderId);
            if (res.success || res.order) {
                // GA4: Frontend refund tracking
                const canceledOrder = orders.find((o: any) => o.order_id === orderId) || selectedOrderDetails;
                if (canceledOrder) {
                    const refundItems: EcommerceItem[] = (canceledOrder.items || []).map((item: any, i: number) => ({
                        item_id: item.product?.product_id || item.product_id || '',
                        item_name: item.product?.product_name || item.product_name || 'Product',
                        price: Number(item.unit_price ?? item.price ?? 0),
                        quantity: Number(item.quantity || 1),
                        index: i + 1
                    }));

                    trackRefund({
                        currency: canceledOrder.currency || 'RUB',
                        value: Number(canceledOrder.final_total || canceledOrder.total_amount || 0),
                        transaction_id: orderId,
                        items: refundItems,
                    });
                }

                toast.success(RU_DICTIONARY.ordersTab.toast.orderCancelledSuccess);
                setCancellingOrderId(null);
                setCancelReason('');
                fetchOrders(); // refresh the list
                if (selectedOrderDetails?.order_id === orderId) {
                    handleViewOrderDetails(orderId); // refresh details
                }
            } else {
                toast.error(res.message || RU_DICTIONARY.ordersTab.toast.failedToCancel);
            }
        } catch {
            toast.error(RU_DICTIONARY.ordersTab.toast.cancelError);
        } finally {
            setCancelSubmitting(false);
        }
    };

    const handleRequestReturn = async (orderId: string) => {
        setReturnSubmitting(true);
        try {
            const reasonWithDetails = returnDetails ? `${returnReason} - ${returnDetails}` : returnReason;
            const res = await apiRequestReturn(orderId, reasonWithDetails);
            if (res.success || res.return_id) {
                toast.success(RU_DICTIONARY.ordersTab.toast?.returnSubmitted || "Запрос на возврат успешно отправлен!");
                setReturningOrderId(null);
                setReturnReason('');
                setReturnDetails('');
                fetchOrders(); // refresh the list
                if (selectedOrderDetails?.order_id === orderId) {
                    handleViewOrderDetails(orderId); // refresh details
                }
            } else {
                toast.error(res.message || RU_DICTIONARY.ordersTab.toast?.returnFailed || "Не удалось отправить запрос на возврат.");
            }
        } catch {
            toast.error(RU_DICTIONARY.ordersTab.toast?.returnError || "Произошла ошибка при отправке запроса.");
        } finally {
            setReturnSubmitting(false);
        }
    };

    const handleCancelReturn = async (orderId: string) => {
        if (!confirm((RU_DICTIONARY.ordersTab as any)?.cancelReturnConfirm || "Вы уверены, что хотите отменить запрос на возврат?")) return;
        try {
            const res = await apiCancelReturn(orderId);
            if (res.success || res.data?.status === 'CANCELLED') {
                toast.success((RU_DICTIONARY.ordersTab?.toast as any)?.returnCancelled || "Запрос на возврат отменён.");
                fetchOrders();
                if (selectedOrderDetails?.order_id === orderId) {
                    handleViewOrderDetails(orderId);
                }
            } else {
                toast.error(res.message || (RU_DICTIONARY.ordersTab?.toast as any)?.cancelReturnFailed || "Не удалось отменить запрос на возврат.");
            }
        } catch {
            toast.error((RU_DICTIONARY.ordersTab?.toast as any)?.cancelReturnError || "Произошла ошибка при отмене запроса.");
        }
    };

    // Review modal state
    const [reviewModal, setReviewModal] = useState<{ orderId: string; productId: string; productName: string } | null>(null);

    // Notification preferences state
    const [showNotificationOverlay, setShowNotificationOverlay] = useState(false);

    // Support Enquiries state
    const [enquiries, setEnquiries] = useState<any[]>([]);
    const [enquiriesLoading, setEnquiriesLoading] = useState(false);
    const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null);
    const [enquiryReplyText, setEnquiryReplyText] = useState('');
    const [isSendingEnquiryReply, setIsSendingEnquiryReply] = useState(false);

    // Export orders modal state
    const [showExportModal, setShowExportModal] = useState(false);

    // Password change state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [passwordChanging, setPasswordChanging] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Body scroll lock for all modals
    useEffect(() => {
        const isAnyModalOpen = isTrackOrderModalOpen || showDeactivateModal || deletingAddressId ||
            cancellingOrderId || returningOrderId || reviewModal || showNotificationOverlay ||
            showExportModal || showPasswordModal || showEmailOtpModal ||
            showNotificationModal || isZoomModalOpen || showPhoneOtpModal;

        if (isAnyModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isTrackOrderModalOpen, showDeactivateModal, deletingAddressId, cancellingOrderId, returningOrderId,
        reviewModal, showNotificationOverlay, showExportModal, showPasswordModal,
        showEmailOtpModal, showNotificationModal, isZoomModalOpen, showPhoneOtpModal]);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    // ── Derive Filtered & Sorted Orders ────────────────────────────
    const filteredAndSortedOrders = useMemo(() => {
        let result = [...orders];

        // Filter by Status
        if (orderStatusFilter !== 'All') {
            result = result.filter(o => o.order_status?.toUpperCase() === orderStatusFilter.toUpperCase());
        }

        // Filter by Search (Order ID or Product Name)
        if (orderSearch.trim()) {
            const query = orderSearch.toLowerCase();
            result = result.filter(o => {
                const orderIdMatch = o.order_id.toLowerCase().includes(query);
                const itemsMatch = o.items?.some((item: any) => {
                    const name = item.product?.product_name || item.product_name || '';
                    return name.toLowerCase().includes(query);
                });
                const firstItemMatch = o.first_item?.product_name?.toLowerCase().includes(query);
                return orderIdMatch || itemsMatch || firstItemMatch;
            });
        }

        // Sort
        result.sort((a, b) => {
            if (orderSort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            if (orderSort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            if (orderSort === 'highest') {
                const valA = parseFloat(String(a.final_total || a.total_amount || 0));
                const valB = parseFloat(String(b.final_total || b.total_amount || 0));
                return valB - valA;
            }
            if (orderSort === 'lowest') {
                const valA = parseFloat(String(a.final_total || a.total_amount || 0));
                const valB = parseFloat(String(b.final_total || b.total_amount || 0));
                return valA - valB;
            }
            return 0;
        });

        return result;
    }, [orders, orderStatusFilter, orderSearch, orderSort]);



    // ── Fetch orders ─────────────────────────────────────────────────
    const fetchOrders = useCallback(async () => {
        if (!user?.id) return;
        setOrdersLoading(true);
        try {
            const res = await getMyOrders(user.id);
            if (res.success) {
                const ordersArray = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.orders) ? res.data.orders : [];
                setOrders(ordersArray);
                setOrderCount(ordersArray.length);
            }
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        } finally {
            setOrdersLoading(false);
        }
    }, [user?.id]);

    // ── Fetch addresses ──────────────────────────────────────────────
    const fetchAddresses = useCallback(async () => {
        if (!user?.id) return;
        setAddressesLoading(true);
        try {
            const res = await getAddresses(user.id);
            if (res.success && Array.isArray(res.data)) {
                setAddresses(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch addresses:', err);
        } finally {
            setAddressesLoading(false);
        }
    }, [user?.id]);

    // ── Fetch profile ────────────────────────────────────────────────
    const fetchProfile = useCallback(async () => {
        if (!user?.id) return;
        try {
            const res = await getCustomerProfile(user.id);
            if (res.success && res.data) {
                const fetchedEmail = res.data.email || '';

                // Important fix: handle truthy values explicitly or just rely on backend boolean.
                // Assuming res.data.has_password is a boolean or 1/0
                const hasPassword = Boolean(res.data.has_password);

                const phone = res.data.phone || '';
                let countryCode = defaultDialCode;
                let localNumber = phone;

                if (phone.startsWith('+')) {
                    // Try to match against our list
                    const match = COUNTRY_CODES.find(c => phone.startsWith(c.dial_code));
                    if (match) {
                        countryCode = match.dial_code;
                        localNumber = phone.slice(match.dial_code.length).trim();
                    } else {
                        // Fallback: split at first space if possible, or just take first few digits
                        const parts = phone.split(' ');
                        if (parts.length > 1) {
                            countryCode = parts[0];
                            localNumber = parts.slice(1).join(' ');
                        }
                    }
                }

                setProfileData({
                    full_name: res.data.full_name || '',
                    email: fetchedEmail,
                    phone: localNumber,
                    is_email_verified: !!res.data.is_email_verified,
                    is_mobile_verified: !!res.data.is_mobile_verified,
                    has_password: hasPassword,
                    created_at: res.data.created_at || '',
                    date_of_birth: res.data.date_of_birth ? res.data.date_of_birth.split('T')[0] : '',
                });
                setSelectedCountryCode(countryCode);
                setOriginalEmail(fetchedEmail);
                setOriginalPhone(res.data.phone || '');
            } else if (res.message) {
                toast.error(res.message);
            }
        } catch (err: any) {
            console.error('Failed to fetch profile:', err);
            toast.error('Failed to load profile data');
        }
    }, [user?.id]);

    // ── Fetch profile image ──────────────────────────────────────────
    const fetchProfileImage = useCallback(async () => {
        if (!user?.id) return;
        try {
            const res = await getProfileImage(user.id);
            if (res.success && res.data) {
                const { profile_image: base64Data, avatar_url: s3Url, mime_type: mimeType } = res.data;

                let parsedBase64 = base64Data;
                if (base64Data && !base64Data.startsWith('data:')) {
                    const mime = mimeType || 'image/jpeg';
                    parsedBase64 = `data:${mime};base64,${base64Data}`;
                }

                setBase64Fallback(parsedBase64);
                // Priority: S3 URL > Base64
                setProfileImageUrl(s3Url || parsedBase64);

                // Keep global AuthContext user state synced ONLY if it's a valid remote URL, NOT a massive base64 string
                const finalUrl = s3Url || parsedBase64;
                if (finalUrl && finalUrl.startsWith('http') && user?.avatar_url !== finalUrl) {
                    updateUser({ avatar_url: finalUrl });
                }
            } else if (user?.avatar_url) {
                setProfileImageUrl(user.avatar_url);
            }
        } catch {
            // No image or error, stay with fallback
            if (user?.avatar_url) {
                setProfileImageUrl(user.avatar_url);
            }
        }
    }, [user?.id, user?.avatar_url, updateUser]);

    // ── Fetch enquiries + support tickets ─────────────────────────────
    const fetchEnquiries = useCallback(async () => {
        setEnquiriesLoading(true);
        try {
            const [enquiryData, ticketData] = await Promise.all([
                getMyEnquiries(),
                getMySupportTickets()
            ]);
            // Normalize support tickets to look like enquiries for unified display
            const normalizedTickets = (ticketData || []).map((t: any) => ({
                feedback_id: t.ticket_id,
                subject: t.subject || 'Support Ticket',
                message: t.description || t.subject || '',
                status: t.status || 'open',
                created_at: t.created_at,
                updated_at: t.updated_at,
                replies: [],
                _source: 'ticket' as const,
                _ticket_id: t.ticket_id,
                _ticket_number: t.ticket_number,
                _category: t.category,
                _priority: t.priority,
                _message_count: parseInt(t.message_count || '0'),
                _order_id: t.order_id,
            }));
            // Merge both lists and sort by most recent
            const merged = [...(enquiryData || []), ...normalizedTickets];
            merged.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
            setEnquiries(merged);
        } catch (err) {
            console.error('Failed to fetch enquiries:', err);
        } finally {
            setEnquiriesLoading(false);
        }
    }, []);

    // Effect to sync selected enquiry with fresh data from enquiries list
    useEffect(() => {
        if (selectedEnquiry && enquiries.length > 0) {
            const updated = enquiries.find((e: any) => e.feedback_id === selectedEnquiry.feedback_id);
            if (updated && (updated.status !== selectedEnquiry.status || updated.replies?.length !== selectedEnquiry.replies?.length)) {
                setSelectedEnquiry(updated);
            }
        }
    }, [enquiries, selectedEnquiry?.feedback_id, selectedEnquiry?.status, selectedEnquiry?.replies?.length]);

    const handleSendEnquiryReply = async () => {
        if (!selectedEnquiry || !enquiryReplyText.trim()) return;

        setIsSendingEnquiryReply(true);
        const loadingToast = toast.loading(RU_DICTIONARY.supportTab.toast.sendingMessage);

        try {
            let res;
            if (selectedEnquiry._source === 'ticket') {
                // Support ticket reply
                res = await replySupportTicket(selectedEnquiry._ticket_id, enquiryReplyText);
            } else {
                // Customer enquiry reply
                res = await replyToEnquiry(selectedEnquiry.feedback_id, enquiryReplyText);
            }
            if (res.success) {
                toast.success(RU_DICTIONARY.supportTab.toast.messageSent, { id: loadingToast });
                setEnquiryReplyText('');
                // Re-fetch all data
                await fetchEnquiries();
            } else {
                toast.error(res.message || RU_DICTIONARY.supportTab.toast.failedToSend, { id: loadingToast });
            }
        } catch (error) {
            toast.error(RU_DICTIONARY.supportTab.toast.networkError, { id: loadingToast });
        } finally {
            setIsSendingEnquiryReply(false);
        }
    };

    /** Unified handler for reordering an entire order or specific items */
    const handleReorder = async (orderId: string, itemsToAdd?: any[]) => {
        setReorderingOrderId(orderId);
        setBuyAgainLoading(true);
        let items = itemsToAdd;

        try {
            if (!items) {
                // Fetch the order full details if we don't have items
                const response = await getOrderById(orderId);
                if (response?.data?.items) {
                    items = response.data.items;
                } else {
                    toast.error(RU_DICTIONARY.ordersTab.toast.couldNotFetchOrder);
                    return;
                }
            }

            if (items?.length === 0) {
                toast.error(RU_DICTIONARY.ordersTab.toast.noItemsFound);
                return;
            }

            const toastId = toast.loading(RU_DICTIONARY.ordersTab.toast.checkingCartStock);
            let addedCount = 0;
            let limitCount = 0;
            let alreadyInCartCount = 0;

            for (const item of items!) {
                const productId = item.product_id || item.product?.product_id;
                const variantId = item.variant_id || item.variant?.variant_id || null;
                if (!productId) continue;

                const existingItem = getItemInCart(productId, variantId);
                const currentQtyInCart = existingItem?.quantity || 0;

                // Get stock quantity (fallback to product stock if variant stock is null)
                const stockQty = item.variant?.stock_quantity ?? item.product?.stock_quantity ?? null;
                const requestedQty = item.quantity || 1;

                const availableSpace = stockQty !== null ? Math.max(0, stockQty - currentQtyInCart) : Infinity;

                if (availableSpace === 0) {
                    if (stockQty !== null && currentQtyInCart >= stockQty) {
                        alreadyInCartCount++;
                    } else {
                        limitCount++;
                    }
                    continue;
                }

                const qtyToAdd = Math.min(requestedQty, availableSpace);
                if (qtyToAdd < requestedQty) {
                    limitCount++;
                }

                try {
                    await addCartItem(productId, variantId, qtyToAdd);
                    addedCount++;
                } catch (err) {
                    console.error("Failed adding item to cart", err);
                }
            }

            if (addedCount === 0 && alreadyInCartCount > 0) {
                toast.error(RU_DICTIONARY.ordersTab.toast.allItemsInCart, { id: toastId });
            } else if (addedCount === 0 && limitCount > 0) {
                toast.error(RU_DICTIONARY.ordersTab.toast.allOutOfStock, { id: toastId });
            } else if (addedCount > 0 && limitCount > 0) {
                toast.success(`${RU_DICTIONARY.ordersTab.toast.addedPrefix} ${addedCount} ${RU_DICTIONARY.ordersTab.toast.addedItemsLimited}`, { id: toastId });
            } else if (addedCount > 0) {
                toast.success(RU_DICTIONARY.ordersTab.toast.itemsAddedSuccess, { id: toastId });
            } else {
                toast.error(RU_DICTIONARY.ordersTab.toast.couldNotAddItems, { id: toastId });
            }
        } catch (error) {
            console.error("Reorder failed", error);
            toast.error(RU_DICTIONARY.ordersTab.toast.reorderError);
        } finally {
            setReorderingOrderId(null);
            setBuyAgainLoading(false);
        }
    };

    // Notifications state
    const [notifications, setNotifications] = useState<any[]>([]);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotificationsData = useCallback(async () => {
        setNotificationsLoading(true);
        try {
            const [notifs, unread] = await Promise.all([
                getMyNotifications(),
                getUnreadNotificationCount()
            ]);
            if (notifs) setNotifications(notifs);
            if (unread !== undefined) setUnreadCount(unread);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setNotificationsLoading(false);
        }
    }, []);

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsAsRead();
            toast.success(RU_DICTIONARY.notificationsTab.toast.allMarkedRead);
            fetchNotificationsData();
            // Sync with navbar
            window.dispatchEvent(new CustomEvent('notifications-updated'));
        } catch (err) { toast.error(RU_DICTIONARY.notificationsTab.toast.failedUpdate); }
    };

    const handleDeleteNotification = async (id: string) => {
        try {
            await deleteNotification(id);
            toast.success(RU_DICTIONARY.notificationsTab.toast.removed);
            fetchNotificationsData();
            // Sync with navbar
            window.dispatchEvent(new CustomEvent('notifications-updated'));
        } catch (err) { toast.error(RU_DICTIONARY.notificationsTab.toast.failedDelete); }
    };

    // Loyalty state
    const [loyaltyData, setLoyaltyData] = useState<any>(null);
    const [reviewsCount, setReviewsCount] = useState(0);

    const fetchLoyaltyData = useCallback(async () => {
        try {
            const data = await getLoyaltyWallet();
            if (data) setLoyaltyData(data);
        } catch (err) {
            console.error('Failed to fetch loyalty data:', err);
        }
    }, []);

    const fetchReviewsCount = useCallback(async () => {
        try {
            const data = await getMyReviews();
            if (data && Array.isArray(data)) {
                setReviewsCount(data.length);
            }
        } catch (err) {
            console.error('Failed to fetch reviews count:', err);
        }
    }, []);


    useEffect(() => {
        setCurrentPage(1);
        if (!user?.id) return;

        // Always fetch profile details and image for the sidebar and header
        fetchProfile();
        fetchProfileImage();

        // Always fetch notifications for badge count
        fetchNotificationsData();

        // Tab-specific fetching
        if (activeTab === 'wallet' || activeTab === 'overview' || activeTab === 'profile') fetchLoyaltyData();
        if (activeTab === 'orders') fetchOrders();
        if (activeTab === 'addresses') fetchAddresses();
        if (activeTab === 'support') fetchEnquiries();
        if (activeTab === 'profile' || activeTab === 'overview') {
            fetchOrders();
            fetchReviewsCount();
        }
    }, [activeTab, user?.id, fetchOrders, fetchAddresses, fetchProfile, fetchProfileImage, fetchEnquiries, fetchLoyaltyData, fetchReviewsCount]);



    useEffect(() => {
        const handleUpdate = () => {
            fetchNotificationsData();
        };
        window.addEventListener('notifications-updated', handleUpdate);
        return () => window.removeEventListener('notifications-updated', handleUpdate);
    }, [fetchNotificationsData]);

    const loyaltyWalletObj = loyaltyData?.wallet || {};
    const loyaltyTierObj = loyaltyData?.tier || {};
    const activeTier = loyaltyTierObj.tier_name || user?.loyalty_tier || 'Bronze';
    const activePoints = loyaltyWalletObj.balance || 0;

    // ── Profile save handler ─────────────────────────────────────────
    const handleProfileSave = async () => {
        if (!user?.id) return;

        // Frontend phone validation (international E.164)
        if (profileData.phone && profileData.phone.trim() !== '') {
            const cleaned = profileData.phone.replace(/[\s\-()]/g, '');
            if (!/^\+?\d+$/.test(cleaned)) {
                toast.error(RU_DICTIONARY.profileTab.toasts.phoneDigits);
                return;
            }
            const digitsOnly = cleaned.replace(/\D/g, '');
            const hasCountryCode = cleaned.startsWith('+');
            const maxDigits = hasCountryCode ? 15 : 12;
            if (digitsOnly.length < 7 || digitsOnly.length > maxDigits) {
                toast.error(RU_DICTIONARY.profileTab.toasts.phoneLength);
                return;
            }
        }

        setProfileSaving(true);
        try {
            // Check if email was changed
            if (profileData.email !== originalEmail) {
                const reqRes = await requestEmailChange(profileData.email);
                if (reqRes.success) {
                    toast.success(reqRes.message || RU_DICTIONARY.profileTab.toasts.emailCodeSent);
                    setShowEmailOtpModal(true);
                    setEmailOtpResendTimer(60);
                    setProfileSaving(false);
                    return; // Return and wait for OTP verification
                } else {
                    toast.error(reqRes.message || RU_DICTIONARY.profileTab.toasts.emailChangeReqFailed);
                    setProfileSaving(false);
                    return;
                }
            }

            const phoneDigitsOnly = profileData.phone ? profileData.phone.replace(/\D/g, '') : '';
            const fullPhone = phoneDigitsOnly ? `${selectedCountryCode}${phoneDigitsOnly}` : null;

            // Check if phone was changed
            if (fullPhone !== originalPhone && fullPhone) {
                try {
                    const reqRes = await requestPhoneChange(fullPhone);
                    if (reqRes.success) {
                        toast.success(RU_DICTIONARY.profileTab.toasts.phoneCodeSent);
                        setShowPhoneOtpModal(true);
                        setPhoneOtpResendTimer(60);
                        setProfileSaving(false);
                        return; // Wait for OTP
                    } else {
                        toast.error(reqRes.message || RU_DICTIONARY.profileTab.toasts.phoneCodeReqFailed);
                        setProfileSaving(false);
                        return;
                    }
                } catch {
                    toast.error(RU_DICTIONARY.profileTab.toasts.phoneVerifyReqFailed);
                    setProfileSaving(false);
                    return;
                }
            }

            // Strip out non-DB fields and fields that need verification (email, phone)
            // Note: email and phone are handled above. If we are here, it means they haven't changed 
            // from original OR they were just verified and fetchProfile was called (which updated originalEmail/originalPhone).
            const { has_password, is_email_verified, is_mobile_verified, email, created_at, phone, ...rest } = profileData;

            const updateData: any = { ...rest };
            // DO NOT update phone or email here; they are managed by separate verification endpoints

            const res = await updateCustomerProfile(user.id, updateData);
            if (res.success) {
                toast.success(RU_DICTIONARY.profileTab.toasts.profileUpdated);
                setProfileEditing(false);
                fetchProfile(); // refresh data
            } else {
                toast.error(res.message || RU_DICTIONARY.profileTab.toasts.profileUpdateFailed);
            }
        } catch {
            toast.error(RU_DICTIONARY.profileTab.toasts.generalServerError);
        } finally {
            setProfileSaving(false);
        }
    };

    const handleResendPhoneOtp = async () => {
        if (phoneOtpResendTimer > 0) return;
        const fullPhone = profileData.phone && profileData.phone.trim() !== '' ? `${selectedCountryCode}${profileData.phone.trim().replace(/\s/g, '')}` : null;
        if (!fullPhone) return;

        try {
            const reqRes = await requestPhoneChange(fullPhone);
            if (reqRes.success) {
                toast.success(RU_DICTIONARY.profileTab.toasts.newCodeSent);
                setPhoneOtpResendTimer(60);
            } else {
                toast.error(reqRes.message || RU_DICTIONARY.profileTab.toasts.resendFailed);
            }
        } catch {
            toast.error(RU_DICTIONARY.profileTab.toasts.serverError);
        }
    };

    const handlePhoneOtpSubmit = async () => {
        if (!phoneOtpCode) {
            toast.error(RU_DICTIONARY.profileTab.toasts.enterOtp);
            return;
        }

        setPhoneOtpSubmitting(true);
        try {
            const res = await verifyPhoneChangeProfile(phoneOtpCode);
            if (res.success) {
                toast.success(RU_DICTIONARY.profileTab.toasts.phoneUpdatedAndVerified);
                setShowPhoneOtpModal(false);
                setPhoneOtpCode('');
                setPhoneOtpResendTimer(0);

                // Continue to update the rest of the profile if needed, but phone is already updated by backend
                setProfileEditing(false);
                fetchProfile();
            } else {
                toast.error(res.message || RU_DICTIONARY.profileTab.toasts.invalidOtp);
            }
        } catch {
            toast.error(RU_DICTIONARY.profileTab.toasts.generalServerError);
        } finally {
            setPhoneOtpSubmitting(false);
        }
    };

    const handleResendEmailOtp = async () => {
        if (emailOtpResendTimer > 0) return;

        try {
            const reqRes = await requestEmailChange(profileData.email);
            if (reqRes.success) {
                toast.success(RU_DICTIONARY.profileTab.toasts.newCodeSent);
                setEmailOtpResendTimer(60);
            } else {
                toast.error(reqRes.message || RU_DICTIONARY.profileTab.toasts.resendFailed);
            }
        } catch {
            toast.error(RU_DICTIONARY.profileTab.toasts.serverError);
        }
    };

    const handleEmailOtpSubmit = async () => {
        if (!emailOtpCode) {
            toast.error(RU_DICTIONARY.profileTab.toasts.enterOtp);
            return;
        }

        setEmailOtpSubmitting(true);
        try {
            const res = await verifyEmailChangeProfile(emailOtpCode);
            if (res.success) {
                toast.success(RU_DICTIONARY.profileTab.toasts.emailUpdated);
                setShowEmailOtpModal(false);
                setEmailOtpCode('');
                setEmailOtpResendTimer(0);

                // Continue to update the rest of the profile if it was being edited
                if (!user?.id) return;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { has_password, is_email_verified, is_mobile_verified, email, ...updateData } = profileData;
                const profileRes = await updateCustomerProfile(user.id, updateData);

                if (profileRes.success) {
                    toast.success(RU_DICTIONARY.profileTab.toasts.profileAllUpdated);
                    setProfileEditing(false);
                }

                fetchProfile();
            } else {
                toast.error(res.message || RU_DICTIONARY.profileTab.toasts.invalidOtp);
            }
        } catch {
            toast.error(RU_DICTIONARY.profileTab.toasts.generalServerError);
        } finally {
            setEmailOtpSubmitting(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (profileData.has_password && passwords.current === passwords.new) {
            toast.error(RU_DICTIONARY.profileTab.toasts.samePassword);
            return;
        }

        if (passwords.new !== passwords.confirm) {
            toast.error(RU_DICTIONARY.profileTab.toasts.passwordMismatch);
            return;
        }
        if (passwords.new.length < 8) {
            toast.error(RU_DICTIONARY.profileTab.toasts.passwordLength);
            return;
        }

        setPasswordChanging(true);
        try {
            const res = await changePassword(passwords.current, passwords.new);
            if (res.success) {
                toast.success(RU_DICTIONARY.profileTab.toasts.passwordUpdated);
                setShowPasswordModal(false);
                setPasswords({ current: '', new: '', confirm: '' });
                setShowCurrentPassword(false);
                setShowNewPassword(false);
                setShowConfirmPassword(false);
                fetchProfile(); // refresh has_password status
            } else {
                toast.error(res.message || RU_DICTIONARY.profileTab.toasts.passwordUpdateFailed);
            }
        } catch {
            toast.error(RU_DICTIONARY.profileTab.toasts.serverError);
        } finally {
            setPasswordChanging(false);
        }
    };

    // ── Image upload handler ─────────────────────────────────────────
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user?.id) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error(RU_DICTIONARY.profileTab.toasts.imageSize);
            return;
        }

        setImageUploading(true);
        try {
            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = reader.result as string;
                setProfileImageUrl(base64); // immediate preview
                try {
                    const res = await uploadProfileImage(user.id, base64);
                    if (res.success) {
                        toast.success(RU_DICTIONARY.profileTab.toasts.photoUpdated);
                        fetchProfileImage();
                    } else {
                        toast.error(res.message || RU_DICTIONARY.profileTab.toasts.uploadFailed);
                        setProfileImageUrl(null);
                    }
                } catch {
                    toast.error(RU_DICTIONARY.profileTab.toasts.uploadRetry);
                    setProfileImageUrl(null);
                } finally {
                    setImageUploading(false);
                }
            };
            reader.readAsDataURL(file);
        } catch {
            setImageUploading(false);
            toast.error(RU_DICTIONARY.profileTab.toasts.couldNotRead);
        }
        // Reset input so same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ── Remove image ─────────────────────────────────────────────────
    const handleRemoveImage = async () => {
        if (!user?.id) return;
        try {
            const res = await removeProfileImage(user.id);
            if (res.success) {
                setProfileImageUrl(null);
                updateUser({ avatar_url: undefined });
                toast.success(RU_DICTIONARY.profileTab.toasts.photoRemoved);
            } else {
                toast.error(res.message || RU_DICTIONARY.profileTab.toasts.removeFailed);
            }
        } catch {
            toast.error(RU_DICTIONARY.profileTab.toasts.serverError);
        }
    };

    // ── Address handlers ─────────────────────────────────────────────
    const handleAddressSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!user?.id) return;
        if (!addressForm.full_name || !addressForm.address_line1 || !addressForm.city || !addressForm.state || !addressForm.pincode || !addressForm.phone) {
            toast.error(RU_DICTIONARY.addressesTab.toast.fillRequired);
            return;
        }

        const phoneDigits = addressForm.phone.replace(/\D/g, '');
        if (phoneDigits.length < 7 || phoneDigits.length > 12) {
            toast.error(RU_DICTIONARY.addressesTab.toast.phoneLength);
            return;
        }

        // Postal Code format validation
        const config = getAddressConfig(addressForm.country_code || 'RU');
        const cleanPin = addressForm.pincode.toString().trim();
        if (config.postalCode) {
            if (!config.postalCode.regex.test(cleanPin)) {
                toast.error(config.postalCode.error);
                return;
            }
        }

        const payload = {
            ...addressForm,
            phone: addressForm.phone ? `${addressDialCode}${addressForm.phone.replace(/\D/g, '')}` : ''
        };

        try {
            if (editingAddress) {
                const res = await apiUpdateAddress(user.id, editingAddress.address_id, payload as unknown as Record<string, string>);
                if (res.success) {
                    toast.success(RU_DICTIONARY.addressesTab.toast.addressUpdated);
                } else {
                    toast.error(res.message || RU_DICTIONARY.addressesTab.toast.failedUpdate);
                }
            } else {
                const res = await apiAddAddress(user.id, payload as unknown as Record<string, string>);
                if (res.success) {
                    toast.success(RU_DICTIONARY.addressesTab.toast.addressAdded);
                } else {
                    toast.error(res.message || RU_DICTIONARY.addressesTab.toast.failedAdd);
                }
            }
            resetAddressForm();
            fetchAddresses();
        } catch {
            toast.error(RU_DICTIONARY.addressesTab.toast.somethingWentWrong);
        }
    };

    const handleDeleteAddress = async (addressId: string) => {
        if (!user?.id) return;
        try {
            const res = await apiDeleteAddress(user.id, addressId);
            if (res.success) {
                toast.success(RU_DICTIONARY.addressesTab.toast.addressDeleted);
                fetchAddresses();
            } else {
                toast.error(res.message || RU_DICTIONARY.addressesTab.toast.failedDelete);
            }
        } catch {
            toast.error(RU_DICTIONARY.addressesTab.toast.somethingWentWrong);
        } finally {
            setDeletingAddressId(null);
        }
    };

    const handleSetDefault = async (addr: Address) => {
        if (!user?.id) return;
        try {
            const res = await apiUpdateAddress(user.id, addr.address_id, { is_default: 'true' } as Record<string, string>);
            if (res.success) {
                toast.success(RU_DICTIONARY.addressesTab.toast.defaultUpdated);
                fetchAddresses();
            } else {
                toast.error(res.message || RU_DICTIONARY.addressesTab.toast.failedDefault);
            }
        } catch {
            toast.error(RU_DICTIONARY.addressesTab.toast.somethingWentWrong);
        }
    };

    const startEditAddress = (addr: Address) => {
        const cCode = (addr as any).country_code || 'RU';
        const match = Array.isArray(COUNTRY_CODES) ? COUNTRY_CODES.find(c => c.code === cCode) : null;
        const fallbackMatch = COUNTRY_CODES.find(c => c.code === defaultCountryCode);
        const dCode = match ? match.dial_code : (fallbackMatch?.dial_code || '+1');
        let phoneVal = addr.phone || '';
        if (phoneVal.startsWith(dCode)) {
            phoneVal = phoneVal.substring(dCode.length).trim();
        }

        setEditingAddress(addr);
        setAddressForm({
            address_line1: addr.address_line1 || '',
            address_line2: addr.address_line2 || '',
            city: addr.city || '',
            state: addr.state || '',
            pincode: addr.pincode || '',
            country: addr.country || defaultCountryName,
            country_code: cCode,
            phone: phoneVal,
            label: addr.label || '',
            is_default: addr.is_default || false,
            full_name: addr.full_name || '',
        });
        setManualEdits({ city: true, state: true }); // Assume manual since it's existing data
        setShowAddressForm(true);
    };

    const resetAddressForm = () => {
        setShowAddressForm(false);
        setEditingAddress(null);
        setAddressForm({
            address_line1: '', address_line2: '', city: '', state: '', pincode: '',
            country: defaultCountryName, country_code: defaultCountryCode, phone: '', label: '', is_default: false, full_name: '',
        });
        setManualEdits({ city: false, state: false });
    };

    const handleViewOrderDetails = useCallback(async (orderId: string) => {
        setIsOrderLoading(true);
        try {
            const res = await getOrderById(orderId);
            if (res.success && res.data) {
                setSelectedOrderDetails(res.data);
            } else {
                toast.error('Failed to load order details');
            }
        } catch (error) {
            console.error('Error fetching order details:', error);
            toast.error('Failed to load order details due to a server error.');
        } finally {
            setIsOrderLoading(false);
        }
    }, []);

    // Handle auto-opening order details from URL param
    useEffect(() => {
        if (activeTab === 'orders' && urlOrderId && orders.length > 0) {
            handleViewOrderDetails(urlOrderId);
        }
    }, [activeTab, urlOrderId, orders, handleViewOrderDetails]);

    const handleTrackOrder = async (orderId: string) => {
        setTrackOrderId(orderId);
        setIsTrackOrderModalOpen(true);
        setTrackingData(null);
        setTrackOrderStatus(null);
        setIsTrackingLoading(true);
        try {
            const res = await trackOrder(orderId);
            if (res?.success && res.data?.tracking_data) {
                setTrackingData(res.data.tracking_data);
                setTrackOrderStatus(res.data.order_status || null);
            } else {
                toast.error(res?.message || 'Tracking information unavailable for this order.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch tracking data');
        } finally {
            setIsTrackingLoading(false);
        }
    };

    if (isLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full border-4 border-[#91c934]/10 animate-pulse" />
                        <Loader2 className="h-12 w-12 animate-spin text-[#91c934] relative z-10" />
                    </div>
                    <div className="flex flex-col items-center">
                        <h2 className="text-gray-900 font-serif text-xl font-medium tracking-tight">{RU_DICTIONARY.account.vedashiSanctuary}</h2>
                        <p className="text-gray-400 text-sm italic mt-1">{RU_DICTIONARY.account.preparingSpace}</p>
                    </div>
                </div>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        const s = status?.toLowerCase();
        if (s === 'confirmed' || s === 'completed') return 'bg-green-100 text-green-700';
        if (s === 'shipped' || s === 'processing') return 'bg-blue-100 text-blue-700';
        if (s === 'delivered') return 'bg-purple-100 text-purple-700';
        if (s === 'cancelled') return 'bg-red-100 text-red-700';
        // Return statuses
        if (s === 'requested' || s === 'return_requested') return 'bg-amber-100 text-amber-700';
        if (s === 'approved' || s === 'return_approved') return 'bg-blue-100 text-blue-700';
        if (s === 'rejected' || s === 'return_rejected') return 'bg-red-100 text-red-700';
        if (s === 'pickup_scheduled') return 'bg-violet-100 text-violet-700';
        if (s === 'picked_up') return 'bg-orange-100 text-orange-700';
        if (s === 'in_transit') return 'bg-purple-100 text-purple-700';
        if (s === 'received') return 'bg-teal-100 text-teal-700';
        if (s === 'rto' || s === 'rto_initiated') return 'bg-rose-100 text-rose-700';
        if (s === 'rto_completed' || s === 'rto_delivered') return 'bg-emerald-100 text-emerald-700';
        return 'bg-yellow-100 text-yellow-700';
    };

    const getLocalizedStatus = (status: string) => {
        const s = status?.toLowerCase();
        if (s === 'confirmed') return RU_DICTIONARY.account.statusConfirmed;
        if (s === 'completed') return RU_DICTIONARY.account.statusCompleted;
        if (s === 'shipped') return RU_DICTIONARY.account.statusShipped;
        if (s === 'processing') return RU_DICTIONARY.account.statusProcessing;
        if (s === 'delivered') return RU_DICTIONARY.account.statusDelivered;
        if (s === 'cancelled') return RU_DICTIONARY.account.statusCancelled;
        return RU_DICTIONARY.account.pending;
    };

    const getLocalizedEnquiryStatus = (status: string) => {
        const s = (status || '').toLowerCase();
        if (s === 'open') return 'Открыт';
        if (s === 'in_progress') return 'В процессе';
        if (s === 'resolved') return 'Решен';
        if (s === 'closed') return 'Закрыт';
        if (s === 'pending') return 'В ожидании';
        return status;
    };

    // Sidebar groups
    const coreExperienceTabs = [
        { id: 'overview', label: RU_DICTIONARY.account.overview, icon: LayoutGrid },
        { id: 'notifications', label: RU_DICTIONARY.account.notifications, icon: BellRing, count: unreadCount },
        { id: 'orders', label: RU_DICTIONARY.account.orders, icon: Package, count: orderCount },
        { id: 'wishlist', label: RU_DICTIONARY.account.wishlist, icon: Heart, count: wishlistItems.length },
        { id: 'wallet', label: RU_DICTIONARY.account.myWallet, icon: Wallet },
    ];
    const identityAccessTabs = [
        { id: 'profile', label: RU_DICTIONARY.account.personalProfile, icon: User },
        { id: 'addresses', label: RU_DICTIONARY.account.manageAddresses, icon: MapPin, count: addresses.length },
        { id: 'support', label: RU_DICTIONARY.account.supportEnquiries, icon: MessageSquare, count: enquiries.length },
        { id: 'privacy', label: RU_DICTIONARY.account.privacySanctuary, icon: Shield },
    ];

    return (
        <div className="flex flex-col lg:flex-row bg-[#FFFFFF] min-h-[calc(100vh-128px)]">
            {/* Mobile Account Navigation (Visible only on < lg) */}
            <nav className="lg:hidden sticky top-0 z-[100] bg-white/95 backdrop-blur-md border-b border-gray-100 overflow-x-auto shadow-sm custom-scrollbar flex items-center gap-1.5 px-4 py-3 whitespace-nowrap shadow-sm">
                {[...coreExperienceTabs, ...identityAccessTabs].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => router.push(ROUTES.accountTab(ACCOUNT_TABS[tab.id as keyof typeof ACCOUNT_TABS]))}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${activeTab === tab.id
                            ? 'bg-[#91c934] text-white shadow-md'
                            : 'bg-white text-gray-700 border border-gray-100 hover:bg-gray-50'
                            }`}
                    >
                        <tab.icon className={`h-3 w-3 ${activeTab === tab.id ? 'opacity-100' : 'opacity-60'}`} />
                        {tab.label}
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className={`text-[9px] px-1.5 rounded-full ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </nav>

            {/* Left Sidebar (Desktop Only) */}
            <aside className="hidden lg:flex w-[280px] bg-white flex-col flex-shrink-0 relative z-20 border-r border-gray-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                <div className="flex-1 px-5 py-8">
                    {/* CORE EXPERIENCE */}
                    <div className="mb-8">
                        <p className="text-[10px] font-bold tracking-[0.15em] text-gray-400 mb-3 ml-3">{RU_DICTIONARY.account.coreExperience}</p>
                        <ul className="space-y-1">
                            {coreExperienceTabs.map(tab => (
                                <li key={tab.id}>
                                    <button
                                        onClick={() => router.push(ROUTES.accountTab(ACCOUNT_TABS[tab.id as keyof typeof ACCOUNT_TABS]))}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                                            ? 'bg-[#91c934] text-white shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'opacity-100' : 'opacity-60'}`} />
                                            {tab.label}
                                        </div>
                                        {tab.count !== undefined && tab.count > 0 && (
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* IDENTITY & ACCESS */}
                    <div>
                        <p className="text-[10px] font-bold tracking-[0.15em] text-gray-400 mb-3 ml-3">{RU_DICTIONARY.account.identityAccess}</p>
                        <ul className="space-y-1">
                            {identityAccessTabs.map(tab => (
                                <li key={tab.id}>
                                    <button
                                        onClick={() => router.push(ROUTES.accountTab(ACCOUNT_TABS[tab.id as keyof typeof ACCOUNT_TABS]))}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                                            ? 'bg-[#91c934] text-white shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'opacity-100' : 'opacity-60'}`} />
                                            {tab.label}
                                        </div>
                                        {tab.count !== undefined && tab.count > 0 && (
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Elite Status Card */}
                <div className="p-5 mt-auto border-t border-gray-100">
                    <div className="bg-gradient-to-br from-[#91c934] to-[#7ab52a] rounded-3xl p-5 text-white mb-4 relative overflow-hidden shadow-lg shadow-[#91c934]/20">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-white">
                                <path d="M12 22C17.5228 22 22 17.5228 22 12" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="p-1.5 bg-white/15 rounded-full flex items-center justify-center">
                                <Star className="h-3 w-3 text-[#FFD801] fill-[#FFD801]" />
                            </span>
                            <span className="text-[10px] font-bold tracking-wider text-white uppercase">{RU_DICTIONARY.account.loyaltySidebar.tiers[activeTier as keyof typeof RU_DICTIONARY.account.loyaltySidebar.tiers] || activeTier} {RU_DICTIONARY.account.loyaltySidebar.status}</span>
                        </div>
                        <p className="text-xs text-white leading-relaxed mb-3">{RU_DICTIONARY.account.loyaltySidebar.youPossess} <strong className="text-white">{RU_DICTIONARY.account.loyaltySidebar.tiers[activeTier as keyof typeof RU_DICTIONARY.account.loyaltySidebar.tiers] || activeTier}</strong> {RU_DICTIONARY.account.loyaltySidebar.ritualistRank}</p>
                        <button
                            onClick={() => router.push(ROUTES.accountTab(ACCOUNT_TABS.wallet))}
                            className="text-[10px] uppercase font-bold text-white flex items-center gap-1 hover:text-[#FFD801] transition-colors"
                        >
                            {RU_DICTIONARY.account.loyaltySidebar.viewBenefits} <ChevronRight className="h-3 w-3" />
                        </button>
                    </div>

                    {/* User Snippet */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="h-9 w-9 rounded-full bg-[#91c934] flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                            {profileImageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={profileImageUrl}
                                    alt="Profile"
                                    className="h-full w-full object-cover"
                                    onError={() => {
                                        if (base64Fallback && profileImageUrl !== base64Fallback) {
                                            setProfileImageUrl(base64Fallback);
                                        }
                                    }}
                                />
                            ) : (
                                <span className="font-bold text-white text-sm">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                            <p className="text-[10px] text-gray-400 tracking-wider flex items-center gap-1">
                                <Shield className="h-2.5 w-2.5 text-[#91c934]" /> {RU_DICTIONARY.account.verifiedMember}
                            </p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Hidden file input for profile image upload from any tab */}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

            {/* Fullscreen Image Zoom Modal */}
            {isMounted && isZoomModalOpen && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md"
                    onClick={() => setIsZoomModalOpen(false)}
                    style={{ animation: 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
                >
                    <button
                        className="absolute top-6 right-6 p-3 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-10"
                        onClick={() => setIsZoomModalOpen(false)}
                    >
                        <X size={28} />
                    </button>
                    <div className="relative w-full max-w-4xl p-4 flex items-center justify-center">
                        <img
                            src={profileImageUrl || ''}
                            alt="Profile Zoom"
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-white/10"
                            style={{ animation: 'zoomIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
                            onError={() => {
                                if (base64Fallback && profileImageUrl !== base64Fallback) {
                                    setProfileImageUrl(base64Fallback);
                                }
                            }}
                        />
                    </div>
                </div>,
                document.body
            )}

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full relative z-10 overflow-hidden">
                {/* Header (Desktop Only Breadcrumb) */}
                <header className="hidden lg:flex h-12 flex-shrink-0 bg-white/95 backdrop-blur-md border-b border-gray-100 items-center justify-between px-8 xl:px-12 sticky top-0 z-20">
                    <div className="flex items-center gap-3 text-sm font-medium">
                        <button onClick={() => router.push('/account')} className="text-gray-400 hover:text-gray-900 transition-colors">{RU_DICTIONARY.account.account}</button>
                        <ChevronRight className="h-4 w-4 text-gray-300" />
                        <span className="text-gray-900 font-bold">
                            {activeTab === 'profile' ? RU_DICTIONARY.account.personalProfile : 
                             activeTab === 'addresses' ? RU_DICTIONARY.addressesTab.header.manageAddresses :
                             activeTab === 'orders' ? RU_DICTIONARY.account.orders : 
                             activeTab === 'wishlist' ? RU_DICTIONARY.account.wishlist :
                             RU_DICTIONARY.account.overview}
                        </span>
                    </div>
                </header>

                {/* Content Roll */}
                <div className="flex-1 px-4 py-8 md:px-8 xl:px-12">
                    <div className="max-w-6xl mx-auto">

                        {/* ═══════════════════ OVERVIEW TAB ═══════════════════ */}
                        {activeTab === 'overview' && (
                            <div className="flex flex-col gap-6 w-full max-w-[1100px] mx-auto animate-fadeIn pb-12">
                                {/* Top Welcome Section */}
                                <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                    <div className="flex-1 relative z-10">
                                        <span className="inline-block bg-gray-200/50 text-gray-900 text-[10px] font-bold tracking-widest px-3 py-1 rounded-full mb-6 uppercase">{RU_DICTIONARY.account.accountOverview}</span>
                                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                                            {RU_DICTIONARY.account.namaste.replace('{name}', user?.name?.split(' ')[0] || 'Guest')}
                                        </h1>
                                        <p className="text-warm-gray leading-relaxed max-w-md mb-8">
                                            {RU_DICTIONARY.account.welcomeBack}
                                        </p>
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => router.push(ROUTES.accountTab(ACCOUNT_TABS.orders))}
                                                className="bg-[#91c934] text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md shadow-[#91c934]/20 hover:bg-[#7ab52a] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                                            >
                                                {RU_DICTIONARY.account.trackLatestOrder}
                                            </button>
                                            <button
                                                onClick={() => router.push(ROUTES.accountTab(ACCOUNT_TABS.profile))}
                                                className="bg-white border text-gray-900 border-gray-100 px-6 py-3 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
                                            >
                                                {RU_DICTIONARY.account.updateHealthProfile}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Aesthetic Profile Image Sphere */}
                                    <div className="relative w-48 h-48 md:w-64 md:h-64 flex-shrink-0 z-10 group mt-6 md:mt-0 mx-auto md:mx-0">
                                        <div className="absolute inset-0 bg-gradient-radial from-white to-[#F8F5F0] rounded-full shadow-[0_0_40px_rgba(212,168,71,0.15)] blur-md"></div>
                                        <div className="relative w-full h-full rounded-full border-4 border-white overflow-hidden shadow-xl bg-gray-200 flex items-center justify-center">
                                            {profileImageUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={profileImageUrl}
                                                    alt="Profile"
                                                    className="h-full w-full object-cover cursor-pointer hover:scale-110 transition-transform duration-500"
                                                    onClick={() => setIsZoomModalOpen(true)}
                                                    onError={() => {
                                                        if (base64Fallback && profileImageUrl !== base64Fallback) {
                                                            setProfileImageUrl(base64Fallback);
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <span className="font-serif text-6xl md:text-8xl font-bold text-gray-900">
                                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                                </span>
                                            )}
                                            {imageUploading && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                                                    <Loader2 className="h-10 w-10 animate-spin text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={imageUploading}
                                            title="Upload Profile Photo"
                                            className="absolute bottom-4 right-4 md:bottom-6 md:right-6 h-12 w-12 md:h-14 md:w-14 rounded-full bg-[#91c934] text-white flex items-center justify-center shadow-lg hover:bg-[#7ab52a] transition-transform hover:scale-110 disabled:opacity-50 z-20 group-hover:bg-[#91C934] focus:outline-none focus:ring-4 focus:ring-[#91C934]/30"
                                        >
                                            <Camera className="h-5 w-5 md:h-6 md:w-6" />
                                        </button>
                                    </div>

                                    {/* Abstract Wave decorative background */}
                                    <div className="absolute top-0 right-0 w-full h-full opacity-30 pointer-events-none mix-blend-multiply" style={{ background: 'radial-gradient(circle at 80% 50%, #D4A847 0%, transparent 50%)' }}></div>
                                </div>

                                {/* Stats Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex items-start gap-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-pointer" onClick={() => router.push(ROUTES.accountTab(ACCOUNT_TABS.orders))}>
                                        <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                                            <Package className="h-6 w-6 text-gray-900" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-warm-gray uppercase tracking-wider mb-1">{RU_DICTIONARY.account.recentOrders}</p>
                                            <h3 className="text-2xl font-bold text-gray-900 mb-1">{orders.length} {RU_DICTIONARY.account.total}</h3>
                                            <p className="text-[11px] text-[#A8B28B] font-medium">{orders.filter((o: any) => o.order_status === 'SHIPPED').length} {RU_DICTIONARY.account.currentlyInTransit}</p>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex items-start gap-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-pointer" onClick={() => router.push(ROUTES.accountTab(ACCOUNT_TABS.wishlist))}>
                                        <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                                            <Heart className="h-6 w-6 text-gray-900" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-warm-gray uppercase tracking-wider mb-1">{RU_DICTIONARY.account.savedItems}</p>
                                            <h3 className="text-2xl font-bold text-gray-900 mb-1">{wishlistItems.length} {RU_DICTIONARY.plp.products}</h3>
                                            <p className="text-[11px] text-warm-gray font-medium">{RU_DICTIONARY.account.waitlistingItems} {wishlistItems.filter((i: any) => (i.stock_status || '').toLowerCase() === 'out_of_stock').length} {RU_DICTIONARY.plp.products}</p>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex items-start gap-4 cursor-default relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5">
                                            <Star className="h-20 w-20 text-[#D4A847]" />
                                        </div>
                                        <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0 relative z-10">
                                            <Star className="h-6 w-6 text-gray-900" />
                                        </div>
                                        <div className="relative z-10">
                                            <p className="text-xs font-bold text-warm-gray uppercase tracking-wider mb-1">{RU_DICTIONARY.account.loyaltyPoints}</p>
                                            <h3 className="text-2xl font-bold text-gray-900 mb-1">{activePoints} {RU_DICTIONARY.account.pts}</h3>
                                            <p className="text-[11px] text-[#A8B28B] font-medium">{loyaltyData?.tier?.points_multiplier || 1}x</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Common Actions Quick Links */}
                                <div className="mt-2">
                                    <h3 className="font-bold text-gray-900 mb-4 text-sm tracking-wide">{RU_DICTIONARY.account.commonActions}</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <button onClick={() => router.push(ROUTES.accountTab(ACCOUNT_TABS.orders))} className="bg-white border border-gray-100 p-4 rounded-3xl flex items-center justify-between hover:border-[#91c934]/30 hover:shadow-md transition-all duration-300 group">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-gray-50 p-2.5 rounded-lg group-hover:bg-[#91c934] transition-colors">
                                                    <List className="h-5 w-5 text-gray-900 group-hover:text-white transition-colors" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-bold text-gray-900">{RU_DICTIONARY.account.viewAllOrders}</p>
                                                    <p className="text-[10px] text-warm-gray">{RU_DICTIONARY.account.checkStatusHistory}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-warm-gray group-hover:text-gray-900 transition-colors" />
                                        </button>

                                        <button onClick={() => router.push(ROUTES.accountTab(ACCOUNT_TABS.addresses))} className="bg-white border border-gray-100 p-4 rounded-3xl flex items-center justify-between hover:border-[#91c934]/30 hover:shadow-md transition-all duration-300 group">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-gray-50 p-2.5 rounded-lg group-hover:bg-[#91c934] transition-colors">
                                                    <MapPin className="h-5 w-5 text-gray-900 group-hover:text-white transition-colors" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-bold text-gray-900">{RU_DICTIONARY.account.manageAddresses}</p>
                                                    <p className="text-[10px] text-warm-gray">{RU_DICTIONARY.account.addEditDeliverySpots}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-warm-gray group-hover:text-gray-900 transition-colors" />
                                        </button>

                                        <button onClick={() => router.push(ROUTES.accountTab(ACCOUNT_TABS.profile))} className="bg-white border border-gray-100 p-4 rounded-3xl flex items-center justify-between hover:border-[#91c934]/30 hover:shadow-md transition-all duration-300 group">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-gray-50 p-2.5 rounded-lg group-hover:bg-[#91c934] transition-colors">
                                                    <User className="h-5 w-5 text-gray-900 group-hover:text-white transition-colors" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-bold text-gray-900">{RU_DICTIONARY.account.accountSettings}</p>
                                                    <p className="text-[10px] text-warm-gray">{RU_DICTIONARY.account.editProfilePrivacy}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-warm-gray group-hover:text-gray-900 transition-colors" />
                                        </button>
                                    </div>
                                </div>

                                {/* Main Layout Body: Left (Orders Summary) + Right (Wishlist Preview & Wallet) */}
                                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 mt-4">

                                    {/* Left: Recent Orders Table */}
                                    <div className="bg-white rounded-[2rem] border border-gray-100 p-6 lg:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] h-fit">
                                        <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg">{RU_DICTIONARY.account.recentOrdersSummary}</h3>
                                                <p className="text-xs text-warm-gray mt-1">{RU_DICTIONARY.account.latestTransactions}</p>
                                            </div>
                                            <button onClick={() => router.push(ROUTES.accountTab(ACCOUNT_TABS.orders))} className="text-xs font-bold text-gray-900 hover:underline hover:text-black">{RU_DICTIONARY.account.seeFullHistory}</button>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-gray-100">
                                                        <th className="pb-3 text-xs font-bold text-warm-gray uppercase tracking-wider">{RU_DICTIONARY.account.orderId}</th>
                                                        <th className="pb-3 text-xs font-bold text-warm-gray uppercase tracking-wider">{RU_DICTIONARY.account.date}</th>
                                                        <th className="pb-3 text-xs font-bold text-warm-gray uppercase tracking-wider">{RU_DICTIONARY.account.status}</th>
                                                        <th className="pb-3 text-xs font-bold text-warm-gray uppercase tracking-wider text-right">{RU_DICTIONARY.account.amount}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {orders.slice(0, 5).map((order: any) => (
                                                        <tr key={order.order_id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                                                            <td className="py-4 text-sm font-bold text-gray-900">{order.order_id.split('-')[0].toUpperCase()}</td>
                                                            <td className="py-4 text-sm text-warm-gray">{new Date(order.created_at).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                                            <td className="py-4">
                                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border border-current ${getStatusColor(order.order_status)}`}>
                                                                    {getLocalizedStatus(order.order_status)}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 text-sm font-bold text-gray-900 text-right">{formatLocal(order.final_total || order.total_amount, order.currency || 'USD', order.currency === 'RUB' ? 'ru-RU' : order.currency === 'KRW' ? 'ko-KR' : 'en-US')}</td>
                                                        </tr>
                                                    ))}
                                                    {orders.length === 0 && (
                                                        <tr>
                                                            <td colSpan={4} className="py-8 text-center text-sm text-warm-gray">{RU_DICTIONARY.account.noOrderHistory}</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Right Side Column */}
                                    <div className="flex flex-col gap-6">

                                        {/* Wishlist Preview */}
                                        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                                    <Heart className="h-4 w-4 text-red-500 fill-red-50" />
                                                    {RU_DICTIONARY.account.wishlistPreview}
                                                </h3>
                                                <span className="bg-[#91c934] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{wishlistItems.length}</span>
                                            </div>

                                            <div className="space-y-4">
                                                {wishlistItems.slice(0, 4).map((item: any) => (
                                                    <div key={item.product_id} className="flex gap-4 group cursor-pointer" onClick={() => router.push(`/products/${item.slug || item.product_id}`)}>
                                                        <div className="h-16 w-16 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center p-2 flex-shrink-0 overflow-hidden">
                                                            {item.image_url ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img src={item.image_url} alt={item.product_name} className="h-full w-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                                                            ) : (
                                                                <Package className="h-6 w-6 text-warm-gray/40" />
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col justify-center max-w-[150px]">
                                                            <p className="text-[9px] font-bold tracking-widest text-[#A8B28B] uppercase mb-0.5 truncate">{item.category_name || 'WELLNESS'}</p>
                                                            <p className="text-xs font-bold text-gray-900 line-clamp-2 leading-tight mb-1 group-hover:text-black">{item.product_name}</p>
                                                            <div className="flex items-center gap-2 mt-auto">
                                                                <span className="text-xs font-bold text-gray-900">{formatPrice(item.price)}</span>
                                                                {item.on_sale && <span className="text-[10px] bg-red-100 text-red-700 px-1 rounded font-bold uppercase">{RU_DICTIONARY.product.off}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {wishlistItems.length === 0 && (
                                                    <div className="py-6 text-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                                                        <Heart className="h-6 w-6 text-warm-gray/40 mx-auto mb-2" />
                                                        <p className="text-xs font-medium text-warm-gray">{RU_DICTIONARY.account.sanctuaryEmpty}</p>
                                                    </div>
                                                )}
                                            </div>

                                            <button onClick={() => router.push(ROUTES.accountTab(ACCOUNT_TABS.wishlist))} className="w-full mt-6 bg-gray-50 text-gray-900 text-xs font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                                                {RU_DICTIONARY.account.manageFullWishlist} <ChevronRight className="h-3 w-3" />
                                            </button>
                                        </div>

                                        {/* Vedashi Wallet Card */}
                                        <div className="bg-[#91c934] rounded-[2rem] p-6 text-white relative flex flex-col justify-between overflow-hidden shadow-md h-40">
                                            {/* Decorative Background Leaf */}
                                            <div className="absolute -right-4 -bottom-4 opacity-10">
                                                <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M17.5 3C15.24 3 13.04 3.73 11 4.9C8.96 3.73 6.76 3 4.5 3C4.1 3 3.7 3.03 3.32 3.08L3 3.12V10C3 15.52 7.48 20 13 20H21C21.55 20 22 19.55 22 19V6.5C22 4.57 20.43 3 18.5 3H17.5ZM19 18H13C9.04 18 5.76 15.17 5.11 11.41C6.67 11.8 8.35 12 10 12C13.88 12 17.52 10.61 20.35 8.32C20.67 9.8 21 11.36 21 13V18H19ZM18.5 5H20V6.5C20 7.82 19.51 9.04 18.72 9.97C16.89 10.63 14.99 11 13 11C10.6 11 8.24 10.45 6.13 9.4C6.55 6.44 8.7 3.96 11.66 3.18C13.43 4.29 15.35 5 17.5 5H18.5Z" />
                                                </svg>
                                            </div>

                                            <div className="relative z-10">
                                                <p className="text-[10px] font-bold tracking-widest text-white uppercase mb-1">{RU_DICTIONARY.account.vedashiWallet}</p>
                                                <h3 className="text-3xl font-bold mb-1">{formatPrice ? formatPrice(Number(user?.wallet_balance || 0)) : `$${(Number(user?.wallet_balance || 0)).toFixed(2)}`}</h3>
                                                <p className="text-[10px] text-white tracking-wide">{RU_DICTIONARY.account.availableBalance}</p>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ═══════════════════ ORDERS TAB ═══════════════════ */}
                        {activeTab === 'orders' && (
                            <div className="flex flex-col h-full bg-gray-50">
                                {/* ── Orders Header ── */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-3xl font-bold text-gray-900">{RU_DICTIONARY.ordersTab.ordersList}</h2>
                                        <span className="bg-[#f0fdf4] text-[#2D5A3A] text-xs font-bold px-3 py-1 rounded-full">
                                            {filteredAndSortedOrders.length} {filteredAndSortedOrders.length !== orders.length ? `${RU_DICTIONARY.ordersTab.of} ${orders.length}` : ''} {RU_DICTIONARY.ordersTab.total}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col lg:flex-row gap-8 items-start">
                                    {/* ── Left Column: Master Orders List ── */}
                                    <div className="flex-1 w-full space-y-6">
                                        {/* Search & Filter Bar */}
                                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                                            <div className="relative flex-1 group">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-gray group-focus-within:text-gray-900 transition-colors" />
                                                <input
                                                    type="text"
                                                    placeholder={RU_DICTIONARY.ordersTab.searchPlaceholder}
                                                    value={orderSearch}
                                                    onChange={e => setOrderSearch(e.target.value)}
                                                    className="w-full bg-white border border-gray-100 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#91c934]/40 focus:ring-1 focus:ring-[#91c934]/20 transition-all text-gray-900 placeholder:text-warm-gray/70 shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Status Filters & Sort */}
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {[{key: 'All', label: RU_DICTIONARY.ordersTab.all}, {key: 'Pending', label: RU_DICTIONARY.ordersTab.pending}, {key: 'Shipped', label: RU_DICTIONARY.ordersTab.shipped}, {key: 'Delivered', label: RU_DICTIONARY.ordersTab.delivered}, {key: 'Cancelled', label: RU_DICTIONARY.ordersTab.cancelled}].map(({key: status, label}) => (
                                                    <button
                                                        key={status}
                                                        onClick={() => setOrderStatusFilter(status)}
                                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm border
                                                        ${orderStatusFilter === status
                                                                ? 'bg-[#91c934] text-white border-[#91c934]'
                                                                : 'bg-white text-gray-900 border-gray-100 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-warm-gray tracking-widest uppercase">{RU_DICTIONARY.ordersTab.sort}</span>
                                                <select
                                                    value={orderSort}
                                                    onChange={(e) => setOrderSort(e.target.value)}
                                                    className="text-sm font-bold text-gray-900 bg-transparent focus:outline-none appearance-none cursor-pointer pr-4"
                                                >
                                                    <option value="newest">{RU_DICTIONARY.ordersTab.newestFirst}</option>
                                                    <option value="oldest">{RU_DICTIONARY.ordersTab.oldestFirst}</option>
                                                    <option value="highest">{RU_DICTIONARY.ordersTab.amountHighLow}</option>
                                                    <option value="lowest">{RU_DICTIONARY.ordersTab.amountLowHigh}</option>
                                                </select>
                                                <ChevronRight className="h-4 w-4 text-gray-900 pointer-events-none rotate-90 -ml-5" />
                                            </div>
                                        </div>

                                        {/* Orders Feed */}
                                        <div className="space-y-4">
                                            {ordersLoading && (
                                                <div className="flex justify-center py-16">
                                                    <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
                                                </div>
                                            )}
                                            {!ordersLoading && filteredAndSortedOrders.length === 0 && (
                                                <div className="rounded-[2rem] border border-gray-100 bg-white py-16 text-center shadow-sm">
                                                    <Package className="mx-auto h-12 w-12 text-warm-gray/30 mb-4" />
                                                    <p className="text-xl font-bold text-gray-900">{RU_DICTIONARY.ordersTab.noOrdersYet}</p>
                                                    <p className="mt-2 text-sm text-warm-gray mb-6">{orderSearch || orderStatusFilter !== 'All' ? RU_DICTIONARY.ordersTab.tryAdjustingFilters : RU_DICTIONARY.ordersTab.noOrdersPlaced}</p>
                                                    <button
                                                        onClick={() => router.push(`/`)}
                                                        className="rounded-xl bg-[#91c934] px-10 py-3 text-sm font-bold text-white shadow-md hover:bg-[#7ab52a] transition-all"
                                                    >
                                                        {RU_DICTIONARY.account.browseShop}
                                                    </button>
                                                </div>
                                            )}
                                            {!ordersLoading && filteredAndSortedOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(order => {
                                                const dtDate = new Date(order.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
                                                // Extract items from order payload regardless of formatting variations
                                                const orderItemsData = order.items || [];
                                                const itemCount = orderItemsData.length > 0 ? orderItemsData.length : Number(order.item_count || 1);

                                                // Safely acquire the first item
                                                const fItem: any = orderItemsData[0];
                                                const prodName = fItem?.product?.product_name || fItem?.product_name || order.first_item?.product_name || 'Product';
                                                const prodImg = fItem?.thumbnail_url || fItem?.product?.thumbnail_url || fItem?.product?.primary_image_url || fItem?.product?.images?.[0] || order.first_item?.thumbnail_url || null;

                                                const isSelected = selectedOrderDetails?.order_id === order.order_id;

                                                return (
                                                    <div
                                                        key={order.order_id}
                                                        onClick={() => handleViewOrderDetails(order.order_id)}
                                                        className={`rounded-[2rem] border transition-all cursor-pointer shadow-sm relative overflow-hidden flex flex-col
                                                        ${isSelected
                                                                ? 'bg-white border-[#91c934] ring-1 ring-[#91c934]/20'
                                                                : 'bg-white border-gray-100 hover:border-[#91c934]/30 hover:shadow-md'
                                                            }`}
                                                    >
                                                        {/* Header Row */}
                                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50/60 border-b border-gray-100 px-4 py-3 sm:px-6">
                                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 w-full sm:w-auto">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] uppercase tracking-widest text-warm-gray font-bold mb-0.5">{RU_DICTIONARY.ordersTab.orderId}</span>
                                                                    <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5 line-clamp-1">
                                                                        #{order.order_id.split('-')[0].toUpperCase()}
                                                                    </span>
                                                                </div>
                                                                <div className="hidden sm:block w-px h-6 bg-gray-200"></div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] uppercase tracking-widest text-warm-gray font-bold mb-0.5">{RU_DICTIONARY.ordersTab.datePlaced}</span>
                                                                    <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                                                                        {dtDate}
                                                                    </span>
                                                                </div>
                                                                <div className="hidden sm:block w-px h-6 bg-gray-200"></div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] uppercase tracking-widest text-warm-gray font-bold mb-0.5">{RU_DICTIONARY.ordersTab.totalAmount}</span>
                                                                    <span className="text-sm font-bold text-gray-900">
                                                                        {formatLocal(
                                                                            order.final_total || order.total_amount, 
                                                                            order.currency || 'USD', 
                                                                            order.currency === 'RUB' ? 'ru-RU' : order.currency === 'KRW' ? 'ko-KR' : 'en-US'
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="mt-3 sm:mt-0 flex flex-wrap gap-2 justify-end">
                                                                {!order.return_status && (
                                                                    <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border border-gray-100
                                                                        ${order.order_status === 'DELIVERED' ? 'bg-[#F2F4EB] text-[#4A5D23]' :
                                                                            order.order_status === 'SHIPPED' ? 'bg-[#EEF2F6] text-[#2C4B7D]' :
                                                                                order.order_status === 'CANCELLED' ? 'bg-[#FCEAE8] text-[#9E2A2B]' :
                                                                                    'bg-[#FCF6E5] text-[#8C6B23]'}`
                                                                    }>
                                                                        {order.order_status === 'DELIVERED' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                                                        {order.order_status === 'PENDING' && <Loader2 className="h-3 w-3 mr-1" />}
                                                                        {order.order_status === 'DELIVERED' ? RU_DICTIONARY.ordersTab.delivered.toUpperCase() : order.order_status === 'SHIPPED' ? RU_DICTIONARY.ordersTab.shipped.toUpperCase() : order.order_status === 'CANCELLED' ? RU_DICTIONARY.ordersTab.cancelled.toUpperCase() : order.order_status === 'PENDING' ? RU_DICTIONARY.ordersTab.pending.toUpperCase() : order.order_status}
                                                                    </span>
                                                                )}
                                                                {order.return_status && (
                                                                    <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border border-gray-100 ${getStatusColor(order.return_status)}`}>
                                                                        <PackageMinus className="h-3 w-3 mr-1" />
                                                                        {((RU_DICTIONARY.ordersTab?.returnStatusLabels as Record<string, string>)?.[order.return_status?.toLowerCase()] || order.return_status).toUpperCase()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Main Content */}
                                                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-6 items-start sm:items-center relative">
                                                            {/* Selected state overlay hint */}
                                                            {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#91c934]"></div>}

                                                            {/* Image */}
                                                            <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-3xl bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                                {prodImg ? (
                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                    <img src={prodImg} alt="Product" className="h-full w-full object-cover mix-blend-multiply" />
                                                                ) : (
                                                                    <Package className="h-8 w-8 text-warm-gray/40" />
                                                                )}
                                                            </div>

                                                            {/* Info */}
                                                            <div className="flex-1 w-full min-w-0 flex flex-col justify-center">
                                                                <p className="text-base font-bold text-gray-900 line-clamp-2">{prodName}</p>
                                                                {itemCount > 1 && (
                                                                    <p className="text-sm font-semibold text-warm-gray mt-1">
                                                                        {RU_DICTIONARY.ordersTab.andMore} {itemCount - 1} {RU_DICTIONARY.ordersTab.moreItems}
                                                                    </p>
                                                                )}
                                                                <p className="text-xs font-medium text-warm-gray mt-2">{RU_DICTIONARY.ordersTab.soldByVedashi}</p>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="flex flex-wrap sm:flex-col gap-2 w-full sm:w-auto shrink-0 mt-4 sm:mt-0 border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-6 justify-center">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleViewOrderDetails(order.order_id); }}
                                                                    className={`rounded-xl px-5 py-2 text-xs font-bold transition-all whitespace-nowrap border overflow-hidden
                                                                        ${isSelected ? 'bg-[#91c934] text-white border-[#91c934]' : 'bg-[#91c934] text-white border-[#91c934] hover:bg-[#7ab52a]'}
                                                                    `}
                                                                >
                                                                    {isOrderLoading && selectedOrderDetails?.order_id === order.order_id ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : RU_DICTIONARY.ordersTab.viewDetails}
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleReorder(order.order_id);
                                                                    }}
                                                                    disabled={reorderingOrderId === order.order_id}
                                                                    className="rounded-xl px-5 py-2 text-xs font-bold bg-white text-gray-900 border border-gray-100 hover:border-[#91c934]/40 hover:bg-gray-50 transition-all whitespace-nowrap disabled:opacity-50 flex items-center justify-center gap-1.5"
                                                                >
                                                                    {reorderingOrderId === order.order_id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                                                    {reorderingOrderId === order.order_id ? RU_DICTIONARY.ordersTab.reordering : RU_DICTIONARY.ordersTab.reorder}
                                                                </button>
                                                                {order.order_status === 'PENDING' && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setCancellingOrderId(order.order_id);
                                                                        }}
                                                                        className="rounded-xl px-5 py-2 text-xs font-bold bg-white text-red-600 border border-red-200 hover:border-red-400 hover:bg-red-50 transition-all whitespace-nowrap"
                                                                    >
                                                                        {RU_DICTIONARY.account.cancel}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Pagination Bottom */}
                                        {!ordersLoading && filteredAndSortedOrders.length > pageSize && (
                                            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                                                <span className="text-sm font-medium text-warm-gray">
                                                    {RU_DICTIONARY.ordersTab.showing} <strong className="text-gray-900">
                                                        {Math.min((currentPage - 1) * pageSize + 1, filteredAndSortedOrders.length)}-{Math.min(currentPage * pageSize, filteredAndSortedOrders.length)}
                                                    </strong> {RU_DICTIONARY.ordersTab.of} <strong className="text-gray-900">{filteredAndSortedOrders.length}</strong> {RU_DICTIONARY.ordersTab.orders}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                        disabled={currentPage === 1}
                                                        className={`px-4 py-2 text-sm font-bold rounded-xl border border-gray-100 transition-colors ${currentPage === 1 ? 'text-warm-gray bg-white opacity-50 cursor-not-allowed' : 'text-gray-900 bg-white hover:bg-gray-50'}`}
                                                    >
                                                        {RU_DICTIONARY.account.previous}
                                                    </button>

                                                    {Array.from({ length: Math.ceil(filteredAndSortedOrders.length / pageSize) }).map((_, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => setCurrentPage(i + 1)}
                                                            className={`h-9 w-9 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center transition-all ${currentPage === i + 1 ? 'bg-[#91c934] text-white' : 'bg-white text-gray-900 border border-gray-100 hover:bg-gray-50'}`}
                                                        >
                                                            {i + 1}
                                                        </button>
                                                    ))}

                                                    <button
                                                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredAndSortedOrders.length / pageSize), p + 1))}
                                                        disabled={currentPage === Math.ceil(filteredAndSortedOrders.length / pageSize)}
                                                        className={`px-4 py-2 text-sm font-bold rounded-xl border border-gray-100 transition-colors ${currentPage === Math.ceil(filteredAndSortedOrders.length / pageSize) ? 'text-warm-gray bg-white opacity-50 cursor-not-allowed' : 'text-gray-900 bg-white hover:bg-gray-50'}`}
                                                    >
                                                        {RU_DICTIONARY.account.next}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* ── Right Column: Order Details Side Panel ── */}
                                    {selectedOrderDetails ? (
                                        <div className="w-full lg:w-[400px] flex-shrink-0 animate-in fade-in slide-in-from-right-4 duration-300">
                                            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden sticky top-32">

                                                {/* Header Bar */}
                                                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-gray-900">{RU_DICTIONARY.ordersTab.orderDetails}</h3>
                                                        <p className="text-xs font-medium text-warm-gray mt-1">{RU_DICTIONARY.ordersTab.orderIdLabel} {selectedOrderDetails.order_id.split('-')[0].toUpperCase()}</p>
                                                    </div>
                                                    <button onClick={() => setSelectedOrderDetails(null)} className="p-2 text-warm-gray hover:text-gray-900 hover:bg-gray-50 rounded-full transition-colors">
                                                        <X className="h-5 w-5" />
                                                    </button>
                                                </div>

                                                <div className="p-6 space-y-6">

                                                    {/* Track Shipment Card */}
                                                    <div className="bg-[#91c934] rounded-[24px] p-6 text-white relative overflow-hidden shadow-md">
                                                        {/* Abstract truck graphic hint */}
                                                        <Package className="absolute -right-4 -bottom-4 h-28 w-28 text-white opacity-5 mix-blend-overlay" />

                                                        <div className="flex items-center justify-between mb-8 relative z-10">
                                                            <span className="text-[10px] font-bold tracking-widest uppercase opacity-70">{RU_DICTIONARY.ordersTab.trackShipment}</span>
                                                            <span className="bg-white/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm border border-white/20">
                                                                {selectedOrderDetails.order_status}
                                                            </span>
                                                        </div>
                                                        <div className="mb-6 relative z-10">
                                                            <p className="text-xs font-medium opacity-70 mb-1">
                                                                {selectedOrderDetails.order_status === 'DELIVERED' ? RU_DICTIONARY.ordersTab.deliveredOn :
                                                                    selectedOrderDetails.order_status === 'SHIPPED' ? RU_DICTIONARY.ordersTab.shippedOn :
                                                                        selectedOrderDetails.order_status === 'CONFIRMED' ? RU_DICTIONARY.ordersTab.confirmedOn :
                                                                            RU_DICTIONARY.ordersTab.orderedOn}
                                                            </p>
                                                            <p className="text-2xl font-bold">
                                                                {selectedOrderDetails.order_status === 'DELIVERED'
                                                                    ? new Date(selectedOrderDetails.updated_at).toLocaleDateString('ru-RU', { month: 'long', day: 'numeric', year: 'numeric' })
                                                                    : new Date(selectedOrderDetails.created_at).toLocaleDateString('ru-RU', { month: 'long', day: 'numeric', year: 'numeric' })
                                                                }
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleTrackOrder(selectedOrderDetails.order_id)}
                                                            className="w-full bg-white text-gray-900 rounded-xl py-3 text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 relative z-10"
                                                        >
                                                            {RU_DICTIONARY.ordersTab.trackOrder} <ChevronRight className="h-4 w-4" />
                                                        </button>
                                                    </div>

                                                    {/* Items Summary */}
                                                    <div>
                                                        <h4 className="text-[11px] font-bold tracking-widest text-gray-900 uppercase mb-4">{RU_DICTIONARY.ordersTab.itemsSummary}</h4>
                                                        <div className="rounded-3xl border border-gray-100 bg-gray-50/50 divide-y divide-[#e5e7eb]">
                                                            {(selectedOrderDetails.items || []).map((item: any) => {
                                                                const prodImg = item.thumbnail_url || item.product?.thumbnail_url || item.product?.primary_image_url || item.product?.images?.[0] || null;
                                                                const prodName = item.product?.product_name || item.product_name || 'Product';
                                                                return (
                                                                    <div key={item.order_item_id} className="p-4 flex items-center justify-between gap-4">
                                                                        <div className="flex items-center gap-4 min-w-0">
                                                                            <div className="h-10 w-10 bg-white rounded-lg border border-gray-100 flex items-center justify-center p-1 flex-shrink-0">
                                                                                {prodImg ? (
                                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                                    <img src={prodImg} alt={prodName} className="h-full w-full object-contain mix-blend-multiply" />
                                                                                ) : (
                                                                                    <Package className="h-5 w-5 text-warm-gray/40" />
                                                                                )}
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <p className="text-xs font-bold text-gray-900 truncate">{prodName}</p>
                                                                                <p className="text-[10px] font-medium text-warm-gray mt-0.5">{RU_DICTIONARY.ordersTab.qty} {item.quantity}</p>
                                                                            </div>
                                                                        </div>
                                                                        <span className="text-xs font-bold text-gray-900 whitespace-nowrap">
                                                                            {formatLocal(
                                                                                item.unit_price || item.price || 0,
                                                                                selectedOrderDetails.currency || 'USD', 
                                                                                selectedOrderDetails.currency === 'RUB' ? 'ru-RU' : selectedOrderDetails.currency === 'KRW' ? 'ko-KR' : 'en-US'
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* Shipping Address */}
                                                    <div>
                                                        <h4 className="text-[11px] font-bold tracking-widest text-gray-900 uppercase mb-4">{RU_DICTIONARY.ordersTab.shippingAddress}</h4>
                                                        <div className="rounded-3xl border border-gray-100 bg-gray-50/50 p-4 flex items-start gap-3">
                                                            <div className="mt-0.5 text-gray-900/60">
                                                                <MapPin className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-900 mb-1">
                                                                    {selectedOrderDetails.shipping_address?.full_name || user?.name || 'Customer Name'}
                                                                </p>
                                                                <p className="text-xs text-warm-gray leading-relaxed max-w-[250px]">
                                                                    {selectedOrderDetails.shipping_address?.address_line1 || 'Address Line 1'}, {selectedOrderDetails.shipping_address?.address_line2}
                                                                    <br />
                                                                    {selectedOrderDetails.shipping_address?.city || 'City'}, {selectedOrderDetails.shipping_address?.state || 'State'} - {selectedOrderDetails.shipping_address?.pincode || 'ZIP'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Payment Info */}
                                                    <div>
                                                        <h4 className="text-[11px] font-bold tracking-widest text-gray-900 uppercase mb-4">{RU_DICTIONARY.ordersTab.paymentInfo}</h4>
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between text-xs text-warm-gray font-medium">
                                                                <span>{RU_DICTIONARY.ordersTab.subtotal}</span>
                                                                <span className="text-gray-900 font-bold">{formatLocal(
                                                                    selectedOrderDetails.subtotal || selectedOrderDetails.total_amount || 0,
                                                                    selectedOrderDetails.currency || 'USD', 
                                                                    selectedOrderDetails.currency === 'RUB' ? 'ru-RU' : selectedOrderDetails.currency === 'KRW' ? 'ko-KR' : 'en-US'
                                                                )}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-xs text-warm-gray font-medium">
                                                                <span>{RU_DICTIONARY.ordersTab.ecoShipping}</span>
                                                                <span className="text-gray-900 font-bold">{RU_DICTIONARY.ordersTab.free}</span>
                                                            </div>


                                                            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                                                <span className="text-sm font-bold text-gray-900">{RU_DICTIONARY.ordersTab.totalLabel}</span>
                                                                <span className="text-lg font-bold text-gray-900">{formatLocal(
                                                                    selectedOrderDetails.final_total || selectedOrderDetails.total_amount || 0,
                                                                    selectedOrderDetails.currency || 'USD', 
                                                                    selectedOrderDetails.currency === 'RUB' ? 'ru-RU' : selectedOrderDetails.currency === 'KRW' ? 'ko-KR' : 'en-US'
                                                                )}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Return Status Banner */}
                                                    {selectedOrderDetails?.return_status && (
                                                        <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-100 relative overflow-hidden">
                                                            <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                                                            <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-xs font-bold text-amber-900">{RU_DICTIONARY.ordersTab?.returnStatusLabel || "Статус возврата"}:</span>
                                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(selectedOrderDetails.return_status)}`}>
                                                                            {(RU_DICTIONARY.ordersTab?.returnStatusLabels as Record<string, string>)?.[selectedOrderDetails.return_status?.toLowerCase()] || selectedOrderDetails.return_status}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[11px] text-amber-800 line-clamp-1">{RU_DICTIONARY.ordersTab?.returnReason || "Причина"}: {selectedOrderDetails.return_reason}</p>
                                                                </div>
                                                                {selectedOrderDetails.return_tracking_url && (
                                                                    <a href={selectedOrderDetails.return_tracking_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-amber-200 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-bold shadow-sm transition-colors">
                                                                        <Truck className="h-3.5 w-3.5" />
                                                                        {RU_DICTIONARY.ordersTab?.returnTrackShipment || "Отследить"}
                                                                    </a>
                                                                )}
                                                                {selectedOrderDetails.return_status?.toLowerCase() === 'requested' && (
                                                                    <button
                                                                        onClick={() => handleCancelReturn(selectedOrderDetails.order_id)}
                                                                        className="flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold shadow-sm transition-colors"
                                                                    >
                                                                        <X className="h-3.5 w-3.5" />
                                                                        {(RU_DICTIONARY.ordersTab as any)?.cancelReturnButton || "Отменить возврат"}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Action Buttons */}
                                                    <div className="flex gap-3 pt-6 border-t border-gray-100 mt-6">
                                                        <button
                                                            onClick={async () => {
                                                                if (isDownloadingInvoice) return;
                                                                setIsDownloadingInvoice(true);
                                                                try {
                                                                    await downloadInvoice(selectedOrderDetails.order_id);
                                                                    toast.success(RU_DICTIONARY.ordersTab.toast.invoiceDownloaded);
                                                                } catch {
                                                                    toast.error(RU_DICTIONARY.ordersTab.toast.invoiceFailed);
                                                                } finally {
                                                                    setIsDownloadingInvoice(false);
                                                                }
                                                            }}
                                                            disabled={isDownloadingInvoice}
                                                            className={`flex-1 flex justify-center items-center gap-2 border border-gray-100 bg-white rounded-xl py-2.5 text-xs font-bold text-gray-900 transition-colors shadow-sm ${isDownloadingInvoice ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                                                        >
                                                            {isDownloadingInvoice ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} {isDownloadingInvoice ? RU_DICTIONARY.ordersTab.downloading : RU_DICTIONARY.ordersTab.invoice}
                                                        </button>
                                                        {(() => {
                                                            const linkedTicket = enquiries.find(e => e._order_id === selectedOrderDetails.order_id && e._source === 'ticket');
                                                            return linkedTicket ? (
                                                                <button
                                                                    onClick={() => router.push(ROUTES.helpCenterSupportTicket(linkedTicket._ticket_id))}
                                                                    className="flex-1 flex justify-center items-center gap-2 border border-[#91c934]/20 bg-gray-50 rounded-xl py-2.5 text-xs font-bold text-gray-900 hover:bg-white transition-colors shadow-sm"
                                                                >
                                                                    <MessageSquare className="h-3.5 w-3.5" /> {RU_DICTIONARY.ordersTab.viewTicket}
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => router.push(ROUTES.helpCenterSupport + "?orderId=" + selectedOrderDetails.order_id.split('-')[0].toUpperCase())}
                                                                    className="flex-1 flex justify-center items-center gap-2 border border-gray-100 bg-white rounded-xl py-2.5 text-xs font-bold text-gray-900 hover:bg-gray-50 transition-colors shadow-sm"
                                                                >
                                                                    <Mail className="h-3.5 w-3.5" /> {RU_DICTIONARY.ordersTab.support}
                                                                </button>
                                                            );
                                                        })()}
                                                        {selectedOrderDetails?.order_status === 'PENDING' && (
                                                            <button
                                                                onClick={() => setCancellingOrderId(selectedOrderDetails.order_id)}
                                                                className="flex-1 flex justify-center items-center gap-2 border border-red-200 bg-red-50 rounded-xl py-2.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors shadow-sm"
                                                            >
                                                                <X className="h-3.5 w-3.5" /> {RU_DICTIONARY.ordersTab.cancelOrder}
                                                            </button>
                                                        )}
                                                        {selectedOrderDetails?.order_status === 'DELIVERED' && (!selectedOrderDetails?.return_status || ['rejected', 'completed', 'cancelled'].includes(selectedOrderDetails?.return_status)) && (
                                                            <button
                                                                onClick={() => setReturningOrderId(selectedOrderDetails.order_id)}
                                                                className="flex-1 flex justify-center items-center gap-2 border border-amber-200 bg-amber-50 rounded-xl py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors shadow-sm"
                                                            >
                                                                <PackageMinus className="h-3.5 w-3.5" /> {RU_DICTIONARY.ordersTab?.returnOrder || "Вернуть товар"}
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Associated Ticket Messages Preview */}
                                                    {(() => {
                                                        const ticket = enquiries.find(e => e._order_id === selectedOrderDetails.order_id && e._source === 'ticket');
                                                        return ticket ? (
                                                            <div className="pt-6 border-t border-gray-100">
                                                                <h4 className="text-[11px] font-bold tracking-widest text-gray-900 uppercase mb-4 flex items-center gap-2">
                                                                    <MessageCircle className="h-3.5 w-3.5 text-[#D4A847]" /> {RU_DICTIONARY.ordersTab.inquiryCorrespondence}
                                                                </h4>
                                                                <div className="rounded-3xl border border-gray-100 bg-gray-50/30 p-4 space-y-3">
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-[10px] font-bold text-gray-900 uppercase">#{ticket._ticket_number || ticket.feedback_id.slice(0, 8)}</span>
                                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${ticket.status === 'resolved' || ticket.status === 'closed' ? 'bg-green-100 text-green-700' :
                                                                            ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                                                'bg-amber-100 text-amber-700'
                                                                            }`}>
                                                                            {ticket.status}
                                                                        </span>
                                                                    </div>
                                                                    <div className="relative">
                                                                        <p className="text-xs text-gray-900 line-clamp-2 italic leading-relaxed pl-3 border-l-2 border-[#91C934]/40">
                                                                            &quot;{ticket.message}&quot;
                                                                        </p>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => router.push(ROUTES.helpCenterSupportTicket(ticket._ticket_id))}
                                                                        className="w-full text-[10px] font-black uppercase tracking-[0.1em] text-gray-900 hover:text-black flex items-center justify-center gap-1.5 mt-2 py-2 rounded-lg bg-white/50 border border-white hover:border-gray-100 transition-all group"
                                                                    >
                                                                        {RU_DICTIONARY.ordersTab.accessAllMessages} <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : null;
                                                    })()}

                                                    <button
                                                        className="w-full bg-[#91c934] text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#7ab52a] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                        onClick={() => handleReorder(selectedOrderDetails.order_id, selectedOrderDetails.items)}
                                                        disabled={buyAgainLoading || reorderingOrderId === selectedOrderDetails.order_id}
                                                    >
                                                        {reorderingOrderId === selectedOrderDetails.order_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                                                        {reorderingOrderId === selectedOrderDetails.order_id ? RU_DICTIONARY.ordersTab.addingToCart : RU_DICTIONARY.ordersTab.buyAgain}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="hidden lg:block w-[400px] flex-shrink-0">
                                            {/* Empty detail state placeholder to preserve grid mapping */}
                                            <div className="bg-gray-50 border-2 border-dashed border-gray-100 rounded-[2rem] h-[600px] flex flex-col items-center justify-center text-center p-8 opacity-70 sticky top-32">
                                                <Package className="h-12 w-12 text-warm-gray/30 mb-4" />
                                                <h3 className="text-xl font-bold text-gray-900 mb-2">{RU_DICTIONARY.ordersTab.selectAnOrder}</h3>
                                                <p className="text-sm text-warm-gray leading-relaxed">{RU_DICTIONARY.ordersTab.selectAnOrderDesc}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ─── Cancel Order Confirmation Modal ─── */}
                        {isMounted && cancellingOrderId && createPortal(
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-bold text-charcoal">{RU_DICTIONARY.ordersTab.cancelOrderTitle}</h3>
                                            <button onClick={() => setCancellingOrderId(null)} className="text-warm-gray hover:text-charcoal"><X size={20} /></button>
                                        </div>
                                        <p className="text-sm text-warm-gray mb-4">{RU_DICTIONARY.ordersTab.cancelOrderDesc}</p>
                                        <textarea
                                            value={cancelReason}
                                            onChange={e => setCancelReason(e.target.value)}
                                            placeholder={RU_DICTIONARY.ordersTab.cancelReasonPlaceholder}
                                            className="w-full bg-cream rounded-xl p-4 text-sm focus:outline-none border border-transparent focus:border-burgundy/20 min-h-[120px]"
                                        />
                                        <div className="flex gap-3 mt-6">
                                            <button
                                                onClick={() => setCancellingOrderId(null)}
                                                className="flex-1 py-3 text-sm font-semibold text-charcoal hover:bg-cream transition-colors rounded-xl border border-light-border"
                                            >
                                                {RU_DICTIONARY.ordersTab.keepOrder}
                                            </button>
                                            <button
                                                onClick={() => handleCancelOrder(cancellingOrderId)}
                                                disabled={cancelSubmitting || !cancelReason}
                                                className="flex-1 py-3 text-sm font-semibold text-white bg-burgundy hover:opacity-90 transition-all rounded-xl disabled:opacity-50"
                                            >
                                                {cancelSubmitting ? RU_DICTIONARY.ordersTab.cancelling : RU_DICTIONARY.ordersTab.cancelOrder}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>,
                            document.body
                        )}

                        {/* ─── Return Order Modal ─── */}
                        {isMounted && returningOrderId && createPortal(
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-bold text-amber-900">{RU_DICTIONARY.ordersTab?.returnOrderTitle || "Запрос на возврат"}</h3>
                                            <button onClick={() => setReturningOrderId(null)} className="text-amber-800/50 hover:text-amber-900"><X size={20} /></button>
                                        </div>
                                        <p className="text-sm text-amber-800/80 mb-4">{RU_DICTIONARY.ordersTab?.returnOrderDesc || "Выберите причину возврата. После отправки наша команда рассмотрит ваш запрос и организует обратную доставку."}</p>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-amber-900 mb-1.5">{RU_DICTIONARY.ordersTab?.returnReasonLabel || "Причина возврата"}</label>
                                                <select
                                                    value={returnReason}
                                                    onChange={e => setReturnReason(e.target.value)}
                                                    className="w-full bg-amber-50 rounded-xl p-3 text-sm focus:outline-none border border-amber-100 focus:border-amber-300 text-amber-900"
                                                >
                                                    <option value="" disabled>{RU_DICTIONARY.ordersTab?.returnReasonPlaceholder || "Выберите причину..."}</option>
                                                    {Object.entries(RU_DICTIONARY.ordersTab?.returnReasons || {}).map(([key, value]) => (
                                                        <option key={key} value={value as string}>{value as string}</option>
                                                    ))}
                                                    {!RU_DICTIONARY.ordersTab?.returnReasons && (
                                                        <>
                                                            <option value="Damaged">Товар повреждён</option>
                                                            <option value="Wrong Item">Получен не тот товар</option>
                                                            <option value="Quality Issue">Качество не устраивает</option>
                                                            <option value="Other">Другое</option>
                                                        </>
                                                    )}
                                                </select>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-xs font-bold text-amber-900 mb-1.5">{RU_DICTIONARY.ordersTab?.returnDetailsLabel || "Дополнительные детали (необязательно)"}</label>
                                                <textarea
                                                    value={returnDetails}
                                                    onChange={e => setReturnDetails(e.target.value)}
                                                    placeholder={RU_DICTIONARY.ordersTab?.returnDetailsPlaceholder || "Опишите проблему подробнее..."}
                                                    className="w-full bg-amber-50 rounded-xl p-3 text-sm focus:outline-none border border-amber-100 focus:border-amber-300 min-h-[80px] text-amber-900 placeholder:text-amber-900/40"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-3 mt-6">
                                            <button
                                                onClick={() => setReturningOrderId(null)}
                                                className="flex-1 py-3 text-sm font-semibold text-amber-900 hover:bg-amber-50 transition-colors rounded-xl border border-amber-200"
                                            >
                                                {RU_DICTIONARY.ordersTab?.keepOrderReturn || "Оставить заказ"}
                                            </button>
                                            <button
                                                onClick={() => handleRequestReturn(returningOrderId)}
                                                disabled={returnSubmitting || !returnReason}
                                                className="flex-1 py-3 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-all rounded-xl disabled:opacity-50 disabled:bg-amber-400"
                                            >
                                                {returnSubmitting ? (RU_DICTIONARY.ordersTab?.submittingReturn || "Отправляем...") : (RU_DICTIONARY.ordersTab?.submitReturn || "Отправить запрос")}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>,
                            document.body
                        )}

                        {/* ─── Verified Purchase Review Modal ─── */}
                        {reviewModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                                <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden">
                                    <div className="h-1" style={{ background: 'linear-gradient(90deg, #10b981, #D4A847)' }} />
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <BadgeCheck className="h-5 w-5 text-emerald-600" />
                                                <h3 className="font-bold text-charcoal text-lg">{RU_DICTIONARY.ordersTab.verifiedPurchaseReview}</h3>
                                            </div>
                                            <button
                                                onClick={() => setReviewModal(null)}
                                                className="p-1.5 rounded-lg hover:bg-cream transition-colors text-warm-gray hover:text-charcoal"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <p className="text-sm text-warm-gray mb-4">
                                            {RU_DICTIONARY.ordersTab.reviewing} <span className="font-medium text-charcoal">{reviewModal.productName}</span>
                                        </p>
                                        <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100">
                                            <BadgeCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                            <p className="text-xs text-emerald-700">{RU_DICTIONARY.ordersTab.verifiedBadgeNote}</p>
                                        </div>
                                        <ReviewForm
                                            productId={reviewModal.productId}
                                            orderId={reviewModal.orderId}
                                            onSubmitted={() => {
                                                setReviewModal(null);
                                                toast.success(RU_DICTIONARY.ordersTab.toast.reviewSubmitted);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ═══════════════════ WISHLIST TAB ═══════════════════ */}
                        {activeTab === 'wishlist' && (
                            <div className="max-w-[1200px] space-y-12 pb-16">

                                {/* ── Sanctuary Header ── */}
                                <div className="rounded-[40px] bg-gray-50 overflow-hidden relative shadow-sm border border-gray-100 py-16 px-12">
                                    {/* Abstract background shapes matching mockup */}
                                    <div className="absolute top-0 right-0 w-[60%] h-full bg-white opacity-40 mix-blend-overlay rounded-bl-[100px] pointer-events-none -mr-12 -mt-12"></div>
                                    <div className="absolute bottom-0 left-[20%] w-[30%] h-[30%] bg-white opacity-30 mix-blend-overlay rounded-tr-[100px] pointer-events-none"></div>

                                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-12">
                                        <div className="max-w-xl">
                                            <span className="inline-block bg-white border border-gray-100 rounded-full px-4 py-1.5 text-[10px] font-bold text-gray-900 uppercase tracking-widest mb-6">
                                                {RU_DICTIONARY.account.mySanctuary}
                                            </span>
                                            <h2 className="text-5xl font-bold text-gray-900 leading-tight mb-4">
                                                {RU_DICTIONARY.account.yourPersonalWellness} <br className="hidden sm:block" /> {RU_DICTIONARY.account.wishlist}
                                            </h2>
                                            <p className="text-warm-gray text-base leading-relaxed">
                                                {RU_DICTIONARY.account.wishlistDesc}
                                            </p>
                                        </div>

                                        {/* Total Items Saved Card */}
                                        <div className="bg-white rounded-[2rem] shadow-md border border-gray-100/50 p-8 flex flex-col items-center justify-center min-w-[200px] relative z-20">
                                            <div className="h-16 w-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-4">
                                                <Heart className="h-7 w-7 text-gray-900" />
                                            </div>
                                            <p className="text-4xl font-bold text-gray-900 mb-1">{wishlistItems.length}</p>
                                            <p className="text-[10px] font-bold text-warm-gray uppercase tracking-widest">{RU_DICTIONARY.account.totalItemsSaved}</p>
                                        </div>
                                    </div>
                                </div>



                                {wishlistLoading ? (
                                    <div className="flex flex-col items-center justify-center py-24 rounded-[30px] border border-gray-100 bg-white">
                                        <Loader2 className="h-10 w-10 text-gray-900 animate-spin mb-4" />
                                        <p className="text-xl font-bold text-gray-900">{RU_DICTIONARY.account.openingSanctuary}</p>
                                    </div>
                                ) : wishlistItems.length === 0 ? (
                                    <div className="rounded-[30px] border border-gray-100 bg-white py-24 text-center">
                                        <Heart className="mx-auto h-16 w-16 text-warm-gray/30 mb-4" />
                                        <p className="text-2xl font-bold text-gray-900">{RU_DICTIONARY.account.wishlistEmpty}</p>
                                        <p className="mt-2 text-warm-gray text-lg">{wishlistItems.length > 0 ? RU_DICTIONARY.account.noMatchesSort : RU_DICTIONARY.account.saveOrganicRituals}</p>
                                        <button
                                            onClick={() => router.push(`/`)}
                                            className="mt-8 rounded-xl bg-[#91c934] px-10 py-3 text-sm font-bold text-white shadow-md hover:bg-[#7ab52a] transition-all"
                                        >
                                            {RU_DICTIONARY.account.browseShop}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                                        {wishlistItems.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((product) => (
                                            <ProductCard
                                                key={product.product_id}
                                                product={product}
                                                listName={RU_DICTIONARY.account.wishlist}
                                            />
                                        ))}

                                        {/* Find More Treasures Tile */}
                                        <div
                                            className="group flex flex-col justify-center items-center rounded-2xl border-2 border-dashed border-gray-100 bg-white p-6 transition-all hover:bg-gray-50 hover:border-transparent text-center cursor-pointer min-h-[320px]"
                                            onClick={() => router.push(`/`)}
                                        >
                                            <div className="h-12 w-12 rounded-full border-2 border-gray-100 flex items-center justify-center bg-white group-hover:border-[#91c934] group-hover:text-gray-900 text-warm-gray transition-colors mb-4 shadow-sm">
                                                <Plus className="h-5 w-5" />
                                            </div>
                                            <h3 className="text-base font-bold text-gray-900 mb-1">{RU_DICTIONARY.account.findMore}</h3>
                                            <p className="text-xs text-warm-gray leading-relaxed mb-4">{RU_DICTIONARY.account.exploreCollections}</p>
                                            <span className="rounded-xl border border-gray-100 px-4 py-2 text-xs font-bold text-gray-900 group-hover:bg-white group-hover:shadow-sm transition-all bg-white">
                                                {RU_DICTIONARY.account.browseShop}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Wishlist Pagination Bottom */}
                                {wishlistItems.length > pageSize && (
                                    <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                                        <span className="text-sm font-medium text-warm-gray">
                                            {RU_DICTIONARY.account.showing} <strong className="text-gray-900">
                                                {Math.min((currentPage - 1) * pageSize + 1, wishlistItems.length)}-{Math.min(currentPage * pageSize, wishlistItems.length)}
                                            </strong> {RU_DICTIONARY.account.of} <strong className="text-gray-900">{wishlistItems.length}</strong> {RU_DICTIONARY.account.items}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className={`px-4 py-2 text-sm font-bold rounded-xl border border-gray-100 transition-colors ${currentPage === 1 ? 'text-warm-gray bg-white opacity-50 cursor-not-allowed' : 'text-gray-900 bg-white hover:bg-gray-50'}`}
                                            >
                                                {RU_DICTIONARY.account.previous}
                                            </button>

                                            {Array.from({ length: Math.ceil(wishlistItems.length / pageSize) }).map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setCurrentPage(i + 1)}
                                                    className={`h-9 w-9 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center transition-all ${currentPage === i + 1 ? 'bg-[#91c934] text-white' : 'bg-white text-gray-900 border border-gray-100 hover:bg-gray-50'}`}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}

                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(wishlistItems.length / pageSize), p + 1))}
                                                disabled={currentPage === Math.ceil(wishlistItems.length / pageSize)}
                                                className={`px-4 py-2 text-sm font-bold rounded-xl border border-gray-100 transition-colors ${currentPage === Math.ceil(wishlistItems.length / pageSize) ? 'text-warm-gray bg-white opacity-50 cursor-not-allowed' : 'text-gray-900 bg-white hover:bg-gray-50'}`}
                                            >
                                                {RU_DICTIONARY.account.next}
                                            </button>
                                        </div>
                                    </div>
                                )}


                            </div>
                        )}

                        {/* ═══════════════════ ADDRESSES TAB ═══════════════════ */}
                        {activeTab === 'addresses' && (
                            <div className="max-w-[1200px] space-y-12 pb-16">
                                {/* ── Rituals Header ── */}
                                <div className="rounded-[40px] bg-gray-50 overflow-hidden relative shadow-sm border border-gray-100 py-16 px-12">
                                    {/* Abstract background shapes matching sanctuary aesthetic */}
                                    <div className="absolute top-0 right-0 w-[60%] h-full bg-white opacity-40 mix-blend-overlay rounded-bl-[100px] pointer-events-none -mr-12 -mt-12" />
                                    <div className="absolute bottom-0 left-[20%] w-[30%] h-[30%] bg-white opacity-30 mix-blend-overlay rounded-tr-[100px] pointer-events-none" />

                                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-12">
                                        <div className="max-w-xl">
                                            <span className="inline-block bg-white border border-[#91c934] rounded-full px-4 py-1.5 text-[10px] font-bold text-[#91c934] uppercase tracking-widest mb-6">
                                                {RU_DICTIONARY.account.manageAddresses}
                                            </span>
                                            <h2 className="text-5xl font-bold text-gray-900 leading-tight mb-4">
                                                {RU_DICTIONARY.addressesTab.header.yourAddresses}
                                            </h2>
                                            <p className="text-warm-gray text-base leading-relaxed">
                                                {RU_DICTIONARY.addressesTab.header.manageDestinations}
                                            </p>
                                        </div>

                                        {/* Add New Address Card */}
                                        {!showAddressForm && (
                                            <button
                                                onClick={() => { resetAddressForm(); setShowAddressForm(true); }}
                                                className="bg-white rounded-[2rem] shadow-md border border-gray-100/50 p-8 flex flex-col items-center justify-center min-w-[200px] relative z-20 group hover:border-[#91c934]/30 transition-all hover:shadow-lg"
                                            >
                                                <div className="h-16 w-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-4 group-hover:bg-[#91c934] transition-colors">
                                                    <Plus className="h-7 w-7 text-gray-900 group-hover:text-white transition-colors" />
                                                </div>
                                                <p className="text-xl font-bold text-gray-900 mb-1">{RU_DICTIONARY.addressesTab.form.addNewAddressCard}</p>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Address Form (animated) */}
                                {isMounted && showAddressForm && createPortal(
                                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                                            <div className="px-6 py-4 border-b border-light-border flex items-center justify-between">
                                                <h3 className="text-xl font-bold text-charcoal">
                                                    {editingAddress ? RU_DICTIONARY.addressesTab.form.editAddress : RU_DICTIONARY.addressesTab.form.addNewAddressForm}
                                                </h3>
                                                <button onClick={() => setShowAddressForm(false)} className="text-warm-gray hover:text-charcoal"><X size={20} /></button>
                                            </div>
                                            <form onSubmit={handleAddressSubmit} className="flex flex-col flex-1 overflow-hidden">
                                                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="md:col-span-2">
                                                            <label className="block text-[11px] font-bold text-warm-gray tracking-widest uppercase mb-1.5 ml-1">{RU_DICTIONARY.addressesTab.form.country}</label>
                                                            <Select
                                                                options={countryOptions}
                                                                styles={customSelectStyles}
                                                                value={countryOptions.find(opt => opt.value === addressForm.country_code)}
                                                                onChange={(opt: any) => setAddressForm({ ...addressForm, country: opt.name, country_code: opt.value })}
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="block text-[11px] font-bold text-warm-gray tracking-widest uppercase mb-1.5 ml-1">{RU_DICTIONARY.addressesTab.form.receiverName}</label>
                                                            <input
                                                                type="text"
                                                                required
                                                                value={addressForm.full_name}
                                                                onChange={e => setAddressForm({ ...addressForm, full_name: e.target.value })}
                                                                placeholder={RU_DICTIONARY.addressesTab.form.namePlaceholder}
                                                                className="w-full bg-cream rounded-xl px-4 py-3 text-sm focus:outline-none border border-transparent focus:border-burgundy/20"
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="block text-[11px] font-bold text-warm-gray tracking-widest uppercase mb-1.5 ml-1">{RU_DICTIONARY.addressesTab.form.phoneNumber}</label>
                                                            <div className="flex gap-2">
                                                                <div className="w-24 shrink-0">
                                                                    <input
                                                                        type="text"
                                                                        disabled
                                                                        value={addressDialCode}
                                                                        className="w-full bg-cream rounded-xl px-3 py-3 text-sm border-transparent text-charcoal/50"
                                                                    />
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    required
                                                                    maxLength={12}
                                                                    value={addressForm.phone}
                                                                    onChange={e => {
                                                                        const val = e.target.value.replace(/\D/g, '');
                                                                        setAddressForm({ ...addressForm, phone: val });
                                                                        if (val.length > 0 && (val.length < 7 || val.length > 12)) {
                                                                            setPhoneError(RU_DICTIONARY.addressesTab.form.phoneError);
                                                                        } else {
                                                                            setPhoneError(null);
                                                                        }
                                                                    }}
                                                                    className={`flex-1 bg-cream rounded-xl px-4 py-3 text-sm focus:outline-none border border-transparent ${phoneError ? 'border-red-500/50 focus:border-red-500' : 'focus:border-burgundy/20'}`}
                                                                />
                                                            </div>
                                                            {phoneError && <p className="text-[10px] text-red-500 mt-1 ml-1 font-medium">{phoneError}</p>}
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="block text-[11px] font-bold text-warm-gray tracking-widest uppercase mb-1.5 ml-1">{RU_DICTIONARY.addressesTab.form.pathLine1}</label>
                                                            <input
                                                                type="text"
                                                                required
                                                                value={addressForm.address_line1}
                                                                onChange={e => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                                                                className="w-full bg-cream rounded-xl px-4 py-3 text-sm focus:outline-none border border-transparent focus:border-burgundy/20"
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="block text-[11px] font-bold text-warm-gray tracking-widest uppercase mb-1.5 ml-1">{RU_DICTIONARY.addressesTab.form.pathLine2}</label>
                                                            <input
                                                                type="text"
                                                                value={addressForm.address_line2}
                                                                onChange={e => setAddressForm({ ...addressForm, address_line2: e.target.value })}
                                                                className="w-full bg-cream rounded-xl px-4 py-3 text-sm focus:outline-none border border-transparent focus:border-burgundy/20"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[11px] font-bold text-warm-gray tracking-widest uppercase mb-1.5 ml-1">{addressConfig.labels.postalCode}</label>
                                                            <div className="relative">
                                                                <input
                                                                    type="text"
                                                                    required
                                                                    value={addressForm.pincode}
                                                                    onChange={e => setAddressForm({ ...addressForm, pincode: e.target.value })}
                                                                    className="w-full bg-cream rounded-xl px-4 py-3 text-sm focus:outline-none border border-transparent focus:border-burgundy/20"
                                                                />
                                                                {isLookupLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-burgundy" />}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[11px] font-bold text-warm-gray tracking-widest uppercase mb-1.5 ml-1">{addressConfig.labels.city}</label>
                                                            <input
                                                                type="text"
                                                                required
                                                                value={addressForm.city}
                                                                onChange={e => {
                                                                    setManualEdits(prev => ({ ...prev, city: true }));
                                                                    setAddressForm({ ...addressForm, city: e.target.value });
                                                                }}
                                                                className="w-full bg-cream rounded-xl px-4 py-3 text-sm focus:outline-none border border-transparent focus:border-burgundy/20"
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="block text-[11px] font-bold text-warm-gray tracking-widest uppercase mb-1.5 ml-1">{addressConfig.labels.state}</label>
                                                            <input
                                                                type="text"
                                                                required
                                                                value={addressForm.state}
                                                                onChange={e => {
                                                                    setManualEdits(prev => ({ ...prev, state: true }));
                                                                    setAddressForm({ ...addressForm, state: e.target.value });
                                                                }}
                                                                className="w-full bg-cream rounded-xl px-4 py-3 text-sm focus:outline-none border border-transparent focus:border-burgundy/20"
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="block text-[11px] font-bold text-warm-gray tracking-widest uppercase mb-1.5 ml-1">{RU_DICTIONARY.addressesTab.form.labelTitle}</label>
                                                            <input
                                                                type="text"
                                                                required
                                                                value={addressForm.label}
                                                                onChange={e => setAddressForm({ ...addressForm, label: e.target.value })}
                                                                placeholder={RU_DICTIONARY.addressesTab.form.labelPlaceholder}
                                                                className="w-full bg-cream rounded-xl px-4 py-3 text-sm focus:outline-none border border-transparent focus:border-burgundy/20"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 pt-2 pb-2">
                                                        <input
                                                            type="checkbox"
                                                            id="is_default"
                                                            checked={addressForm.is_default}
                                                            onChange={e => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                                                            className="w-4 h-4 rounded text-burgundy focus:ring-burgundy"
                                                        />
                                                        <label htmlFor="is_default" className="text-sm text-charcoal font-medium cursor-pointer select-none">{RU_DICTIONARY.addressesTab.form.setPrincipal}</label>
                                                    </div>
                                                </div>
                                                <div className="p-6 border-t border-light-border bg-gray-50 flex gap-3 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowAddressForm(false)}
                                                        className="flex-1 py-3 text-sm font-semibold text-charcoal hover:bg-cream transition-colors rounded-xl border border-light-border bg-white"
                                                    >
                                                        {RU_DICTIONARY.addressesTab.form.back}
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="flex-1 py-3 text-sm font-semibold text-white bg-[#91c934] hover:bg-[#7ab52a] transition-all rounded-xl shadow-lg border border-[#7ab52a]"
                                                    >
                                                        {editingAddress ? RU_DICTIONARY.addressesTab.form.saveChanges : RU_DICTIONARY.addressesTab.form.addAddressBtn}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>,
                                    document.body
                                )}

                                {addressesLoading ? (
                                    <div className="flex justify-center py-24">
                                        <Loader2 className="h-12 w-12 animate-spin text-gray-900" />
                                    </div>
                                ) : addresses.length === 0 && !showAddressForm ? (
                                    <div className="rounded-[30px] border border-gray-100 bg-white py-24 text-center">
                                        <MapPin className="mx-auto h-16 w-16 text-warm-gray/30 mb-4" />
                                        <p className="text-2xl font-bold text-gray-900">{RU_DICTIONARY.addressesTab.empty.noSavedRituals}</p>
                                        <p className="mt-2 text-warm-gray text-lg">{RU_DICTIONARY.addressesTab.empty.defineFirstSpace}</p>
                                        <button
                                            onClick={() => { resetAddressForm(); setShowAddressForm(true); }}
                                            className="mt-8 rounded-xl bg-[#91c934] px-10 py-3 text-sm font-bold text-white shadow-md hover:bg-[#7ab52a] transition-all"
                                        >
                                            <Plus className="inline h-4 w-4 mr-2" strokeWidth={3} /> {RU_DICTIONARY.addressesTab.empty.addAddress}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid gap-6 sm:grid-cols-2">
                                        {addresses.map(addr => (
                                            <div key={addr.address_id}
                                                className={`group relative rounded-[2rem] border bg-white p-6 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 ${addr.is_default ? 'border-[#91c934] ring-1 ring-[#91c934]/20 shadow-md' : 'border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]'}`}
                                            >
                                                {/* Default badge */}
                                                {addr.is_default && (
                                                    <div className="absolute -top-3 left-6 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[10px] font-bold text-white shadow-md"
                                                        style={{ background: 'linear-gradient(135deg, #91c934, #7ab52a)' }}>
                                                        <Star className="h-3 w-3 fill-[#FFD801] text-[#FFD801]" /> {RU_DICTIONARY.addressesTab.list.primarySpace}
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-start">
                                                    <div className="pt-2">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center border border-gray-100">
                                                                <MapPin className="h-5 w-5 text-gray-900" />
                                                            </div>
                                                            {addr.label && (
                                                                <span className="bg-[#91c934]/10 text-gray-900 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                                    {addr.label}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-base font-bold text-gray-900 leading-tight">{addr.full_name}</p>
                                                            <p className="text-sm text-warm-gray font-medium">{addr.address_line1}</p>
                                                            {addr.address_line2 && <p className="text-sm text-warm-gray font-medium">{addr.address_line2}</p>}
                                                            <p className="text-sm text-warm-gray font-medium tracking-wide">
                                                                {addr.city}, {addr.state} {addr.pincode}
                                                            </p>
                                                            {addr.country && (
                                                                <p className="text-sm text-warm-gray font-medium">{addr.country}</p>
                                                            )}
                                                        </div>

                                                        {addr.phone && (
                                                            <div className="mt-5 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 w-fit">
                                                                <Phone className="h-3 w-3 text-warm-gray" />
                                                                <span className="text-xs font-bold text-gray-900">{formatAddressPhone(addr.phone)}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                        {!addr.is_default && (
                                                            <button onClick={() => handleSetDefault(addr)}
                                                                title={RU_DICTIONARY.addressesTab.list.setPrimary}
                                                                className="h-9 w-9 flex items-center justify-center text-warm-gray hover:text-[#91c934] transition-all bg-white rounded-xl border border-gray-100 hover:border-[#91c934]/30 hover:shadow-sm">
                                                                <Star className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        <button onClick={() => startEditAddress(addr)}
                                                            title={RU_DICTIONARY.addressesTab.list.editDetails}
                                                            className="h-9 w-9 flex items-center justify-center text-warm-gray hover:text-gray-900 transition-all bg-white rounded-xl border border-gray-100 hover:border-[#91c934]/30 hover:shadow-sm">
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => setDeletingAddressId(addr.address_id)}
                                                            title={RU_DICTIONARY.addressesTab.list.deleteSpace}
                                                            className="h-9 w-9 flex items-center justify-center text-warm-gray hover:text-red-500 transition-all bg-white rounded-xl border border-gray-100 hover:border-red-200 hover:shadow-sm">
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ═══════════════════ PROFILE TAB ═══════════════════ */}
                        {activeTab === 'profile' && (
                            <div className="max-w-[1000px] space-y-8 pb-12">
                                {/* ── Top User Card ── */}
                                <div className="rounded-[2rem] bg-white shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-full pointer-events-none opacity-[0.03]">
                                        <svg viewBox="0 0 100 100" className="w-full h-full text-gray-900 fill-current">
                                            <path d="M50 0C50 0 100 20 100 50C100 80 50 100 50 100C50 100 0 80 0 50C0 20 50 0 50 0Z" />
                                        </svg>
                                    </div>
                                    <div className="flex items-center gap-6 relative z-10">
                                        <div className="relative group">
                                            <div className="h-28 w-28 rounded-full border-4 border-white shadow-md overflow-hidden bg-cream-dark flex items-center justify-center">
                                                {profileImageUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={profileImageUrl}
                                                        alt="Profile"
                                                        className="h-full w-full object-cover cursor-pointer hover:scale-110 transition-transform duration-500"
                                                        onClick={() => setIsZoomModalOpen(true)}
                                                        onError={() => {
                                                            if (base64Fallback && profileImageUrl !== base64Fallback) {
                                                                setProfileImageUrl(base64Fallback);
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <span className="text-3xl font-bold text-gray-900">
                                                        {user?.name?.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                                {imageUploading && (
                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                                                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Image Action Buttons */}
                                            <div className="absolute -bottom-1 -right-1 flex gap-2">
                                                {profileImageUrl && !imageUploading && (
                                                    <button
                                                        onClick={handleRemoveImage}
                                                        className="h-8 w-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-200"
                                                        title={RU_DICTIONARY.profileTab.image.removePhoto}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={imageUploading}
                                                    className="h-8 w-8 rounded-full bg-[#91c934] text-white flex items-center justify-center shadow-md hover:bg-[#7ab52a] transition-transform hover:scale-110 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#91c934]/30"
                                                    title={RU_DICTIONARY.profileTab.image.uploadPhoto}
                                                >
                                                    <Camera className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h2 className="text-3xl font-bold text-gray-900">{profileData.full_name || user?.name}</h2>
                                                <span className="bg-[#D4A847]/20 text-[#B38720] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                                    {RU_DICTIONARY.profileTab.overview.lifetimeMember}
                                                </span>
                                            </div>
                                            <p className="text-sm text-warm-gray font-medium">{RU_DICTIONARY.profileTab.overview.memberSince} {profileData.created_at ? new Date(profileData.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : RU_DICTIONARY.profileTab.overview.fallbackDate}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8 relative z-10">
                                        <div className="text-center">
                                            <p className="text-3xl font-bold text-gray-900 mb-1">{orderCount}</p>
                                            <p className="text-[10px] font-bold text-warm-gray tracking-widest uppercase">{RU_DICTIONARY.profileTab.overview.ritualsDone}</p>
                                        </div>
                                        <div className="w-px h-12 bg-gray-200"></div>
                                        <div className="text-center">
                                            <p className="text-3xl font-bold text-gray-900 mb-1">{reviewsCount}</p>
                                            <p className="text-[10px] font-bold text-warm-gray tracking-widest uppercase">{RU_DICTIONARY.profileTab.overview.soulfulReviews}</p>
                                        </div>
                                        <div className="w-px h-12 bg-gray-200"></div>
                                        <div className="text-center">
                                            <p className="text-3xl font-bold text-[#FFD801] mb-1">{activePoints}</p>
                                            <p className="text-[10px] font-bold text-[#FFD801] tracking-widest uppercase flex items-center gap-1 justify-center">
                                                <Star className="h-2.5 w-2.5" /> {RU_DICTIONARY.profileTab.overview.seedPoints}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Two Column Layout ── */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                                    {/* Left Column (Forms) */}
                                    <div className="lg:col-span-2 space-y-8">
                                        {/* Personal Essence */}
                                        <section className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-full opacity-50 pointer-events-none"></div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                                <span className="w-1.5 h-6 bg-[#91c934] rounded-full inline-block"></span>
                                                {RU_DICTIONARY.profileTab.form.personalEssence}
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                                <div>
                                                    <label className="block flex items-center gap-1.5 text-[11px] font-bold text-warm-gray uppercase tracking-widest mb-2"><User className="h-3 w-3" /> {RU_DICTIONARY.profileTab.form.fullIdentity}</label>
                                                    <input type="text" value={profileData.full_name} onChange={e => setProfileData({ ...profileData, full_name: e.target.value })}
                                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#91c934] focus:ring-1 focus:ring-[#91c934]/20 transition-all font-medium text-gray-900" />
                                                </div>
                                                <div>
                                                    <label className="block flex items-center gap-1.5 text-[11px] font-bold text-warm-gray uppercase tracking-widest mb-2"><Mail className="h-3 w-3" /> {RU_DICTIONARY.profileTab.form.soulfulMail}</label>
                                                    <input type="email" value={profileData.email} onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#91c934] focus:ring-1 focus:ring-[#91c934]/20 transition-all font-medium text-gray-900" />
                                                </div>
                                                <div>
                                                    <label className="block flex items-center gap-1.5 text-[11px] font-bold text-warm-gray uppercase tracking-widest mb-2"><Phone className="h-3 w-3" /> {RU_DICTIONARY.profileTab.form.mobileNumber}</label>
                                                    <div className="flex gap-2">
                                                        <div className="w-1/3 min-w-[120px]">
                                                            <Select
                                                                options={COUNTRY_CODES.map(c => ({
                                                                    value: c.dial_code,
                                                                    label: `${c.flag} ${c.dial_code}`,
                                                                    name: c.name
                                                                }))}
                                                                value={{
                                                                    value: selectedCountryCode,
                                                                    label: `${COUNTRY_CODES.find(c => c.dial_code === selectedCountryCode)?.flag || ''} ${selectedCountryCode}`
                                                                }}
                                                                onChange={(val: any) => setSelectedCountryCode(val.value)}
                                                                styles={{
                                                                    ...customSelectStyles,
                                                                    control: (base: any, state: any) => ({
                                                                        ...customSelectStyles.control(base, state),
                                                                        paddingLeft: '10px',
                                                                        backgroundColor: '#F8F5F0',
                                                                    })
                                                                }}
                                                                placeholder={RU_DICTIONARY.profileTab.form.code}
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <input type="tel" value={profileData.phone}
                                                                maxLength={15}
                                                                onChange={e => {
                                                                    // Allow only digits, spaces, hyphens
                                                                    const val = e.target.value.replace(/[^\d\s\-]/g, '');
                                                                    setProfileData({ ...profileData, phone: val });
                                                                }}
                                                                placeholder="98765 43210"
                                                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-[9px] text-sm focus:outline-none focus:border-[#91c934] focus:ring-1 focus:ring-[#91c934]/20 transition-all font-medium text-gray-900" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block flex items-center gap-1.5 text-[11px] font-bold text-warm-gray uppercase tracking-widest mb-2"><Calendar className="h-3 w-3" /> {RU_DICTIONARY.profileTab.form.dateOfBirth}</label>
                                                    <input type="date" value={profileData.date_of_birth} onChange={e => setProfileData({ ...profileData, date_of_birth: e.target.value })}
                                                        max={new Date().toISOString().split("T")[0]}
                                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-[9px] text-sm focus:outline-none focus:border-[#91c934] focus:ring-1 focus:ring-[#91c934]/20 transition-all font-medium text-gray-900 min-h-[44px]" />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block flex items-center gap-1.5 text-[11px] font-bold text-warm-gray uppercase tracking-widest mb-2"><MapPin className="h-3 w-3" /> {RU_DICTIONARY.profileTab.form.currentLocation}</label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            readOnly
                                                            value={(() => {
                                                                const addr = addresses.find(a => a.is_default) || addresses[0];
                                                                return addr ? `${addr.city}, ${addr.state}, ${addr.country} - ${addr.pincode}` : RU_DICTIONARY.profileTab.form.noAddressAdded;
                                                            })()}
                                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all font-medium text-warm-gray cursor-not-allowed"
                                                            title={RU_DICTIONARY.profileTab.form.locationDerived}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        {/* Security Sanctuary & Notification Harmony Row */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Security Sanctuary */}
                                            <section className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-bl-full opacity-50 pointer-events-none"></div>
                                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                    <span className="w-1.5 h-6 bg-[#91c934] rounded-full inline-block"></span>
                                                    {RU_DICTIONARY.profileTab.security.securitySanctuary}
                                                </h3>
                                                <p className="text-sm text-warm-gray mb-6 leading-relaxed">{RU_DICTIONARY.profileTab.security.protectSanctum}</p>
                                                <button
                                                    onClick={() => setShowPasswordModal(true)}
                                                    className="w-full rounded-xl border border-gray-100 py-3.5 text-sm font-bold text-gray-900 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 mb-2"
                                                >
                                                    {profileData.has_password ? RU_DICTIONARY.profileTab.security.modifyAccessPassword : RU_DICTIONARY.profileTab.security.setAccessPassword} <ChevronRight className="h-4 w-4" />
                                                </button>
                                                {profileData.has_password && <p className="text-xs text-warm-gray text-center mt-3">{RU_DICTIONARY.profileTab.security.accountSecured}</p>}
                                            </section>

                                            {/* Notification Harmony */}
                                            <section className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden group hover:border-[#91c934] transition-all duration-300">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-bl-full opacity-50 pointer-events-none group-hover:bg-[#f0fdf4] transition-colors"></div>
                                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                    <span className="w-1.5 h-6 bg-[#91c934] rounded-full inline-block"></span>
                                                    {RU_DICTIONARY.profileTab.security.notificationHarmony}
                                                </h3>
                                                <p className="text-sm text-warm-gray mb-6 leading-relaxed">{RU_DICTIONARY.profileTab.security.tuneAlerts}</p>
                                                <button
                                                    onClick={() => setShowNotificationModal(true)}
                                                    className="w-full rounded-xl border border-gray-100 py-3.5 px-4 text-sm font-bold text-gray-900 hover:bg-gray-50 hover:border-[#91c934]/30 transition-all flex items-center justify-center gap-3 group-hover:shadow-sm"
                                                >
                                                    <BellRing className="h-4 w-4 flex-shrink-0" />
                                                    <span className="text-center leading-tight">{RU_DICTIONARY.profileTab.security.manageNotifications}</span>
                                                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                                                </button>
                                            </section>
                                        </div>
                                    </div>

                                    {/* Right Column (Side Panels) */}
                                    <div className="space-y-8">

                                        {/* Actions */}
                                        <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] text-center">
                                            <button
                                                disabled={profileSaving}
                                                onClick={handleProfileSave}
                                                className="w-full bg-[#91c934] text-white rounded-xl py-4 text-sm font-bold shadow-md hover:bg-[#7ab52a] hover:shadow-lg transition-all flex items-center justify-center gap-2 mb-4"
                                            >
                                                {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                {RU_DICTIONARY.profileTab.actions.saveAllChanges}
                                            </button>
                                            <button
                                                onClick={() => { fetchProfile(); toast.success(RU_DICTIONARY.profileTab.toasts.discarded); }}
                                                className="text-xs font-bold text-warm-gray hover:text-gray-900 transition-colors border-b border-warm-gray/30 pb-0.5 hover:border-[#91c934]"
                                            >
                                                {RU_DICTIONARY.profileTab.actions.discardModifications}
                                            </button>
                                        </div>

                                        {/* Active Plan / Loyalty Status */}
                                        <div className="bg-[#83BD2E] rounded-[2rem] p-6 text-white relative overflow-hidden shadow-lg border border-[#91C934]/30 group hover:border-[#91C934] transition-all duration-500">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <Star className="h-16 w-16 text-[#D4A847]" />
                                            </div>
                                            <p className="text-[10px] font-bold tracking-[0.2em] text-white mb-2 uppercase">{RU_DICTIONARY.profileTab.actions.activePlan}</p>
                                            <h3 className="text-2xl font-bold text-[#FFD801] mb-2">{RU_DICTIONARY.account.loyaltySidebar.tiers[activeTier as keyof typeof RU_DICTIONARY.account.loyaltySidebar.tiers] || activeTier} {RU_DICTIONARY.profileTab.actions.ritualist}</h3>
                                            <p className="text-sm text-white leading-relaxed mb-6">
                                                {loyaltyData?.tier?.benefits && Array.isArray(loyaltyData?.tier?.benefits) && loyaltyData?.tier?.benefits.length > 0
                                                    ? loyaltyData?.tier?.benefits.join(', ')
                                                    : RU_DICTIONARY.profileTab.actions.enhanceAura
                                                }
                                            </p>
                                            <button
                                                onClick={() => router.push(ROUTES.accountTab(ACCOUNT_TABS.wallet))}
                                                className="w-full rounded-xl bg-[#FFD801] text-[#1f2937] py-3 text-sm font-bold hover:bg-[#FFD801]/80 transition-all transform active:scale-95 shadow-lg"
                                            >
                                                {RU_DICTIONARY.profileTab.actions.manageRewards}
                                            </button>
                                        </div>

                                        {/* Account Status */}
                                        <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
                                            <p className="text-[10px] font-bold tracking-widest text-warm-gray mb-4">{RU_DICTIONARY.profileTab.status.accountStatus}</p>
                                            <div className="space-y-4 mb-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-4 w-4 text-gray-900" />
                                                        <span className="text-sm font-medium text-gray-900">{RU_DICTIONARY.profileTab.status.email}</span>
                                                    </div>
                                                    {profileData.is_email_verified ? (
                                                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {RU_DICTIONARY.profileTab.status.verified}</span>
                                                    ) : (
                                                        <button onClick={() => router.push(`/verify-email`)} className="text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {RU_DICTIONARY.profileTab.status.verify}</button>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-4 w-4 text-gray-900" />
                                                        <span className="text-sm font-medium text-gray-900">{RU_DICTIONARY.profileTab.status.mobile}</span>
                                                    </div>
                                                    {profileData.is_mobile_verified ? (
                                                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {RU_DICTIONARY.profileTab.status.verified}</span>
                                                    ) : (
                                                        <button onClick={() => router.push(`/podtverzhdenie-otp`)} className="text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {RU_DICTIONARY.profileTab.status.verify}</button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="border-t border-gray-100 pt-5">
                                                <button
                                                    onClick={() => { setDeactivatePassword(''); setShowDeactivateModal(true); }}
                                                    className="w-full flex items-center justify-center gap-3 px-4 text-sm font-bold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl py-3 transition-colors"
                                                >
                                                    <ShieldOff className="h-4 w-4 flex-shrink-0" />
                                                    <span className="text-center leading-tight">{RU_DICTIONARY.profileTab.status.initiateDeletion}</span>
                                                </button>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ═══════════════════ SUPPORT & ENQUIRIES TAB ═══════════════════ */}
                        {activeTab === 'support' && (
                            <div className="flex flex-col gap-6 w-full max-w-[1100px] mx-auto animate-fadeIn pb-12">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                                            <MessageSquare className="h-6 w-6 text-gray-900" />
                                        </div>
                                        <div>
                                            <h1 className="text-3xl font-bold text-gray-900">{RU_DICTIONARY.account.supportEnquiries}</h1>
                                            <p className="text-sm text-warm-gray">{RU_DICTIONARY.supportTab.header.viewAndManage}</p>
                                        </div>
                                    </div>
                                    {selectedEnquiry && (
                                        <button
                                            onClick={() => setSelectedEnquiry(null)}
                                            className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-900 hover:bg-gray-50 transition-colors"
                                        >
                                            {RU_DICTIONARY.supportTab.header.backToList}
                                        </button>
                                    )}
                                </div>

                                {selectedEnquiry ? (
                                    /* ENQUIRY DETAIL VIEW */
                                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 animate-fadeIn">
                                        {/* Main Conversation Area */}
                                        <div className="space-y-6">
                                            {/* Original Issue Card */}
                                            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                                                <div className="p-6 md:p-8 bg-[#91c934]/5 border-b border-gray-100">
                                                    <div className="flex items-start justify-between gap-4 mb-4">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-900/60">{selectedEnquiry.type || RU_DICTIONARY.supportTab.detail.fallbackInquiry}</span>
                                                                <span className="h-1 w-1 rounded-full bg-gray-200"></span>
                                                                <span className="text-[10px] font-bold text-warm-gray uppercase tracking-widest">{new Date(selectedEnquiry.created_at).toLocaleDateString()}</span>
                                                            </div>
                                                            <h2 className="text-2xl font-bold text-gray-900 capitalize">{selectedEnquiry.subject || RU_DICTIONARY.supportTab.detail.fallbackSubject}</h2>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${selectedEnquiry.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-[#D4A847]/20 text-[#B38720]'
                                                            }`}>
                                                            {getLocalizedEnquiryStatus(selectedEnquiry.status) || RU_DICTIONARY.supportTab.detail.fallbackPending}
                                                        </span>
                                                    </div>
                                                    <div className="prose prose-sm max-w-none text-gray-900 leading-relaxed">
                                                        <p className="whitespace-pre-wrap">{selectedEnquiry.message}</p>
                                                    </div>
                                                </div>

                                                {/* Replies History */}
                                                <div className="p-6 md:p-8 space-y-8">
                                                    <div className="space-y-8 relative">
                                                        {/* Vertical Timeline Line */}
                                                        <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-200 hidden md:block"></div>

                                                        {(!selectedEnquiry.replies || selectedEnquiry.replies.length === 0) ? (
                                                            <div className="text-center py-10">
                                                                <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                                                    <Clock className="h-8 w-8 text-warm-gray" />
                                                                </div>
                                                                <p className="text-sm font-bold text-gray-900">{RU_DICTIONARY.supportTab.empty.awaitingAdmin}</p>
                                                                <p className="text-xs text-warm-gray mt-1 max-w-[240px] mx-auto leading-relaxed">{RU_DICTIONARY.supportTab.empty.supportReceived}</p>
                                                            </div>
                                                        ) : (
                                                            selectedEnquiry.replies.map((reply: any, idx: number) => (
                                                                <div key={idx} className={`relative flex flex-col md:flex-row gap-4 items-start ${reply.author_type === 'admin' ? 'justify-start' : 'justify-end md:flex-row-reverse'}`}>
                                                                    {/* Avatar or Icon */}
                                                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 border-white shadow-sm ${reply.author_type === 'admin' ? 'bg-[#91c934] text-white' : 'bg-[#D4A847] text-white'}`}>
                                                                        {reply.author_type === 'admin' ? <Shield className="h-5 w-5" /> : <User2 className="h-5 w-5" />}
                                                                    </div>

                                                                    <div className={`flex-1 w-full p-5 rounded-3xl border ${reply.author_type === 'admin'
                                                                        ? 'bg-gray-50 border-gray-100 rounded-tl-none'
                                                                        : 'bg-white border-gray-100 rounded-tr-none'
                                                                        }`}>
                                                                        <div className="flex items-center justify-between gap-4 mb-2">
                                                                            <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">
                                                                                {reply.author_type === 'admin' ? RU_DICTIONARY.supportTab.detail.supportSpecialist : RU_DICTIONARY.supportTab.detail.you}
                                                                            </span>
                                                                            <span className="text-[10px] font-medium text-warm-gray">
                                                                                {new Date(reply.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                                                                            {reply.message}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>

                                                    {/* User Reply Box (Continuous Chatting) */}
                                                    {selectedEnquiry.status !== 'resolved' && selectedEnquiry.status !== 'dismissed' && (
                                                        <div className="mt-8 pt-8 border-t border-gray-100">
                                                            <div className="relative">
                                                                <textarea
                                                                    value={enquiryReplyText}
                                                                    onChange={(e) => setEnquiryReplyText(e.target.value)}
                                                                    placeholder={RU_DICTIONARY.supportTab.detail.typeMessage}
                                                                    className="w-full min-h-[120px] p-5 bg-gray-50 border border-gray-100 rounded-3xl text-sm focus:outline-none focus:border-[#91C934]/40 transition-all resize-none placeholder:text-warm-gray/60"
                                                                />
                                                                <div className="absolute bottom-4 right-4 flex items-center gap-3">
                                                                    <button
                                                                        onClick={handleSendEnquiryReply}
                                                                        disabled={isSendingEnquiryReply || !enquiryReplyText.trim()}
                                                                        className="bg-[#91c934] text-white p-3 rounded-xl hover:bg-[#7ab52a] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md group"
                                                                    >
                                                                        <Send className={`h-5 w-5 transition-transform ${isSendingEnquiryReply ? 'animate-pulse' : 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5'}`} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <p className="text-[10px] text-warm-gray mt-3 px-1 italic">{RU_DICTIONARY.supportTab.detail.teamResponds}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Quick Actions Card */}
                                            <div className="bg-[#91c934] rounded-[2rem] p-8 text-white relative overflow-hidden shadow-lg">
                                                <div className="absolute top-0 right-0 p-6 opacity-10">
                                                    <MessageCircle className="h-20 w-20" />
                                                </div>
                                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                                    <div>
                                                        <h3 className="text-2xl font-bold text-[#D4A847] mb-2">{RU_DICTIONARY.supportTab.sidebar.addMoreInfo}</h3>
                                                        <p className="text-sm text-white/80 max-w-md">{RU_DICTIONARY.supportTab.sidebar.teamHereToHelp}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => router.push(ROUTES.helpCenterSupport)}
                                                        className="bg-[#D4A847] text-gray-900 px-8 py-3 rounded-xl text-sm font-bold shadow-md hover:bg-[#B38720] transition-colors whitespace-nowrap"
                                                    >{RU_DICTIONARY.supportTab.sidebar.submitNew}</button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sidebar Info Area */}
                                        <div className="space-y-6">
                                            <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                                                <h3 className="text-lg font-bold text-gray-900 mb-4">{RU_DICTIONARY.supportTab.sidebar.ticketInsight}</h3>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center text-xs pb-3 border-b border-gray-100">
                                                        <span className="text-warm-gray font-medium">{RU_DICTIONARY.supportTab.sidebar.ticketId}</span>
                                                        <span className="font-bold text-gray-900 uppercase">#{selectedEnquiry.feedback_id.slice(0, 8)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs pb-3 border-b border-gray-100">
                                                        <span className="text-warm-gray font-medium">{RU_DICTIONARY.supportTab.sidebar.requestedOn}</span>
                                                        <span className="font-bold text-gray-900">{new Date(selectedEnquiry.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs pb-3 border-b border-gray-100">
                                                        <span className="text-warm-gray font-medium">{RU_DICTIONARY.supportTab.sidebar.priorityRange}</span>
                                                        <span className="font-bold text-amber-600">{RU_DICTIONARY.supportTab.sidebar.standardPriority}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-warm-gray font-medium">{RU_DICTIONARY.supportTab.sidebar.category}</span>
                                                        <span className="font-bold text-gray-900 capitalize">{selectedEnquiry.type || RU_DICTIONARY.supportTab.sidebar.fallbackGeneral}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                                                <h3 className="text-lg font-bold text-gray-900 mb-4">{RU_DICTIONARY.supportTab.sidebar.supportPhilosophy}</h3>
                                                <p className="text-[11px] leading-relaxed text-warm-gray mb-4">{RU_DICTIONARY.supportTab.sidebar.philosophyText}</p>
                                                <button
                                                    onClick={() => router.push(ROUTES.helpCenter)}
                                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-100 text-xs font-bold text-gray-900 hover:bg-gray-50 transition-colors"
                                                >
                                                    <FileText className="h-3.5 w-3.5" /> {RU_DICTIONARY.supportTab.sidebar.viewHelpCenter}</button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* ENQUIRY LIST VIEW */
                                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden animate-fadeIn">
                                        <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between bg-[#91c934]/5">
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">{RU_DICTIONARY.supportTab.header.historyTitle}</h2>
                                                <p className="text-xs text-warm-gray mt-1">{RU_DICTIONARY.supportTab.header.historyDesc}</p>
                                            </div>

                                        </div>

                                        <div className="divide-y divide-gray-100">
                                            {enquiriesLoading ? (
                                                <div className="py-20 flex flex-col items-center justify-center">
                                                    <Loader2 className="h-10 w-10 animate-spin text-gray-900 mb-4" />
                                                    <p className="text-sm font-medium text-warm-gray uppercase tracking-widest">{RU_DICTIONARY.supportTab.empty.recallingHistory}</p>
                                                </div>
                                            ) : enquiries.length === 0 ? (
                                                <div className="py-20 text-center">
                                                    <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center mx-auto mb-6 border border-gray-100">
                                                        <MessageSquare className="h-10 w-10 text-warm-gray/40" />
                                                    </div>
                                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{RU_DICTIONARY.supportTab.empty.noPastEnquiries}</h3>
                                                    <p className="text-sm text-warm-gray max-w-xs mx-auto mb-8">{RU_DICTIONARY.supportTab.empty.pathSmooth}</p>
                                                    <button
                                                        onClick={() => router.push(ROUTES.helpCenterSupport)}
                                                        className="bg-[#91c934] text-white px-8 py-3 rounded-xl text-sm font-bold shadow-md hover:bg-[#7ab52a] transition-colors"
                                                    >{RU_DICTIONARY.supportTab.empty.createNewTicket}</button>
                                                </div>
                                            ) : (
                                                enquiries.map((enquiry) => (
                                                    <div
                                                        key={enquiry.feedback_id}
                                                        onClick={async () => {
                                                            if (enquiry._source === 'ticket') {
                                                                if (enquiry._order_id) {
                                                                    // Redirect to the Orders tab with the specific order selected
                                                                    router.push(ROUTES.accountTab(ACCOUNT_TABS.orders) + '?orderId=' + enquiry._order_id);
                                                                } else {
                                                                    // Redirect to the dedicated ticket detail page
                                                                    router.push(ROUTES.helpCenterSupportTicket(enquiry._ticket_id));
                                                                }
                                                            } else {
                                                                setSelectedEnquiry(enquiry);
                                                            }
                                                        }}
                                                        className="p-6 transition-all hover:bg-gray-50 cursor-pointer group"
                                                    >
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-3 mb-2">
                                                                    {enquiry._source === 'ticket' && (
                                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-100 text-blue-700">
                                                                            {RU_DICTIONARY.supportTab.list.ticketBadge}
                                                                        </span>
                                                                    )}
                                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${enquiry.status === 'resolved' || enquiry.status === 'closed' ? 'bg-green-100 text-green-700' :
                                                                        enquiry.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                                            'bg-[#D4A847]/20 text-[#B38720]'
                                                                        }`}>
                                                                        {getLocalizedEnquiryStatus(enquiry.status) || RU_DICTIONARY.supportTab.detail.fallbackPending}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-warm-gray uppercase tracking-widest">
                                                                        {new Date(enquiry.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                    </span>
                                                                </div>
                                                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-black transition-colors truncate capitalize">
                                                                    {enquiry._source === 'ticket' && enquiry._ticket_number ? `${enquiry._ticket_number} — ` : ''}{enquiry.subject || RU_DICTIONARY.supportTab.list.fallbackEnquiry}
                                                                </h3>
                                                                <p className="text-sm text-warm-gray truncate mt-1">
                                                                    {enquiry.message}
                                                                </p>
                                                            </div>

                                                            <div className="flex items-center gap-6 flex-shrink-0">
                                                                <div className="text-center hidden md:block">
                                                                    <p className="text-xl font-bold text-gray-900">{enquiry._source === 'ticket' ? (enquiry._message_count || 0) : (enquiry.replies?.length || 0)}</p>
                                                                    <p className="text-[10px] font-bold text-warm-gray uppercase tracking-widest">{RU_DICTIONARY.supportTab.list.messages}</p>
                                                                </div>
                                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${enquiry.replies?.some((r: any) => r.type === 'admin')
                                                                    ? 'bg-amber-100 text-amber-600'
                                                                    : 'bg-gray-50 text-warm-gray group-hover:bg-[#91c934] group-hover:text-white'
                                                                    }`}>
                                                                    <ChevronRight className="h-5 w-5" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ═══════════════════ PRIVACY TAB ═══════════════════ */}
                        {activeTab === 'privacy' && (
                            <PrivacyDashboard />
                        )}

                        {/* ═══ Deactivation Confirmation Modal ═══ */}
                        {isMounted && showDeactivateModal && createPortal(
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeactivateModal(false)} />
                                <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl border border-light-border" style={{ animation: 'slideUp 0.35s ease-out' }}>
                                    <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl" style={{ background: 'linear-gradient(90deg, #6B2737, #D4A847)' }} />
                                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'rgba(107, 39, 55, 0.1)' }}>
                                        <ShieldOff className="h-7 w-7" style={{ color: '#6B2737' }} />
                                    </div>
                                    <h2 className="text-center text-xl font-bold text-charcoal mb-2">{RU_DICTIONARY.profileTab.modals.deactivation.confirmDeactivation}</h2>
                                    <p className="text-center text-sm text-warm-gray mb-6">
                                        {RU_DICTIONARY.profileTab.modals.deactivation.enterPasswordConfirm}
                                    </p>
                                    <input
                                        type="password"
                                        value={deactivatePassword}
                                        onChange={e => setDeactivatePassword(e.target.value)}
                                        placeholder={RU_DICTIONARY.profileTab.modals.deactivation.enterYourPassword}
                                        className="w-full rounded-lg border border-light-border px-4 py-3 text-sm focus:border-burgundy focus:outline-none mb-6"
                                        autoFocus
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowDeactivateModal(false)}
                                            disabled={deactivating}
                                            className="flex-1 rounded-xl border border-light-border py-3 text-sm font-medium text-charcoal hover:bg-cream transition-colors disabled:opacity-50"
                                        >
                                            {RU_DICTIONARY.account.cancel}
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (!deactivatePassword) { toast.error(RU_DICTIONARY.profileTab.toasts.passwordRequired); return; }
                                                setDeactivating(true);
                                                try {
                                                    const res = await deactivateAccount(deactivatePassword);
                                                    if (res.success) {
                                                        setShowDeactivateModal(false);
                                                        logout();
                                                        toast.success(RU_DICTIONARY.profileTab.toasts.accountDeactivated);
                                                        router.push('/');
                                                    } else {
                                                        toast.error(res.message || RU_DICTIONARY.profileTab.toasts.deactivateFailed);
                                                    }
                                                } catch {
                                                    toast.error(RU_DICTIONARY.profileTab.toasts.generalServerError);
                                                } finally {
                                                    setDeactivating(false);
                                                }
                                            }}
                                            disabled={deactivating || !deactivatePassword}
                                            className="flex-1 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:shadow-md disabled:opacity-50"
                                            style={{ backgroundColor: '#6B2737' }}
                                        >
                                            {deactivating ? RU_DICTIONARY.profileTab.modals.deactivation.deactivating : RU_DICTIONARY.profileTab.modals.deactivation.deactivate}
                                        </button>
                                    </div>
                                </div>
                            </div>,
                            document.body
                        )}


                        {/* ═══ Order Details Modal (Removed) ═══ */}

                        {/* ═══════════════════ WALLET TAB ═══════════════════ */}
                        {activeTab === 'wallet' && (
                            <div className="animate-fadeIn">
                                <MyWallet customerId={user?.id || ''} />
                            </div>
                        )}

                        {/* ═══════════════════ NOTIFICATIONS TAB ═══════════════════ */}
                        {activeTab === 'notifications' && (
                            <div className="max-w-[900px] animate-fadeIn pb-12">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                                            <BellRing className="h-6 w-6 text-gray-900" />
                                        </div>
                                        <div>
                                            <h1 className="text-3xl font-bold text-gray-900">{RU_DICTIONARY.notificationsTab.title}</h1>
                                            <p className="text-sm text-warm-gray">{RU_DICTIONARY.notificationsTab.subtitle}</p>
                                        </div>
                                    </div>
                                    {notifications.length > 0 && (
                                        <button
                                            onClick={handleMarkAllRead}
                                            className="px-4 py-2 bg-white border border-[#91C934] rounded-xl text-xs font-bold text-[#91C934] hover:bg-gray-50 transition-colors flex items-center gap-2"
                                        >
                                            <Check className="h-3.5 w-3.5" /> {RU_DICTIONARY.notificationsTab.markAllAsRead}
                                        </button>
                                    )}
                                </div>

                                {notificationsLoading ? (
                                    <div className="py-24 flex justify-center">
                                        <Loader2 className="h-10 w-10 animate-spin text-gray-900" />
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="bg-white rounded-[30px] border border-gray-100 py-20 px-6 text-center">
                                        <div className="h-20 w-20 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-6">
                                            <BellRing className="h-10 w-10 text-warm-gray/30" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{RU_DICTIONARY.notificationsTab.innerPeace}</h3>
                                        <p className="text-warm-gray text-sm max-w-xs mx-auto">{RU_DICTIONARY.notificationsTab.noNotifications}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {notifications.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((n) => (
                                            <div
                                                key={n.notification_id}
                                                className={`group flex items-start gap-4 p-5 rounded-3xl border transition-all ${n.is_read
                                                    ? 'bg-white/60 border-gray-100 opacity-75'
                                                    : 'bg-white border-[#91c934]/20 shadow-sm border-l-4 border-l-[#91c934]'}`}
                                            >
                                                <div className={`mt-1 h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${n.is_read ? 'bg-warm-gray/10' : 'bg-[#91c934]/10'}`}>
                                                    {n.type === 'security' || n.category === 'security_alerts' ? <Shield className="h-5 w-5 text-red-500" /> : <Sparkles className="h-5 w-5 text-[#D4A847]" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <h4 className={`text-sm font-bold ${n.is_read ? 'text-gray-900/60' : 'text-gray-900'}`}>{n.title}</h4>
                                                        <span className="text-[10px] font-medium text-warm-gray whitespace-nowrap">
                                                            {new Date(n.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-warm-gray leading-relaxed mb-3">
                                                        {n.message}
                                                    </p>
                                                    <div className="flex items-center gap-4">
                                                        {n.link_url && (
                                                            <button
                                                                onClick={() => router.push(n.link_url as any)}
                                                                className="text-[10px] font-black uppercase tracking-widest text-gray-900 hover:underline"
                                                            >
                                                                {RU_DICTIONARY.notificationsTab.viewDetails}
                                                            </button>
                                                        )}
                                                        {!n.is_read && (
                                                            <button
                                                                onClick={async () => {
                                                                    await markNotificationAsRead(n.notification_id);
                                                                    fetchNotificationsData();
                                                                    window.dispatchEvent(new CustomEvent('notifications-updated'));
                                                                }}
                                                                className="text-[10px] font-black uppercase tracking-widest transition-colors text-[#91C934] hover:underline"
                                                            >
                                                                {RU_DICTIONARY.notificationsTab.markAsRead}
                                                            </button>
                                                        )}
                                                        {n.is_read && (
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-900/30 flex items-center gap-1.5">
                                                                <Check className="h-3 w-3" /> {RU_DICTIONARY.notificationsTab.seen}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteNotification(n.notification_id)}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-warm-gray/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}

                                        {/* Notifications Pagination Bottom */}
                                        {notifications.length > pageSize && (
                                            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                                                <span className="text-sm font-medium text-warm-gray">
                                                    {RU_DICTIONARY.notificationsTab.showing} <strong className="text-gray-900">
                                                        {Math.min((currentPage - 1) * pageSize + 1, notifications.length)}-{Math.min(currentPage * pageSize, notifications.length)}
                                                    </strong> {RU_DICTIONARY.notificationsTab.of} <strong className="text-gray-900">{notifications.length}</strong> {RU_DICTIONARY.notificationsTab.notifications}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                        disabled={currentPage === 1}
                                                        className={`px-4 py-2 text-sm font-bold rounded-xl border border-gray-100 transition-colors ${currentPage === 1 ? 'text-warm-gray bg-white opacity-50 cursor-not-allowed' : 'text-gray-900 bg-white hover:bg-gray-50'}`}
                                                    >
                                                        {RU_DICTIONARY.notificationsTab.previous}
                                                    </button>

                                                    {Array.from({ length: Math.ceil(notifications.length / pageSize) }).map((_, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => setCurrentPage(i + 1)}
                                                            className={`h-9 w-9 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center transition-all ${currentPage === i + 1 ? 'bg-[#91c934] text-white' : 'bg-white text-gray-900 border border-gray-100 hover:bg-gray-50'}`}
                                                        >
                                                            {i + 1}
                                                        </button>
                                                    ))}

                                                    <button
                                                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(notifications.length / pageSize), p + 1))}
                                                        disabled={currentPage === Math.ceil(notifications.length / pageSize)}
                                                        className={`px-4 py-2 text-sm font-bold rounded-xl border border-gray-100 transition-colors ${currentPage === Math.ceil(notifications.length / pageSize) ? 'text-warm-gray bg-white opacity-50 cursor-not-allowed' : 'text-gray-900 bg-white hover:bg-gray-50'}`}
                                                    >
                                                        {RU_DICTIONARY.notificationsTab.next}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ═══ Track Order Modal ═══ */}
                        {isMounted && isTrackOrderModalOpen && createPortal(
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsTrackOrderModalOpen(false)} />
                                <div className="relative w-full max-w-md rounded-3xl bg-[#FFFFFF] p-8 shadow-2xl border border-gray-100 text-center" style={{ animation: 'slideUp 0.25s ease-out' }}>

                                    {/* Botanical Icon */}
                                    {(() => {
                                        const s = (trackOrderStatus || 'PENDING').toUpperCase();
                                        const iconMap: Record<string, string> = {
                                            'PENDING': '/images/tracking/seed-pending.png',
                                            'CONFIRMED': '/images/tracking/bud-confirmed.png',
                                            'SHIPPED': '/images/tracking/leaves-shipped.png',
                                            'DELIVERED': '/images/tracking/flower-delivered.png',
                                            'CANCELLED': '/images/tracking/wilted-cancelled.png',
                                        };
                                        const labelMap: Record<string, string> = {
                                            'PENDING': RU_DICTIONARY.ordersTab.trackLabels.pending,
                                            'CONFIRMED': RU_DICTIONARY.ordersTab.trackLabels.confirmed,
                                            'SHIPPED': RU_DICTIONARY.ordersTab.trackLabels.shipped,
                                            'DELIVERED': RU_DICTIONARY.ordersTab.trackLabels.delivered,
                                            'CANCELLED': RU_DICTIONARY.ordersTab.trackLabels.cancelled,
                                        };
                                        return (
                                            <div className="mx-auto mb-4">
                                                <img
                                                    src={iconMap[s] || iconMap['PENDING']}
                                                    alt={labelMap[s] || 'Order status'}
                                                    className="w-24 h-24 object-contain mx-auto rounded-full"
                                                    style={{ filter: s === 'CANCELLED' ? 'saturate(0.6)' : 'none' }}
                                                />
                                            </div>
                                        );
                                    })()}

                                    <h3 className="text-2xl font-bold text-[#374151] mb-2">{RU_DICTIONARY.ordersTab.trackOrder}</h3>
                                    <p className="font-mono text-sm font-semibold text-[#6b7280] mb-1">#{trackOrderId?.split('-')[0].toUpperCase()}</p>
                                    {trackOrderStatus && (
                                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 ${trackOrderStatus === 'DELIVERED' ? 'bg-[#E8F5E9] text-[#2E7D32]' :
                                            trackOrderStatus === 'SHIPPED' ? 'bg-[#E0F2F1] text-[#00695C]' :
                                                trackOrderStatus === 'CONFIRMED' ? 'bg-[#F1F8E9] text-[#558B2F]' :
                                                    trackOrderStatus === 'CANCELLED' ? 'bg-[#FBE9E7] text-[#BF360C]' :
                                                        'bg-[#FFF8E1] text-[#F9A825]'
                                            }`}>{getLocalizedStatus(trackOrderStatus || 'PENDING')}</span>
                                    )}

                                    {/* Growth Progress Bar */}
                                    {trackOrderStatus && trackOrderStatus !== 'CANCELLED' && (
                                        <div className="flex items-center justify-between px-2 mb-5">
                                            {['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'].map((step, idx) => {
                                                const statusOrder = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
                                                const currentIdx = statusOrder.indexOf(trackOrderStatus || 'PENDING');
                                                const isActive = idx <= currentIdx;
                                                return (
                                                    <div key={step} className="flex items-center flex-1 last:flex-none">
                                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black transition-all ${isActive ? 'bg-[#91c934] text-white shadow-sm' : 'bg-gray-200 text-[#d1d5db]'}`}>
                                                            {idx === 0 ? '🌱' : idx === 1 ? '🌿' : idx === 2 ? '🍃' : '🌸'}
                                                        </div>
                                                        {idx < 3 && <div className={`h-0.5 flex-1 mx-1 rounded transition-all ${idx < currentIdx ? 'bg-[#91c934]' : 'bg-gray-200'}`} />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-5 mb-6 relative overflow-hidden text-left min-h-[120px]">
                                        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: trackOrderStatus === 'CANCELLED' ? '#BF360C' : '#91c934' }}></div>
                                        {isTrackingLoading ? (
                                            <div className="flex flex-col items-center justify-center h-full text-[#6b7280] py-6">
                                                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                                                <p className="text-xs font-medium">{RU_DICTIONARY.ordersTab.fetchingLogistics}</p>
                                            </div>
                                        ) : trackingData ? (
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100">
                                                    <div>
                                                        <p className="text-[10px] font-black tracking-widest text-[#6b7280] uppercase">{RU_DICTIONARY.ordersTab.currentStatus}</p>
                                                        <p className="font-bold text-[#374151]">{trackingData.shipment_track?.[0]?.current_status || RU_DICTIONARY.ordersTab.processing}</p>
                                                    </div>
                                                    {trackingData.track_url && (
                                                        <a href={trackingData.track_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[#91c934] bg-[#E8F5E9] hover:bg-[#91c934] hover:text-white px-3 py-1.5 rounded-full transition-colors flex items-center gap-1">
                                                            {RU_DICTIONARY.ordersTab.liveMap} <ChevronRight className="h-3 w-3" />
                                                        </a>
                                                    )}
                                                </div>

                                                {trackingData.shipment_track && trackingData.shipment_track.length > 0 && (
                                                    <div className="relative pl-4 space-y-4 before:content-[''] before:absolute before:left-1.5 before:top-2 before:bottom-0 before:w-0.5 before:bg-gray-200">
                                                        {trackingData.shipment_track.slice(0, 3).map((track: any, idx: number) => (
                                                            <div key={idx} className="relative">
                                                                <div className={`absolute -left-[19px] top-1.5 w-3 h-3 rounded-full border-2 border-[#FFFFFF] ${idx === 0 ? 'bg-[#91c934]' : 'bg-[#d1d5db]'}`} />
                                                                <p className="text-xs font-bold text-[#374151]">{track.activity || track.current_status}</p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <p className="text-[10px] text-[#6b7280] font-medium flex items-center gap-1"><Calendar className="h-3 w-3" /> {track.date}</p>
                                                                    {track.location && <p className="text-[10px] text-[#6b7280] font-medium flex items-center gap-1"><MapPin className="h-3 w-3" /> {track.location}</p>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-6">
                                                <svg width="32" height="32" viewBox="0 0 64 64" fill="none" className="mb-2 opacity-40">
                                                    <rect x="8" y="44" rx="4" width="48" height="12" fill="#8B6914" opacity="0.3" />
                                                    <ellipse cx="32" cy="38" rx="6" ry="8" fill="#8B6914" opacity="0.4" />
                                                </svg>
                                                <p className="text-[#374151] text-sm leading-relaxed font-medium">
                                                    {RU_DICTIONARY.ordersTab.orderBeingPrepared}
                                                </p>
                                                <p className="text-xs text-[#6b7280] mt-1">{RU_DICTIONARY.ordersTab.seedSownCheckBack}</p>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setIsTrackOrderModalOpen(false)}
                                        className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg hover:opacity-90"
                                        style={{ backgroundColor: '#91c934' }}
                                    >
                                        {RU_DICTIONARY.ordersTab.close}
                                    </button>
                                </div>
                            </div>,
                            document.body
                        )}

                        {/* ═══ Notification Preferences Overlay ═══ */}
                        {isMounted && showNotificationOverlay && createPortal(
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNotificationOverlay(false)} />

                                <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden" style={{ animation: 'slideUp 0.35s ease-out' }}>
                                    {/* Header Stripe */}
                                    <div className="flex-shrink-0 h-1.5 w-full shrink-0" style={{ background: 'linear-gradient(90deg, #6B2737, #D4A847)' }} />

                                    {/* Overlay Header */}
                                    <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-light-border bg-white">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cream-dark">
                                                <BellRing className="h-5 w-5 text-burgundy" />
                                            </div>
                                            <h2 className="text-xl font-bold text-charcoal">{RU_DICTIONARY.profileTab.security.manageNotifications}</h2>
                                        </div>
                                        <button
                                            onClick={() => setShowNotificationOverlay(false)}
                                            className="p-2 rounded-lg text-warm-gray hover:bg-cream hover:text-charcoal transition-colors"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>

                                    {/* Scrollable Content */}
                                    <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                                        <NotificationPreferences />
                                    </div>

                                    {/* Footer */}
                                    <div className="flex-shrink-0 px-6 py-4 border-t border-light-border bg-gray-50 flex justify-end">
                                        <button
                                            onClick={() => setShowNotificationOverlay(false)}
                                            className="rounded-lg bg-charcoal px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
                                        >
                                            {RU_DICTIONARY.profileTab.modals.notification.doneBtn}
                                        </button>
                                    </div>
                                </div>
                            </div>,
                            document.body
                        )}

                        {/* ═══ Export Orders Modal ═══ */}
                        <ExportOrdersModal
                            isOpen={showExportModal}
                            onClose={() => setShowExportModal(false)}
                            orders={orders}
                            userName={profileData.full_name || user?.name}
                            userEmail={profileData.email || user?.email}
                        />

                        {/* Keyframe animations */}
                        <style jsx>{`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes slideUp {
                        from { opacity: 0; transform: translateY(20px) scale(0.97); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    @keyframes slideDown {
                        from { opacity: 0; max-height: 0; transform: translateY(-10px); }
                        to { opacity: 1; max-height: 800px; transform: translateY(0); }
                    }
                `}</style>
                    </div>
                </div>
            </main>

            {/* Confirm modals */}

            <ConfirmModal
                isOpen={!!confirmingIndividualRemove}
                title={RU_DICTIONARY.account.removeItemTitle}
                message={RU_DICTIONARY.account.removeWishlistConfirm}
                confirmText={RU_DICTIONARY.account.remove}
                cancelText={RU_DICTIONARY.account.cancel}
                isDestructive={true}
                onConfirm={() => {
                    if (confirmingIndividualRemove) {
                        removeWishlistItem(confirmingIndividualRemove);
                        toast.success(RU_DICTIONARY.account.itemRemoved);
                        setConfirmingIndividualRemove(null);
                    }
                }}
                onCancel={() => setConfirmingIndividualRemove(null)}
            />

            <ConfirmModal
                isOpen={!!deletingAddressId}
                title={RU_DICTIONARY.addressesTab.modal.deleteTitle}
                message={RU_DICTIONARY.addressesTab.modal.deleteDesc}
                confirmText={RU_DICTIONARY.addressesTab.modal.deleteBtn}
                cancelText={RU_DICTIONARY.account.cancel}
                isDestructive={true}
                onConfirm={() => {
                    if (deletingAddressId) {
                        handleDeleteAddress(deletingAddressId);
                    }
                }}
                onCancel={() => setDeletingAddressId(null)}
            />

            {/* Email OTP Verification Modal */}
            {isMounted && showEmailOtpModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm" onClick={() => setShowEmailOtpModal(false)}></div>
                    <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-light-border overflow-hidden animate-fadeIn">
                        <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #91c934, #D4A847, #91c934)' }}></div>
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {RU_DICTIONARY.profileTab.modals.emailOtp.verifyEmailChange}
                                </h3>
                                <button onClick={() => setShowEmailOtpModal(false)} className="p-2 rounded-full hover:bg-cream/50 transition-colors text-warm-gray hover:text-gray-900">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <p className="text-sm text-warm-gray mb-6">
                                {RU_DICTIONARY.profileTab.modals.emailOtp.secureVerificationCodeSent} <strong className="text-charcoal font-semibold">{profileData.email}</strong>{RU_DICTIONARY.profileTab.modals.emailOtp.enterCodeBelow}
                            </p>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-[11px] font-bold text-warm-gray tracking-widest uppercase mb-2 ml-1">{RU_DICTIONARY.profileTab.modals.emailOtp.secureCodeOtp}</label>
                                    <input
                                        type="text"
                                        value={emailOtpCode}
                                        onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder={RU_DICTIONARY.profileTab.modals.emailOtp.enter6DigitCode}
                                        className="w-full bg-white border border-[#91C934] rounded-xl px-4 py-3.5 text-center text-xl font-bold tracking-[0.5em] focus:outline-none shadow-[0_0_15px_rgba(145,201,52,0.15)] focus:border-[#91C934] focus:ring-1 focus:ring-[#91C934] transition-all placeholder:tracking-normal placeholder:font-normal placeholder:text-base placeholder:text-gray-300 text-[#374151]"
                                    />
                                </div>
                                <div className="pt-2">
                                    <button
                                        onClick={handleEmailOtpSubmit}
                                        disabled={emailOtpSubmitting || emailOtpCode.length < 4}
                                        className="w-full bg-[#91c934] text-white rounded-xl py-3.5 text-sm font-bold shadow-xl hover:bg-[#7ab52a] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-[#7ab52a]"
                                    >
                                        {emailOtpSubmitting ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Check className="h-4 w-4 text-white" />}
                                        {RU_DICTIONARY.profileTab.modals.emailOtp.verifyAndSave}
                                    </button>
                                </div>
                                <div className="text-center pt-2">
                                    <button
                                        type="button"
                                        onClick={handleResendEmailOtp}
                                        disabled={emailOtpResendTimer > 0}
                                        className={`text-sm font-semibold transition-all ${emailOtpResendTimer > 0 ? 'text-warm-gray/70 cursor-not-allowed' : 'text-[#D4A847] hover:text-[#b38a36] hover:underline'}`}
                                    >
                                        {emailOtpResendTimer > 0 ? `${RU_DICTIONARY.profileTab.modals.emailOtp.resendCodeIn} ${emailOtpResendTimer}с` : RU_DICTIONARY.profileTab.modals.emailOtp.resendSecureCode}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Phone OTP Verification Modal */}
            {isMounted && showPhoneOtpModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm" onClick={() => setShowPhoneOtpModal(false)}></div>
                    <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-light-border overflow-hidden animate-fadeIn">
                        <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #374151, #91c934, #374151)' }}></div>
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-[#374151]">
                                    {RU_DICTIONARY.profileTab.modals.phoneOtp.verifyMobileNumber}
                                </h3>
                                <button onClick={() => setShowPhoneOtpModal(false)} className="p-2 rounded-full hover:bg-cream/50 transition-colors text-warm-gray hover:text-[#374151]">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <p className="text-sm text-warm-gray mb-6">
                                {RU_DICTIONARY.profileTab.modals.phoneOtp.verificationCodeSentEnd} <strong className="text-charcoal font-semibold">{profileData.phone.slice(-4)}</strong>.
                            </p>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-[11px] font-bold text-warm-gray tracking-widest uppercase mb-2 ml-1">{RU_DICTIONARY.profileTab.modals.phoneOtp.verificationCode}</label>
                                    <input
                                        type="text"
                                        value={phoneOtpCode}
                                        onChange={(e) => setPhoneOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        className="w-full bg-white border border-[#91c934] rounded-xl px-4 py-3.5 text-center text-xl font-bold tracking-[0.5em] focus:outline-none shadow-[0_0_15px_rgba(107,143,94,0.15)] focus:border-[#4A6341] focus:ring-1 focus:ring-[#4A6341] transition-all placeholder:tracking-normal placeholder:font-normal placeholder:text-base placeholder:text-gray-300 text-[#374151]"
                                    />
                                </div>
                                <div className="pt-2">
                                    <button
                                        onClick={handlePhoneOtpSubmit}
                                        disabled={phoneOtpSubmitting || phoneOtpCode.length < 4}
                                        className="w-full bg-[#91c934] text-white rounded-xl py-3.5 text-sm font-bold shadow-xl hover:bg-[#7ab52a] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-[#7ab52a]"
                                    >
                                        {phoneOtpSubmitting ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <CheckCircle2 className="h-4 w-4 text-white" />}
                                        {RU_DICTIONARY.profileTab.modals.phoneOtp.verifyAndUpdate}
                                    </button>
                                </div>
                                <div className="text-center pt-2">
                                    <button
                                        type="button"
                                        onClick={handleResendPhoneOtp}
                                        disabled={phoneOtpResendTimer > 0}
                                        className={`text-sm font-semibold transition-all ${phoneOtpResendTimer > 0 ? 'text-warm-gray/70 cursor-not-allowed' : 'text-[#91c934] hover:text-[#6b7341] hover:underline'}`}
                                    >
                                        {phoneOtpResendTimer > 0 ? `${RU_DICTIONARY.profileTab.modals.phoneOtp.resendSmsIn} ${phoneOtpResendTimer}с` : RU_DICTIONARY.profileTab.modals.phoneOtp.resendVerificationSms}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Password Change Modal */}
            {isMounted && showPasswordModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)}></div>
                    <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-light-border overflow-hidden animate-fadeIn">
                        <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #91c934, #D4A847, #91c934)' }}></div>
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {profileData.has_password ? RU_DICTIONARY.profileTab.modals.password.modifyPassword : RU_DICTIONARY.profileTab.modals.password.setPassword}
                                </h3>
                                <button onClick={() => setShowPasswordModal(false)} className="p-2 rounded-full hover:bg-cream/50 transition-colors text-warm-gray hover:text-gray-900">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                {profileData.has_password && (
                                    <div>
                                        <label className="block text-[10px] font-bold text-warm-gray tracking-widest uppercase mb-2 ml-1">{RU_DICTIONARY.profileTab.modals.password.currentPassword}</label>
                                        <div className="relative">
                                            <input
                                                type={showCurrentPassword ? "text" : "password"}
                                                required
                                                value={passwords.current}
                                                onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                                                className="w-full rounded-xl border border-light-border bg-cream/20 pl-4 pr-12 py-3 text-sm focus:border-burgundy/40 focus:outline-none transition-all"
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-gray hover:text-gray-900 transition-colors"
                                            >
                                                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-4 pt-2">
                                    <div>
                                        <label className="block text-[10px] font-bold text-warm-gray tracking-widest uppercase mb-2 ml-1">{RU_DICTIONARY.profileTab.modals.password.newPassword}</label>
                                        <div className="relative">
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                required
                                                value={passwords.new}
                                                onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                                className="w-full rounded-xl border border-light-border bg-cream/20 pl-4 pr-12 py-3 text-sm focus:border-burgundy/40 focus:outline-none transition-all"
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-gray hover:text-gray-900 transition-colors"
                                            >
                                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-warm-gray tracking-widest uppercase mb-2 ml-1">{RU_DICTIONARY.profileTab.modals.password.confirmNewPassword}</label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                required
                                                value={passwords.confirm}
                                                onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                                className="w-full rounded-xl border border-light-border bg-cream/20 pl-4 pr-12 py-3 text-sm focus:border-burgundy/40 focus:outline-none transition-all"
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-gray hover:text-gray-900 transition-colors"
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <button
                                        type="submit"
                                        disabled={passwordChanging}
                                        className="w-full bg-[#91c934] text-white rounded-xl py-4 text-sm font-bold shadow-md hover:bg-[#7ab52a] transition-all flex items-center justify-center gap-2"
                                    >
                                        {passwordChanging ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                {RU_DICTIONARY.profileTab.modals.password.updatingSanctuary}
                                            </>
                                        ) : (
                                            <>
                                                <Check className="h-4 w-4" />
                                                {RU_DICTIONARY.profileTab.modals.password.updateCredentials}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── Notification Preferences Modal ── */}
            {isMounted && showNotificationModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#1f2937]/40 backdrop-blur-sm" onClick={() => setShowNotificationModal(false)}></div>
                    <div className="relative w-full max-w-2xl bg-[#ffffff] rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-300">
                        <div className="bg-[#1f2937] p-8 text-white relative">
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full pointer-events-none"></div>

                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                                        <BellRing className="h-7 w-7 text-[#D4A847]" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold font-serif tracking-tight">
                                                    {RU_DICTIONARY.profileTab.security.notificationHarmony}
                                                </h2>
                                        <p className="text-white/60 text-xs font-medium uppercase tracking-widest mt-0.5">{RU_DICTIONARY.profileTab.modals.notification.customiseAlerts}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowNotificationModal(false)} className="p-3 rounded-3xl hover:bg-white/10 transition-all text-white/50 hover:text-white border border-transparent hover:border-white/10 group">
                                    <X className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
                                </button>
                            </div>
                        </div>

                        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar bg-white/80 backdrop-blur-md">
                            <div className="mb-6 bg-gray-50 p-4 rounded-3xl border border-gray-100/50">
                                <p className="text-sm text-gray-900 flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-[#D4A847]" /> {RU_DICTIONARY.profileTab.modals.notification.masterPresence}
                                </p>
                            </div>
                            <NotificationPreferences hideHeader={true} isMobileVerified={profileData.is_mobile_verified} />
                        </div>
                        <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
                            <button
                                onClick={() => setShowNotificationModal(false)}
                                className="px-12 py-3.5 bg-[#91c934] text-white rounded-xl text-sm font-bold shadow-lg hover:bg-[#7ab52a] transition-all transform active:scale-95"
                            >
                                {RU_DICTIONARY.profileTab.modals.notification.done}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
