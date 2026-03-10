/* Cloudflare Turnstile — global type declarations */

interface TurnstileRenderOptions {
    sitekey: string;
    callback?: (token: string) => void;
    'expired-callback'?: () => void;
    'error-callback'?: () => void;
    theme?: 'light' | 'dark' | 'auto';
    size?: 'normal' | 'compact';
    action?: string;
    cData?: string;
    tabindex?: number;
}

interface TurnstileInstance {
    render: (
        container: string | HTMLElement,
        options: TurnstileRenderOptions,
    ) => string;
    reset: (widgetId?: string) => void;
    remove: (widgetId?: string) => void;
    getResponse: (widgetId?: string) => string | undefined;
}

interface Window {
    turnstile?: TurnstileInstance;
}
