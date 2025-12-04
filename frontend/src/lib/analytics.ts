/**
 * BizTrackr V2 - Analytics Helper Module
 * Google Analytics 4 (GA4) + Google Tag Manager (GTM) Integration
 * 
 * This module provides reusable functions for tracking events, pageviews,
 * and custom BizTrackr-specific actions across the application.
 */

// Extend Window interface for TypeScript
declare global {
    interface Window {
        dataLayer: any[];
        gtag: (...args: any[]) => void;
    }
}

// GA4 Measurement ID
export const GA_MEASUREMENT_ID = 'G-GW8N42TF9G';

// GTM Container ID (replace with your actual GTM ID)
export const GTM_ID = 'GTM-XXXXXXX';

/**
 * Initialize dataLayer if not exists
 */
export const initializeDataLayer = (): void => {
    window.dataLayer = window.dataLayer || [];
};

/**
 * gtag helper function
 */
export function gtag(...args: any[]): void {
    if (typeof window !== 'undefined') {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(arguments);
    }
}

/**
 * Track a pageview
 * @param url - The page URL to track
 */
export const trackPageView = (url: string): void => {
    if (typeof window.gtag !== 'undefined') {
        window.gtag('config', GA_MEASUREMENT_ID, {
            page_path: url,
        });
    }
};

/**
 * Track a custom event
 * @param eventName - Name of the event
 * @param params - Event parameters
 */
export const trackEvent = (
    eventName: string,
    params?: Record<string, any>
): void => {
    if (typeof window.gtag !== 'undefined') {
        window.gtag('event', eventName, params);
    }
};

// ==========================================
// BIZTRACKR SPECIFIC EVENT TRACKING
// ==========================================

/**
 * Track when inventory is added
 */
export const trackInventoryAdded = (data: {
    item: string;
    quantity: number;
    value?: number;
    category?: string;
}): void => {
    trackEvent('inventory_added', {
        item_name: data.item,
        quantity: data.quantity,
        value: data.value,
        category: data.category,
        event_category: 'Inventory',
        event_label: data.item,
    });
};

/**
 * Track when a sale is created
 */
export const trackSaleCreated = (data: {
    saleId: string;
    amount: number;
    currency?: string;
    customer?: string;
    items?: number;
}): void => {
    trackEvent('sale_created', {
        transaction_id: data.saleId,
        value: data.amount,
        currency: data.currency || 'INR',
        customer_name: data.customer,
        num_items: data.items,
        event_category: 'Sales',
        event_label: `Sale ${data.saleId}`,
    });
};

/**
 * Track when an invoice is generated
 */
export const trackInvoiceGenerated = (data: {
    invoiceId: string;
    amount: number;
    customer: string;
    format?: string;
}): void => {
    trackEvent('invoice_generated', {
        invoice_id: data.invoiceId,
        value: data.amount,
        customer_name: data.customer,
        format: data.format || 'PDF',
        event_category: 'Invoicing',
        event_label: `Invoice ${data.invoiceId}`,
    });
};

/**
 * Track when a customer is added
 */
export const trackCustomerAdded = (data: {
    customerId?: string;
    customerName: string;
    customerType?: string;
}): void => {
    trackEvent('customer_added', {
        customer_id: data.customerId,
        customer_name: data.customerName,
        customer_type: data.customerType,
        event_category: 'CRM',
        event_label: data.customerName,
    });
};

/**
 * Track when a report is exported
 */
export const trackReportExported = (data: {
    reportType: string;
    format: string;
    dateRange?: string;
}): void => {
    trackEvent('report_exported', {
        report_type: data.reportType,
        export_format: data.format,
        date_range: data.dateRange,
        event_category: 'Reports',
        event_label: `${data.reportType} - ${data.format}`,
    });
};

/**
 * Track when Pro upgrade is clicked
 */
export const trackProUpgradeClicked = (data?: {
    source?: string;
    plan?: string;
    price?: number;
}): void => {
    trackEvent('pro_upgrade_clicked', {
        source: data?.source || 'unknown',
        plan_name: data?.plan,
        price: data?.price,
        event_category: 'Conversion',
        event_label: 'Pro Upgrade CTA',
    });
};

/**
 * Track user signup/registration
 */
export const trackUserSignup = (data: {
    method?: string;
    userId?: string;
}): void => {
    trackEvent('sign_up', {
        method: data.method || 'email',
        user_id: data.userId,
        event_category: 'Authentication',
        event_label: 'User Signup',
    });
};

/**
 * Track user login
 */
export const trackUserLogin = (data: {
    method?: string;
    userId?: string;
}): void => {
    trackEvent('login', {
        method: data.method || 'email',
        user_id: data.userId,
        event_category: 'Authentication',
        event_label: 'User Login',
    });
};

/**
 * Track search queries
 */
export const trackSearch = (searchTerm: string, resultCount?: number): void => {
    trackEvent('search', {
        search_term: searchTerm,
        result_count: resultCount,
        event_category: 'Site Search',
        event_label: searchTerm,
    });
};

/**
 * Track outbound link clicks
 */
export const trackOutboundLink = (url: string, linkText?: string): void => {
    trackEvent('click', {
        event_category: 'Outbound Link',
        event_label: url,
        link_text: linkText,
        link_url: url,
    });
};

/**
 * Track file downloads
 */
export const trackFileDownload = (
    fileName: string,
    fileType: string
): void => {
    trackEvent('file_download', {
        file_name: fileName,
        file_type: fileType,
        event_category: 'Downloads',
        event_label: fileName,
    });
};

/**
 * Track scroll depth
 */
export const trackScrollDepth = (percentage: number): void => {
    trackEvent('scroll', {
        percent_scrolled: percentage,
        event_category: 'Engagement',
        event_label: `${percentage}%`,
    });
};

/**
 * Track form submissions
 */
export const trackFormSubmission = (formName: string, success: boolean): void => {
    trackEvent('form_submit', {
        form_name: formName,
        success: success,
        event_category: 'Forms',
        event_label: formName,
    });
};

/**
 * Track errors/exceptions
 */
export const trackError = (
    errorMessage: string,
    errorType?: string,
    fatal?: boolean
): void => {
    trackEvent('exception', {
        description: errorMessage,
        error_type: errorType,
        fatal: fatal || false,
        event_category: 'Errors',
        event_label: errorMessage,
    });
};

/**
 * Set user properties (for logged-in users)
 */
export const setUserProperties = (properties: {
    userId?: string;
    userRole?: string;
    plan?: string;
    tenantId?: string;
}): void => {
    if (typeof window.gtag !== 'undefined') {
        window.gtag('set', 'user_properties', {
            user_id: properties.userId,
            user_role: properties.userRole,
            subscription_plan: properties.plan,
            tenant_id: properties.tenantId,
        });
    }
};

/**
 * Track timing/performance
 */
export const trackTiming = (data: {
    name: string;
    value: number;
    category?: string;
    label?: string;
}): void => {
    trackEvent('timing_complete', {
        name: data.name,
        value: data.value,
        event_category: data.category || 'Performance',
        event_label: data.label,
    });
};

// ==========================================
// CONVENIENCE FUNCTIONS
// ==========================================

/**
 * Track any general action with metadata
 */
export const trackAction = (
    actionType: string,
    metadata?: Record<string, any>
): void => {
    trackEvent(actionType, {
        action_type: actionType,
        ...metadata,
        timestamp: new Date().toISOString(),
    });
};

/**
 * Enable/disable analytics (for GDPR compliance)
 */
export const setAnalyticsConsent = (granted: boolean): void => {
    if (typeof window.gtag !== 'undefined') {
        window.gtag('consent', 'update', {
            analytics_storage: granted ? 'granted' : 'denied',
            ad_storage: granted ? 'granted' : 'denied',
        });
    }
};

// ==========================================
// DEBUG HELPERS
// ==========================================

/**
 * Check if analytics is loaded
 */
export const isAnalyticsReady = (): boolean => {
    return typeof window !== 'undefined' && typeof window.gtag !== 'undefined';
};

/**
 * Log analytics status (development only)
 */
export const logAnalyticsStatus = (): void => {
    if (process.env.NODE_ENV === 'development') {
        console.log('Analytics Status:', {
            gtagLoaded: typeof window.gtag !== 'undefined',
            dataLayerExists: Array.isArray(window.dataLayer),
            dataLayerLength: window.dataLayer?.length || 0,
            measurementId: GA_MEASUREMENT_ID,
            gtmId: GTM_ID,
        });
    }
};

export default {
    trackPageView,
    trackEvent,
    trackInventoryAdded,
    trackSaleCreated,
    trackInvoiceGenerated,
    trackCustomerAdded,
    trackReportExported,
    trackProUpgradeClicked,
    trackAction,
    setUserProperties,
    setAnalyticsConsent,
    isAnalyticsReady,
};
