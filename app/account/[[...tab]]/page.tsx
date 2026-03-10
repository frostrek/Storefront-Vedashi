'use client';

import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/ProductCard';
import {
    getMyOrders, getAddresses, addAddress as apiAddAddress,
    updateAddress as apiUpdateAddress, deleteAddress as apiDeleteAddress,
    getCustomerProfile, updateCustomerProfile, deactivateAccount,
    uploadProfileImage, getProfileImage, removeProfileImage, getOrderById,
    cancelOrder as apiCancelOrder, formatVND, downloadInvoice
} from '@/lib/api';
import { Order, Address } from '@/types';
import {
    Package, MapPin, Heart, LogOut, User, Plus, Pencil, Trash2,
    Loader2, ShieldOff, Camera, X, Check, Star, Phone, Calendar, Mail,
    CheckCircle2, Smartphone, AlertCircle, Shield, FileText
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';
import PrivacyDashboard from '@/components/account/PrivacyDashboard';
import ReviewForm from '@/components/reviews/ReviewForm';
import NotificationPreferences from '@/components/account/NotificationPreferences';
import ExportOrdersModal from '@/components/account/ExportOrdersModal';
import { BadgeCheck, BellRing, Download } from 'lucide-react';

type Tab = 'orders' | 'wishlist' | 'addresses' | 'profile' | 'privacy';

const VALID_TABS: Tab[] = ['orders', 'wishlist', 'addresses', 'profile', 'privacy'];

export default function AccountPage() {
    const router = useRouter();
    const params = useParams<{ tab?: string[] }>();
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const { items: wishlistItems, removeItem: removeWishlistItem } = useWishlist();
    const { addItem: addCartItem } = useCart();

    // Derive active tab from URL path segment, default to 'orders'
    const activeTab: Tab = useMemo(() => {
        const slug = params?.tab?.[0] as Tab | undefined;
        return slug && VALID_TABS.includes(slug) ? slug : 'orders';
    }, [params?.tab]);

    // Orders state
    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null);
    const [isOrderLoading, setIsOrderLoading] = useState(false);
    const [isTrackOrderModalOpen, setIsTrackOrderModalOpen] = useState(false);
    const [trackOrderId, setTrackOrderId] = useState<string | null>(null);

    // Addresses state
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [addressesLoading, setAddressesLoading] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [addressForm, setAddressForm] = useState({
        address_line1: '', address_line2: '', city: '', state: '', pincode: '',
        country: 'India', phone: '', label: '', is_default: false,
    });

    // Profile state
    const [orderCount, setOrderCount] = useState(0);
    const [profileEditing, setProfileEditing] = useState(false);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileData, setProfileData] = useState({
        full_name: '', email: '', phone: '', date_of_birth: '',
        is_email_verified: false, is_mobile_verified: false,
    });

    // Profile image state
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
    const [imageUploading, setImageUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Review modal state
    const [reviewModal, setReviewModal] = useState<{ orderId: string; productId: string; productName: string } | null>(null);

    // Notification preferences state
    const [showNotificationOverlay, setShowNotificationOverlay] = useState(false);

    // Export orders modal state
    const [showExportModal, setShowExportModal] = useState(false);

    // Body scroll lock for modals
    useEffect(() => {
        if (selectedOrderDetails || isTrackOrderModalOpen || showDeactivateModal || deletingAddressId || cancellingOrderId || reviewModal || showNotificationOverlay || showExportModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [selectedOrderDetails, isTrackOrderModalOpen, showDeactivateModal, deletingAddressId, cancellingOrderId, reviewModal, showNotificationOverlay, showExportModal]);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

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
                setProfileData({
                    full_name: res.data.full_name || '',
                    email: res.data.email || '',
                    phone: res.data.phone || '',
                    date_of_birth: res.data.date_of_birth ? res.data.date_of_birth.split('T')[0] : '',
                    is_email_verified: !!res.data.is_email_verified,
                    is_mobile_verified: !!res.data.is_mobile_verified,
                });
            }
        } catch (err) {
            console.error('Failed to fetch profile:', err);
        }
    }, [user?.id]);

    // ── Fetch profile image ──────────────────────────────────────────
    const fetchProfileImage = useCallback(async () => {
        if (!user?.id) return;
        try {
            const res = await getProfileImage(user.id);
            if (res.success && res.data?.profile_image) {
                const mime = res.data.mime_type || 'image/jpeg';
                setProfileImageUrl(`data:${mime};base64,${res.data.profile_image}`);
            }
        } catch {
            // No image or error, stay with fallback
        }
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id) return;
        if (activeTab === 'orders') fetchOrders();
        if (activeTab === 'addresses') fetchAddresses();
        if (activeTab === 'profile') {
            fetchOrders(); // for order count
            fetchProfile();
            fetchProfileImage();
        }
    }, [activeTab, user?.id, fetchOrders, fetchAddresses, fetchProfile, fetchProfileImage]);

    // ── Profile save handler ─────────────────────────────────────────
    const handleProfileSave = async () => {
        if (!user?.id) return;
        setProfileSaving(true);
        try {
            const res = await updateCustomerProfile(user.id, profileData);
            if (res.success) {
                toast.success('Profile updated successfully');
                setProfileEditing(false);
            } else {
                toast.error(res.message || 'Failed to update profile');
            }
        } catch {
            toast.error('Server error. Please try again.');
        } finally {
            setProfileSaving(false);
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
                setDeletingAddressId(null);
                fetchAddresses();
            } else {
                toast.error(res.message || 'Failed to delete address');
            }
        } catch {
            toast.error('Something went wrong');
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
            phone: addr.phone || '',
            label: addr.label || '',
            is_default: addr.is_default || false,
        });
        setShowAddressForm(true);
    };

    const resetAddressForm = () => {
        setShowAddressForm(false);
        setEditingAddress(null);
        setAddressForm({
            address_line1: '', address_line2: '', city: '', state: '', pincode: '',
            country: 'India', phone: '', label: '', is_default: false,
        });
    };

    const handleViewOrderDetails = async (orderId: string) => {
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
    };

    const handleTrackOrder = (orderId: string) => {
        setTrackOrderId(orderId);
        setIsTrackOrderModalOpen(true);
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

    const tabs: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
        { id: 'orders', label: 'Orders', icon: Package, count: orderCount },
        { id: 'wishlist', label: 'Wishlist', icon: Heart, count: wishlistItems.length },
        { id: 'addresses', label: 'Addresses', icon: MapPin, count: addresses.length },
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'privacy', label: 'Privacy', icon: Shield },
    ];

    return (
        <div className="min-h-screen bg-cream">
            {/* Header */}
            <div className="border-b border-light-border bg-white">
                <div className="mx-auto max-w-7xl px-4 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="font-serif text-3xl font-bold text-charcoal">My Account</h1>
                            <p className="mt-1 text-sm text-warm-gray">Welcome back, {user?.name}!</p>
                        </div>
                        <button
                            onClick={() => { logout(); toast.success('Logged out'); router.push('/'); }}
                            className="flex items-center gap-2 rounded-lg border border-light-border px-4 py-2 text-sm font-medium text-warm-gray hover:text-red-500 hover:border-red-200 transition-colors"
                        >
                            <LogOut className="h-4 w-4" /> Sign Out
                        </button>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-8">
                {/* Tabs */}
                <div className="flex gap-1 border-b border-light-border mb-8 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => router.push(`/account/${tab.id}`)}
                            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-5 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                                ? 'border-burgundy text-burgundy'
                                : 'border-transparent text-warm-gray hover:text-charcoal'
                                }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className="rounded-full bg-burgundy/10 px-2 py-0.5 text-[10px] font-bold text-burgundy">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ═══════════════════ ORDERS TAB ═══════════════════ */}
                {activeTab === 'orders' && (
                    <div>
                        {ordersLoading ? (
                            <div className="flex justify-center py-16">
                                <Loader2 className="h-8 w-8 animate-spin text-burgundy" />
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="rounded-2xl border border-light-border bg-white py-16 text-center">
                                <Package className="mx-auto h-12 w-12 text-warm-gray/40 mb-3" />
                                <p className="font-serif text-lg text-charcoal">No orders yet</p>
                                <p className="mt-1 text-sm text-warm-gray">Your orders will appear here</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map(order => (
                                    <div key={order.order_id} className="rounded-xl border border-light-border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                                            {/* Left Section: Order Info & Status */}
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <Package className="h-5 w-5 text-warm-gray" />
                                                    <span className="font-serif text-lg font-bold text-charcoal">
                                                        Order #{order.order_id.split('-')[0].toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-warm-gray">
                                                    <Calendar className="h-4 w-4" />
                                                    {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                    <span className="flex items-center gap-1.5 text-charcoal">
                                                        <span className={`h-2.5 w-2.5 rounded-full ${order.order_status === 'DELIVERED' ? 'bg-purple-500' : order.order_status === 'SHIPPED' ? 'bg-blue-500' : order.order_status === 'CONFIRMED' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                                        {order.order_status}
                                                    </span>
                                                    <span className="text-warm-gray/40">|</span>
                                                    <span className="flex items-center gap-1.5 text-charcoal">
                                                        <span className={`h-2.5 w-2.5 rounded-full ${order.payment_status?.toLowerCase() === 'paid' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                        {order.payment_status || 'UNPAID'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Middle Section: Product Preview */}
                                            <div className="flex-1 md:border-l md:border-r border-light-border md:px-6 py-2">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-16 w-16 rounded-lg border border-light-border overflow-hidden bg-cream flex-shrink-0">
                                                        {order.first_item?.thumbnail_url ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={order.first_item.thumbnail_url} alt="Product" className="h-full w-full object-cover" />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center text-warm-gray">
                                                                <Package className="h-6 w-6" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-charcoal line-clamp-2 text-sm">
                                                            {order.first_item?.product_name || 'Product'}
                                                        </p>
                                                        {Number(order.item_count) > 1 && (
                                                            <p className="text-sm text-burgundy font-medium mt-1">
                                                                +{Number(order.item_count) - 1} more order items
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Section: Total & Actions */}
                                            <div className="flex flex-col items-start md:items-end justify-between space-y-4">
                                                <div className="flex flex-col items-start md:items-end gap-1">
                                                    <span className="text-charcoal flex items-center gap-1.5 font-bold font-serif text-lg">
                                                        <span className="text-xl">💰</span>{formatVND(order.final_total || order.total_amount)}
                                                    </span>
                                                    {order.vat_amount ? (
                                                        <span className="text-xs text-warm-gray">incl. VAT {formatVND(order.vat_amount)}</span>
                                                    ) : null}
                                                    {order.order_status === 'CANCELLED' && order.cancellation_reason && (
                                                        <span className="text-xs text-red-500 max-w-[180px] md:text-right">
                                                            Reason: {order.cancellation_reason}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    <button onClick={() => handleTrackOrder(order.order_id)} className="rounded-lg border border-light-border px-4 py-2 text-sm font-semibold text-charcoal hover:bg-cream transition-colors">
                                                        Track Order
                                                    </button>
                                                    <button onClick={() => handleViewOrderDetails(order.order_id)} className="rounded-lg border border-light-border px-4 py-2 text-sm font-semibold text-charcoal hover:bg-cream transition-colors">
                                                        {isOrderLoading && selectedOrderDetails?.order_id === order.order_id ? <Loader2 className="h-4 w-4 animate-spin inline-block" /> : 'View Details'}
                                                    </button>
                                                    {(order.order_status === 'PENDING' || order.order_status === 'CONFIRMED') && (
                                                        <button
                                                            onClick={() => { setCancellingOrderId(order.order_id); setCancelReason(''); }}
                                                            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                                                        >
                                                            Cancel Order
                                                        </button>
                                                    )}
                                                    {order.order_status === 'DELIVERED' && (
                                                        <button
                                                            onClick={async () => {
                                                                // Fetch order details to get product info for the review
                                                                const res = await getOrderById(order.order_id);
                                                                if (res.success && res.data?.items?.length > 0) {
                                                                    const firstItem = res.data.items[0];
                                                                    const productId = firstItem.product?.product_id || firstItem.product_id;
                                                                    const productName = firstItem.product?.product_name || firstItem.product_name || 'Product';
                                                                    if (productId) {
                                                                        setReviewModal({ orderId: order.order_id, productId, productName });
                                                                    } else {
                                                                        toast.error('Could not load product info');
                                                                    }
                                                                } else {
                                                                    toast.error('Could not load order details');
                                                                }
                                                            }}
                                                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                                                        >
                                                            <BadgeCheck className="h-4 w-4" />
                                                            Write Review
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Cancel Order Confirmation Modal ─── */}
                {cancellingOrderId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-red-100">
                                    <X className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="font-serif font-bold text-charcoal text-lg">Cancel Order?</h3>
                                    <p className="text-sm text-warm-gray">This action cannot be undone. Stock will be restored.</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-charcoal mb-1">Reason (optional)</label>
                                <textarea
                                    rows={3}
                                    value={cancelReason}
                                    onChange={e => setCancelReason(e.target.value)}
                                    placeholder="e.g. Changed my mind, ordered by mistake..."
                                    className="w-full rounded-lg border border-light-border px-3 py-2 text-sm text-charcoal placeholder:text-warm-gray/60 focus:border-burgundy/40 focus:outline-none focus:ring-1 focus:ring-burgundy/30 resize-none"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    disabled={cancelSubmitting}
                                    onClick={() => { setCancellingOrderId(null); setCancelReason(''); }}
                                    className="flex-1 rounded-lg border border-light-border py-2.5 text-sm font-semibold text-charcoal hover:bg-cream transition-colors"
                                >
                                    Keep Order
                                </button>
                                <button
                                    disabled={cancelSubmitting}
                                    onClick={async () => {
                                        if (!cancellingOrderId) return;
                                        setCancelSubmitting(true);
                                        try {
                                            const res = await apiCancelOrder(cancellingOrderId, cancelReason);
                                            if (res.success) {
                                                toast.success('Order cancelled successfully');
                                                setCancellingOrderId(null);
                                                setCancelReason('');
                                                fetchOrders();
                                            } else {
                                                toast.error(res.message || 'Failed to cancel order');
                                            }
                                        } catch {
                                            toast.error('Something went wrong. Please try again.');
                                        } finally {
                                            setCancelSubmitting(false);
                                        }
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-500 hover:bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60"
                                >
                                    {cancelSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                    Yes, Cancel Order
                                </button>
                            </div>
                        </div>
                    </div>
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
                                        <h3 className="font-serif font-bold text-charcoal text-lg">Verified Purchase Review</h3>
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
                    <div>
                        {wishlistItems.length === 0 ? (
                            <div className="rounded-2xl border border-light-border bg-white py-16 text-center">
                                <Heart className="mx-auto h-12 w-12 text-warm-gray/40 mb-3" />
                                <p className="font-serif text-lg text-charcoal">Wishlist is empty</p>
                                <p className="mt-1 text-sm text-warm-gray">Save your favorite wines here</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {wishlistItems.map(product => (
                                    <ProductCard
                                        key={product.product_id}
                                        product={product}
                                        onMoveToCart={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            addCartItem(product.product_id, null, 1);
                                            removeWishlistItem(product.product_id);
                                            toast.success(`${product.product_name} moved to cart`);
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══════════════════ ADDRESSES TAB ═══════════════════ */}
                {activeTab === 'addresses' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="font-serif text-lg font-bold text-charcoal">Address Book</h2>
                                <p className="text-sm text-warm-gray mt-0.5">Manage your delivery addresses</p>
                            </div>
                            {!showAddressForm && (
                                <button
                                    onClick={() => {
                                        resetAddressForm();
                                        setShowAddressForm(true);
                                    }}
                                    className="flex items-center gap-2 rounded-lg bg-burgundy px-4 py-2.5 text-sm font-semibold text-white hover:bg-burgundy-dark transition-all hover:shadow-md"
                                >
                                    <Plus className="h-4 w-4" /> Add Address
                                </button>
                            )}
                        </div>

                        {/* Address Form (animated) */}
                        {showAddressForm && (
                            <div
                                className="mb-6 rounded-2xl border border-light-border bg-white overflow-hidden shadow-sm"
                                style={{ animation: 'slideDown 0.3s ease-out' }}
                            >
                                {/* Form header accent */}
                                <div className="h-1" style={{ background: 'linear-gradient(90deg, #6B2737, #D4A847)' }} />
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-5">
                                        <h3 className="font-serif text-base font-bold text-charcoal">
                                            {editingAddress ? 'Edit Address' : 'New Address'}
                                        </h3>
                                        <button onClick={resetAddressForm} className="p-1.5 rounded-lg hover:bg-cream transition-colors text-warm-gray hover:text-charcoal">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-charcoal mb-1">Address Line 1 *</label>
                                            <input type="text" value={addressForm.address_line1}
                                                onChange={e => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                                                className="w-full rounded-lg border border-light-border px-4 py-2.5 text-sm focus:border-burgundy focus:outline-none transition-colors"
                                                placeholder="Street address" />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-charcoal mb-1">Address Line 2</label>
                                            <input type="text" value={addressForm.address_line2}
                                                onChange={e => setAddressForm({ ...addressForm, address_line2: e.target.value })}
                                                className="w-full rounded-lg border border-light-border px-4 py-2.5 text-sm focus:border-burgundy focus:outline-none transition-colors"
                                                placeholder="Apartment, suite, etc." />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-charcoal mb-1">City *</label>
                                            <input type="text" value={addressForm.city}
                                                onChange={e => setAddressForm({ ...addressForm, city: e.target.value })}
                                                className="w-full rounded-lg border border-light-border px-4 py-2.5 text-sm focus:border-burgundy focus:outline-none transition-colors"
                                                placeholder="City" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-charcoal mb-1">State *</label>
                                            <input type="text" value={addressForm.state}
                                                onChange={e => setAddressForm({ ...addressForm, state: e.target.value })}
                                                className="w-full rounded-lg border border-light-border px-4 py-2.5 text-sm focus:border-burgundy focus:outline-none transition-colors"
                                                placeholder="State" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-charcoal mb-1">Pincode *</label>
                                            <input type="text" value={addressForm.pincode}
                                                onChange={e => setAddressForm({ ...addressForm, pincode: e.target.value })}
                                                className="w-full rounded-lg border border-light-border px-4 py-2.5 text-sm focus:border-burgundy focus:outline-none transition-colors"
                                                placeholder="Pincode" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-charcoal mb-1">Country</label>
                                            <input type="text" value={addressForm.country}
                                                onChange={e => setAddressForm({ ...addressForm, country: e.target.value })}
                                                className="w-full rounded-lg border border-light-border px-4 py-2.5 text-sm focus:border-burgundy focus:outline-none transition-colors"
                                                placeholder="Country" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-charcoal mb-1">Phone</label>
                                            <input type="tel" value={addressForm.phone}
                                                onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })}
                                                className="w-full rounded-lg border border-light-border px-4 py-2.5 text-sm focus:border-burgundy focus:outline-none transition-colors"
                                                placeholder="Phone number" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-charcoal mb-1">Label</label>
                                            <div className="flex gap-2">
                                                {['Home', 'Office', 'Other'].map(l => (
                                                    <button key={l} type="button"
                                                        onClick={() => setAddressForm({ ...addressForm, label: l })}
                                                        className={`rounded-lg px-4 py-2.5 text-sm font-medium border transition-all ${addressForm.label === l
                                                            ? 'border-burgundy bg-burgundy/5 text-burgundy'
                                                            : 'border-light-border text-warm-gray hover:border-burgundy/30'}`
                                                        }>
                                                        {l}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={addressForm.is_default}
                                                    onChange={e => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                                                    className="rounded border-light-border text-burgundy focus:ring-burgundy w-4 h-4" />
                                                <span className="text-sm text-charcoal">Set as default address</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="mt-5 flex gap-3">
                                        <button onClick={handleAddressSubmit}
                                            className="rounded-lg bg-burgundy px-6 py-2.5 text-sm font-semibold text-white hover:bg-burgundy-dark transition-all hover:shadow-md">
                                            {editingAddress ? 'Update Address' : 'Save Address'}
                                        </button>
                                        <button onClick={resetAddressForm}
                                            className="rounded-lg border border-light-border px-6 py-2.5 text-sm font-medium text-charcoal hover:bg-cream transition-colors">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {addressesLoading ? (
                            <div className="flex justify-center py-16">
                                <Loader2 className="h-8 w-8 animate-spin text-burgundy" />
                            </div>
                        ) : addresses.length === 0 && !showAddressForm ? (
                            <div className="rounded-2xl border border-light-border bg-white py-16 text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cream">
                                    <MapPin className="h-8 w-8 text-warm-gray/50" />
                                </div>
                                <p className="font-serif text-lg text-charcoal">No saved addresses</p>
                                <p className="mt-1 text-sm text-warm-gray mb-5">Add your first delivery address</p>
                                <button
                                    onClick={() => { resetAddressForm(); setShowAddressForm(true); }}
                                    className="rounded-lg bg-burgundy px-5 py-2.5 text-sm font-semibold text-white hover:bg-burgundy-dark transition-colors"
                                >
                                    <Plus className="inline h-4 w-4 mr-1 -mt-0.5" /> Add Address
                                </button>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {addresses.map(addr => (
                                    <div key={addr.address_id}
                                        className={`group relative rounded-xl border bg-white p-5 transition-all hover:shadow-md ${addr.is_default ? 'border-burgundy/30 ring-1 ring-burgundy/10' : 'border-light-border'}`}
                                    >
                                        {/* Default badge */}
                                        {addr.is_default && (
                                            <div className="absolute -top-2.5 left-4 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white"
                                                style={{ background: 'linear-gradient(135deg, #D4A847, #B8902D)' }}>
                                                <Star className="h-2.5 w-2.5" fill="white" /> DEFAULT
                                            </div>
                                        )}

                                        <div className="flex justify-between items-start">
                                            <div className="pt-1">
                                                {addr.label && (
                                                    <span className="inline-block rounded-full bg-burgundy/10 px-2.5 py-0.5 text-[10px] font-bold text-burgundy uppercase mb-2">
                                                        {addr.label}
                                                    </span>
                                                )}
                                                <p className="text-sm font-medium text-charcoal">{addr.address_line1}</p>
                                                {addr.address_line2 && <p className="text-sm text-warm-gray">{addr.address_line2}</p>}
                                                <p className="text-sm text-warm-gray">{addr.city}, {addr.state} {addr.pincode}</p>
                                                {addr.country && addr.country !== 'India' && (
                                                    <p className="text-sm text-warm-gray">{addr.country}</p>
                                                )}
                                                {addr.phone && (
                                                    <p className="mt-2 text-sm text-charcoal flex items-center gap-1.5">
                                                        <Phone className="h-3 w-3 text-warm-gray" /> {addr.phone}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!addr.is_default && (
                                                    <button onClick={() => handleSetDefault(addr)}
                                                        title="Set as default"
                                                        className="p-2 text-warm-gray hover:text-amber-600 transition-colors rounded-lg hover:bg-amber-50">
                                                        <Star className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button onClick={() => startEditAddress(addr)}
                                                    className="p-2 text-warm-gray hover:text-burgundy transition-colors rounded-lg hover:bg-burgundy/5">
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => setDeletingAddressId(addr.address_id)}
                                                    className="p-2 text-warm-gray hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
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
                    <div className="max-w-2xl space-y-6">

                        {/* ── Profile Card with Avatar ── */}
                        <div className="rounded-2xl border border-light-border bg-white overflow-hidden shadow-sm">
                            {/* Header gradient */}
                            <div className="h-24 relative" style={{ background: 'linear-gradient(135deg, #6B2737 0%, #8B3A4A 40%, #D4A847 100%)' }}>
                                <div className="absolute -bottom-12 left-6">
                                    <div className="relative group">
                                        {/* Avatar */}
                                        <div className="h-24 w-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-cream-dark flex items-center justify-center">
                                            {profileImageUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="font-serif text-3xl font-bold text-burgundy">
                                                    {user?.name?.charAt(0).toUpperCase()}
                                                </span>
                                            )}

                                            {/* Upload overlay */}
                                            {imageUploading && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                                                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Camera button */}
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={imageUploading}
                                            className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-burgundy text-white flex items-center justify-center shadow-md hover:bg-burgundy-dark transition-all hover:scale-110 disabled:opacity-50"
                                        >
                                            <Camera className="h-3.5 w-3.5" />
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                        />
                                    </div>
                                </div>

                                {/* Edit / save button */}
                                <div className="absolute top-4 right-4">
                                    {profileEditing ? (
                                        <div className="flex gap-2">
                                            <button onClick={handleProfileSave} disabled={profileSaving}
                                                className="flex items-center gap-1.5 rounded-lg bg-white/20 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/30 transition-colors disabled:opacity-50">
                                                {profileSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                                Save
                                            </button>
                                            <button onClick={() => { setProfileEditing(false); fetchProfile(); }}
                                                className="flex items-center gap-1.5 rounded-lg bg-white/20 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/30 transition-colors">
                                                <X className="h-3 w-3" /> Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setProfileEditing(true)}
                                            className="flex items-center gap-1.5 rounded-lg bg-white/20 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/30 transition-colors">
                                            <Pencil className="h-3 w-3" /> Edit Profile
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="pt-16 px-6 pb-6">
                                {/* Photo actions */}
                                <div className="flex items-center gap-3 mb-6">
                                    <button onClick={() => fileInputRef.current?.click()}
                                        className="text-xs font-medium text-burgundy hover:text-burgundy-dark transition-colors">
                                        Change Photo
                                    </button>
                                    {profileImageUrl && (
                                        <>
                                            <span className="text-warm-gray/30">|</span>
                                            <button onClick={handleRemoveImage}
                                                className="text-xs font-medium text-warm-gray hover:text-red-500 transition-colors">
                                                Remove Photo
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* Profile fields */}
                                <div className="space-y-4">
                                    {/* Full Name */}
                                    <div className="flex items-center gap-3 py-3 border-b border-light-border">
                                        <User className="h-4 w-4 text-warm-gray flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-medium text-warm-gray uppercase tracking-wider">Full Name</p>
                                            {profileEditing ? (
                                                <input type="text" value={profileData.full_name}
                                                    onChange={e => setProfileData({ ...profileData, full_name: e.target.value })}
                                                    className="w-full mt-0.5 text-sm text-charcoal font-medium bg-transparent border-b border-burgundy/30 focus:border-burgundy focus:outline-none py-0.5 transition-colors" />
                                            ) : (
                                                <p className="text-sm text-charcoal font-medium mt-0.5">{profileData.full_name || '—'}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="flex items-center gap-3 py-3 border-b border-light-border">
                                        <Mail className="h-4 w-4 text-warm-gray flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-medium text-warm-gray uppercase tracking-wider">Email Address</p>
                                            {profileEditing ? (
                                                <input type="email" value={profileData.email}
                                                    onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                                                    className="w-full mt-0.5 text-sm text-charcoal font-medium bg-transparent border-b border-burgundy/30 focus:border-burgundy focus:outline-none py-0.5 transition-colors" />
                                            ) : (
                                                <p className="text-sm text-charcoal font-medium mt-0.5">{profileData.email || '—'}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div className="flex items-center gap-3 py-3 border-b border-light-border">
                                        <Phone className="h-4 w-4 text-warm-gray flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-medium text-warm-gray uppercase tracking-wider">Phone Number</p>
                                            {profileEditing ? (
                                                <input type="tel" value={profileData.phone}
                                                    onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                                                    className="w-full mt-0.5 text-sm text-charcoal font-medium bg-transparent border-b border-burgundy/30 focus:border-burgundy focus:outline-none py-0.5 transition-colors"
                                                    placeholder="Add phone number" />
                                            ) : (
                                                <p className="text-sm text-charcoal font-medium mt-0.5">{profileData.phone || 'Not provided'}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Date of Birth */}
                                    <div className="flex items-center gap-3 py-3">
                                        <Calendar className="h-4 w-4 text-warm-gray flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-medium text-warm-gray uppercase tracking-wider">Date of Birth</p>
                                            {profileEditing ? (
                                                <input type="date" value={profileData.date_of_birth}
                                                    onChange={e => setProfileData({ ...profileData, date_of_birth: e.target.value })}
                                                    className="w-full mt-0.5 text-sm text-charcoal font-medium bg-transparent border-b border-burgundy/30 focus:border-burgundy focus:outline-none py-0.5 transition-colors" />
                                            ) : (
                                                <p className="text-sm text-charcoal font-medium mt-0.5">
                                                    {profileData.date_of_birth
                                                        ? new Date(profileData.date_of_birth + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                                        : 'Not provided'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Verification Status ── */}
                        <div className="rounded-2xl border border-light-border bg-white overflow-hidden shadow-sm">
                            <div className="h-1" style={{ background: 'linear-gradient(90deg, #6B2737, #D4A847)' }} />
                            <div className="p-6">
                                <h3 className="font-serif text-base font-bold text-charcoal mb-4">Verification Status</h3>
                                <div className="space-y-3">
                                    {/* Email Verification */}
                                    <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-cream/50 border border-light-border">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex h-9 w-9 items-center justify-center rounded-full ${profileData.is_email_verified ? 'bg-green-100' : 'bg-amber-100'}`}>
                                                <Mail className={`h-4 w-4 ${profileData.is_email_verified ? 'text-green-600' : 'text-amber-600'}`} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-charcoal">Email Address</p>
                                                <p className="text-xs text-warm-gray">{profileData.email}</p>
                                            </div>
                                        </div>
                                        {profileData.is_email_verified ? (
                                            <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                                <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => router.push('/verify-email')}
                                                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all hover:shadow-md"
                                                style={{ backgroundColor: '#D4A847' }}
                                            >
                                                <AlertCircle className="h-3.5 w-3.5" /> Verify Now
                                            </button>
                                        )}
                                    </div>

                                    {/* Mobile Verification */}
                                    <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-cream/50 border border-light-border">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex h-9 w-9 items-center justify-center rounded-full ${profileData.is_mobile_verified ? 'bg-green-100' : 'bg-amber-100'}`}>
                                                <Smartphone className={`h-4 w-4 ${profileData.is_mobile_verified ? 'text-green-600' : 'text-amber-600'}`} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-charcoal">Mobile Number</p>
                                                <p className="text-xs text-warm-gray">{profileData.phone || 'Not provided'}</p>
                                            </div>
                                        </div>
                                        {profileData.is_mobile_verified ? (
                                            <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                                <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => router.push('/verify-otp')}
                                                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all hover:shadow-md"
                                                style={{ backgroundColor: '#D4A847' }}
                                            >
                                                <AlertCircle className="h-3.5 w-3.5" /> Verify Now
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Quick Stats ── */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="rounded-xl border border-light-border bg-white p-4 text-center">
                                <p className="font-serif text-2xl font-bold text-burgundy">{orderCount}</p>
                                <p className="text-xs text-warm-gray mt-1">Orders</p>
                            </div>
                            <div className="rounded-xl border border-light-border bg-white p-4 text-center">
                                <p className="font-serif text-2xl font-bold text-burgundy">{wishlistItems.length}</p>
                                <p className="text-xs text-warm-gray mt-1">Wishlist</p>
                            </div>
                            <div className="rounded-xl border border-light-border bg-white p-4 text-center">
                                <p className="font-serif text-2xl font-bold text-burgundy">{addresses.length}</p>
                                <p className="text-xs text-warm-gray mt-1">Addresses</p>
                            </div>
                        </div>

                        {/* ── Notification Preferences Box ── */}
                        <div className="rounded-2xl border border-light-border bg-white overflow-hidden shadow-sm">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cream-dark">
                                            <BellRing className="h-5 w-5 text-burgundy" />
                                        </div>
                                        <div>
                                            <h3 className="font-serif text-base font-bold text-charcoal">Notification Preferences</h3>
                                            <p className="text-sm text-warm-gray mt-0.5">Control your email alerts</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowNotificationOverlay(true)}
                                        className="rounded-lg border border-light-border px-4 py-2 text-sm font-semibold text-charcoal hover:bg-cream transition-colors"
                                    >
                                        Manage
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── Export Orders Data ── */}
                        <div className="rounded-2xl border border-light-border bg-white overflow-hidden shadow-sm">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cream-dark">
                                            <FileText className="h-5 w-5 text-burgundy" />
                                        </div>
                                        <div>
                                            <h3 className="font-serif text-base font-bold text-charcoal tracking-wider">Export Orders Data</h3>
                                            <p className="text-sm text-warm-gray mt-0.5">Download orders as CSV or Excel</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowExportModal(true)}
                                        className="rounded-lg flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg"
                                        style={{ backgroundColor: '#6B2737' }}
                                    >
                                        <Download className="h-4 w-4" /> Export
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── Account Control ── */}
                        <div className="rounded-xl border p-6" style={{ borderColor: 'rgba(107, 39, 55, 0.2)', backgroundColor: 'rgba(107, 39, 55, 0.03)' }}>
                            <div className="flex items-start gap-3 mb-4">
                                <ShieldOff className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#6B2737' }} />
                                <div>
                                    <h3 className="font-serif text-base font-bold" style={{ color: '#6B2737' }}>Account Control</h3>
                                    <p className="mt-1 text-sm text-warm-gray leading-relaxed">
                                        Deactivating your account will log you out and hide your profile.
                                        Your data — orders, wishlist, and addresses — will be safely preserved.
                                        You can reactivate anytime by signing in again.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setDeactivatePassword(''); setShowDeactivateModal(true); }}
                                className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md"
                                style={{ backgroundColor: '#6B2737' }}
                            >
                                Deactivate My Account
                            </button>
                        </div>
                    </div>
                )}

                {/* ═══════════════════ PRIVACY TAB ═══════════════════ */}
                {activeTab === 'privacy' && (
                    <PrivacyDashboard />
                )}

                {/* ═══ Deactivation Confirmation Modal ═══ */}
                {showDeactivateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeactivateModal(false)} />
                        <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-light-border" style={{ animation: 'slideUp 0.35s ease-out' }}>
                            <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl" style={{ background: 'linear-gradient(90deg, #6B2737, #D4A847)' }} />
                            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'rgba(107, 39, 55, 0.1)' }}>
                                <ShieldOff className="h-7 w-7" style={{ color: '#6B2737' }} />
                            </div>
                            <h2 className="text-center font-serif text-xl font-bold text-charcoal mb-2">Confirm Deactivation</h2>
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
                    </div>
                )}

                {/* ═══ Delete Address Confirmation Modal ═══ */}
                {deletingAddressId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeletingAddressId(null)} />
                        <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-light-border" style={{ animation: 'slideUp 0.25s ease-out' }}>
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                                <Trash2 className="h-5 w-5 text-red-500" />
                            </div>
                            <h3 className="text-center font-serif text-lg font-bold text-charcoal mb-1">Delete Address?</h3>
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

                {/* ═══ Order Details Modal ═══ */}
                {selectedOrderDetails && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 p-4 sm:p-0" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedOrderDetails(null)} />
                        <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-light-border" style={{ animation: 'slideUp 0.25s ease-out' }}>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-serif text-xl font-bold text-charcoal">Order Details</h3>
                                <button onClick={() => setSelectedOrderDetails(null)} className="rounded-full p-2 hover:bg-cream transition-colors text-warm-gray">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Order Info */}
                                <div className="grid grid-cols-2 gap-4 bg-cream p-4 rounded-xl text-sm">
                                    <div>
                                        <p className="text-warm-gray mb-1">Order ID</p>
                                        <p className="font-mono font-medium text-charcoal text-xs break-all">{(selectedOrderDetails as { order_id: string }).order_id}</p>
                                    </div>
                                    <div>
                                        <p className="text-warm-gray mb-1">Date</p>
                                        <p className="font-medium text-charcoal">{new Date((selectedOrderDetails as { created_at: string }).created_at).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-warm-gray mb-1">Order Status</p>
                                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusColor((selectedOrderDetails as { order_status: string }).order_status)}`}>
                                            {(selectedOrderDetails as { order_status: string }).order_status}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-warm-gray mb-1">Payment Status</p>
                                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${(selectedOrderDetails as { payment_status?: string }).payment_status?.toLowerCase() === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {(selectedOrderDetails as { payment_status?: string }).payment_status || 'UNPAID'}
                                        </span>
                                    </div>
                                </div>

                                {/* Items List */}
                                <div>
                                    <h4 className="font-serif text-lg font-bold text-charcoal mb-4">Items</h4>
                                    <div className="space-y-3">
                                        {(selectedOrderDetails as { items: unknown[] }).items?.map((item: unknown) => (
                                            <div key={(item as { order_item_id: string }).order_item_id} className="flex gap-4 p-3 border border-light-border rounded-xl hover:border-burgundy/30 transition-colors">
                                                <div className="h-16 w-16 bg-cream rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border border-light-border">
                                                    {(item as { thumbnail_url?: string }).thumbnail_url ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={(item as { thumbnail_url: string }).thumbnail_url} alt="Product" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Package className="h-6 w-6 text-warm-gray" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-charcoal truncate">{(item as { product?: { product_name?: string } }).product?.product_name || 'Product'}</p>
                                                    <p className="text-xs text-warm-gray mt-1">Brand: {(item as { product?: { brand?: string } }).product?.brand || 'N/A'} | Size: {(item as { variant?: { size_label?: string } }).variant?.size_label || 'N/A'}</p>
                                                    <div className="flex justify-between items-center mt-2">
                                                        <p className="text-sm font-medium text-charcoal">Qty: {(item as { quantity: number }).quantity}</p>
                                                        <p className="text-sm font-bold text-burgundy">{formatVND(parseFloat((item as { line_total?: string, unit_price: number, quantity: number, tax_amount: number }).line_total || String((item as { unit_price: number, quantity: number, tax_amount: number }).unit_price * (item as { quantity: number }).quantity + (item as { tax_amount: number }).tax_amount)))}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="border-t border-light-border pt-4 space-y-2 text-sm">
                                    <div className="flex justify-between text-warm-gray">
                                        <span>Subtotal</span>
                                        <span>{formatVND(parseFloat((selectedOrderDetails as { total_amount: string }).total_amount))}</span>
                                    </div>
                                    <div className="flex justify-between text-warm-gray">
                                        <span>Tax</span>
                                        <span>{formatVND(parseFloat((selectedOrderDetails as { total_tax: string }).total_tax))}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-charcoal text-base mt-2 pt-2 border-t border-light-border">
                                        <span>Grand Total</span>
                                        <span className="text-burgundy">{formatVND(parseFloat((selectedOrderDetails as { total_amount: string }).total_amount) + parseFloat((selectedOrderDetails as { total_tax: string }).total_tax))}</span>
                                    </div>
                                </div>

                                {/* Download Invoice Button */}
                                <div className="pt-2">
                                    <button
                                        onClick={async () => {
                                            const toastId = toast.loading('Downloading invoice...');
                                            const res = await downloadInvoice((selectedOrderDetails as { order_id: string }).order_id);
                                            if (res.success) {
                                                toast.success('Invoice downloaded!', { id: toastId });
                                            } else {
                                                toast.error(res.message || 'Failed to download invoice', { id: toastId });
                                            }
                                        }}
                                        className="w-full rounded-xl bg-gradient-to-r from-[#722F37] to-[#8B3A42] px-4 py-3 text-sm font-semibold text-white hover:from-[#5E252C] hover:to-[#722F37] transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                                    >
                                        <FileText className="h-4 w-4" />
                                        Download Invoice
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ Track Order Modal ═══ */}
                {isTrackOrderModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsTrackOrderModalOpen(false)} />
                        <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-light-border text-center" style={{ animation: 'slideUp 0.25s ease-out' }}>
                            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-cream">
                                <Package className="h-8 w-8 text-burgundy" />
                            </div>
                            <h3 className="font-serif text-2xl font-bold text-charcoal mb-2">Track Order</h3>
                            <p className="font-mono text-sm font-semibold text-warm-gray mb-4">#{trackOrderId?.split('-')[0].toUpperCase()}</p>
                            <div className="bg-light-border/30 rounded-xl p-4 mb-6 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-burgundy"></div>
                                <p className="text-charcoal text-sm leading-relaxed font-medium">
                                    We will integrate with a third-party application for real-time tracking in the future. Check back soon!
                                </p>
                            </div>
                            <button
                                onClick={() => setIsTrackOrderModalOpen(false)}
                                className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg hover:opacity-90"
                                style={{ backgroundColor: '#6B2737' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {/* ═══ Notification Preferences Overlay ═══ */}
                {showNotificationOverlay && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style={{ animation: 'fadeIn 0.3s ease-out' }}>
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
                                    <h2 className="font-serif text-xl font-bold text-charcoal">Manage Notifications</h2>
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
                    </div>
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
    );
}
