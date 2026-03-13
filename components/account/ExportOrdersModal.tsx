import React, { useState } from 'react';
import { X, FileText, Download, Calendar, DollarSign, Loader2 } from 'lucide-react';
import { Order } from '@/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getOrderById } from '@/lib/api';
import toast from 'react-hot-toast';

interface ExportOrdersModalProps {
    orders: Order[];
    isOpen: boolean;
    onClose: () => void;
    userName?: string;
    userEmail?: string;
}

// ─── Colour palette (matches the storefront burgundy/gold theme) ───────────
const BURGUNDY = [59, 93, 59] as [number, number, number];
const GOLD = [181, 149, 47] as [number, number, number];
const CREAM = [250, 246, 240] as [number, number, number];
const CREAM_DARK = [245, 240, 233] as [number, number, number];
const LIGHT_GRAY = [240, 240, 240] as [number, number, number];
const MID_GRAY = [150, 150, 150] as [number, number, number];
const DARK_GRAY = [50, 50, 50] as [number, number, number];
const GREEN = [34, 197, 94] as [number, number, number];
const RED = [239, 68, 68] as [number, number, number];

// ─── PDF-safe price formatter ────────────────────────────────────────────────
// jsPDF may not support vi-VN locale (dots as thousands separators), so we use
// en-US commas and append the VND symbol explicitly.
const fmtPrice = (amount: number | string | null | undefined): string => {
    const n = Math.round(Number(amount) || 0);
    return '₹' + n.toLocaleString('en-IN');
};

export default function ExportOrdersModal({
    orders, isOpen, onClose, userName, userEmail,
}: ExportOrdersModalProps) {
    const [isExporting, setIsExporting] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState('All');
    const [paymentFilter, setPaymentFilter] = useState('All');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');

    if (!isOpen) return null;

    // ─── Helpers ─────────────────────────────────────────────────────────────

    const getBase64ImageFromUrl = async (imageUrl: string): Promise<string | null> => {
        if (!imageUrl) return null;
        if (imageUrl.startsWith('data:image')) return imageUrl;
        try {
            const res = await fetch(imageUrl);
            const blob = await res.blob();
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.warn('Failed to fetch image', e);
            return null;
        }
    };

    // ─── PDF generation ──────────────────────────────────────────────────────

    const handleExport = async () => {
        setIsExporting(true);

        try {
            // Apply filters
            let filteredOut = orders;

            if (statusFilter !== 'All')
                filteredOut = filteredOut.filter(o =>
                    o.order_status?.toLowerCase() === statusFilter.toLowerCase());

            if (paymentFilter !== 'All')
                filteredOut = filteredOut.filter(o =>
                    o.payment_status?.toLowerCase() === paymentFilter.toLowerCase());

            if (dateFrom) {
                const fromDate = new Date(dateFrom);
                fromDate.setHours(0, 0, 0, 0);
                filteredOut = filteredOut.filter(o => new Date(o.created_at) >= fromDate);
            }

            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                filteredOut = filteredOut.filter(o => new Date(o.created_at) <= toDate);
            }

            if (minAmount) {
                const min = parseFloat(minAmount);
                if (!isNaN(min))
                    filteredOut = filteredOut.filter(o =>
                        parseFloat(String(o.total_amount)) >= min);
            }

            if (maxAmount) {
                const max = parseFloat(maxAmount);
                if (!isNaN(max))
                    filteredOut = filteredOut.filter(o =>
                        parseFloat(String(o.total_amount)) <= max);
            }

            if (filteredOut.length === 0) {
                toast.error('No orders match the selected filters');
                setIsExporting(false);
                return;
            }

            const maxExportLength = Math.min(filteredOut.length, 50);
            if (filteredOut.length > 50)
                toast('Only exporting first 50 orders', { icon: '⚠️' });

            // ── Fetch all order details up-front ──────────────────────────
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const detailedOrders: any[] = [];
            for (let i = 0; i < maxExportLength; i++) {
                const basic = filteredOut[i];
                let detail = basic;
                try {
                    const res = await getOrderById(basic.order_id);
                    if (res.success && res.data) detail = res.data;
                } catch {
                    console.warn('Could not load detail for order', basic.order_id);
                }

                // Pre-fetch item images
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const rawItems: any[] =
                    detail.items && detail.items.length > 0
                        ? detail.items
                        : detail.first_item
                            ? [detail.first_item]
                            : [];

                for (const item of rawItems) {
                    if (item?.thumbnail_url) {
                        item._b64 = await getBase64ImageFromUrl(item.thumbnail_url);
                    }
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (detail as any)._items = rawItems;
                detailedOrders.push(detail);
            }

            // ── Build PDF ─────────────────────────────────────────────────
            const doc = new jsPDF('portrait', 'mm', 'a4');
            const PW = 210; // page width mm
            const PH = 297; // page height mm
            const ML = 14;  // margin left
            const MR = 14;  // margin right
            const CW = PW - ML - MR; // content width (182mm)

            // ─── Cover / Document header (first page only) ────────────────
            // Gradient-look top banner (two filled rects approximating the gradient)
            doc.setFillColor(...BURGUNDY);
            doc.rect(0, 0, PW, 40, 'F');
            doc.setFillColor(...GOLD);
            doc.rect(PW - 60, 0, 60, 40, 'F');
            // Blend strip
            doc.setFillColor(160, 100, 60);
            doc.rect(PW - 90, 0, 40, 40, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(255, 255, 255);
            doc.text('Vedashi', ML, 17);

            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(240, 220, 200);
            doc.text('Order Export Report', ML, 26);

            // User info block (right side of banner)
            const uName = userName || 'Customer';
            const uEmail = userEmail || '';
            doc.setFontSize(9);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text(uName.toUpperCase(), PW - MR, 14, { align: 'right' });
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(240, 220, 200);
            if (uEmail) doc.text(uEmail, PW - MR, 20, { align: 'right' });

            // Meta below banner
            doc.setFontSize(8.5);
            doc.setTextColor(...MID_GRAY);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated on: ${new Date().toLocaleString()}`, ML, 47);
            doc.text(`Total orders in report: ${detailedOrders.length}`, ML, 53);

            // Separator line under header meta
            doc.setDrawColor(...GOLD);
            doc.setLineWidth(0.6);
            doc.line(ML, 57, PW - MR, 57);

            let currentY = 63;
            let ordersOnThisPage = 0;
            const ORDERS_PER_PAGE = 2;

            // ── Render each order ─────────────────────────────────────────
            for (let idx = 0; idx < detailedOrders.length; idx++) {
                const order = detailedOrders[idx];

                // Start a new page after every 2 orders
                if (ordersOnThisPage >= ORDERS_PER_PAGE) {
                    doc.addPage();
                    ordersOnThisPage = 0;

                    // Repeat thin header strip on subsequent pages
                    doc.setFillColor(...BURGUNDY);
                    doc.rect(0, 0, PW, 10, 'F');
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(8);
                    doc.setTextColor(255, 255, 255);
                    doc.text('Vedashi  —  Order Export', ML, 7);
                    if (uEmail) doc.text(uEmail, PW - MR, 7, { align: 'right' });

                    currentY = 16;
                }

                // ── Order card background ──────────────────────────────────
                const cardStartY = currentY;

                // Estimate card height (header 30 + items table ~16*n + totals 22 + padding)
                // We use a fixed generous estimate; autoTable will push currentY
                doc.setFillColor(...CREAM);
                doc.setDrawColor(220, 215, 210);
                doc.setLineWidth(0.3);
                doc.roundedRect(ML, cardStartY, CW, 8, 2, 2, 'FD');

                // ── Order ID banner row ────────────────────────────────────
                doc.setFillColor(...BURGUNDY);
                doc.roundedRect(ML, cardStartY, CW, 8, 2, 2, 'F');
                // Bottom corners square (overlay to make them straight)
                doc.setFillColor(...BURGUNDY);
                doc.rect(ML, cardStartY + 4, CW, 4, 'F');

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.setTextColor(255, 255, 255);
                const shortId = order.order_id?.split('-')[0].toUpperCase() ?? '—';
                doc.text(`ORDER  #${shortId}`, ML + 4, cardStartY + 5.5);

                const orderDate = order.created_at
                    ? new Date(order.created_at).toLocaleString()
                    : '—';
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(220, 200, 180);
                doc.text(orderDate, PW - MR, cardStartY + 5.5, { align: 'right' });

                currentY = cardStartY + 10;

                // ── Two-column info row: Customer | Status ─────────────────
                const halfW = (CW - 4) / 2;

                // Left card: Customer
                doc.setFillColor(255, 255, 255);
                doc.setDrawColor(230, 225, 220);
                doc.setLineWidth(0.25);
                doc.roundedRect(ML, currentY, halfW, 22, 1.5, 1.5, 'FD');

                doc.setFontSize(7);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...MID_GRAY);
                doc.text('CUSTOMER', ML + 3, currentY + 4.5);

                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...DARK_GRAY);
                const custName = order.customer_name || userName || '—';
                const custEmail = order.customer_email || userEmail || '—';
                doc.text(custName.toUpperCase(), ML + 3, currentY + 9.5);

                doc.setFontSize(7.5);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(...MID_GRAY);
                doc.text(custEmail, ML + 3, currentY + 14);

                // Shipping address (below email)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const adr = (order as any).shipping_address;
                let adrText = 'No address on record';
                if (adr?.address_line1) {
                    const parts = [
                        adr.address_line1,
                        adr.address_line2,
                        adr.city,
                        adr.state,
                        adr.pincode,
                        adr.country,
                    ].filter(Boolean).join(', ');
                    adrText = parts;
                }
                const adrLines = doc.splitTextToSize(adrText, halfW - 6);
                doc.setFontSize(7);
                doc.setTextColor(130, 130, 130);
                doc.text(adrLines.slice(0, 2), ML + 3, currentY + 18.5);

                // Right card: Status & Payment
                const rightX = ML + halfW + 4;

                doc.setFillColor(255, 255, 255);
                doc.setDrawColor(230, 225, 220);
                doc.roundedRect(rightX, currentY, halfW, 22, 1.5, 1.5, 'FD');

                doc.setFontSize(7);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...MID_GRAY);
                doc.text('PAYMENT & STATUS', rightX + 3, currentY + 4.5);

                // Order status badge
                const orderStatus = (order.order_status || 'UNKNOWN').toUpperCase();
                const statusColors: Record<string, [number, number, number]> = {
                    SHIPPED: [34, 197, 94],
                    DELIVERED: [22, 163, 74],
                    PENDING: [234, 179, 8],
                    CONFIRMED: [59, 130, 246],
                    CANCELLED: [239, 68, 68],
                };
                const sColor = statusColors[orderStatus] ?? [100, 100, 100] as [number, number, number];

                doc.setFillColor(...sColor);
                doc.roundedRect(rightX + 3, currentY + 7, 30, 5, 1, 1, 'F');
                doc.setFontSize(7);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(255, 255, 255);
                doc.text(orderStatus, rightX + 18, currentY + 10.3, { align: 'center' });

                // Payment status
                const ptStatus = (order.payment_status || 'UNPAID').toUpperCase();
                const ptColor: [number, number, number] = ptStatus === 'PAID' ? GREEN : RED;
                doc.setFillColor(...ptColor);
                doc.roundedRect(rightX + 3, currentY + 14, 22, 5, 1, 1, 'F');
                doc.setFontSize(7);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(255, 255, 255);
                doc.text(ptStatus, rightX + 14, currentY + 17.3, { align: 'center' });

                // Notes (if any)
                if (order.notes) {
                    doc.setFontSize(6.5);
                    doc.setFont('helvetica', 'italic');
                    doc.setTextColor(...MID_GRAY);
                    const noteLines = doc.splitTextToSize(`Notes: ${order.notes}`, halfW - 36);
                    doc.text(noteLines.slice(0, 2), rightX + 28, currentY + 10);
                }

                currentY += 25; // after the two-column row

                // ── Items table ────────────────────────────────────────────
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const items: any[] = order._items || [];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const tableRows: any[] = items.map((item: any) => {
                    const name = item.product?.product_name || item.product_name || 'Product';
                    const brand = item.product?.brand || '';
                    const variant = item.variant?.size_label || item.variant_name || 'Default';
                    const qty = item.quantity || 1;
                    const unitP = item.unit_price ? fmtPrice(item.unit_price) : '—';
                    const lineT = item.line_total
                        ? fmtPrice(item.line_total)
                        : fmtPrice(item.unit_price * qty);

                    return [
                        { content: '' },   // image col
                        { content: `${name}\n${[brand, variant].filter(Boolean).join('  |  ')}` },
                        { content: qty.toString(), styles: { halign: 'center' as const, fontStyle: 'bold' as const } },
                        { content: unitP, styles: { halign: 'right' as const } },
                        { content: lineT, styles: { halign: 'right' as const, fontStyle: 'bold' as const, textColor: DARK_GRAY } },
                    ];
                });

                autoTable(doc, {
                    startY: currentY,
                    head: [[
                        '',
                        { content: 'PRODUCT', styles: { halign: 'left' as const } },
                        { content: 'QTY', styles: { halign: 'center' as const } },
                        { content: 'UNIT PRICE', styles: { halign: 'right' as const } },
                        { content: 'LINE TOTAL', styles: { halign: 'right' as const } },
                    ]],
                    body: tableRows.length > 0 ? tableRows : [['', { content: 'No items found', colSpan: 4 }]],
                    theme: 'plain',
                    headStyles: {
                        fillColor: BURGUNDY,
                        textColor: [255, 255, 255] as [number, number, number],
                        fontStyle: 'bold',
                        fontSize: 7.5,
                        cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
                    },
                    styles: {
                        fontSize: 8,
                        cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
                        minCellHeight: 14,
                        valign: 'middle',
                        overflow: 'linebreak',
                        lineColor: [225, 218, 212] as [number, number, number],
                        lineWidth: 0.2,
                    },
                    columnStyles: {
                        0: { cellWidth: 14 },
                        1: { cellWidth: 82, fontSize: 8 },
                        2: { cellWidth: 14 },
                        3: { cellWidth: 36 },
                        4: { cellWidth: 36, textColor: DARK_GRAY },
                    },
                    alternateRowStyles: { fillColor: CREAM },
                    margin: { left: ML, right: MR },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    didDrawCell: (data: any) => {
                        if (data.section === 'body' && data.column.index === 0) {
                            const item = items[data.row.index];
                            if (item?._b64) {
                                try {
                                    doc.addImage(
                                        item._b64, 'JPEG',
                                        data.cell.x + 1.5,
                                        data.cell.y + 1.5,
                                        11, 11,
                                    );
                                } catch { /* silent */ }
                            }
                        }
                    },
                });

                // @ts-expect-error – jspdf-autotable augments jsPDF at runtime
                currentY = doc.lastAutoTable.finalY + 3;

                // ── Financial summary box (right-aligned) ─────────────────
                const boxW = 80;
                const boxX = PW - MR - boxW;
                const rLabelX = boxX + 4;
                const rValX = PW - MR - 4;
                const lineH = 6;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const subtotalAmt = (order as any).subtotal ?? order.total_amount ?? 0;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const taxAmt = (order as any).tax_amount ?? (order as any).total_tax ?? 0;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const grandTotal = (order as any).final_total ?? order.total_amount ?? 0;

                const boxH = lineH * 2 + 12; // subtotal + tax rows + grand total row

                // Background fill
                doc.setFillColor(...CREAM_DARK);
                doc.setDrawColor(220, 212, 205);
                doc.setLineWidth(0.3);
                doc.roundedRect(boxX, currentY, boxW, boxH, 2, 2, 'FD');

                // Subtotal row
                doc.setFontSize(8.5);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(...MID_GRAY);
                doc.text('Subtotal', rLabelX, currentY + lineH);
                doc.setTextColor(...DARK_GRAY);
                doc.text(fmtPrice(subtotalAmt), rValX, currentY + lineH, { align: 'right' });

                // Tax row
                doc.setTextColor(...MID_GRAY);
                doc.text('Tax', rLabelX, currentY + lineH * 2);
                doc.setTextColor(...DARK_GRAY);
                doc.text(fmtPrice(taxAmt), rValX, currentY + lineH * 2, { align: 'right' });

                // Divider before grand total
                const divY = currentY + lineH * 2 + 2.5;
                doc.setDrawColor(200, 192, 185);
                doc.setLineWidth(0.4);
                doc.line(boxX + 3, divY, PW - MR - 3, divY);

                // Grand total row — filled burgundy strip
                const gtY = divY + 1;
                doc.setFillColor(...BURGUNDY);
                doc.roundedRect(boxX, gtY, boxW, 8, 0, 0, 'F');
                // Adjust bottom corners to be straight
                doc.roundedRect(boxX, gtY + 4, boxW, 4 + 2, 2, 2, 'F');
                doc.rect(boxX, gtY, boxW, 4, 'F');

                doc.setFontSize(9.5);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(255, 255, 255);
                doc.text('Grand Total', rLabelX, gtY + 5.5);
                doc.text(fmtPrice(grandTotal), rValX, gtY + 5.5, { align: 'right' });
                doc.setTextColor(...DARK_GRAY);

                currentY = gtY + 8 + 4; // below the box

                // ── Horizontal rule separating orders ─────────────────────
                // Thick solid line full-width
                doc.setDrawColor(...BURGUNDY);
                doc.setLineWidth(0.8);
                doc.line(ML, currentY - 2, PW - MR, currentY - 2);
                // Thinner dotted-look line just below
                doc.setDrawColor(...GOLD);
                doc.setLineWidth(0.3);
                doc.line(ML, currentY, PW - MR, currentY);

                // Spacing after separator
                if (idx < detailedOrders.length - 1) {
                    currentY += 6;
                }

                ordersOnThisPage++;

                // Safety: if remaining space < 60mm, force a new page early
                if (currentY > PH - 60 && idx < detailedOrders.length - 1) {
                    ordersOnThisPage = ORDERS_PER_PAGE; // trigger page break on next iteration
                }
            }

            // ── Footer on every page ──────────────────────────────────────
            const totalPages = doc.getNumberOfPages();
            for (let p = 1; p <= totalPages; p++) {
                doc.setPage(p);
                doc.setFontSize(7.5);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(...MID_GRAY);
                doc.text('Vedashi  •  Confidential', ML, PH - 6);
                doc.text(`Page ${p} of ${totalPages}`, PW - MR, PH - 6, { align: 'right' });
                doc.setDrawColor(...LIGHT_GRAY);
                doc.setLineWidth(0.3);
                doc.line(ML, PH - 9, PW - MR, PH - 9);
            }

            doc.save(`Vedashi_Orders_Export_${new Date().toISOString().slice(0, 10)}.pdf`);
            toast.success('Successfully exported orders as PDF');
            onClose();

        } catch (error) {
            console.error('Export Error:', error);
            toast.error('Failed to generate PDF export');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden" style={{ animation: 'slideUp 0.35s ease-out' }}>
                {/* Header Stripe */}
                <div className="flex-shrink-0 h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #3B5D3B, #B5952F)' }} />

                {/* Overlay Header */}
                <div className="flex-shrink-0 flex items-center justify-between px-6 py-5 border-b border-light-border bg-white">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cream-dark">
                            <FileText className="h-6 w-6 text-[#3B5D3B]" />
                        </div>
                        <div>
                            <h2 className="font-serif text-xl font-bold text-charcoal">Export Orders</h2>
                            <p className="text-sm text-warm-gray mt-0.5">Download detailed orders as PDF (2 per page)</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-warm-gray hover:bg-cream hover:text-charcoal transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar bg-cream/30">

                    {/* Format Selection */}
                    <div className="mb-8">
                        <h3 className="text-xs font-bold text-warm-gray tracking-wider uppercase mb-3">Format</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-xl border-2 border-burgundy bg-burgundy/5 p-4 flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm">
                                <FileText className="h-5 w-5 text-[#3B5D3B]" />
                                <span className="font-semibold text-[#3B5D3B]">PDF Document</span>
                            </div>
                            <div className="rounded-xl border border-light-border bg-white p-4 flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                                <span className="font-medium text-warm-gray">CSV / Excel (Coming Soon)</span>
                            </div>
                        </div>
                    </div>

                    {/* Filters Section */}
                    <div>
                        <h3 className="text-xs font-bold text-warm-gray tracking-wider uppercase mb-3">Filters (Optional)</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Order Status */}
                            <div>
                                <label className="block text-sm font-medium text-charcoal mb-1">Order Status</label>
                                <select
                                    className="w-full rounded-lg border border-light-border px-4 py-2.5 text-sm focus:border-burgundy focus:outline-none transition-colors bg-white shadow-sm"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="CONFIRMED">Confirmed</option>
                                    <option value="SHIPPED">Shipped</option>
                                    <option value="DELIVERED">Delivered</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>

                            {/* Payment Status */}
                            <div>
                                <label className="block text-sm font-medium text-charcoal mb-1">Payment Status</label>
                                <select
                                    className="w-full rounded-lg border border-light-border px-4 py-2.5 text-sm focus:border-burgundy focus:outline-none transition-colors bg-white shadow-sm"
                                    value={paymentFilter}
                                    onChange={(e) => setPaymentFilter(e.target.value)}
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="PAID">Paid</option>
                                    <option value="UNPAID">Unpaid</option>
                                    <option value="FAILED">Failed</option>
                                    <option value="REFUNDED">Refunded</option>
                                </select>
                            </div>

                            {/* Date Area */}
                            <div>
                                <label className="block text-sm font-medium text-charcoal mb-1">Date From</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        className="w-full rounded-lg border border-light-border pl-10 pr-4 py-2.5 text-sm focus:border-burgundy focus:outline-none transition-colors bg-white shadow-sm"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                    />
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-gray pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-charcoal mb-1">Date To</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        className="w-full rounded-lg border border-light-border pl-10 pr-4 py-2.5 text-sm focus:border-burgundy focus:outline-none transition-colors bg-white shadow-sm"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                    />
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-gray pointer-events-none" />
                                </div>
                            </div>

                            {/* Amount Area */}
                            <div>
                                <label className="block text-sm font-medium text-charcoal mb-1">Min Amount (₹)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full rounded-lg border border-light-border pl-10 pr-4 py-2.5 text-sm focus:border-burgundy focus:outline-none transition-colors bg-white shadow-sm"
                                        value={minAmount}
                                        onChange={(e) => setMinAmount(e.target.value)}
                                    />
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-gray pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-charcoal mb-1">Max Amount (₹)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="No limit"
                                        className="w-full rounded-lg border border-light-border pl-10 pr-4 py-2.5 text-sm focus:border-burgundy focus:outline-none transition-colors bg-white shadow-sm"
                                        value={maxAmount}
                                        onChange={(e) => setMaxAmount(e.target.value)}
                                    />
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-gray pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 px-6 py-5 border-t border-light-border bg-white flex items-center justify-between">
                    <p className="text-xs text-warm-gray">
                        Leave filters empty to export all orders. Max 50 orders per export.
                    </p>
                    <button
                        onClick={handleExport}
                        disabled={isExporting || orders.length === 0}
                        className="rounded-xl flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#3B5D3B' }}
                    >
                        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        {isExporting ? 'Generating PDF...' : 'Download Export'}
                    </button>
                </div>
            </div>
        </div>
    );
}
