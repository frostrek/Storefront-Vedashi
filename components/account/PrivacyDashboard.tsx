'use client';
import { authFetch, API_URL } from '@/lib/api';

import { useState, useEffect } from 'react';
import { Shield, Download, Trash2, Eye, ExternalLink, Loader2, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { RU_DICTIONARY } from '@/content/ru';

export default function PrivacyDashboard() {
    const [loading, setLoading] = useState(false);
    const [requests, setRequests] = useState<any[]>([]);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await authFetch(`${API_URL}/api/gdpr/data-request`);
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setRequests(data.data);
                }
            }
        } catch (error) {
            console.error('Failed to fetch requests', error);
        }
    };

    const handleExport = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`${API_URL}/api/gdpr/export`);
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `my-data-export-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    toast.success(RU_DICTIONARY.privacyTab.exportSuccess);
                    fetchRequests(); // refresh logs
                } else {
                    toast.error(data.message || RU_DICTIONARY.privacyTab.exportFailed);
                }
            }
        } catch (error) {
            toast.error(RU_DICTIONARY.privacyTab.networkErrorExport);
        } finally {
            setLoading(false);
        }
    };

    const handleErasure = async () => {
        if (!confirm(RU_DICTIONARY.privacyTab.erasureWarning)) {
            return;
        }

        setLoading(true);
        try {
            const res = await authFetch(`${API_URL}/api/gdpr/erasure`, {
                method: 'DELETE'
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    toast.success(RU_DICTIONARY.privacyTab.erasureSuccess);
                    window.location.href = '/login'; // log out natively
                } else {
                    toast.error(data.message || RU_DICTIONARY.privacyTab.erasureFailed);
                }
            }
        } catch (error) {
            toast.error(RU_DICTIONARY.privacyTab.networkErrorErasure);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center gap-3 border-b border-light-border pb-4">
                <Shield className="h-6 w-6 text-[#91C934]" />
                <div>
                    <h2 className="text-xl font-bold text-charcoal">{RU_DICTIONARY.privacyTab.title}</h2>
                    <p className="text-sm text-warm-gray">{RU_DICTIONARY.privacyTab.subtitle}</p>
                </div>
            </div>

            {/* General Privacy Center Info */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 text-emerald-900 text-sm flex gap-3">
                <Info className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                <div>
                    <p className="font-semibold mb-1 text-emerald-800">{RU_DICTIONARY.privacyTab.dataSubjectsRights}</p>
                    <p className="leading-relaxed opacity-90">
                        Under the General Data Protection Regulation (GDPR), you have the right to access, rectify, port, and erase your personal information.
                        Use the tools below to execute these rights automatically.
                    </p>
                    <a href="/privacy" className="inline-flex items-center gap-1 mt-2 text-emerald-700 font-medium hover:underline">
                        {RU_DICTIONARY.privacyTab.readPrivacyPolicy} <ExternalLink className="h-3 w-3" />
                    </a>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {/* Data Export Card */}
                <div className="rounded-xl border border-light-border bg-white p-5 hover:shadow-md transition-shadow">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 mb-4">
                        <Download className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-charcoal mb-1">{RU_DICTIONARY.privacyTab.dataPortability}</h3>
                    <p className="text-sm text-warm-gray mb-4">{RU_DICTIONARY.privacyTab.dataPortabilityDesc}</p>
                    <button
                        onClick={handleExport}
                        disabled={loading}
                        className="w-full flex justify-center items-center gap-2 rounded-lg border border-light-border px-4 py-2 text-sm font-semibold text-charcoal hover:bg-cream transition-colors disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        {RU_DICTIONARY.privacyTab.exportMyData}
                    </button>
                </div>

                {/* Data Erasure Card */}
                <div className="rounded-xl border border-light-border bg-white p-5 hover:border-red-200 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 mb-4">
                        <Trash2 className="h-5 w-5 text-red-600" />
                    </div>
                    <h3 className="font-bold text-charcoal mb-1">{RU_DICTIONARY.privacyTab.rightToBeForgotten}</h3>
                    <p className="text-sm text-warm-gray mb-4">{RU_DICTIONARY.privacyTab.rightToBeForgottenDesc}</p>
                    <button
                        onClick={handleErasure}
                        disabled={loading}
                        className="w-full flex justify-center items-center gap-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        {RU_DICTIONARY.privacyTab.erasePersonalData}
                    </button>
                </div>
            </div>

            {/* Request History Log */}
            <div className="rounded-xl border border-light-border bg-white overflow-hidden mt-8">
                <div className="bg-cream px-5 py-3 border-b border-light-border flex justify-between items-center">
                    <h3 className="font-bold text-charcoal">{RU_DICTIONARY.privacyTab.dataRequestLog}</h3>
                    <div className="text-xs text-warm-gray">{RU_DICTIONARY.privacyTab.article30Compliance}</div>
                </div>
                {requests.length === 0 ? (
                    <div className="p-8 text-center text-warm-gray text-sm">
                        {RU_DICTIONARY.privacyTab.noPrivacyRequests}
                    </div>
                ) : (
                    <ul className="divide-y divide-light-border">
                        {requests.map(req => (
                            <li key={req.id} className="p-4 flex items-center justify-between text-sm hover:bg-gray-50/50">
                                <div>
                                    <p className="font-medium text-charcoal">{RU_DICTIONARY.privacyTab.requestTypes[req.request_type as keyof typeof RU_DICTIONARY.privacyTab.requestTypes] || req.request_type}</p>
                                    <p className="text-xs text-warm-gray mt-0.5">{new Date(req.created_at).toLocaleString()}</p>
                                    {req.details && <p className="text-xs text-warm-gray italic mt-1 bg-gray-50 p-1 inline-block rounded border">"{req.details}"</p>}
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${req.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                    req.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                        'bg-amber-100 text-amber-700'
                                    }`}>
                                    {RU_DICTIONARY.privacyTab.requestStatuses[req.status as keyof typeof RU_DICTIONARY.privacyTab.requestStatuses] || req.status}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

        </div>
    );
}
