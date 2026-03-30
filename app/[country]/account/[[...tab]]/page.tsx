'use client';

import { createPortal } from 'react-dom';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useClerk } from '@clerk/nextjs';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/ProductCard';
import {
    getMyOrders, getAddresses, addAddress as apiAddAddress,
    updateAddress as apiUpdateAddress, deleteAddress as apiDeleteAddress,
    getCustomerProfile, updateCustomerProfile, deactivateAccount,
    uploadProfileImage, getProfileImage, removeProfileImage, getOrderById,
    cancelOrder as apiCancelOrder, formatVND, downloadInvoice, getBestSellers,
    getMyEnquiries, replyToEnquiry, changePassword,
    requestEmailChange, verifyEmailChangeProfile,
    requestPhoneChange, verifyPhoneChangeProfile,
    getLoyaltyWallet, getMyNotifications, getUnreadNotificationCount,
    markNotificationAsRead, markAllNotificationsAsRead, deleteNotification,
    lookupPostalCode, getMySupportTickets, replySupportTicket, getSupportTicketDetail,
    getMyReviews, trackOrder
} from '@/lib/api';
import { Order, Address } from '@/types';
import { COUNTRIES } from '@/lib/countries';
import Select from 'react-select';
import {
    Package, MapPin, Heart, LogOut, User, Plus, Pencil, Trash2,
    Loader2, ShieldOff, Camera, X, Check, Star, Phone, Calendar, Mail,
    CheckCircle2, Smartphone, AlertCircle, Shield, FileText, MessageSquare, Send, Clock, User2, MessageCircle, Sparkles,
    Globe, ChevronRight, Lock, CreditCard, Banknote,
    BadgeCheck, BellRing, Download, Search, ShoppingCart, LayoutGrid, List, Wallet, Eye, EyeOff
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
import { useCurrency } from '@/context/CurrencyContext';

type Tab = 'overview' | 'orders' | 'wishlist' | 'addresses' | 'profile' | 'privacy' | 'support' | 'wallet' | 'notifications';

const VALID_TABS: Tab[] = ['overview', 'orders', 'wishlist', 'addresses', 'profile', 'privacy', 'support', 'wallet', 'notifications'];

export default function AccountPage() {
    const { formatPrice } = useCurrency();
    const router = useRouter();
    const params = useParams<{ country: string, tab?: string[] }>();
    const searchParams = useSearchParams();
    const urlOrderId = searchParams.get('orderId');
    const country = params?.country || 'in';
    const { user, isAuthenticated, isLoading, logout, updateUser } = useAuth();
    const { signOut: clerkSignOut } = useClerk();
    const { items: wishlistItems, removeItem: removeWishlistItem } = useWishlist();
    const { addItem: addCartItem } = useCart();

    // Wishlist extra state
    const [selectedWishlistItems, setSelectedWishlistItems] = useState<Set<string>>(new Set());
    const [wishlistSort, setWishlistSort] = useState('recently_added');
    const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);

    const handleWishlistSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedWishlistItems(new Set(wishlistItems.map(item => item.product_id)));
        } else {
            setSelectedWishlistItems(new Set());
        }
    };

    const handleWishlistToggleItem = (id: string) => {
        const next = new Set(selectedWishlistItems);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedWishlistItems(next);
    };

    const handleAddSelectedToCart = () => {
        if (selectedWishlistItems.size === 0) return;
        selectedWishlistItems.forEach(id => {
            addCartItem(id, null, 1);
            removeWishlistItem(id);
        });
        toast.success(`Moved ${selectedWishlistItems.size} items to cart`);
        setSelectedWishlistItems(new Set());
    };

    const handleRemoveSelected = () => {
        if (selectedWishlistItems.size === 0) return;
        selectedWishlistItems.forEach(id => {
            removeWishlistItem(id);
        });
        toast.success(`Removed ${selectedWishlistItems.size} items from wishlist`);
        setSelectedWishlistItems(new Set());
        setConfirmingBulkRemove(false);
    };

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [confirmingBulkRemove, setConfirmingBulkRemove] = useState(false);
    const [confirmingIndividualRemove, setConfirmingIndividualRemove] = useState<string | null>(null);

    // Derive active tab from URL path segment, default to 'overview'
    const activeTab: Tab = useMemo(() => {
        const slug = params?.tab?.[0] as Tab | undefined;
        return slug && VALID_TABS.includes(slug) ? slug : 'overview';
    }, [params?.tab]);

    useEffect(() => {
        if (activeTab === 'wishlist' && wishlistItems.length > 0 && recommendedProducts.length === 0) {
            getBestSellers({ limit: 4 }).then(res => {
                if (res?.data) {
                    setRecommendedProducts(res.data);
                }
            }).catch(err => console.error("Failed to fetch recommended products", err));
        }
    }, [activeTab, wishlistItems.length, recommendedProducts.length]);

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

    // Orders Filtering State
    const [orderSearch, setOrderSearch] = useState('');
    const [orderStatusFilter, setOrderStatusFilter] = useState('All');
    const [orderSort, setOrderSort] = useState('newest');

    // Addresses state
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [addressesLoading, setAddressesLoading] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [addressForm, setAddressForm] = useState({
        address_line1: '', address_line2: '', city: '', state: '', pincode: '',
        country: 'India', country_code: 'IN', phone: '', label: '', is_default: false,
    });
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
            borderRadius: '8px',
            borderColor: state.isFocused ? '#6B8F5E' : '#D4CFC0',
            boxShadow: 'none',
            '&:hover': {
                borderColor: '#6B8F5E',
            },
            backgroundColor: 'white',
            paddingLeft: '34px',
            minHeight: '44px',
            fontSize: '14px',
        }),
        option: (provided: any, state: any) => ({
            ...provided,
            backgroundColor: state.isSelected ? '#6B8F5E' : state.isFocused ? '#DFE5D9' : 'white',
            color: state.isSelected ? 'white' : '#1A1A1A',
            '&:active': {
                backgroundColor: '#6B8F5E',
            },
            fontSize: '14px',
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
    const [selectedCountryCode, setSelectedCountryCode] = useState('+91');

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

    const handleCancelOrder = async (orderId: string) => {
        setCancelSubmitting(true);
        try {
            const res = await apiCancelOrder(orderId);
            if (res.success || res.order) {
                toast.success('Order cancelled successfully.');
                setCancellingOrderId(null);
                setCancelReason('');
                fetchOrders(); // refresh the list
                if (selectedOrderDetails?.order_id === orderId) {
                    handleViewOrderDetails(orderId); // refresh details
                }
            } else {
                toast.error(res.message || 'Failed to cancel order.');
            }
        } catch {
            toast.error('An error occurred while cancelling.');
        } finally {
            setCancelSubmitting(false);
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
                             cancellingOrderId || reviewModal || showNotificationOverlay || 
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
    }, [isTrackOrderModalOpen, showDeactivateModal, deletingAddressId, cancellingOrderId, 
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

    // ── Derive Sorted Wishlist ─────────────────────────────────────
    const sortedWishlistItems = useMemo(() => {
        const result = [...wishlistItems];
        if (wishlistSort === 'recently_added') {
            result.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        } else if (wishlistSort === 'price_low') {
            result.sort((a, b) => (a.price || 0) - (b.price || 0));
        } else if (wishlistSort === 'price_high') {
            result.sort((a, b) => (b.price || 0) - (a.price || 0));
        }
        return result;
    }, [wishlistItems, wishlistSort]);

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
                let countryCode = '+91';
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
                
                // Keep global AuthContext user state synced
                const finalUrl = s3Url || parsedBase64;
                if (user?.avatar_url !== finalUrl) {
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
        const loadingToast = toast.loading('Sending your message...');

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
                toast.success('Message sent successfully', { id: loadingToast });
                setEnquiryReplyText('');
                // Re-fetch all data
                await fetchEnquiries();
            } else {
                toast.error(res.message || 'Failed to send message', { id: loadingToast });
            }
        } catch (error) {
            toast.error('Network error', { id: loadingToast });
        } finally {
            setIsSendingEnquiryReply(false);
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
            toast.success('All marked as read');
            fetchNotificationsData();
            // Sync with navbar
            window.dispatchEvent(new CustomEvent('notifications-updated'));
        } catch (err) { toast.error('Failed to update'); }
    };

    const handleDeleteNotification = async (id: string) => {
        try {
            await deleteNotification(id);
            toast.success('Notification removed');
            fetchNotificationsData();
            // Sync with navbar
            window.dispatchEvent(new CustomEvent('notifications-updated'));
        } catch (err) { toast.error('Failed to delete'); }
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

        // Tab-specific fetching
        fetchLoyaltyData();
        if (activeTab === 'orders') fetchOrders();
        if (activeTab === 'addresses') fetchAddresses();
        if (activeTab === 'support') fetchEnquiries();
        if (activeTab === 'notifications') fetchNotificationsData();
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
                toast.error('Phone number can only contain digits and an optional + prefix.');
                return;
            }
            const digitsOnly = cleaned.replace(/\D/g, '');
            const hasCountryCode = cleaned.startsWith('+');
            const maxDigits = hasCountryCode ? 15 : 12;
            if (digitsOnly.length < 7 || digitsOnly.length > maxDigits) {
                toast.error(`Phone number must be between 7 and ${maxDigits} digits.`);
                return;
            }
        }

        setProfileSaving(true);
        try {
            // Check if email was changed
            if (profileData.email !== originalEmail) {
                const reqRes = await requestEmailChange(profileData.email);
                if (reqRes.success) {
                    toast.success(reqRes.message || 'Verification code sent to your new email');
                    setShowEmailOtpModal(true);
                    setEmailOtpResendTimer(60);
                    setProfileSaving(false);
                    return; // Return and wait for OTP verification
                } else {
                    toast.error(reqRes.message || 'Failed to request email change');
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
                        toast.success('Verification code sent to your new mobile number');
                        setShowPhoneOtpModal(true);
                        setPhoneOtpResendTimer(60);
                        setProfileSaving(false);
                        return; // Wait for OTP
                    } else {
                        toast.error(reqRes.message || 'Failed to send verification code to new number');
                        setProfileSaving(false);
                        return;
                    }
                } catch {
                    toast.error('Failed to request phone verification');
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
                toast.success('Profile updated successfully');
                setProfileEditing(false);
                fetchProfile(); // refresh data
            } else {
                toast.error(res.message || 'Failed to update profile');
            }
        } catch {
            toast.error('Server error. Please try again.');
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
                toast.success('A new verification code has been sent');
                setPhoneOtpResendTimer(60);
            } else {
                toast.error(reqRes.message || 'Failed to resend code');
            }
        } catch {
            toast.error('Server error');
        }
    };

    const handlePhoneOtpSubmit = async () => {
        if (!phoneOtpCode) {
            toast.error('Please enter the OTP');
            return;
        }
        
        setPhoneOtpSubmitting(true);
        try {
            const res = await verifyPhoneChangeProfile(phoneOtpCode);
            if (res.success) {
                toast.success('Mobile number updated and verified!');
                setShowPhoneOtpModal(false);
                setPhoneOtpCode('');
                setPhoneOtpResendTimer(0);
                
                // Continue to update the rest of the profile if needed, but phone is already updated by backend
                setProfileEditing(false);
                fetchProfile();
            } else {
                toast.error(res.message || 'Invalid or expired OTP');
            }
        } catch {
            toast.error('Server error. Please try again.');
        } finally {
            setPhoneOtpSubmitting(false);
        }
    };

    const handleResendEmailOtp = async () => {
        if (emailOtpResendTimer > 0) return;
        
        try {
            const reqRes = await requestEmailChange(profileData.email);
            if (reqRes.success) {
                toast.success('A new verification code has been sent');
                setEmailOtpResendTimer(60);
            } else {
                toast.error(reqRes.message || 'Failed to resend code');
            }
        } catch {
            toast.error('Server error');
        }
    };

    const handleEmailOtpSubmit = async () => {
        if (!emailOtpCode) {
            toast.error('Please enter the OTP');
            return;
        }
        
        setEmailOtpSubmitting(true);
        try {
            const res = await verifyEmailChangeProfile(emailOtpCode);
            if (res.success) {
                toast.success('Email updated successfully');
                setShowEmailOtpModal(false);
                setEmailOtpCode('');
                setEmailOtpResendTimer(0);
                
                // Continue to update the rest of the profile if it was being edited
                if (!user?.id) return;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { has_password, is_email_verified, is_mobile_verified, email, ...updateData } = profileData;
                const profileRes = await updateCustomerProfile(user.id, updateData);
                
                if (profileRes.success) {
                    toast.success('Profile all updated');
                    setProfileEditing(false);
                }
                
                fetchProfile();
            } else {
                toast.error(res.message || 'Invalid or expired OTP');
            }
        } catch {
            toast.error('Server error. Please try again.');
        } finally {
            setEmailOtpSubmitting(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (profileData.has_password && passwords.current === passwords.new) {
            toast.error('New password cannot be the same as your current password');
            return;
        }

        if (passwords.new !== passwords.confirm) {
            toast.error('Passwords do not match');
            return;
        }
        if (passwords.new.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        setPasswordChanging(true);
        try {
            const res = await changePassword(passwords.current, passwords.new);
            if (res.success) {
                toast.success('Password updated successfully');
                setShowPasswordModal(false);
                setPasswords({ current: '', new: '', confirm: '' });
                setShowCurrentPassword(false);
                setShowNewPassword(false);
                setShowConfirmPassword(false);
                fetchProfile(); // refresh has_password status
            } else {
                toast.error(res.message || 'Failed to update password');
            }
        } catch {
            toast.error('Server error');
        } finally {
            setPasswordChanging(false);
        }
    };

    // ── Image upload handler ─────────────────────────────────────────
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user?.id) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be under 5MB');
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
                        toast.success('Profile photo updated!');
                        updateUser({ avatar_url: base64 });
                    } else {
                        toast.error(res.message || 'Failed to upload image');
                        setProfileImageUrl(null);
                    }
                } catch {
                    toast.error('Upload failed. Please try again.');
                    setProfileImageUrl(null);
                } finally {
                    setImageUploading(false);
                }
            };
            reader.readAsDataURL(file);
        } catch {
            setImageUploading(false);
            toast.error('Could not read file');
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
                toast.success('Profile photo removed');
            } else {
                toast.error(res.message || 'Failed to remove image');
            }
        } catch {
            toast.error('Server error');
        }
    };

    // ── Address handlers ─────────────────────────────────────────────
    const handleAddressSubmit = async () => {
        if (!user?.id) return;
        if (!addressForm.address_line1 || !addressForm.city || !addressForm.state || !addressForm.pincode) {
            toast.error('Please fill in all required fields');
            return;
        }

        // Pincode format validation
        const cleanPin = addressForm.pincode.toString().trim();
        const isIndia = !addressForm.country || addressForm.country.toLowerCase() === 'india';
        if (isIndia) {
            if (!/^\d{6}$/.test(cleanPin)) {
                toast.error('Pincode must be exactly 6 digits');
                return;
            }
        } else {
            if (!/^[a-zA-Z0-9\s\-]{3,10}$/.test(cleanPin)) {
                toast.error('Postal code must be 3-10 alphanumeric characters');
                return;
            }
        }

        try {
            if (editingAddress) {
                const res = await apiUpdateAddress(user.id, editingAddress.address_id, addressForm as unknown as Record<string, string>);
                if (res.success) {
                    toast.success('Address updated');
                } else {
                    toast.error(res.message || 'Failed to update address');
                }
            } else {
                const res = await apiAddAddress(user.id, addressForm as unknown as Record<string, string>);
                if (res.success) {
                    toast.success('Address added');
                } else {
                    toast.error(res.message || 'Failed to add address');
                }
            }
            resetAddressForm();
            fetchAddresses();
        } catch {
            toast.error('Something went wrong');
        }
    };

    const handleDeleteAddress = async (addressId: string) => {
        if (!user?.id) return;
        try {
            const res = await apiDeleteAddress(user.id, addressId);
            if (res.success) {
                toast.success('Address deleted');
                fetchAddresses();
            } else {
                toast.error(res.message || 'Failed to delete address');
            }
        } catch {
            toast.error('Something went wrong');
        } finally {
            setDeletingAddressId(null);
        }
    };

    const handleSetDefault = async (addr: Address) => {
        if (!user?.id) return;
        try {
            const res = await apiUpdateAddress(user.id, addr.address_id, { is_default: 'true' } as Record<string, string>);
            if (res.success) {
                toast.success('Default address updated');
                fetchAddresses();
            } else {
                toast.error(res.message || 'Failed to set default');
            }
        } catch {
            toast.error('Something went wrong');
        }
    };

    const startEditAddress = (addr: Address) => {
        setEditingAddress(addr);
        setAddressForm({
            address_line1: addr.address_line1 || '',
            address_line2: addr.address_line2 || '',
            city: addr.city || '',
            state: addr.state || '',
            pincode: addr.pincode || '',
            country: addr.country || 'India',
            country_code: (addr as any).country_code || 'IN',
            phone: addr.phone || '',
            label: addr.label || '',
            is_default: addr.is_default || false,
        });
        setManualEdits({ city: true, state: true }); // Assume manual since it's existing data
        setShowAddressForm(true);
    };

    const resetAddressForm = () => {
        setShowAddressForm(false);
        setEditingAddress(null);
        setAddressForm({
            address_line1: '', address_line2: '', city: '', state: '', pincode: '',
            country: 'India', country_code: 'IN', phone: '', label: '', is_default: false,
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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-burgundy" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    const getStatusColor = (status: string) => {
        const s = status?.toLowerCase();
        if (s === 'confirmed' || s === 'completed') return 'bg-green-100 text-green-700';
        if (s === 'shipped' || s === 'processing') return 'bg-blue-100 text-blue-700';
        if (s === 'delivered') return 'bg-purple-100 text-purple-700';
        if (s === 'cancelled') return 'bg-red-100 text-red-700';
        return 'bg-yellow-100 text-yellow-700';
    };

    // Sidebar groups
    const coreExperienceTabs = [
        { id: 'overview', label: 'Overview', icon: LayoutGrid },
        { id: 'notifications', label: 'Notifications', icon: BellRing, count: unreadCount },
        { id: 'orders', label: 'Orders', icon: Package, count: orderCount },
        { id: 'wishlist', label: 'Wishlist', icon: Heart, count: wishlistItems.length },
        { id: 'wallet', label: 'My Wallet', icon: Wallet },
    ];
    const identityAccessTabs = [
        { id: 'profile', label: 'Personal Profile', icon: User },
        { id: 'addresses', label: 'Delivery Rituals', icon: MapPin, count: addresses.length },
        { id: 'support', label: 'Support & Enquiries', icon: MessageSquare, count: enquiries.length },
        { id: 'privacy', label: 'Privacy Sanctuary', icon: Shield },
    ];

    return (
        <div className="flex flex-col lg:flex-row bg-[#F8F5F0] min-h-[calc(100vh-128px)]">
            {/* Mobile Account Navigation (Visible only on < lg) */}
            <nav className="lg:hidden sticky top-0 z-[100] bg-white border-b border-[#E8E1D5] overflow-x-auto custom-scrollbar flex items-center gap-1.5 px-4 py-3 whitespace-nowrap shadow-sm">
                {[...coreExperienceTabs, ...identityAccessTabs].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => router.push(`/${country}/account/${tab.id}`)}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                            activeTab === tab.id 
                            ? 'bg-[#1D351D] text-white shadow-md' 
                            : 'bg-white text-[#36453A] border border-[#E8E1D5] hover:bg-gray-50'
                        }`}
                    >
                        <tab.icon className={`h-3 w-3 ${activeTab === tab.id ? 'opacity-100' : 'opacity-60'}`} />
                        {tab.label}
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className={`text-[9px] px-1.5 rounded-full ${activeTab === tab.id ? 'bg-[#D4A847] text-[#36453A]' : 'bg-[#E8E1D5] text-[#36453A]'}`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </nav>

            {/* Left Sidebar (Desktop Only) */}
            <aside className="hidden lg:flex w-[280px] bg-[#1D351D] text-white flex-col flex-shrink-0 relative z-20 shadow-[4px_0_24px_rgba(0,0,0,0.12)]">
                <div className="flex-1 px-5 py-8">
                    {/* CORE EXPERIENCE */}
                    <div className="mb-8">
                        <p className="text-[10px] font-bold tracking-[0.15em] text-white/50 mb-3 ml-3">CORE EXPERIENCE</p>
                        <ul className="space-y-1">
                            {coreExperienceTabs.map(tab => (
                                <li key={tab.id}>
                                    <button
                                        onClick={() => router.push(`/${country}/account/${tab.id}`)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                                            ? 'bg-white/10 text-white shadow-sm'
                                            : 'text-white/70 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'opacity-100' : 'opacity-70'}`} />
                                            {tab.label}
                                        </div>
                                        {tab.count !== undefined && tab.count > 0 && (
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-[#D4A847] text-[#36453A]' : 'bg-white/10 text-white/90'
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
                        <p className="text-[10px] font-bold tracking-[0.15em] text-white/50 mb-3 ml-3">IDENTITY & ACCESS</p>
                        <ul className="space-y-1">
                            {identityAccessTabs.map(tab => (
                                <li key={tab.id}>
                                    <button
                                        onClick={() => router.push(`/${country}/account/${tab.id}`)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                                            ? 'bg-[#A8B28B]/20 text-[#DCDFB3] font-bold shadow-sm border border-[#A8B28B]/20'
                                            : 'text-white/70 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'opacity-100' : 'opacity-70'}`} />
                                            {tab.label}
                                        </div>
                                        {tab.count !== undefined && tab.count > 0 && (
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-[#D4A847] text-[#36453A]' : 'bg-white/10 text-white/90'
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
                <div className="p-5 mt-auto border-t border-white/10">
                    <div className="bg-white/5 rounded-xl border border-white/10 p-4 mb-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-white">
                                <path d="M12 22C17.5228 22 22 17.5228 22 12" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="p-1.5 bg-white/10 rounded-full flex items-center justify-center">
                                <Star className="h-3 w-3 text-[#D4A847] fill-[#D4A847]" />
                            </span>
                            <span className="text-[10px] font-bold tracking-wider text-white uppercase">{activeTier} STATUS</span>
                        </div>
                        <p className="text-xs text-white/80 leading-relaxed mb-3">You currently possess the <strong className="text-white">{activeTier}</strong> ritualist rank.</p>
                        <button 
                            onClick={() => router.push(`/${country}/account/wallet`)}
                            className="text-[10px] uppercase font-bold text-[#D4A847] flex items-center gap-1 hover:text-white transition-colors"
                        >
                            VIEW BENEFITS <ChevronRight className="h-3 w-3" />
                        </button>
                    </div>

                    {/* User Snippet */}
                    <div className="flex items-center gap-3 p-3 bg-black/20 rounded-xl">
                        <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/20">
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
                            <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                            <p className="text-[10px] text-white/50 tracking-wider flex items-center gap-1">
                                <Shield className="h-2.5 w-2.5 text-[#D4A847]" /> VERIFIED HUMAN
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
                <header className="hidden lg:flex h-12 flex-shrink-0 bg-white/80 backdrop-blur-md border-b border-[#E8E1D5] items-center justify-between px-8 xl:px-12 sticky top-0 z-20">
                    <div className="flex items-center gap-3 text-sm font-medium">
                        <button onClick={() => router.push('/account')} className="text-[#36453A]/60 hover:text-[#36453A] transition-colors">Account</button>
                        <ChevronRight className="h-4 w-4 text-[#36453A]/30" />
                        <span className="text-[#36453A] font-bold">
                            {activeTab === 'profile' ? 'Profile Settings' :
                                activeTab === 'addresses' ? 'Delivery Rituals' :
                                    activeTab === 'privacy' ? 'Privacy Sanctuary' :
                                        activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
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
                                <div className="bg-white rounded-3xl border border-[#E8E1D5] p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-sm">
                                    <div className="flex-1 relative z-10">
                                        <span className="inline-block bg-[#E8E1D5]/50 text-[#36453A] text-[10px] font-bold tracking-widest px-3 py-1 rounded-full mb-6 uppercase">Account Overview</span>
                                        <h1 className="text-4xl md:text-5xl font-bold text-[#36453A] mb-4">
                                            Namaste, {user?.name?.split(' ')[0] || 'Guest'}.
                                        </h1>
                                        <p className="text-warm-gray leading-relaxed max-w-md mb-8">
                                            Welcome back to your sanctuary. Your wellness journey continues with the same purity and dedication.
                                        </p>
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => router.push('/account/orders')}
                                                className="bg-[#36453A] text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md hover:bg-[#2A362D] transition-colors"
                                            >
                                                Track Latest Order
                                            </button>
                                            <button
                                                onClick={() => router.push('/account/profile')}
                                                className="bg-white border text-[#36453A] border-[#E8E1D5] px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#F8F5F0] transition-colors"
                                            >
                                                Update Health Profile
                                            </button>
                                        </div>
                                    </div>

                                    {/* Aesthetic Profile Image Sphere */}
                                    <div className="relative w-48 h-48 md:w-64 md:h-64 flex-shrink-0 z-10 group mt-6 md:mt-0 mx-auto md:mx-0">
                                        <div className="absolute inset-0 bg-gradient-radial from-white to-[#F8F5F0] rounded-full shadow-[0_0_40px_rgba(212,168,71,0.15)] blur-md"></div>
                                        <div className="relative w-full h-full rounded-full border-4 border-white overflow-hidden shadow-xl bg-[#E8E1D5] flex items-center justify-center">
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
                                                <span className="font-serif text-6xl md:text-8xl font-bold text-[#36453A]">
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
                                            className="absolute bottom-4 right-4 md:bottom-6 md:right-6 h-12 w-12 md:h-14 md:w-14 rounded-full bg-[#36453A] text-white flex items-center justify-center shadow-lg hover:bg-[#2A362D] transition-transform hover:scale-110 disabled:opacity-50 z-20 group-hover:bg-[#D4A847] focus:outline-none focus:ring-4 focus:ring-[#D4A847]/30"
                                        >
                                            <Camera className="h-5 w-5 md:h-6 md:w-6" />
                                        </button>
                                    </div>

                                    {/* Abstract Wave decorative background */}
                                    <div className="absolute top-0 right-0 w-full h-full opacity-30 pointer-events-none mix-blend-multiply" style={{ background: 'radial-gradient(circle at 80% 50%, #D4A847 0%, transparent 50%)' }}></div>
                                </div>

                                {/* Stats Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white p-6 rounded-2xl border border-[#E8E1D5] shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/account/orders')}>
                                        <div className="h-12 w-12 rounded-xl bg-[#F8F5F0] flex items-center justify-center flex-shrink-0">
                                            <Package className="h-6 w-6 text-[#36453A]" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-warm-gray uppercase tracking-wider mb-1">Recent Orders</p>
                                            <h3 className="text-2xl font-bold text-[#36453A] mb-1">{orders.length} Total</h3>
                                            <p className="text-[11px] text-[#A8B28B] font-medium">{orders.filter((o: any) => o.status === 'SHIPPED').length} currently in transit</p>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl border border-[#E8E1D5] shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/${country}/account/wishlist`)}>
                                        <div className="h-12 w-12 rounded-xl bg-[#F8F5F0] flex items-center justify-center flex-shrink-0">
                                            <Heart className="h-6 w-6 text-[#36453A]" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-warm-gray uppercase tracking-wider mb-1">Saved Items</p>
                                            <h3 className="text-2xl font-bold text-[#36453A] mb-1">{wishlistItems.length} Items</h3>
                                            <p className="text-[11px] text-warm-gray font-medium">Waitlisting {wishlistItems.filter((i: any) => (i.stock_status || '').toLowerCase() === 'out_of_stock').length} items</p>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl border border-[#E8E1D5] shadow-sm flex items-start gap-4 cursor-default relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5">
                                            <Star className="h-20 w-20 text-[#D4A847]" />
                                        </div>
                                        <div className="h-12 w-12 rounded-xl bg-[#F8F5F0] flex items-center justify-center flex-shrink-0 relative z-10">
                                            <Star className="h-6 w-6 text-[#36453A]" />
                                        </div>
                                        <div className="relative z-10">
                                            <p className="text-xs font-bold text-warm-gray uppercase tracking-wider mb-1">Loyalty Points</p>
                                            <h3 className="text-2xl font-bold text-[#36453A] mb-1">{activePoints} Pts</h3>
                                            <p className="text-[11px] text-[#A8B28B] font-medium">{loyaltyData?.tier?.points_multiplier || 1}x</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Common Actions Quick Links */}
                                <div className="mt-2">
                                    <h3 className="font-bold text-[#36453A] mb-4 text-sm tracking-wide">Common Actions</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <button onClick={() => router.push(`/${country}/account/orders`)} className="bg-white border border-[#E8E1D5] p-4 rounded-2xl flex items-center justify-between hover:border-[#36453A]/30 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-[#F8F5F0] p-2.5 rounded-lg group-hover:bg-[#36453A] transition-colors">
                                                    <List className="h-5 w-5 text-[#36453A] group-hover:text-white transition-colors" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-bold text-[#36453A]">View All Orders</p>
                                                    <p className="text-[10px] text-warm-gray">Check status & history</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-warm-gray group-hover:text-[#36453A] transition-colors" />
                                        </button>

                                        <button onClick={() => router.push(`/${country}/account/addresses`)} className="bg-white border border-[#E8E1D5] p-4 rounded-2xl flex items-center justify-between hover:border-[#36453A]/30 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-[#F8F5F0] p-2.5 rounded-lg group-hover:bg-[#36453A] transition-colors">
                                                    <MapPin className="h-5 w-5 text-[#36453A] group-hover:text-white transition-colors" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-bold text-[#36453A]">Manage Addresses</p>
                                                    <p className="text-[10px] text-warm-gray">Add or edit delivery spots</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-warm-gray group-hover:text-[#36453A] transition-colors" />
                                        </button>

                                        <button onClick={() => router.push(`/${country}/account/profile`)} className="bg-white border border-[#E8E1D5] p-4 rounded-2xl flex items-center justify-between hover:border-[#36453A]/30 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-[#F8F5F0] p-2.5 rounded-lg group-hover:bg-[#36453A] transition-colors">
                                                    <User className="h-5 w-5 text-[#36453A] group-hover:text-white transition-colors" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-bold text-[#36453A]">Account Settings</p>
                                                    <p className="text-[10px] text-warm-gray">Edit profile & privacy</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-warm-gray group-hover:text-[#36453A] transition-colors" />
                                        </button>
                                    </div>
                                </div>

                                {/* Main Layout Body: Left (Orders Summary) + Right (Wishlist Preview & Wallet) */}
                                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 mt-4">

                                    {/* Left: Recent Orders Table */}
                                    <div className="bg-white rounded-3xl border border-[#E8E1D5] p-6 lg:p-8 shadow-sm h-fit">
                                        <div className="flex items-center justify-between mb-8 border-b border-[#E8E1D5] pb-4">
                                            <div>
                                                <h3 className="font-bold text-[#36453A] text-lg">Recent Orders Summary</h3>
                                                <p className="text-xs text-warm-gray mt-1">Your latest transactions at Vedashi</p>
                                            </div>
                                            <button onClick={() => router.push(`/${country}/account/orders`)} className="text-xs font-bold text-[#36453A] hover:underline hover:text-black">See Full History</button>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-[#E8E1D5]">
                                                        <th className="pb-3 text-xs font-bold text-warm-gray uppercase tracking-wider">Order ID</th>
                                                        <th className="pb-3 text-xs font-bold text-warm-gray uppercase tracking-wider">Date</th>
                                                        <th className="pb-3 text-xs font-bold text-warm-gray uppercase tracking-wider">Status</th>
                                                        <th className="pb-3 text-xs font-bold text-warm-gray uppercase tracking-wider text-right">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {orders.slice(0, 5).map((order: any) => (
                                                        <tr key={order.order_id} className="border-b border-[#F8F5F0] last:border-0 hover:bg-[#F8F5F0]/50 transition-colors">
                                                            <td className="py-4 text-sm font-bold text-[#36453A]">{order.order_id.split('-')[0].toUpperCase()}</td>
                                                            <td className="py-4 text-sm text-warm-gray">{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                                            <td className="py-4">
                                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border border-current ${getStatusColor(order.order_status)}`}>
                                                                    {order.order_status || 'PENDING'}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 text-sm font-bold text-[#36453A] text-right">{formatPrice(order.final_total || order.total_amount)}</td>
                                                        </tr>
                                                    ))}
                                                    {orders.length === 0 && (
                                                        <tr>
                                                            <td colSpan={4} className="py-8 text-center text-sm text-warm-gray">No order history available yet.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Right Side Column */}
                                    <div className="flex flex-col gap-6">

                                        {/* Wishlist Preview */}
                                        <div className="bg-white rounded-3xl border border-[#E8E1D5] p-6 shadow-sm">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="font-bold text-[#36453A] text-sm flex items-center gap-2">
                                                    <Heart className="h-4 w-4 text-red-500 fill-red-50" />
                                                    Wishlist Preview
                                                </h3>
                                                <span className="bg-[#36453A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{wishlistItems.length}</span>
                                            </div>

                                            <div className="space-y-4">
                                                {wishlistItems.slice(0, 4).map((item: any) => (
                                                    <div key={item.product_id} className="flex gap-4 group cursor-pointer" onClick={() => router.push(`/products/${item.slug || item.product_id}`)}>
                                                        <div className="h-16 w-16 bg-[#F8F5F0] rounded-xl border border-[#E8E1D5] flex items-center justify-center p-2 flex-shrink-0 overflow-hidden">
                                                            {item.primary_image_url ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img src={item.primary_image_url} alt={item.product_name} className="h-full w-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                                                            ) : (
                                                                <Package className="h-6 w-6 text-warm-gray/40" />
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col justify-center max-w-[150px]">
                                                            <p className="text-[9px] font-bold tracking-widest text-[#A8B28B] uppercase mb-0.5 truncate">{item.category_name || 'WELLNESS'}</p>
                                                            <p className="text-xs font-bold text-[#36453A] line-clamp-2 leading-tight mb-1 group-hover:text-black">{item.product_name}</p>
                                                            <div className="flex items-center gap-2 mt-auto">
                                                                <span className="text-xs font-bold text-[#36453A]">{formatPrice(item.price)}</span>
                                                                {item.on_sale && <span className="text-[10px] bg-red-100 text-red-700 px-1 rounded font-bold uppercase">Sale</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {wishlistItems.length === 0 && (
                                                    <div className="py-6 text-center border-2 border-dashed border-[#E8E1D5] rounded-xl bg-[#F8F5F0]/50">
                                                        <Heart className="h-6 w-6 text-warm-gray/40 mx-auto mb-2" />
                                                        <p className="text-xs font-medium text-warm-gray">Your sanctuary is empty.</p>
                                                    </div>
                                                )}
                                            </div>

                                            <button onClick={() => router.push('/account/wishlist')} className="w-full mt-6 bg-[#F8F5F0] text-[#36453A] text-xs font-bold py-3 rounded-xl hover:bg-[#E8E1D5] transition-colors flex items-center justify-center gap-2">
                                                Manage Full Wishlist <ChevronRight className="h-3 w-3" />
                                            </button>
                                        </div>

                                        {/* Vedashi Wallet Card */}
                                        <div className="bg-[#36453A] rounded-3xl p-6 text-white relative flex flex-col justify-between overflow-hidden shadow-md h-40">
                                            {/* Decorative Background Leaf */}
                                            <div className="absolute -right-4 -bottom-4 opacity-10">
                                                <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M17.5 3C15.24 3 13.04 3.73 11 4.9C8.96 3.73 6.76 3 4.5 3C4.1 3 3.7 3.03 3.32 3.08L3 3.12V10C3 15.52 7.48 20 13 20H21C21.55 20 22 19.55 22 19V6.5C22 4.57 20.43 3 18.5 3H17.5ZM19 18H13C9.04 18 5.76 15.17 5.11 11.41C6.67 11.8 8.35 12 10 12C13.88 12 17.52 10.61 20.35 8.32C20.67 9.8 21 11.36 21 13V18H19ZM18.5 5H20V6.5C20 7.82 19.51 9.04 18.72 9.97C16.89 10.63 14.99 11 13 11C10.6 11 8.24 10.45 6.13 9.4C6.55 6.44 8.7 3.96 11.66 3.18C13.43 4.29 15.35 5 17.5 5H18.5Z" />
                                                </svg>
                                            </div>

                                            <div className="relative z-10">
                                                <p className="text-[10px] font-bold tracking-widest text-[#D4A847] uppercase mb-1">Vedashi Wallet</p>
                                                <h3 className="text-3xl font-bold mb-1">${(Number(user?.wallet_balance || 0)).toFixed(2)}</h3>
                                                <p className="text-[10px] text-white/70 tracking-wide">Available balance for quick checkout</p>
                                            </div>

                                            <button className="relative z-10 bg-white text-[#36453A] text-xs font-bold py-2 px-4 rounded-lg w-fit shadow-sm hover:shadow-md transition-shadow">
                                                Add Credits
                                            </button>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ═══════════════════ ORDERS TAB ═══════════════════ */}
                        {activeTab === 'orders' && (
                            <div className="flex flex-col h-full bg-[#F8F5F0]">
                                {/* ── Orders Header ── */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-3xl font-bold text-[#36453A]">Orders List</h2>
                                        <span className="bg-[#E7F0E9] text-[#2D5A3A] text-xs font-bold px-3 py-1 rounded-full">
                                            {filteredAndSortedOrders.length} {filteredAndSortedOrders.length !== orders.length ? `of ${orders.length}` : ''} Total
                                        </span>
                                    </div> 
                                </div>

                                <div className="flex flex-col lg:flex-row gap-8 items-start">
                                    {/* ── Left Column: Master Orders List ── */}
                                    <div className="flex-1 w-full space-y-6">
                                        {/* Search & Filter Bar */}
                                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                                            <div className="relative flex-1 group">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-gray group-focus-within:text-[#36453A] transition-colors" />
                                                <input
                                                    type="text"
                                                    placeholder="Search by Order ID or Product Name..."
                                                    value={orderSearch}
                                                    onChange={e => setOrderSearch(e.target.value)}
                                                    className="w-full bg-white border border-[#E8E1D5] rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#36453A]/40 focus:ring-1 focus:ring-[#36453A]/20 transition-all text-[#36453A] placeholder:text-warm-gray/70 shadow-sm"
                                                />
                                            </div>
                                            <button className="flex items-center justify-center gap-2 bg-white border border-[#E8E1D5] rounded-xl px-4 py-3 text-sm font-bold text-[#36453A] hover:bg-[#F8F5F0] transition-colors shadow-sm whitespace-nowrap">
                                                <List className="h-4 w-4" /> Filters
                                            </button>
                                        </div>

                                        {/* Status Filters & Sort */}
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {['All', 'Pending', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
                                                    <button
                                                        key={status}
                                                        onClick={() => setOrderStatusFilter(status)}
                                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm border
                                                        ${orderStatusFilter === status
                                                                ? 'bg-[#36453A] text-white border-[#36453A]'
                                                                : 'bg-white text-[#36453A] border-[#E8E1D5] hover:bg-[#F8F5F0]'
                                                            }`}
                                                    >
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-warm-gray tracking-widest uppercase">SORT:</span>
                                                <select
                                                    value={orderSort}
                                                    onChange={(e) => setOrderSort(e.target.value)}
                                                    className="text-sm font-bold text-[#36453A] bg-transparent focus:outline-none appearance-none cursor-pointer pr-4"
                                                >
                                                    <option value="newest">Newest First</option>
                                                    <option value="oldest">Oldest First</option>
                                                    <option value="highest">Amount: High to Low</option>
                                                    <option value="lowest">Amount: Low to High</option>
                                                </select>
                                                <ChevronRight className="h-4 w-4 text-[#36453A] pointer-events-none rotate-90 -ml-5" />
                                            </div>
                                        </div>

                                        {/* Orders Feed */}
                                        <div className="space-y-4">
                                            {ordersLoading && (
                                                <div className="flex justify-center py-16">
                                                    <Loader2 className="h-8 w-8 animate-spin text-[#36453A]" />
                                                </div>
                                            )}
                                            {!ordersLoading && filteredAndSortedOrders.length === 0 && (
                                                <div className="rounded-3xl border border-[#E8E1D5] bg-white py-16 text-center shadow-sm">
                                                    <Package className="mx-auto h-12 w-12 text-warm-gray/30 mb-4" />
                                                    <p className="text-xl font-bold text-[#36453A]">No orders yet</p>
                                                    <p className="mt-2 text-sm text-warm-gray mb-6">{orderSearch || orderStatusFilter !== 'All' ? 'Try adjusting your filters.' : "You haven't placed any orders yet."}</p>
                                                    <button
                                                        onClick={() => router.push(`/${country}/shop`)}
                                                        className="rounded-xl bg-[#36453A] px-10 py-3 text-sm font-bold text-white shadow-md hover:bg-[#2A362D] transition-all"
                                                    >
                                                        Browse Shop
                                                    </button>
                                                </div>
                                            )}
                                            {!ordersLoading && filteredAndSortedOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(order => {
                                                const dtDate = new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
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
                                                        className={`rounded-3xl border transition-all cursor-pointer shadow-sm relative overflow-hidden flex flex-col
                                                        ${isSelected
                                                                ? 'bg-white border-[#36453A] ring-1 ring-[#36453A]/20'
                                                                : 'bg-white border-[#E8E1D5] hover:border-[#36453A]/30 hover:shadow-md'
                                                            }`}
                                                    >
                                                        {/* Header Row */}
                                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#F8F5F0]/60 border-b border-[#E8E1D5] px-4 py-3 sm:px-6">
                                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 w-full sm:w-auto">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] uppercase tracking-widest text-warm-gray font-bold mb-0.5">Order ID</span>
                                                                    <span className="text-sm font-bold text-[#36453A] flex items-center gap-1.5 line-clamp-1">
                                                                        #{order.order_id.split('-')[0].toUpperCase()}
                                                                    </span>
                                                                </div>
                                                                <div className="hidden sm:block w-px h-6 bg-[#E8E1D5]"></div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] uppercase tracking-widest text-warm-gray font-bold mb-0.5">Date Placed</span>
                                                                    <span className="text-sm font-bold text-[#36453A] flex items-center gap-1.5">
                                                                        {dtDate}
                                                                    </span>
                                                                </div>
                                                                <div className="hidden sm:block w-px h-6 bg-[#E8E1D5]"></div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] uppercase tracking-widest text-warm-gray font-bold mb-0.5">Total Amount</span>
                                                                    <span className="text-sm font-bold text-[#36453A]">
                                                                        {formatPrice(order.final_total || order.total_amount)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="mt-3 sm:mt-0">
                                                                <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border border-[#E8E1D5]
                                                                    ${order.order_status === 'DELIVERED' ? 'bg-[#F2F4EB] text-[#4A5D23]' :
                                                                        order.order_status === 'SHIPPED' ? 'bg-[#EEF2F6] text-[#2C4B7D]' :
                                                                            order.order_status === 'CANCELLED' ? 'bg-[#FCEAE8] text-[#9E2A2B]' :
                                                                                'bg-[#FCF6E5] text-[#8C6B23]'}`
                                                                }>
                                                                    {order.order_status === 'DELIVERED' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                                                    {order.order_status === 'PENDING' && <Loader2 className="h-3 w-3 mr-1" />}
                                                                    {order.order_status}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Main Content */}
                                                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-6 items-start sm:items-center relative">
                                                            {/* Selected state overlay hint */}
                                                            {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#36453A]"></div>}
                                                            
                                                            {/* Image */}
                                                            <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-[#F8F5F0] border border-[#E8E1D5] flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                                {prodImg ? (
                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                    <img src={prodImg} alt="Product" className="h-full w-full object-cover mix-blend-multiply" />
                                                                ) : (
                                                                    <Package className="h-8 w-8 text-warm-gray/40" />
                                                                )}
                                                            </div>
                                                            
                                                            {/* Info */}
                                                            <div className="flex-1 w-full min-w-0 flex flex-col justify-center">
                                                                <p className="text-base font-bold text-[#36453A] line-clamp-2">{prodName}</p>
                                                                {itemCount > 1 && (
                                                                    <p className="text-sm font-semibold text-warm-gray mt-1">
                                                                        and {itemCount - 1} more item(s)
                                                                    </p>
                                                                )}
                                                                <p className="text-xs font-medium text-warm-gray mt-2">Sold by Vedashi</p>
                                                            </div>
                                                            
                                                            {/* Actions */}
                                                            <div className="flex flex-wrap sm:flex-col gap-2 w-full sm:w-auto shrink-0 mt-4 sm:mt-0 border-t sm:border-t-0 sm:border-l border-[#E8E1D5] pt-4 sm:pt-0 sm:pl-6 justify-center">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleViewOrderDetails(order.order_id); }}
                                                                    className={`rounded-xl px-5 py-2 text-xs font-bold transition-all whitespace-nowrap border overflow-hidden
                                                                        ${isSelected ? 'bg-[#36453A] text-white border-[#36453A]' : 'bg-[#36453A] text-white border-[#36453A] hover:bg-[#2A362D]'}
                                                                    `}
                                                                >
                                                                    {isOrderLoading && selectedOrderDetails?.order_id === order.order_id ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'View Details'}
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        toast.success("Items added to cart.");
                                                                    }}
                                                                    className="rounded-xl px-5 py-2 text-xs font-bold bg-white text-[#36453A] border border-[#E8E1D5] hover:border-[#36453A]/40 hover:bg-[#F8F5F0] transition-all whitespace-nowrap"
                                                                >
                                                                    Reorder
                                                                </button>
                                                                {order.order_status === 'PENDING' && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setCancellingOrderId(order.order_id);
                                                                        }}
                                                                        className="rounded-xl px-5 py-2 text-xs font-bold bg-white text-red-600 border border-red-200 hover:border-red-400 hover:bg-red-50 transition-all whitespace-nowrap"
                                                                    >
                                                                        Cancel
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
                                            <div className="flex items-center justify-between pt-6 border-t border-[#E8E1D5]">
                                                <span className="text-sm font-medium text-warm-gray">
                                                    Showing <strong className="text-[#36453A]">
                                                        {Math.min((currentPage - 1) * pageSize + 1, filteredAndSortedOrders.length)}-{Math.min(currentPage * pageSize, filteredAndSortedOrders.length)}
                                                    </strong> of <strong className="text-[#36453A]">{filteredAndSortedOrders.length}</strong> orders
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                        disabled={currentPage === 1}
                                                        className={`px-4 py-2 text-sm font-bold rounded-xl border border-[#E8E1D5] transition-colors ${currentPage === 1 ? 'text-warm-gray bg-white opacity-50 cursor-not-allowed' : 'text-[#36453A] bg-white hover:bg-[#F8F5F0]'}`}
                                                    >
                                                        Previous
                                                    </button>
                                                    
                                                    {Array.from({ length: Math.ceil(filteredAndSortedOrders.length / pageSize) }).map((_, i) => (
                                                        <button 
                                                            key={i}
                                                            onClick={() => setCurrentPage(i + 1)}
                                                            className={`h-9 w-9 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center transition-all ${currentPage === i + 1 ? 'bg-[#36453A] text-white' : 'bg-white text-[#36453A] border border-[#E8E1D5] hover:bg-[#F8F5F0]'}`}
                                                        >
                                                            {i + 1}
                                                        </button>
                                                    ))}

                                                    <button 
                                                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredAndSortedOrders.length / pageSize), p + 1))}
                                                        disabled={currentPage === Math.ceil(filteredAndSortedOrders.length / pageSize)}
                                                        className={`px-4 py-2 text-sm font-bold rounded-xl border border-[#E8E1D5] transition-colors ${currentPage === Math.ceil(filteredAndSortedOrders.length / pageSize) ? 'text-warm-gray bg-white opacity-50 cursor-not-allowed' : 'text-[#36453A] bg-white hover:bg-[#F8F5F0]'}`}
                                                    >
                                                        Next
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* ── Right Column: Order Details Side Panel ── */}
                                    {selectedOrderDetails ? (
                                        <div className="w-full lg:w-[400px] flex-shrink-0 animate-in fade-in slide-in-from-right-4 duration-300">
                                            <div className="bg-white rounded-3xl border border-[#E8E1D5] shadow-sm overflow-hidden sticky top-32">

                                                {/* Header Bar */}
                                                <div className="px-6 py-5 border-b border-[#E8E1D5] flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-[#36453A]">Order Details</h3>
                                                        <p className="text-xs font-medium text-warm-gray mt-1">Order ID: {selectedOrderDetails.order_id.split('-')[0].toUpperCase()}</p>
                                                    </div>
                                                    <button onClick={() => setSelectedOrderDetails(null)} className="p-2 text-warm-gray hover:text-[#36453A] hover:bg-[#F8F5F0] rounded-full transition-colors">
                                                        <X className="h-5 w-5" />
                                                    </button>
                                                </div>

                                                <div className="p-6 space-y-6">

                                                    {/* Track Shipment Card */}
                                                    <div className="bg-[#36453A] rounded-[24px] p-6 text-white relative overflow-hidden shadow-md">
                                                        {/* Abstract truck graphic hint */}
                                                        <Package className="absolute -right-4 -bottom-4 h-28 w-28 text-white opacity-5 mix-blend-overlay" />

                                                        <div className="flex items-center justify-between mb-8 relative z-10">
                                                            <span className="text-[10px] font-bold tracking-widest uppercase opacity-70">Track Shipment</span>
                                                            <span className="bg-white/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm border border-white/20">
                                                                {selectedOrderDetails.order_status}
                                                            </span>
                                                        </div>
                                                        <div className="mb-6 relative z-10">
                                                            <p className="text-xs font-medium opacity-70 mb-1">
                                                                {selectedOrderDetails.order_status === 'DELIVERED' ? 'Delivered On' :
                                                                 selectedOrderDetails.order_status === 'SHIPPED' ? 'Shipped On' :
                                                                 selectedOrderDetails.order_status === 'CONFIRMED' ? 'Confirmed On' :
                                                                 'Ordered On'}
                                                            </p>
                                                            <p className="text-2xl font-bold">
                                                                {selectedOrderDetails.order_status === 'DELIVERED'
                                                                    ? new Date(selectedOrderDetails.updated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                                                    : new Date(selectedOrderDetails.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                                                }
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleTrackOrder(selectedOrderDetails.order_id)}
                                                            className="w-full bg-white text-[#36453A] rounded-xl py-3 text-sm font-bold shadow-sm hover:bg-[#F8F5F0] transition-colors flex items-center justify-center gap-2 relative z-10"
                                                        >
                                                            Track Order <ChevronRight className="h-4 w-4" />
                                                        </button>
                                                    </div>

                                                    {/* Items Summary */}
                                                    <div>
                                                        <h4 className="text-[11px] font-bold tracking-widest text-[#36453A] uppercase mb-4">Items Summary</h4>
                                                        <div className="rounded-2xl border border-[#E8E1D5] bg-[#F8F5F0]/50 divide-y divide-[#E8E1D5]">
                                                            {(selectedOrderDetails.items || []).map((item: any) => {
                                                                const prodImg = item.thumbnail_url || item.product?.thumbnail_url || item.product?.primary_image_url || item.product?.images?.[0] || null;
                                                                const prodName = item.product?.product_name || item.product_name || 'Product';
                                                                return (
                                                                    <div key={item.order_item_id} className="p-4 flex items-center justify-between gap-4">
                                                                        <div className="flex items-center gap-4 min-w-0">
                                                                            <div className="h-10 w-10 bg-white rounded-lg border border-[#E8E1D5] flex items-center justify-center p-1 flex-shrink-0">
                                                                                {prodImg ? (
                                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                                    <img src={prodImg} alt={prodName} className="h-full w-full object-contain mix-blend-multiply" />
                                                                                ) : (
                                                                                    <Package className="h-5 w-5 text-warm-gray/40" />
                                                                                )}
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <p className="text-xs font-bold text-[#36453A] truncate">{prodName}</p>
                                                                                <p className="text-[10px] font-medium text-warm-gray mt-0.5">Qty: {item.quantity}</p>
                                                                            </div>
                                                                        </div>
                                                                        <span className="text-xs font-bold text-[#36453A] whitespace-nowrap">
                                                                            {formatPrice(item.price || item.unit_price)}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* Shipping Address */}
                                                    <div>
                                                        <h4 className="text-[11px] font-bold tracking-widest text-[#36453A] uppercase mb-4">Shipping Address</h4>
                                                        <div className="rounded-2xl border border-[#E8E1D5] bg-[#F8F5F0]/50 p-4 flex items-start gap-3">
                                                            <div className="mt-0.5 text-[#36453A]/60">
                                                                <MapPin className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-[#36453A] mb-1">
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
                                                        <h4 className="text-[11px] font-bold tracking-widest text-[#36453A] uppercase mb-4">Payment Info</h4>
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between text-xs text-warm-gray font-medium">
                                                                <span>Subtotal</span>
                                                                <span className="text-[#36453A] font-bold">{formatPrice(selectedOrderDetails.total_amount || 0)}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-xs text-warm-gray font-medium">
                                                                <span>Eco-Shipping</span>
                                                                <span className="text-[#36453A] font-bold">FREE</span>
                                                            </div>


                                                            <div className="pt-3 border-t border-[#E8E1D5] flex items-center justify-between">
                                                                <span className="text-sm font-bold text-[#36453A]">Total</span>
                                                                <span className="text-lg font-bold text-[#36453A]">{formatPrice(selectedOrderDetails.final_total || selectedOrderDetails.total_amount || 0)}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex gap-3 pt-6 border-t border-[#E8E1D5]">
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await downloadInvoice(selectedOrderDetails.order_id);
                                                                    toast.success('Invoice downloaded successfully');
                                                                } catch {
                                                                    toast.error('Failed to download invoice');
                                                                }
                                                            }}
                                                            className="flex-1 flex justify-center items-center gap-2 border border-[#E8E1D5] bg-white rounded-xl py-2.5 text-xs font-bold text-[#36453A] hover:bg-[#F8F5F0] transition-colors shadow-sm"
                                                        >
                                                            <Download className="h-3.5 w-3.5" /> Invoice
                                                        </button>
                                                        {(() => {
                                                            const linkedTicket = enquiries.find(e => e._order_id === selectedOrderDetails.order_id && e._source === 'ticket');
                                                            return linkedTicket ? (
                                                                <button
                                                                    onClick={() => router.push(`/${country}/help-center/support/${linkedTicket._ticket_id}`)}
                                                                    className="flex-1 flex justify-center items-center gap-2 border border-[#36453A]/20 bg-[#F8F5F0] rounded-xl py-2.5 text-xs font-bold text-[#36453A] hover:bg-white transition-colors shadow-sm"
                                                                >
                                                                    <MessageSquare className="h-3.5 w-3.5" /> View Ticket
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => router.push(`/${country}/help-center/support?orderId=${selectedOrderDetails.order_id.split('-')[0].toUpperCase()}`)}
                                                                    className="flex-1 flex justify-center items-center gap-2 border border-[#E8E1D5] bg-white rounded-xl py-2.5 text-xs font-bold text-[#36453A] hover:bg-[#F8F5F0] transition-colors shadow-sm"
                                                                >
                                                                    <Mail className="h-3.5 w-3.5" /> Support
                                                                </button>
                                                            );
                                                        })()}
                                                        {selectedOrderDetails?.order_status === 'PENDING' && (
                                                            <button
                                                                onClick={() => setCancellingOrderId(selectedOrderDetails.order_id)}
                                                                className="flex-1 flex justify-center items-center gap-2 border border-red-200 bg-red-50 rounded-xl py-2.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors shadow-sm"
                                                            >
                                                                <X className="h-3.5 w-3.5" /> Cancel Order
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Associated Ticket Messages Preview */}
                                                    {(() => {
                                                        const ticket = enquiries.find(e => e._order_id === selectedOrderDetails.order_id && e._source === 'ticket');
                                                        return ticket ? (
                                                            <div className="pt-6 border-t border-[#E8E1D5]">
                                                                <h4 className="text-[11px] font-bold tracking-widest text-[#36453A] uppercase mb-4 flex items-center gap-2">
                                                                    <MessageCircle className="h-3.5 w-3.5 text-[#D4A847]" /> Inquiry Correspondence
                                                                </h4>
                                                                <div className="rounded-2xl border border-[#E8E1D5] bg-[#F8F5F0]/30 p-4 space-y-3">
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-[10px] font-bold text-[#36453A] uppercase">#{ticket._ticket_number || ticket.feedback_id.slice(0, 8)}</span>
                                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                                                            ticket.status === 'resolved' || ticket.status === 'closed' ? 'bg-green-100 text-green-700' :
                                                                            ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                                            'bg-amber-100 text-amber-700'
                                                                        }`}>
                                                                            {ticket.status}
                                                                        </span>
                                                                    </div>
                                                                    <div className="relative">
                                                                        <p className="text-xs text-[#36453A] line-clamp-2 italic leading-relaxed pl-3 border-l-2 border-[#D4A847]/40">
                                                                            "{ticket.message}"
                                                                        </p>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => router.push(`/${country}/help-center/support/${ticket._ticket_id}`)}
                                                                        className="w-full text-[10px] font-black uppercase tracking-[0.1em] text-[#36453A] hover:text-black flex items-center justify-center gap-1.5 mt-2 py-2 rounded-lg bg-white/50 border border-white hover:border-[#E8E1D5] transition-all group"
                                                                    >
                                                                        Access All Messages <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : null;
                                                    })()}

                                                    <button
                                                        className="w-full bg-[#36453A] text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#2A362D] transition-colors shadow-sm"
                                                        onClick={async () => {
                                                            const items = selectedOrderDetails.items || [];
                                                            if (items.length === 0) {
                                                                toast.error('No items found in this order.');
                                                                return;
                                                            }
                                                            const toastId = toast.loading('Adding items to cart...');
                                                            try {
                                                                for (const item of items) {
                                                                    const productId = item.product_id || item.product?.product_id;
                                                                    const variantId = item.variant_id || item.variant?.variant_id || null;
                                                                    if (productId) {
                                                                        await addCartItem(productId, variantId, item.quantity || 1);
                                                                    }
                                                                }
                                                                toast.success('All items added to cart!', { id: toastId });
                                                            } catch {
                                                                toast.error('Failed to add some items to cart.', { id: toastId });
                                                            }
                                                        }}
                                                    >
                                                        <ShoppingCart className="h-4 w-4" /> Buy These Items Again
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="hidden lg:block w-[400px] flex-shrink-0">
                                            {/* Empty detail state placeholder to preserve grid mapping */}
                                            <div className="bg-[#F8F5F0] border-2 border-dashed border-[#E8E1D5] rounded-3xl h-[600px] flex flex-col items-center justify-center text-center p-8 opacity-70 sticky top-32">
                                                <Package className="h-12 w-12 text-warm-gray/30 mb-4" />
                                                <h3 className="text-xl font-bold text-[#36453A] mb-2">Select an Order</h3>
                                                <p className="text-sm text-warm-gray leading-relaxed">Choose an order from the list to view tracking, items, and billing details here.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ─── Cancel Order Confirmation Modal ─── */}
                        {isMounted && cancellingOrderId && createPortal(
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-bold text-charcoal">Cancel Order</h3>
                                            <button onClick={() => setCancellingOrderId(null)} className="text-warm-gray hover:text-charcoal"><X size={20} /></button>
                                        </div>
                                        <p className="text-sm text-warm-gray mb-4">Please let us know why you would like to cancel your order.</p>
                                        <textarea
                                            value={cancelReason}
                                            onChange={e => setCancelReason(e.target.value)}
                                            placeholder="Reason for cancellation..."
                                            className="w-full bg-cream rounded-xl p-4 text-sm focus:outline-none border border-transparent focus:border-burgundy/20 min-h-[120px]"
                                        />
                                        <div className="flex gap-3 mt-6">
                                            <button
                                                onClick={() => setCancellingOrderId(null)}
                                                className="flex-1 py-3 text-sm font-semibold text-charcoal hover:bg-cream transition-colors rounded-xl border border-light-border"
                                            >
                                                Keep Order
                                            </button>
                                            <button
                                                onClick={() => handleCancelOrder(cancellingOrderId)}
                                                disabled={cancelSubmitting || !cancelReason}
                                                className="flex-1 py-3 text-sm font-semibold text-white bg-burgundy hover:opacity-90 transition-all rounded-xl disabled:opacity-50"
                                            >
                                                {cancelSubmitting ? 'Cancelling...' : 'Cancel Order'}
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
                                <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                                    <div className="h-1" style={{ background: 'linear-gradient(90deg, #10b981, #D4A847)' }} />
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <BadgeCheck className="h-5 w-5 text-emerald-600" />
                                                <h3 className="font-bold text-charcoal text-lg">Verified Purchase Review</h3>
                                            </div>
                                            <button
                                                onClick={() => setReviewModal(null)}
                                                className="p-1.5 rounded-lg hover:bg-cream transition-colors text-warm-gray hover:text-charcoal"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <p className="text-sm text-warm-gray mb-4">
                                            Reviewing: <span className="font-medium text-charcoal">{reviewModal.productName}</span>
                                        </p>
                                        <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100">
                                            <BadgeCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                            <p className="text-xs text-emerald-700">This review will have a <strong>Verified Purchase</strong> badge because your order has been delivered.</p>
                                        </div>
                                        <ReviewForm
                                            productId={reviewModal.productId}
                                            orderId={reviewModal.orderId}
                                            onSubmitted={() => {
                                                setReviewModal(null);
                                                toast.success('Review submitted with Verified Purchase badge!');
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
                                <div className="rounded-[40px] bg-[#F8F5F0] overflow-hidden relative shadow-sm border border-[#E8E1D5] py-16 px-12">
                                    {/* Abstract background shapes matching mockup */}
                                    <div className="absolute top-0 right-0 w-[60%] h-full bg-white opacity-40 mix-blend-overlay rounded-bl-[100px] pointer-events-none -mr-12 -mt-12"></div>
                                    <div className="absolute bottom-0 left-[20%] w-[30%] h-[30%] bg-white opacity-30 mix-blend-overlay rounded-tr-[100px] pointer-events-none"></div>

                                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-12">
                                        <div className="max-w-xl">
                                            <span className="inline-block bg-white border border-[#E8E1D5] rounded-full px-4 py-1.5 text-[10px] font-bold text-[#36453A] uppercase tracking-widest mb-6">
                                                My Sanctuary
                                            </span>
                                            <h2 className="text-5xl font-bold text-[#36453A] leading-tight mb-4">
                                                Your Personal Wellness <br className="hidden sm:block" /> Wishlist
                                            </h2>
                                            <p className="text-warm-gray text-base leading-relaxed">
                                                A curated space for the rituals you love. Keep track of your organic essentials and wellness tools.
                                            </p>
                                        </div>

                                        {/* Total Items Saved Card */}
                                        <div className="bg-white rounded-3xl shadow-md border border-[#E8E1D5]/50 p-8 flex flex-col items-center justify-center min-w-[200px] relative z-20">
                                            <div className="h-16 w-16 bg-[#F8F5F0] rounded-2xl flex items-center justify-center mb-4">
                                                <Heart className="h-7 w-7 text-[#36453A]" />
                                            </div>
                                            <p className="text-4xl font-bold text-[#36453A] mb-1">{wishlistItems.length}</p>
                                            <p className="text-[10px] font-bold text-warm-gray uppercase tracking-widest">TOTAL ITEMS SAVED</p>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Actions Bar ── */}
                                <div className="border-b border-[#E8E1D5] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-6">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className="relative flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    className="peer appearance-none w-5 h-5 rounded-md border-2 border-[#E8E1D5] checked:bg-[#36453A] checked:border-[#36453A] transition-colors cursor-pointer"
                                                    onChange={handleWishlistSelectAll}
                                                    checked={wishlistItems.length > 0 && selectedWishlistItems.size === wishlistItems.length}
                                                />
                                                <Check className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                                            </div>
                                            <span className="text-sm font-bold text-[#36453A] group-hover:text-[#2A362D] transition-colors">Select All</span>
                                        </label>

                                        <div className="w-px h-5 bg-[#E8E1D5]"></div>

                                        <button
                                            onClick={handleAddSelectedToCart}
                                            disabled={selectedWishlistItems.size === 0}
                                            className="flex items-center gap-2 text-sm font-bold text-[#36453A] hover:text-[#2A362D] disabled:opacity-30 transition-colors"
                                        >
                                            <ShoppingCart className="h-4 w-4" /> Add Selected to Cart
                                        </button>

                                        <button
                                            onClick={() => setConfirmingBulkRemove(true)}
                                            disabled={selectedWishlistItems.size === 0}
                                            className="flex items-center gap-2 text-sm font-bold text-warm-gray hover:text-red-500 disabled:opacity-30 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" /> Remove
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-6 self-end sm:self-auto">
                                        {/* View Toggles */}
                                        <div className="flex items-center gap-2 border border-[#E8E1D5] rounded-full p-1 bg-white">
                                            <button className="p-1.5 rounded-full bg-[#F8F5F0] text-[#36453A] shadow-sm"><LayoutGrid className="h-4 w-4" /></button>
                                            <button className="p-1.5 rounded-full text-warm-gray hover:text-[#36453A]"><List className="h-4 w-4" /></button>
                                        </div>

                                        {/* Sort */}
                                        <div className="flex items-center gap-3 bg-white border border-[#E8E1D5] rounded-full px-4 py-2">
                                            <span className="text-[10px] font-bold text-warm-gray tracking-widest uppercase">SORT BY:</span>
                                            <select
                                                value={wishlistSort}
                                                onChange={(e) => setWishlistSort(e.target.value)}
                                                className="text-sm font-bold text-[#36453A] bg-transparent focus:outline-none appearance-none cursor-pointer pr-4 uppercase"
                                            >
                                                <option value="recently_added">Recently Added</option>
                                                <option value="price_low">Price: Low to High</option>
                                                <option value="price_high">Price: High to Low</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Product Grid ── */}
                                {sortedWishlistItems.length === 0 ? (
                                    <div className="rounded-[30px] border border-[#E8E1D5] bg-white py-24 text-center">
                                        <Heart className="mx-auto h-16 w-16 text-warm-gray/30 mb-4" />
                                        <p className="text-2xl font-bold text-[#36453A]">Your sanctuary is empty</p>
                                        <p className="mt-2 text-warm-gray text-lg">{wishlistItems.length > 0 ? "No matches found for your current sort." : "Save your favorite organic rituals here."}</p>
                                        <button
                                            onClick={() => router.push(`/${country}/shop`)}
                                            className="mt-8 rounded-xl bg-[#36453A] px-10 py-3 text-sm font-bold text-white shadow-md hover:bg-[#2A362D] transition-all"
                                        >
                                            Browse Shop
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                         {sortedWishlistItems.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((prod) => {
                                            const product = prod as any;
                                            const isSelected = selectedWishlistItems.has(product.product_id);
                                            const stockStatus = (product.stock_status || '').toLowerCase();
                                            const inStock = stockStatus === 'in_stock';
                                            const addDate = product.created_at ? new Date(product.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently';

                                            return (
                                                <div key={product.product_id} className="group flex flex-col rounded-3xl border border-[#E8E1D5] bg-white p-4 transition-all hover:shadow-lg relative">
                                                    {/* Individual Remove Button */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setConfirmingIndividualRemove(product.product_id);
                                                        }}
                                                        className="absolute top-6 right-6 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white text-warm-gray shadow-sm hover:text-red-500 hover:shadow-md transition-all border border-[#E8E1D5] opacity-0 group-hover:opacity-100"
                                                        title="Remove from wishlist"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>

                                                    {/* Checkbox Overlay */}
                                                    <div className="absolute top-6 left-6 z-10">
                                                        <div className="relative flex items-center justify-center">
                                                            <input
                                                                type="checkbox"
                                                                className="peer appearance-none w-[22px] h-[22px] rounded-md bg-white border-2 border-white shadow-sm checked:bg-white checked:border-white transition-colors cursor-pointer"
                                                                checked={isSelected}
                                                                onChange={() => handleWishlistToggleItem(product.product_id)}
                                                            />
                                                            <div className="absolute inset-0 rounded-md border border-[#E8E1D5] peer-checked:border-white pointer-events-none"></div>
                                                            <Check className="absolute h-3.5 w-3.5 text-[#36453A] opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={3} />
                                                        </div>
                                                    </div>

                                                    {/* Product Image */}
                                                    <div className="aspect-[4/5] w-full rounded-2xl overflow-hidden bg-[#F8F5F0] mb-5 relative cursor-pointer" onClick={() => router.push(`/products/${product.slug || product.product_id}`)}>
                                                        {product.images && product.images[0] ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={product.images[0]} alt={product.product_name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                                        ) : (
                                                            <div className="flex h-full items-center justify-center text-warm-gray/30"><Package className="h-12 w-12" /></div>
                                                        )}
                                                    </div>

                                                    {/* Details */}
                                                    <div className="flex flex-col flex-1 px-1">
                                                        <div className="flex items-start justify-between gap-3 mb-1">
                                                            <h3 className="text-base font-bold text-[#36453A] leading-snug cursor-pointer hover:underline" onClick={() => router.push(`/products/${product.slug || product.product_id}`)}>
                                                                {product.product_name}
                                                            </h3>
                                                            <span className="font-bold text-[#36453A] whitespace-nowrap">${product.price}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mb-2 mt-auto">
                                                            {/* Status labels removed as per request */}
                                                        </div>

                                                        {/* Action */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                addCartItem(product.product_id, null, 1);
                                                                removeWishlistItem(product.product_id);
                                                                toast.success('Moved to cart');
                                                            }}
                                                            disabled={!inStock}
                                                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#36453A] py-3 text-sm font-bold text-white shadow-md hover:bg-[#2A362D] hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <ShoppingCart className="h-4 w-4" /> {inStock ? 'Add to Cart' : 'Out of Stock'}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Find More Treasures Tile */}
                                        <div className="group flex flex-col justify-center items-center rounded-3xl border-2 border-dashed border-[#E8E1D5] bg-white p-8 transition-all hover:bg-[#F8F5F0] hover:border-transparent text-center cursor-pointer min-h-[400px]">
                                            <div className="h-12 w-12 rounded-full border-2 border-[#E8E1D5] flex items-center justify-center bg-white group-hover:border-[#36453A] group-hover:text-[#36453A] text-warm-gray transition-colors mb-6 shadow-sm">
                                                <Plus className="h-5 w-5" />
                                            </div>
                                            <h3 className="text-xl font-bold text-[#36453A] mb-2">Find More Treasures</h3>
                                            <p className="text-xs text-warm-gray leading-relaxed mb-6 max-w-[200px]">Continue exploring our organic collections.</p>
                                            <button
                                                onClick={() => router.push('/shop')}
                                                className="rounded-xl border border-[#E8E1D5] px-6 py-2.5 text-xs font-bold text-[#36453A] group-hover:bg-white group-hover:shadow-sm transition-all bg-white"
                                            >
                                                Browse Shop
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Wishlist Pagination Bottom */}
                                {sortedWishlistItems.length > pageSize && (
                                    <div className="flex items-center justify-between pt-6 border-t border-[#E8E1D5]">
                                        <span className="text-sm font-medium text-warm-gray">
                                            Showing <strong className="text-[#36453A]">
                                                {Math.min((currentPage - 1) * pageSize + 1, sortedWishlistItems.length)}-{Math.min(currentPage * pageSize, sortedWishlistItems.length)}
                                            </strong> of <strong className="text-[#36453A]">{sortedWishlistItems.length}</strong> items
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className={`px-4 py-2 text-sm font-bold rounded-xl border border-[#E8E1D5] transition-colors ${currentPage === 1 ? 'text-warm-gray bg-white opacity-50 cursor-not-allowed' : 'text-[#36453A] bg-white hover:bg-[#F8F5F0]'}`}
                                            >
                                                Previous
                                            </button>
                                            
                                            {Array.from({ length: Math.ceil(sortedWishlistItems.length / pageSize) }).map((_, i) => (
                                                <button 
                                                    key={i}
                                                    onClick={() => setCurrentPage(i + 1)}
                                                    className={`h-9 w-9 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center transition-all ${currentPage === i + 1 ? 'bg-[#36453A] text-white' : 'bg-white text-[#36453A] border border-[#E8E1D5] hover:bg-[#F8F5F0]'}`}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}

                                            <button 
                                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(sortedWishlistItems.length / pageSize), p + 1))}
                                                disabled={currentPage === Math.ceil(sortedWishlistItems.length / pageSize)}
                                                className={`px-4 py-2 text-sm font-bold rounded-xl border border-[#E8E1D5] transition-colors ${currentPage === Math.ceil(sortedWishlistItems.length / pageSize) ? 'text-warm-gray bg-white opacity-50 cursor-not-allowed' : 'text-[#36453A] bg-white hover:bg-[#F8F5F0]'}`}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ── Recommended Rituals ── */}
                                {wishlistItems.length > 0 && (
                                    <div className="pt-12 border-t border-[#E8E1D5]">
                                        <div className="flex items-end justify-between mb-8">
                                            <div>
                                                <h3 className="text-2xl font-bold text-[#36453A] mb-1">Recommended Rituals</h3>
                                                <p className="text-sm font-medium text-warm-gray">Based on your saved wellness essentials</p>
                                            </div>
                                            <button className="text-[11px] font-bold text-[#36453A] uppercase tracking-widest flex items-center gap-1 hover:opacity-70 transition-opacity">
                                                See All Recommendations <ChevronRight className="h-3.5 w-3.5" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                            {recommendedProducts.map(product => (
                                                <div key={product.product_id} className="group relative flex flex-col rounded-[20px] bg-white transition-all hover:shadow-md cursor-pointer overflow-hidden p-2" onClick={() => router.push(`/products/${product.slug || product.product_id}`)}>
                                                    {/* Product Image Box */}
                                                    <div className="aspect-[4/5] w-full rounded-[14px] overflow-hidden bg-[#F8F5F0] relative">
                                                        {product.images && product.images[0] ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={product.images[0]} alt={product.product_name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                                        ) : (
                                                            <div className="flex h-full items-center justify-center text-warm-gray/30"><Package className="h-10 w-10" /></div>
                                                        )}
                                                        {/* Quick Add Plus Icon Overlay */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                addCartItem(product.product_id, null, 1);
                                                                toast.success('Added to cart');
                                                            }}
                                                            className="absolute bottom-3 right-3 h-7 w-7 rounded-sm bg-[#36453A] text-white flex items-center justify-center shadow-md hover:bg-[#2A362D] transition-colors"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </button>
                                                    </div>

                                                    {/* Details */}
                                                    <div className="pt-3 px-1">
                                                        <h4 className="text-[13px] font-bold text-[#36453A] leading-snug line-clamp-2 min-h-[38px]">
                                                            {product.product_name}
                                                        </h4>
                                                        <p className="font-bold text-[#36453A] text-xs mt-1">${product.price}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ═══════════════════ ADDRESSES TAB ═══════════════════ */}
                        {activeTab === 'addresses' && (
                            <div className="max-w-[1200px] space-y-12 pb-16">
                                {/* ── Rituals Header ── */}
                                <div className="rounded-[40px] bg-[#F8F5F0] overflow-hidden relative shadow-sm border border-[#E8E1D5] py-16 px-12">
                                    {/* Abstract background shapes matching sanctuary aesthetic */}
                                    <div className="absolute top-0 right-0 w-[60%] h-full bg-white opacity-40 mix-blend-overlay rounded-bl-[100px] pointer-events-none -mr-12 -mt-12" />
                                    <div className="absolute bottom-0 left-[20%] w-[30%] h-[30%] bg-white opacity-30 mix-blend-overlay rounded-tr-[100px] pointer-events-none" />

                                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-12">
                                        <div className="max-w-xl">
                                            <span className="inline-block bg-white border border-[#E8E1D5] rounded-full px-4 py-1.5 text-[10px] font-bold text-[#36453A] uppercase tracking-widest mb-6">
                                                Delivery Rituals
                                            </span>
                                            <h2 className="text-5xl font-bold text-[#36453A] leading-tight mb-4">
                                                Your Sacred <br className="hidden sm:block" /> Delivery Spaces
                                            </h2>
                                            <p className="text-warm-gray text-base leading-relaxed">
                                                Manage the destinations for your wellness rituals. Each address is a point of connection for your Ayurvedic journey.
                                            </p>
                                        </div>

                                        {/* Add New Address Card */}
                                        {!showAddressForm && (
                                            <button
                                                onClick={() => { resetAddressForm(); setShowAddressForm(true); }}
                                                className="bg-white rounded-3xl shadow-md border border-[#E8E1D5]/50 p-8 flex flex-col items-center justify-center min-w-[200px] relative z-20 group hover:border-[#36453A]/30 transition-all hover:shadow-lg"
                                            >
                                                <div className="h-16 w-16 bg-[#F8F5F0] rounded-2xl flex items-center justify-center mb-4 group-hover:bg-[#36453A] transition-colors">
                                                    <Plus className="h-7 w-7 text-[#36453A] group-hover:text-white transition-colors" />
                                                </div>
                                                <p className="text-xl font-bold text-[#36453A] mb-1">Add Ritual Space</p>
                                                <p className="text-[10px] font-bold text-warm-gray uppercase tracking-widest">New Delivery Address</p>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Address Form (animated) */}
                                {isMounted && showAddressForm && createPortal(
                                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                                            <div className="px-6 py-4 border-b border-light-border flex items-center justify-between">
                                                <h3 className="text-xl font-bold text-charcoal">
                                                    {editingAddress ? 'Revise Sanctuary Path' : 'Enshrine New Sanctuary'}
                                                </h3>
                                                <button onClick={() => setShowAddressForm(false)} className="text-warm-gray hover:text-charcoal"><X size={20} /></button>
                                            </div>
                                            <form onSubmit={handleAddressSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="md:col-span-2">
                                                        <label className="block text-[11px] font-bold text-warm-gray tracking-widest uppercase mb-1.5 ml-1">Label (e.g., Home, Sanctuary)</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={addressForm.label}
                                                            onChange={e => setAddressForm({ ...addressForm, label: e.target.value })}
                                                            placeholder="Home / Work / Temple"
                                                            className="w-full bg-cream rounded-xl px-4 py-3 text-sm focus:outline-none border border-transparent focus:border-burgundy/20"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className="block text-[11px] font-bold text-warm-gray tracking-widest uppercase mb-1.5 ml-1">Path Line 1 (Street, Area)</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={addressForm.address_line1}
                                                            onChange={e => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                                                            className="w-full bg-cream rounded-xl px-4 py-3 text-sm focus:outline-none border border-transparent focus:border-burgundy/20"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className="block text-[11px] font-bold text-warm-gray tracking-widest uppercase mb-1.5 ml-1">Path Line 2 (Optional)</label>
                                                        <input
                                                            type="text"
                                                            value={addressForm.address_line2}
                                                            onChange={e => setAddressForm({ ...addressForm, address_line2: e.target.value })}
                                                            className="w-full bg-cream rounded-xl px-4 py-3 text-sm focus:outline-none border border-transparent focus:border-burgundy/20"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-warm-gray tracking-widest uppercase mb-1.5 ml-1">Postal Code (Pincode)</label>
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
                                                        <label className="block text-[11px] font-bold text-warm-gray tracking-widest uppercase mb-1.5 ml-1">Sanctuary Domain (Country)</label>
                                                        <Select
                                                            options={countryOptions}
                                                            styles={customSelectStyles}
                                                            value={countryOptions.find(opt => opt.value === addressForm.country_code)}
                                                            onChange={(opt: any) => setAddressForm({ ...addressForm, country: opt.name, country_code: opt.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-warm-gray tracking-widest uppercase mb-1.5 ml-1">City</label>
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
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-warm-gray tracking-widest uppercase mb-1.5 ml-1">Province (State)</label>
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
                                                        <label className="block text-[11px] font-bold text-warm-gray tracking-widest uppercase mb-1.5 ml-1">Commune Number (Phone)</label>
                                                        <div className="flex gap-2">
                                                            <div className="w-24 shrink-0">
                                                                <input
                                                                    type="text"
                                                                    disabled
                                                                    value={selectedCountryCode}
                                                                    className="w-full bg-cream rounded-xl px-3 py-3 text-sm border-transparent text-charcoal/50"
                                                                />
                                                            </div>
                                                            <input
                                                                type="text"
                                                                required
                                                                value={addressForm.phone}
                                                                onChange={e => setAddressForm({ ...addressForm, phone: e.target.value.replace(/\D/g, '') })}
                                                                className="flex-1 bg-cream rounded-xl px-4 py-3 text-sm focus:outline-none border border-transparent focus:border-burgundy/20"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 pt-2">
                                                    <input
                                                        type="checkbox"
                                                        id="is_default"
                                                        checked={addressForm.is_default}
                                                        onChange={e => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                                                        className="w-4 h-4 rounded text-burgundy focus:ring-burgundy"
                                                    />
                                                    <label htmlFor="is_default" className="text-sm text-charcoal font-medium cursor-pointer select-none">Set as Principal Sanctuary (Default Address)</label>
                                                </div>
                                                <div className="flex gap-3 pt-4 sticky bottom-0 bg-white">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowAddressForm(false)}
                                                        className="flex-1 py-3 text-sm font-semibold text-charcoal hover:bg-cream transition-colors rounded-xl border border-light-border"
                                                    >
                                                        Back
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="flex-1 py-3 text-sm font-semibold text-[#E8D5A3] bg-[#1C2B1A] hover:bg-[#2A3B28] transition-all rounded-xl shadow-lg border border-[#3A4B38]"
                                                    >
                                                        {editingAddress ? 'Update Path' : 'Enshrine Path'}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>,
                                    document.body
                                )}

                                {addressesLoading ? (
                                    <div className="flex justify-center py-24">
                                        <Loader2 className="h-12 w-12 animate-spin text-[#36453A]" />
                                    </div>
                                ) : addresses.length === 0 && !showAddressForm ? (
                                    <div className="rounded-[30px] border border-[#E8E1D5] bg-white py-24 text-center">
                                        <MapPin className="mx-auto h-16 w-16 text-warm-gray/30 mb-4" />
                                        <p className="text-2xl font-bold text-[#36453A]">No saved rituals</p>
                                        <p className="mt-2 text-warm-gray text-lg">Define your first delivery space to begin your journey.</p>
                                        <button
                                            onClick={() => { resetAddressForm(); setShowAddressForm(true); }}
                                            className="mt-8 rounded-xl bg-[#36453A] px-10 py-3 text-sm font-bold text-white shadow-md hover:bg-[#2A362D] transition-all"
                                        >
                                            <Plus className="inline h-4 w-4 mr-2" strokeWidth={3} /> Add Address
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid gap-6 sm:grid-cols-2">
                                        {addresses.map(addr => (
                                            <div key={addr.address_id}
                                                className={`group relative rounded-[24px] border bg-white p-6 transition-all hover:shadow-lg ${addr.is_default ? 'border-[#D4A847] ring-1 ring-[#D4A847]/20 shadow-sm' : 'border-[#E8E1D5]'}`}
                                            >
                                                {/* Default badge */}
                                                {addr.is_default && (
                                                    <div className="absolute -top-3 left-6 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[10px] font-bold text-white shadow-md"
                                                        style={{ background: 'linear-gradient(135deg, #36453A, #4A5D23)' }}>
                                                        <Star className="h-3 w-3 fill-[#D4A847] text-[#D4A847]" /> PRIMARY RITUAL SPACE
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-start">
                                                    <div className="pt-2">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="h-10 w-10 rounded-xl bg-[#F8F5F0] flex items-center justify-center border border-[#E8E1D5]">
                                                                <MapPin className="h-5 w-5 text-[#36453A]" />
                                                            </div>
                                                            {addr.label && (
                                                                <span className="bg-[#36453A]/10 text-[#36453A] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                                    {addr.label}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-base font-bold text-[#36453A] leading-tight">{addr.address_line1}</p>
                                                            {addr.address_line2 && <p className="text-sm text-warm-gray font-medium">{addr.address_line2}</p>}
                                                            <p className="text-sm text-warm-gray font-medium tracking-wide">
                                                                {addr.city}, {addr.state} {addr.pincode}
                                                            </p>
                                                            {addr.country && addr.country !== 'India' && (
                                                                <p className="text-sm text-warm-gray font-medium">{addr.country}</p>
                                                            )}
                                                        </div>

                                                        {addr.phone && (
                                                            <div className="mt-5 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F8F5F0] border border-[#E8E1D5] w-fit">
                                                                <Phone className="h-3 w-3 text-warm-gray" />
                                                                <span className="text-xs font-bold text-[#36453A]">{addr.phone}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                        {!addr.is_default && (
                                                            <button onClick={() => handleSetDefault(addr)}
                                                                title="Set as primary"
                                                                className="h-9 w-9 flex items-center justify-center text-warm-gray hover:text-[#D4A847] transition-all bg-white rounded-xl border border-[#E8E1D5] hover:border-[#D4A847]/30 hover:shadow-sm">
                                                                <Star className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        <button onClick={() => startEditAddress(addr)}
                                                            title="Edit Details"
                                                            className="h-9 w-9 flex items-center justify-center text-warm-gray hover:text-[#36453A] transition-all bg-white rounded-xl border border-[#E8E1D5] hover:border-[#36453A]/30 hover:shadow-sm">
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => setDeletingAddressId(addr.address_id)}
                                                            title="Delete Space"
                                                            className="h-9 w-9 flex items-center justify-center text-warm-gray hover:text-red-500 transition-all bg-white rounded-xl border border-[#E8E1D5] hover:border-red-200 hover:shadow-sm">
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
                                <div className="rounded-3xl bg-white shadow-sm border border-[#E8E1D5] p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-full pointer-events-none opacity-[0.03]">
                                        <svg viewBox="0 0 100 100" className="w-full h-full text-[#36453A] fill-current">
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
                                                    <span className="text-3xl font-bold text-[#36453A]">
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
                                                        title="Remove Photo"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={imageUploading}
                                                    className="h-8 w-8 rounded-full bg-[#36453A] text-white flex items-center justify-center shadow-md hover:bg-[#2A362D] transition-transform hover:scale-110 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#36453A]/30"
                                                    title="Upload Photo"
                                                >
                                                    <Camera className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h2 className="text-3xl font-bold text-[#36453A]">{profileData.full_name || user?.name}</h2>
                                                <span className="bg-[#D4A847]/20 text-[#B38720] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                                    Lifetime Member
                                                </span>
                                            </div>
                                            <p className="text-sm text-warm-gray font-medium">Holistic Living Enthusiast • Member since {profileData.created_at ? new Date(profileData.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'September 2021'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8 relative z-10">
                                        <div className="text-center">
                                            <p className="text-3xl font-bold text-[#36453A] mb-1">{orderCount}</p>
                                            <p className="text-[10px] font-bold text-warm-gray tracking-widest uppercase">Rituals Done</p>
                                        </div>
                                        <div className="w-px h-12 bg-[#E8E1D5]"></div>
                                        <div className="text-center">
                                            <p className="text-3xl font-bold text-[#36453A] mb-1">{reviewsCount}</p>
                                            <p className="text-[10px] font-bold text-warm-gray tracking-widest uppercase">Soulful Reviews</p>
                                        </div>
                                        <div className="w-px h-12 bg-[#E8E1D5]"></div>
                                        <div className="text-center">
                                            <p className="text-3xl font-bold text-[#D4A847] mb-1">{activePoints}</p>
                                            <p className="text-[10px] font-bold text-[#D4A847]/70 tracking-widest uppercase flex items-center gap-1 justify-center">
                                                <Star className="h-2.5 w-2.5" /> Seed Points
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Two Column Layout ── */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                                    {/* Left Column (Forms) */}
                                    <div className="lg:col-span-2 space-y-8">
                                        {/* Personal Essence */}
                                        <section className="bg-white rounded-3xl p-8 border border-[#E8E1D5] shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#F8F5F0] rounded-bl-full opacity-50 pointer-events-none"></div>
                                            <h3 className="text-xl font-bold text-[#36453A] mb-6 flex items-center gap-2">
                                                <span className="w-1.5 h-6 bg-[#36453A] rounded-full inline-block"></span>
                                                Personal Essence
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                                <div>
                                                    <label className="block flex items-center gap-1.5 text-[11px] font-bold text-warm-gray uppercase tracking-widest mb-2"><User className="h-3 w-3" /> Full Identity</label>
                                                    <input type="text" value={profileData.full_name} onChange={e => setProfileData({ ...profileData, full_name: e.target.value })}
                                                        className="w-full bg-[#F8F5F0] border border-[#E8E1D5] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#36453A] focus:ring-1 focus:ring-[#36453A]/20 transition-all font-medium text-[#36453A]" />
                                                </div>
                                                <div>
                                                    <label className="block flex items-center gap-1.5 text-[11px] font-bold text-warm-gray uppercase tracking-widest mb-2"><Mail className="h-3 w-3" /> Soulful Mail</label>
                                                    <input type="email" value={profileData.email} onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                                                        className="w-full bg-[#F8F5F0] border border-[#E8E1D5] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#36453A] focus:ring-1 focus:ring-[#36453A]/20 transition-all font-medium text-[#36453A]" />
                                                </div>
                                                <div>
                                                    <label className="block flex items-center gap-1.5 text-[11px] font-bold text-warm-gray uppercase tracking-widest mb-2"><Phone className="h-3 w-3" /> Mobile Number</label>
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
                                                                placeholder="Code"
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
                                                                className="w-full bg-[#F8F5F0] border border-[#E8E1D5] rounded-xl px-4 py-[9px] text-sm focus:outline-none focus:border-[#36453A] focus:ring-1 focus:ring-[#36453A]/20 transition-all font-medium text-[#36453A]" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block flex items-center gap-1.5 text-[11px] font-bold text-warm-gray uppercase tracking-widest mb-2"><Calendar className="h-3 w-3" /> Date of Birth</label>
                                                    <input type="date" value={profileData.date_of_birth} onChange={e => setProfileData({ ...profileData, date_of_birth: e.target.value })}
                                                        max={new Date().toISOString().split("T")[0]}
                                                        className="w-full bg-[#F8F5F0] border border-[#E8E1D5] rounded-xl px-4 py-[9px] text-sm focus:outline-none focus:border-[#36453A] focus:ring-1 focus:ring-[#36453A]/20 transition-all font-medium text-[#36453A] min-h-[44px]" />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block flex items-center gap-1.5 text-[11px] font-bold text-warm-gray uppercase tracking-widest mb-2"><MapPin className="h-3 w-3" /> Current Location</label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            readOnly
                                                            value={(() => {
                                                                const addr = addresses.find(a => a.is_default) || addresses[0];
                                                                return addr ? `${addr.city}, ${addr.state}, ${addr.country} - ${addr.pincode}` : 'No Address Added';
                                                            })()}
                                                            className="w-full bg-[#F8F5F0] border border-[#E8E1D5] rounded-xl px-4 py-3 text-sm focus:outline-none transition-all font-medium text-warm-gray cursor-not-allowed"
                                                            title="Location is derived from your Default Delivery Address"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        {/* Security Sanctuary & Notification Harmony Row */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Security Sanctuary */}
                                            <section className="bg-white rounded-3xl p-8 border border-[#E8E1D5] shadow-sm relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-[#F8F5F0] rounded-bl-full opacity-50 pointer-events-none"></div>
                                                <h3 className="text-xl font-bold text-[#36453A] mb-4 flex items-center gap-2">
                                                    <span className="w-1.5 h-6 bg-[#36453A] rounded-full inline-block"></span>
                                                    Security Sanctuary
                                                </h3>
                                                <p className="text-sm text-warm-gray mb-6 leading-relaxed">Protect your inner sanctum with a strong, mindful password.</p>
                                                <button
                                                    onClick={() => setShowPasswordModal(true)}
                                                    className="w-full rounded-xl border border-[#E8E1D5] py-3.5 text-sm font-bold text-[#36453A] hover:bg-[#F8F5F0] transition-colors flex items-center justify-center gap-2 mb-2"
                                                >
                                                    {profileData.has_password ? 'Modify Access Password' : 'Set Access Password'} <ChevronRight className="h-4 w-4" />
                                                </button>
                                                {profileData.has_password && <p className="text-xs text-warm-gray text-center mt-3">Your account is secured</p>}
                                            </section>

                                            {/* Notification Harmony */}
                                            <section className="bg-white rounded-3xl p-8 border border-[#E8E1D5] shadow-sm relative overflow-hidden group hover:border-[#36453A] transition-all duration-300">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-[#F8F5F0] rounded-bl-full opacity-50 pointer-events-none group-hover:bg-[#E7F0E9] transition-colors"></div>
                                                <h3 className="text-xl font-bold text-[#36453A] mb-4 flex items-center gap-2">
                                                    <span className="w-1.5 h-6 bg-[#36453A] rounded-full inline-block"></span>
                                                    Notification Harmony
                                                </h3>
                                                <p className="text-sm text-warm-gray mb-6 leading-relaxed">Tune your alerts and stay synchronous with your wellness journey.</p>
                                                <button
                                                    onClick={() => setShowNotificationModal(true)}
                                                    className="w-full rounded-xl border border-[#E8E1D5] py-3.5 text-sm font-bold text-[#36453A] hover:bg-[#F8F5F0] hover:border-[#36453A]/30 transition-all flex items-center justify-center gap-2 group-hover:shadow-sm"
                                                >
                                                    <BellRing className="h-4 w-4" /> Manage Notifications <ChevronRight className="h-4 w-4" />
                                                </button>
                                            </section>
                                        </div>
                                    </div>

                                    {/* Right Column (Side Panels) */}
                                    <div className="space-y-8">

                                        {/* Actions */}
                                        <div className="bg-white rounded-3xl p-6 border border-[#E8E1D5] shadow-sm text-center">
                                            <button
                                                disabled={profileSaving}
                                                onClick={handleProfileSave}
                                                className="w-full bg-[#36453A] text-white rounded-xl py-4 text-sm font-bold shadow-md hover:bg-[#2A362D] hover:shadow-lg transition-all flex items-center justify-center gap-2 mb-4"
                                            >
                                                {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                SAVE ALL CHANGES
                                            </button>
                                            <button
                                                onClick={() => { fetchProfile(); toast.success('Modifications discarded'); }}
                                                className="text-xs font-bold text-warm-gray hover:text-[#36453A] transition-colors border-b border-warm-gray/30 pb-0.5 hover:border-[#36453A]"
                                            >
                                                Discard Modifications
                                            </button>
                                        </div>

                                        {/* Active Plan / Loyalty Status */}
                                        <div className="bg-[#1A2E1A] rounded-3xl p-6 text-white relative overflow-hidden shadow-lg border border-[#D4A847]/30 group hover:border-[#D4A847] transition-all duration-500">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <Star className="h-16 w-16 text-[#D4A847]" />
                                            </div>
                                            <p className="text-[10px] font-bold tracking-[0.2em] text-[#D4A847]/60 mb-2 uppercase">ACTIVE PLAN</p>
                                            <h3 className="text-2xl font-bold text-[#D4A847] mb-2">{activeTier} Ritualist</h3>
                                            <p className="text-sm text-white/70 leading-relaxed mb-6">
                                                {loyaltyData?.tier?.benefits && Array.isArray(loyaltyData?.tier?.benefits) && loyaltyData?.tier?.benefits.length > 0
                                                    ? loyaltyData?.tier?.benefits.join(', ')
                                                    : "Enhance your aura with every ritual to unlock exotic benefits and golden boons."
                                                }
                                            </p>
                                            <button
                                                onClick={() => router.push(`/${country}/account/wallet`)}
                                                className="w-full rounded-xl bg-[#D4A847] text-[#1A2E1A] py-3 text-sm font-bold hover:bg-white transition-all transform active:scale-95 shadow-lg"
                                            >
                                                Manage Rewards
                                            </button>
                                        </div>

                                        {/* Account Status */}
                                        <div className="bg-white rounded-3xl p-6 border border-[#E8E1D5] shadow-sm">
                                            <p className="text-[10px] font-bold tracking-widest text-warm-gray mb-4">ACCOUNT STATUS</p>
                                            <div className="space-y-4 mb-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-4 w-4 text-[#36453A]" />
                                                        <span className="text-sm font-medium text-[#36453A]">Email</span>
                                                    </div>
                                                    {profileData.is_email_verified ? (
                                                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Verified</span>
                                                    ) : (
                                                        <button onClick={() => router.push(`/${country}/verify-email`)} className="text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Verify</button>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-4 w-4 text-[#36453A]" />
                                                        <span className="text-sm font-medium text-[#36453A]">Mobile</span>
                                                    </div>
                                                    {profileData.is_mobile_verified ? (
                                                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Verified</span>
                                                    ) : (
                                                        <button onClick={() => router.push(`/${country}/verify-otp`)} className="text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Verify</button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="border-t border-[#E8E1D5] pt-5">
                                                <button
                                                    onClick={() => { setDeactivatePassword(''); setShowDeactivateModal(true); }}
                                                    className="w-full flex items-center justify-center gap-2 text-sm font-bold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl py-3 transition-colors"
                                                >
                                                    <ShieldOff className="h-4 w-4" /> Initiate Account Deletion
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
                                        <div className="h-12 w-12 rounded-xl bg-white border border-[#E8E1D5] flex items-center justify-center shadow-sm">
                                            <MessageSquare className="h-6 w-6 text-[#36453A]" />
                                        </div>
                                        <div>
                                            <h1 className="text-3xl font-bold text-[#36453A]">Support & Enquiries</h1>
                                            <p className="text-sm text-warm-gray">View and manage your support tickets and enquiries</p>
                                        </div>
                                    </div>
                                    {selectedEnquiry && (
                                        <button
                                            onClick={() => setSelectedEnquiry(null)}
                                            className="px-4 py-2 bg-white border border-[#E8E1D5] rounded-xl text-sm font-bold text-[#36453A] hover:bg-[#F8F5F0] transition-colors"
                                        >
                                            Back to List
                                        </button>
                                    )}
                                </div>

                                {selectedEnquiry ? (
                                    /* ENQUIRY DETAIL VIEW */
                                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 animate-fadeIn">
                                        {/* Main Conversation Area */}
                                        <div className="space-y-6">
                                            {/* Original Issue Card */}
                                            <div className="bg-white rounded-3xl border border-[#E8E1D5] shadow-sm overflow-hidden">
                                                <div className="p-6 md:p-8 bg-[#36453A]/5 border-b border-[#E8E1D5]">
                                                    <div className="flex items-start justify-between gap-4 mb-4">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-[10px] uppercase font-bold tracking-widest text-[#36453A]/60">{selectedEnquiry.type || 'Inquiry'}</span>
                                                                <span className="h-1 w-1 rounded-full bg-[#E8E1D5]"></span>
                                                                <span className="text-[10px] font-bold text-warm-gray uppercase tracking-widest">{new Date(selectedEnquiry.created_at).toLocaleDateString()}</span>
                                                            </div>
                                                            <h2 className="text-2xl font-bold text-[#36453A] capitalize">{selectedEnquiry.subject || 'No Subject'}</h2>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${selectedEnquiry.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-[#D4A847]/20 text-[#B38720]'
                                                            }`}>
                                                            {selectedEnquiry.status || 'Pending'}
                                                        </span>
                                                    </div>
                                                    <div className="prose prose-sm max-w-none text-[#36453A] leading-relaxed">
                                                        <p className="whitespace-pre-wrap">{selectedEnquiry.message}</p>
                                                    </div>
                                                </div>

                                                {/* Replies History */}
                                                <div className="p-6 md:p-8 space-y-8">
                                                    <div className="space-y-8 relative">
                                                        {/* Vertical Timeline Line */}
                                                        <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-[#E8E1D5] hidden md:block"></div>

                                                        {(!selectedEnquiry.replies || selectedEnquiry.replies.length === 0) ? (
                                                            <div className="text-center py-10">
                                                                <div className="h-16 w-16 rounded-full bg-[#F8F5F0] flex items-center justify-center mx-auto mb-4 border border-[#E8E1D5]">
                                                                    <Clock className="h-8 w-8 text-warm-gray" />
                                                                </div>
                                                                <p className="text-sm font-bold text-[#36453A]">Awaiting Admin Response</p>
                                                                <p className="text-xs text-warm-gray mt-1 max-w-[240px] mx-auto leading-relaxed">Our support team has received your enquiry and will respond within 24-48 hours.</p>
                                                            </div>
                                                        ) : (
                                                            selectedEnquiry.replies.map((reply: any, idx: number) => (
                                                                <div key={idx} className={`relative flex flex-col md:flex-row gap-4 items-start ${reply.author_type === 'admin' ? 'justify-start' : 'justify-end md:flex-row-reverse'}`}>
                                                                    {/* Avatar or Icon */}
                                                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 border-white shadow-sm ${reply.author_type === 'admin' ? 'bg-[#36453A] text-white' : 'bg-[#D4A847] text-white'}`}>
                                                                        {reply.author_type === 'admin' ? <Shield className="h-5 w-5" /> : <User2 className="h-5 w-5" />}
                                                                    </div>

                                                                    <div className={`flex-1 w-full p-5 rounded-2xl border ${reply.author_type === 'admin'
                                                                        ? 'bg-[#F8F5F0] border-[#E8E1D5] rounded-tl-none'
                                                                        : 'bg-white border-[#E8E1D5] rounded-tr-none'
                                                                        }`}>
                                                                        <div className="flex items-center justify-between gap-4 mb-2">
                                                                            <span className="text-[10px] font-bold text-[#36453A] uppercase tracking-widest">
                                                                                {reply.author_type === 'admin' ? 'Support Specialist' : 'You'}
                                                                            </span>
                                                                            <span className="text-[10px] font-medium text-warm-gray">
                                                                                {new Date(reply.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-sm text-[#36453A] leading-relaxed whitespace-pre-wrap">
                                                                            {reply.message}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>

                                                    {/* User Reply Box (Continuous Chatting) */}
                                                    {selectedEnquiry.status !== 'resolved' && selectedEnquiry.status !== 'dismissed' && (
                                                        <div className="mt-8 pt-8 border-t border-[#F8F5F0]">
                                                            <div className="relative">
                                                                <textarea
                                                                    value={enquiryReplyText}
                                                                    onChange={(e) => setEnquiryReplyText(e.target.value)}
                                                                    placeholder="Type your message here..."
                                                                    className="w-full min-h-[120px] p-5 bg-[#F8F5F0] border border-[#E8E1D5] rounded-2xl text-sm focus:outline-none focus:border-[#D4A847]/40 transition-all resize-none placeholder:text-warm-gray/60"
                                                                />
                                                                <div className="absolute bottom-4 right-4 flex items-center gap-3">
                                                                    <button
                                                                        onClick={handleSendEnquiryReply}
                                                                        disabled={isSendingEnquiryReply || !enquiryReplyText.trim()}
                                                                        className="bg-[#36453A] text-white p-3 rounded-xl hover:bg-[#2A362D] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md group"
                                                                    >
                                                                        <Send className={`h-5 w-5 transition-transform ${isSendingEnquiryReply ? 'animate-pulse' : 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5'}`} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <p className="text-[10px] text-warm-gray mt-3 px-1 italic">Our team usually responds within 24-48 hours. Thank you for your patience.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Quick Actions Card */}
                                            <div className="bg-[#36453A] rounded-3xl p-8 text-white relative overflow-hidden shadow-lg">
                                                <div className="absolute top-0 right-0 p-6 opacity-10">
                                                    <MessageCircle className="h-20 w-20" />
                                                </div>
                                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                                    <div>
                                                        <h3 className="text-2xl font-bold text-[#D4A847] mb-2">Need to add more info?</h3>
                                                        <p className="text-sm text-white/80 max-w-md">Our support team is here to help. You'll receive an email notification as soon as we reply.</p>
                                                    </div>
                                                    <button
                                                        onClick={() => router.push(`/${country}/help-center/support`)}
                                                        className="bg-[#D4A847] text-[#36453A] px-8 py-3 rounded-xl text-sm font-bold shadow-md hover:bg-[#B38720] transition-colors whitespace-nowrap"
                                                    >
                                                        Submit New Enquiry
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sidebar Info Area */}
                                        <div className="space-y-6">
                                            <div className="bg-white rounded-3xl border border-[#E8E1D5] p-6 shadow-sm">
                                                <h3 className="text-lg font-bold text-[#36453A] mb-4">Ticket Insight</h3>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center text-xs pb-3 border-b border-[#F8F5F0]">
                                                        <span className="text-warm-gray font-medium">Ticket ID</span>
                                                        <span className="font-bold text-[#36453A] uppercase">#{selectedEnquiry.feedback_id.slice(0, 8)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs pb-3 border-b border-[#F8F5F0]">
                                                        <span className="text-warm-gray font-medium">Requested On</span>
                                                        <span className="font-bold text-[#36453A]">{new Date(selectedEnquiry.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs pb-3 border-b border-[#F8F5F0]">
                                                        <span className="text-warm-gray font-medium">Priority Range</span>
                                                        <span className="font-bold text-amber-600">Standard</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-warm-gray font-medium">Category</span>
                                                        <span className="font-bold text-[#36453A] capitalize">{selectedEnquiry.type || 'General'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white rounded-3xl border border-[#E8E1D5] p-6 shadow-sm">
                                                <h3 className="text-lg font-bold text-[#36453A] mb-4">Support Philosophy</h3>
                                                <p className="text-[11px] leading-relaxed text-warm-gray mb-4">
                                                    At Vedashi, we treat every enquiry with the same mindfulness as our product crafting. Thank you for your patience as we provide a soulful solution.
                                                </p>
                                                <button
                                                    onClick={() => router.push(`/${country}/help-center`)}
                                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[#E8E1D5] text-xs font-bold text-[#36453A] hover:bg-[#F8F5F0] transition-colors"
                                                >
                                                    <FileText className="h-3.5 w-3.5" /> View Help Center
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* ENQUIRY LIST VIEW */
                                    <div className="bg-white rounded-3xl border border-[#E8E1D5] shadow-sm overflow-hidden animate-fadeIn">
                                        <div className="p-6 md:p-8 border-b border-[#E8E1D5] flex items-center justify-between bg-[#36453A]/5">
                                            <div>
                                                <h2 className="text-xl font-bold text-[#36453A]">Harmony Support History</h2>
                                                <p className="text-xs text-warm-gray mt-1">Timeline of your past interactions and resolutions</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="relative group hidden sm:block">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-gray" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search enquiries..."
                                                        className="bg-white border border-[#E8E1D5] rounded-full pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#36453A]/40 transition-all w-48"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="divide-y divide-[#F8F5F0]">
                                            {enquiriesLoading ? (
                                                <div className="py-20 flex flex-col items-center justify-center">
                                                    <Loader2 className="h-10 w-10 animate-spin text-[#36453A] mb-4" />
                                                    <p className="text-sm font-medium text-warm-gray uppercase tracking-widest">Recalling your history...</p>
                                                </div>
                                            ) : enquiries.length === 0 ? (
                                                <div className="py-20 text-center">
                                                    <div className="h-20 w-20 rounded-full bg-[#F8F5F0] flex items-center justify-center mx-auto mb-6 border border-[#E8E1D5]">
                                                        <MessageSquare className="h-10 w-10 text-warm-gray/40" />
                                                    </div>
                                                    <h3 className="text-2xl font-bold text-[#36453A] mb-2">No Past Enquiries</h3>
                                                    <p className="text-sm text-warm-gray max-w-xs mx-auto mb-8">Your path has been smooth! If you ever need help, our support team is just a message away.</p>
                                                    <button
                                                        onClick={() => router.push('/help-center/support')}
                                                        className="bg-[#36453A] text-white px-8 py-3 rounded-xl text-sm font-bold shadow-md hover:bg-[#2A362D] transition-colors"
                                                    >
                                                        Create New Ticket
                                                    </button>
                                                </div>
                                            ) : (
                                                enquiries.map((enquiry) => (
                                                    <div
                                                        key={enquiry.feedback_id}
                                                        onClick={async () => {
                                                            if (enquiry._source === 'ticket') {
                                                                if (enquiry._order_id) {
                                                                    // Redirect to the Orders tab with the specific order selected
                                                                    router.push(`/${country}/account/orders?orderId=${enquiry._order_id}`);
                                                                } else {
                                                                    // Redirect to the dedicated ticket detail page
                                                                    router.push(`/${country}/help-center/support/${enquiry._ticket_id}`);
                                                                }
                                                            } else {
                                                                setSelectedEnquiry(enquiry);
                                                            }
                                                        }}
                                                        className="p-6 transition-all hover:bg-[#F8F5F0] cursor-pointer group"
                                                    >
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-3 mb-2">
                                                                    {enquiry._source === 'ticket' && (
                                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-100 text-blue-700">
                                                                            Ticket
                                                                        </span>
                                                                    )}
                                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                                                        enquiry.status === 'resolved' || enquiry.status === 'closed' ? 'bg-green-100 text-green-700' :
                                                                        enquiry.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                                        'bg-[#D4A847]/20 text-[#B38720]'
                                                                    }`}>
                                                                        {enquiry.status || 'Pending'}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-warm-gray uppercase tracking-widest">
                                                                        {new Date(enquiry.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                    </span>
                                                                </div>
                                                                <h3 className="text-lg font-bold text-[#36453A] group-hover:text-black transition-colors truncate capitalize">
                                                                    {enquiry._source === 'ticket' && enquiry._ticket_number ? `${enquiry._ticket_number} — ` : ''}{enquiry.subject || 'Standard Enquiry'}
                                                                </h3>
                                                                <p className="text-sm text-warm-gray truncate mt-1">
                                                                    {enquiry.message}
                                                                </p>
                                                            </div>

                                                            <div className="flex items-center gap-6 flex-shrink-0">
                                                                <div className="text-center hidden md:block">
                                                                    <p className="text-xl font-bold text-[#36453A]">{enquiry._source === 'ticket' ? (enquiry._message_count || 0) : (enquiry.replies?.length || 0)}</p>
                                                                    <p className="text-[10px] font-bold text-warm-gray uppercase tracking-widest">Messages</p>
                                                                </div>
                                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${enquiry.replies?.some((r: any) => r.type === 'admin')
                                                                    ? 'bg-amber-100 text-amber-600'
                                                                    : 'bg-[#F8F5F0] text-warm-gray group-hover:bg-[#36453A] group-hover:text-white'
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
                                <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-light-border" style={{ animation: 'slideUp 0.35s ease-out' }}>
                                    <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl" style={{ background: 'linear-gradient(90deg, #6B2737, #D4A847)' }} />
                                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'rgba(107, 39, 55, 0.1)' }}>
                                        <ShieldOff className="h-7 w-7" style={{ color: '#6B2737' }} />
                                    </div>
                                    <h2 className="text-center text-xl font-bold text-charcoal mb-2">Confirm Deactivation</h2>
                                    <p className="text-center text-sm text-warm-gray mb-6">
                                        Please enter your password to confirm account deactivation.
                                    </p>
                                    <input
                                        type="password"
                                        value={deactivatePassword}
                                        onChange={e => setDeactivatePassword(e.target.value)}
                                        placeholder="Enter your password"
                                        className="w-full rounded-lg border border-light-border px-4 py-3 text-sm focus:border-burgundy focus:outline-none mb-6"
                                        autoFocus
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowDeactivateModal(false)}
                                            disabled={deactivating}
                                            className="flex-1 rounded-xl border border-light-border py-3 text-sm font-medium text-charcoal hover:bg-cream transition-colors disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (!deactivatePassword) { toast.error('Password is required'); return; }
                                                setDeactivating(true);
                                                try {
                                                    const res = await deactivateAccount(deactivatePassword);
                                                    if (res.success) {
                                                        setShowDeactivateModal(false);
                                                        clerkSignOut().catch(()=>{});
                                                        logout();
                                                        toast.success('Account deactivated. You can reactivate anytime.');
                                                        router.push('/');
                                                    } else {
                                                        toast.error(res.message || 'Failed to deactivate account');
                                                    }
                                                } catch {
                                                    toast.error('Server error. Please try again.');
                                                } finally {
                                                    setDeactivating(false);
                                                }
                                            }}
                                            disabled={deactivating || !deactivatePassword}
                                            className="flex-1 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:shadow-md disabled:opacity-50"
                                            style={{ backgroundColor: '#6B2737' }}
                                        >
                                            {deactivating ? 'Deactivating...' : 'Deactivate'}
                                        </button>
                                    </div>
                                </div>
                            </div>,
                            document.body
                        )}

                        {/* ═══ Delete Address Confirmation Modal ═══ */}
                        {deletingAddressId && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeletingAddressId(null)} />
                                <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-light-border" style={{ animation: 'slideUp 0.25s ease-out' }}>
                                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                                        <Trash2 className="h-5 w-5 text-red-500" />
                                    </div>
                                    <h3 className="text-center text-lg font-bold text-charcoal mb-1">Delete Address?</h3>
                                    <p className="text-center text-sm text-warm-gray mb-5">This action cannot be undone.</p>
                                    <div className="flex gap-3">
                                        <button onClick={() => setDeletingAddressId(null)}
                                            className="flex-1 rounded-xl border border-light-border py-2.5 text-sm font-medium text-charcoal hover:bg-cream transition-colors">
                                            Cancel
                                        </button>
                                        <button onClick={() => deletingAddressId && handleDeleteAddress(deletingAddressId)}
                                            className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
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
                                        <div className="h-12 w-12 rounded-xl bg-white border border-[#E8E1D5] flex items-center justify-center shadow-sm">
                                            <BellRing className="h-6 w-6 text-[#36453A]" />
                                        </div>
                                        <div>
                                            <h1 className="text-3xl font-bold text-[#36453A]">Your Notifications</h1>
                                            <p className="text-sm text-warm-gray">Security alerts and update rituals</p>
                                        </div>
                                    </div>
                                    {notifications.length > 0 && (
                                        <button
                                            onClick={handleMarkAllRead}
                                            className="px-4 py-2 bg-white border border-[#E8E1D5] rounded-xl text-xs font-bold text-[#36453A] hover:bg-[#F8F5F0] transition-colors flex items-center gap-2"
                                        >
                                            <Check className="h-3.5 w-3.5" /> Mark All as Read
                                        </button>
                                    )}
                                </div>

                                {notificationsLoading ? (
                                    <div className="py-24 flex justify-center">
                                        <Loader2 className="h-10 w-10 animate-spin text-[#36453A]" />
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="bg-white rounded-[30px] border border-[#E8E1D5] py-20 px-6 text-center">
                                        <div className="h-20 w-20 rounded-full bg-[#F8F5F0] border border-[#E8E1D5] flex items-center justify-center mx-auto mb-6">
                                            <BellRing className="h-10 w-10 text-warm-gray/30" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-[#36453A] mb-2">Inner Peace</h3>
                                        <p className="text-warm-gray text-sm max-w-xs mx-auto">You have no new notifications at this moment. Stay mindful and enjoy your wellness journey.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {notifications.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((n) => (
                                            <div
                                                key={n.notification_id}
                                                className={`group flex items-start gap-4 p-5 rounded-2xl border transition-all ${n.is_read
                                                    ? 'bg-white/60 border-[#E8E1D5] opacity-75'
                                                    : 'bg-white border-[#36453A]/20 shadow-sm border-l-4 border-l-[#36453A]'}`}
                                            >
                                                <div className={`mt-1 h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${n.is_read ? 'bg-warm-gray/10' : 'bg-[#36453A]/10'}`}>
                                                    {n.type === 'security' || n.category === 'security_alerts' ? <Shield className="h-5 w-5 text-red-500" /> : <Sparkles className="h-5 w-5 text-[#D4A847]" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <h4 className={`text-sm font-bold ${n.is_read ? 'text-[#36453A]/60' : 'text-[#36453A]'}`}>{n.title}</h4>
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
                                                                className="text-[10px] font-black uppercase tracking-widest text-[#36453A] hover:underline"
                                                            >
                                                                View Details
                                                            </button>
                                                        )}
                                                        {!n.is_read && (
                                                            <button
                                                                onClick={async () => {
                                                                    await markNotificationAsRead(n.notification_id);
                                                                    fetchNotificationsData();
                                                                    window.dispatchEvent(new CustomEvent('notifications-updated'));
                                                                }}
                                                                className="text-[10px] font-black uppercase tracking-widest transition-colors text-[#D4A847] hover:text-[#B38720]"
                                                            >
                                                                Mark as Read
                                                            </button>
                                                        )}
                                                        {n.is_read && (
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#36453A]/30 flex items-center gap-1.5">
                                                                <Check className="h-3 w-3" /> Seen
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
                                            <div className="flex items-center justify-between pt-6 border-t border-[#E8E1D5]">
                                                <span className="text-sm font-medium text-warm-gray">
                                                    Showing <strong className="text-[#36453A]">
                                                        {Math.min((currentPage - 1) * pageSize + 1, notifications.length)}-{Math.min(currentPage * pageSize, notifications.length)}
                                                    </strong> of <strong className="text-[#36453A]">{notifications.length}</strong> notifications
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                        disabled={currentPage === 1}
                                                        className={`px-4 py-2 text-sm font-bold rounded-xl border border-[#E8E1D5] transition-colors ${currentPage === 1 ? 'text-warm-gray bg-white opacity-50 cursor-not-allowed' : 'text-[#36453A] bg-white hover:bg-[#F8F5F0]'}`}
                                                    >
                                                        Previous
                                                    </button>
                                                    
                                                    {Array.from({ length: Math.ceil(notifications.length / pageSize) }).map((_, i) => (
                                                        <button 
                                                            key={i}
                                                            onClick={() => setCurrentPage(i + 1)}
                                                            className={`h-9 w-9 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center transition-all ${currentPage === i + 1 ? 'bg-[#36453A] text-white' : 'bg-white text-[#36453A] border border-[#E8E1D5] hover:bg-[#F8F5F0]'}`}
                                                        >
                                                            {i + 1}
                                                        </button>
                                                    ))}

                                                    <button 
                                                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(notifications.length / pageSize), p + 1))}
                                                        disabled={currentPage === Math.ceil(notifications.length / pageSize)}
                                                        className={`px-4 py-2 text-sm font-bold rounded-xl border border-[#E8E1D5] transition-colors ${currentPage === Math.ceil(notifications.length / pageSize) ? 'text-warm-gray bg-white opacity-50 cursor-not-allowed' : 'text-[#36453A] bg-white hover:bg-[#F8F5F0]'}`}
                                                    >
                                                        Next
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
                                <div className="relative w-full max-w-md rounded-2xl bg-[#FAFAF5] p-8 shadow-2xl border border-[#E8E1D5] text-center" style={{ animation: 'slideUp 0.25s ease-out' }}>
                                    
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
                                            'PENDING': 'Seed being sown',
                                            'CONFIRMED': 'Sprout growing',
                                            'SHIPPED': 'Leaves flourishing',
                                            'DELIVERED': 'Flower bloomed',
                                            'CANCELLED': 'Plant wilted',
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

                                    <h3 className="text-2xl font-bold text-[#2E4A32] mb-2">Track Order</h3>
                                    <p className="font-mono text-sm font-semibold text-[#8B7E6A] mb-1">#{trackOrderId?.split('-')[0].toUpperCase()}</p>
                                    {trackOrderStatus && (
                                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 ${
                                            trackOrderStatus === 'DELIVERED' ? 'bg-[#E8F5E9] text-[#2E7D32]' :
                                            trackOrderStatus === 'SHIPPED' ? 'bg-[#E0F2F1] text-[#00695C]' :
                                            trackOrderStatus === 'CONFIRMED' ? 'bg-[#F1F8E9] text-[#558B2F]' :
                                            trackOrderStatus === 'CANCELLED' ? 'bg-[#FBE9E7] text-[#BF360C]' :
                                            'bg-[#FFF8E1] text-[#F9A825]'
                                        }`}>{trackOrderStatus}</span>
                                    )}

                                    {/* Growth Progress Bar */}
                                    {trackOrderStatus && trackOrderStatus !== 'CANCELLED' && (
                                        <div className="flex items-center justify-between px-2 mb-5">
                                            {['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'].map((step, idx) => {
                                                const statusOrder = ['PENDING','CONFIRMED','SHIPPED','DELIVERED'];
                                                const currentIdx = statusOrder.indexOf(trackOrderStatus || 'PENDING');
                                                const isActive = idx <= currentIdx;
                                                return (
                                                    <div key={step} className="flex items-center flex-1 last:flex-none">
                                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black transition-all ${isActive ? 'bg-[#4A7C59] text-white shadow-sm' : 'bg-[#E8E1D5] text-[#B5A88A]'}`}>
                                                            {idx === 0 ? '🌱' : idx === 1 ? '🌿' : idx === 2 ? '🍃' : '🌸'}
                                                        </div>
                                                        {idx < 3 && <div className={`h-0.5 flex-1 mx-1 rounded transition-all ${idx < currentIdx ? 'bg-[#4A7C59]' : 'bg-[#E8E1D5]'}`} />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <div className="bg-[#F0EDE6] rounded-xl p-4 mb-6 relative overflow-hidden text-left min-h-[120px]">
                                        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: trackOrderStatus === 'CANCELLED' ? '#BF360C' : '#4A7C59' }}></div>
                                        {isTrackingLoading ? (
                                            <div className="flex flex-col items-center justify-center h-full text-[#8B7E6A] py-6">
                                                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                                                <p className="text-xs font-medium">Fetching logistics data...</p>
                                            </div>
                                        ) : trackingData ? (
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-[#E8E1D5]">
                                                    <div>
                                                        <p className="text-[10px] font-black tracking-widest text-[#8B7E6A] uppercase">Current Status</p>
                                                        <p className="font-bold text-[#2E4A32]">{trackingData.shipment_track?.[0]?.current_status || 'Processing'}</p>
                                                    </div>
                                                    {trackingData.track_url && (
                                                        <a href={trackingData.track_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[#4A7C59] bg-[#E8F5E9] hover:bg-[#4A7C59] hover:text-white px-3 py-1.5 rounded-full transition-colors flex items-center gap-1">
                                                            Live Map <ChevronRight className="h-3 w-3" />
                                                        </a>
                                                    )}
                                                </div>
                                                
                                                {trackingData.shipment_track && trackingData.shipment_track.length > 0 && (
                                                    <div className="relative pl-4 space-y-4 before:content-[''] before:absolute before:left-1.5 before:top-2 before:bottom-0 before:w-0.5 before:bg-[#E8E1D5]">
                                                        {trackingData.shipment_track.slice(0, 3).map((track: any, idx: number) => (
                                                            <div key={idx} className="relative">
                                                                <div className={`absolute -left-[19px] top-1.5 w-3 h-3 rounded-full border-2 border-[#FAFAF5] ${idx === 0 ? 'bg-[#4A7C59]' : 'bg-[#B5A88A]'}`} />
                                                                <p className="text-xs font-bold text-[#2E4A32]">{track.activity || track.current_status}</p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <p className="text-[10px] text-[#8B7E6A] font-medium flex items-center gap-1"><Calendar className="h-3 w-3" /> {track.date}</p>
                                                                    {track.location && <p className="text-[10px] text-[#8B7E6A] font-medium flex items-center gap-1"><MapPin className="h-3 w-3" /> {track.location}</p>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-6">
                                                <svg width="32" height="32" viewBox="0 0 64 64" fill="none" className="mb-2 opacity-40">
                                                    <rect x="8" y="44" rx="4" width="48" height="12" fill="#8B6914" opacity="0.3"/>
                                                    <ellipse cx="32" cy="38" rx="6" ry="8" fill="#8B6914" opacity="0.4"/>
                                                </svg>
                                                <p className="text-[#2E4A32] text-sm leading-relaxed font-medium">
                                                    Your order is being prepared.
                                                </p>
                                                <p className="text-xs text-[#8B7E6A] mt-1">The seed has been sown. Check back for updates.</p>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setIsTrackOrderModalOpen(false)}
                                        className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg hover:opacity-90"
                                        style={{ backgroundColor: '#36453A' }}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>,
                            document.body
                        )}

                        {/* ═══ Notification Preferences Overlay ═══ */}
                        {isMounted && showNotificationOverlay && createPortal(
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNotificationOverlay(false)} />

                                <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden" style={{ animation: 'slideUp 0.35s ease-out' }}>
                                    {/* Header Stripe */}
                                    <div className="flex-shrink-0 h-1.5 w-full shrink-0" style={{ background: 'linear-gradient(90deg, #6B2737, #D4A847)' }} />

                                    {/* Overlay Header */}
                                    <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-light-border bg-white">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cream-dark">
                                                <BellRing className="h-5 w-5 text-burgundy" />
                                            </div>
                                            <h2 className="text-xl font-bold text-charcoal">Manage Notifications</h2>
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
                                            Done
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
                isOpen={confirmingBulkRemove}
                title="Remove Items"
                message={`Are you sure you want to remove ${selectedWishlistItems.size} items from your sanctuary?`}
                confirmText="Remove"
                cancelText="Cancel"
                isDestructive={true}
                onConfirm={handleRemoveSelected}
                onCancel={() => setConfirmingBulkRemove(false)}
            />

            <ConfirmModal
                isOpen={!!confirmingIndividualRemove}
                title="Remove Item"
                message="Are you sure you want to remove this item from your sanctuary?"
                confirmText="Remove"
                cancelText="Cancel"
                isDestructive={true}
                onConfirm={() => {
                    if (confirmingIndividualRemove) {
                        removeWishlistItem(confirmingIndividualRemove);
                        toast.success('Item removed from wishlist');
                        setConfirmingIndividualRemove(null);
                    }
                }}
                onCancel={() => setConfirmingIndividualRemove(null)}
            />

            <ConfirmModal
                isOpen={!!deletingAddressId}
                title="Delete Address"
                message="Are you sure you want to permanently delete this address? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
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
                    <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-light-border overflow-hidden animate-fadeIn">
                        <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #36453A, #D4A847, #36453A)' }}></div>
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-[#36453A]">
                                    Verify Email Change
                                </h3>
                                <button onClick={() => setShowEmailOtpModal(false)} className="p-2 rounded-full hover:bg-cream/50 transition-colors text-warm-gray hover:text-[#36453A]">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <p className="text-sm text-warm-gray mb-6">
                                We've sent a secure verification code to <strong className="text-charcoal font-semibold">{profileData.email}</strong>. Please enter the code below to confirm this change.
                            </p>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-[11px] font-bold text-warm-gray tracking-widest uppercase mb-2 ml-1">Secure Code (OTP)</label>
                                    <input
                                        type="text"
                                        value={emailOtpCode}
                                        onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="Enter the 6-digit code"
                                        className="w-full bg-white border border-[#D4A847] rounded-xl px-4 py-3.5 text-center text-xl font-bold tracking-[0.5em] focus:outline-none shadow-[0_0_15px_rgba(212,168,71,0.15)] focus:border-[#C49A3C] focus:ring-1 focus:ring-[#C49A3C] transition-all placeholder:tracking-normal placeholder:font-normal placeholder:text-base placeholder:text-gray-300 text-[#1C2B1A]"
                                    />
                                </div>
                                <div className="pt-2">
                                    <button
                                        onClick={handleEmailOtpSubmit}
                                        disabled={emailOtpSubmitting || emailOtpCode.length < 4}
                                        className="w-full bg-[#1C2B1A] text-[#E8D5A3] rounded-xl py-3.5 text-sm font-bold shadow-xl hover:bg-[#2A3B28] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-[#3A4B38]"
                                    >
                                        {emailOtpSubmitting ? <Loader2 className="h-4 w-4 animate-spin text-[#E8D5A3]" /> : <Check className="h-4 w-4 text-[#E8D5A3]" />}
                                        Verify & Save
                                    </button>
                                </div>
                                <div className="text-center pt-2">
                                    <button
                                        type="button"
                                        onClick={handleResendEmailOtp}
                                        disabled={emailOtpResendTimer > 0}
                                        className={`text-sm font-semibold transition-all ${emailOtpResendTimer > 0 ? 'text-warm-gray/70 cursor-not-allowed' : 'text-[#D4A847] hover:text-[#b38a36] hover:underline'}`}
                                    >
                                        {emailOtpResendTimer > 0 ? `Resend Code in ${emailOtpResendTimer}s` : 'Resend Secure Code'}
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
                    <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-light-border overflow-hidden animate-fadeIn">
                        <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #1C2B1A, #6B8F5E, #1C2B1A)' }}></div>
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-[#1C2B1A]">
                                    Verify Mobile Number
                                </h3>
                                <button onClick={() => setShowPhoneOtpModal(false)} className="p-2 rounded-full hover:bg-cream/50 transition-colors text-warm-gray hover:text-[#1C2B1A]">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <p className="text-sm text-warm-gray mb-6">
                                We've sent a 6-digit verification code to your new mobile number ending in <strong className="text-charcoal font-semibold">{profileData.phone.slice(-4)}</strong>.
                            </p>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-[11px] font-bold text-warm-gray tracking-widest uppercase mb-2 ml-1">Verification Code</label>
                                    <input
                                        type="text"
                                        value={phoneOtpCode}
                                        onChange={(e) => setPhoneOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        className="w-full bg-white border border-[#6B8F5E] rounded-xl px-4 py-3.5 text-center text-xl font-bold tracking-[0.5em] focus:outline-none shadow-[0_0_15px_rgba(107,143,94,0.15)] focus:border-[#4A6341] focus:ring-1 focus:ring-[#4A6341] transition-all placeholder:tracking-normal placeholder:font-normal placeholder:text-base placeholder:text-gray-300 text-[#1C2B1A]"
                                    />
                                </div>
                                <div className="pt-2">
                                    <button
                                        onClick={handlePhoneOtpSubmit}
                                        disabled={phoneOtpSubmitting || phoneOtpCode.length < 4}
                                        className="w-full bg-[#1C2B1A] text-[#E8D5A3] rounded-xl py-3.5 text-sm font-bold shadow-xl hover:bg-[#2A3B28] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-[#3A4B38]"
                                    >
                                        {phoneOtpSubmitting ? <Loader2 className="h-4 w-4 animate-spin text-[#E8D5A3]" /> : <CheckCircle2 className="h-4 w-4 text-[#E8D5A3]" />}
                                        Verify & Update
                                    </button>
                                </div>
                                <div className="text-center pt-2">
                                    <button
                                        type="button"
                                        onClick={handleResendPhoneOtp}
                                        disabled={phoneOtpResendTimer > 0}
                                        className={`text-sm font-semibold transition-all ${phoneOtpResendTimer > 0 ? 'text-warm-gray/70 cursor-not-allowed' : 'text-[#6B8F5E] hover:text-[#4A6341] hover:underline'}`}
                                    >
                                        {phoneOtpResendTimer > 0 ? `Resend SMS in ${phoneOtpResendTimer}s` : 'Resend Verification SMS'}
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
                    <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-light-border overflow-hidden animate-fadeIn">
                        <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #36453A, #D4A847, #36453A)' }}></div>
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-[#36453A]">
                                    {profileData.has_password ? 'Modify Password' : 'Set Password'}
                                </h3>
                                <button onClick={() => setShowPasswordModal(false)} className="p-2 rounded-full hover:bg-cream/50 transition-colors text-warm-gray hover:text-[#36453A]">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                {profileData.has_password && (
                                    <div>
                                        <label className="block text-[10px] font-bold text-warm-gray tracking-widest uppercase mb-2 ml-1">Current Password</label>
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
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-gray hover:text-[#36453A] transition-colors"
                                            >
                                                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-4 pt-2">
                                    <div>
                                        <label className="block text-[10px] font-bold text-warm-gray tracking-widest uppercase mb-2 ml-1">New Password</label>
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
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-gray hover:text-[#36453A] transition-colors"
                                            >
                                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-warm-gray tracking-widest uppercase mb-2 ml-1">Confirm New Password</label>
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
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-gray hover:text-[#36453A] transition-colors"
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
                                        className="w-full bg-[#36453A] text-white rounded-xl py-4 text-sm font-bold shadow-md hover:bg-[#2A362D] transition-all flex items-center justify-center gap-2"
                                    >
                                        {passwordChanging ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Updating Sanctuary...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="h-4 w-4" />
                                                Update Credentials
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
                    <div className="absolute inset-0 bg-[#1A2E1A]/40 backdrop-blur-sm" onClick={() => setShowNotificationModal(false)}></div>
                    <div className="relative w-full max-w-2xl bg-[#FBF9F6] rounded-[40px] shadow-2xl overflow-hidden border border-[#E8E1D5] animate-in fade-in zoom-in duration-300">
                        <div className="bg-[#1A2E1A] p-8 text-white relative">
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full pointer-events-none"></div>
                            
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                                        <BellRing className="h-7 w-7 text-[#D4A847]" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold font-serif tracking-tight">Notification Harmony</h2>
                                        <p className="text-white/60 text-xs font-medium uppercase tracking-widest mt-0.5">Customise your mindful alerts</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowNotificationModal(false)} className="p-3 rounded-2xl hover:bg-white/10 transition-all text-white/50 hover:text-white border border-transparent hover:border-white/10 group">
                                    <X className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar bg-white/80 backdrop-blur-md">
                            <div className="mb-6 bg-[#F8F5F0] p-4 rounded-2xl border border-[#E8E1D5]/50">
                                <p className="text-sm text-[#36453A] flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-[#D4A847]" /> Master your periodic presence through mindful alerts.
                                </p>
                            </div>
                            <NotificationPreferences hideHeader={true} isMobileVerified={profileData.is_mobile_verified} />
                        </div>
                        <div className="p-6 bg-[#F8F5F0] border-t border-[#E8E1D5] text-center">
                            <button 
                                onClick={() => setShowNotificationModal(false)}
                                className="px-12 py-3.5 bg-[#36453A] text-white rounded-xl text-sm font-bold shadow-lg hover:bg-[#2A362D] transition-all transform active:scale-95"
                            >
                                DONE
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
