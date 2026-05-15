'use client';
import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics/gtag';

export default function GlobalErrorTracker() {
    useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            trackEvent('js_error', {
                error_message: event.message,
                error_source: event.filename,
                error_line: event.lineno
            });
        };

        const handleRejection = (event: PromiseRejectionEvent) => {
            trackEvent('api_error', {
                error_message: event.reason?.message || 'Unhandled Promise Rejection',
            });
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleRejection);
        
        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleRejection);
        };
    }, []);

    return null;
}
