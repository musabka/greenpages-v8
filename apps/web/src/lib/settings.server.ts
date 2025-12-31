/**
 * Server-Side Settings Fetcher
 * هذا الملف مسؤول عن جلب الإعدادات من الخادم
 * يُستخدم في Server Components فقط
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';

export interface SettingValue {
  ar: string | null;
  en: string | null;
  type?: string;
}

export interface ServerSettings {
  [key: string]: SettingValue;
}

// Cache settings for 60 seconds to avoid too many API calls
let cachedSettings: ServerSettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 1000; // 60 seconds

/**
 * Fetch settings from the API server-side
 * This function is called in Server Components
 */
export async function getServerSettings(): Promise<ServerSettings> {
  const now = Date.now();
  
  // Return cached settings if still valid
  if (cachedSettings && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedSettings;
  }

  try {
    const response = await fetch(`${API_URL}/api/${API_VERSION}/settings/public`, {
      next: { revalidate: 60 }, // Revalidate every 60 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch settings:', response.status);
      return getDefaultSettings();
    }

    const data = await response.json();
    cachedSettings = data;
    cacheTimestamp = now;
    
    return data;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return getDefaultSettings();
  }
}

/**
 * Get a specific setting value
 */
export function getSetting(
  settings: ServerSettings,
  key: string,
  lang: 'ar' | 'en' = 'ar',
  fallback: string = ''
): string {
  const setting = settings[key];
  if (!setting) return fallback;
  
  const value = lang === 'ar' ? setting.ar : setting.en;
  return value || setting.ar || setting.en || fallback;
}

/**
 * Get a boolean setting
 */
export function getSettingBool(settings: ServerSettings, key: string): boolean {
  const setting = settings[key];
  if (!setting) return false;
  
  const value = setting.ar || setting.en;
  return value === 'true' || value === '1';
}

/**
 * Generate CSS variables from color settings
 */
export function generateCssVariables(settings: ServerSettings): string {
  const colorMappings: Record<string, string> = {
    'color_primary': '--color-primary',
    'color_primary_light': '--color-primary-light',
    'color_primary_dark': '--color-primary-dark',
    'color_secondary': '--color-secondary',
    'color_accent': '--color-accent',
    'color_header_bg': '--color-header-bg',
    'color_header_text': '--color-header-text',
    'color_footer_bg': '--color-footer-bg',
    'color_footer_text': '--color-footer-text',
  };

  const cssVars: string[] = [];
  
  for (const [settingKey, cssVar] of Object.entries(colorMappings)) {
    const value = getSetting(settings, settingKey);
    if (value) {
      cssVars.push(`${cssVar}: ${value};`);
    }
  }

  return cssVars.join('\n    ');
}

/**
 * Default settings fallback
 */
function getDefaultSettings(): ServerSettings {
  return {
    // General
    site_name: { ar: 'الصفحات الخضراء', en: 'Green Pages' },
    site_tagline: { ar: 'دليل الأنشطة التجارية في سوريا', en: 'Business Directory in Syria' },
    site_description: { ar: 'الدليل التجاري الرقمي الأول والأشمل للأنشطة التجارية في سوريا', en: 'The first and most comprehensive digital business directory in Syria' },
    site_url: { ar: 'https://greenpages.sy', en: 'https://greenpages.sy' },
    
    // Branding
    logo: { ar: '', en: '' },
    logo_dark: { ar: '', en: '' },
    favicon: { ar: '/favicon.ico', en: '/favicon.ico' },
    
    // Colors
    color_primary: { ar: '#16a34a', en: '#16a34a' },
    color_primary_light: { ar: '#22c55e', en: '#22c55e' },
    color_primary_dark: { ar: '#15803d', en: '#15803d' },
    color_secondary: { ar: '#0ea5e9', en: '#0ea5e9' },
    color_accent: { ar: '#f59e0b', en: '#f59e0b' },
    color_header_bg: { ar: '#ffffff', en: '#ffffff' },
    color_header_text: { ar: '#111827', en: '#111827' },
    color_footer_bg: { ar: '#111827', en: '#111827' },
    color_footer_text: { ar: '#d1d5db', en: '#d1d5db' },
    
    // Header
    header_show_topbar: { ar: 'true', en: 'true' },
    header_topbar_text: { ar: '', en: '' },
    header_logo_display: { ar: 'logo_with_text', en: 'logo_with_text' },
    header_show_search: { ar: 'true', en: 'true' },
    header_show_add_business: { ar: 'true', en: 'true' },
    header_sticky: { ar: 'true', en: 'true' },
    
    // Footer
    footer_description: { ar: 'الدليل التجاري الرقمي الأول والأشمل للأنشطة التجارية في سوريا', en: 'The first and most comprehensive digital business directory in Syria' },
    footer_copyright: { ar: '© {year} الصفحات الخضراء. جميع الحقوق محفوظة.', en: '© {year} Green Pages. All rights reserved.' },
    footer_show_newsletter: { ar: 'true', en: 'true' },
    footer_newsletter_title: { ar: 'اشترك في نشرتنا البريدية', en: 'Subscribe to our newsletter' },
    
    // Contact
    contact_email: { ar: 'info@greenpages.sy', en: 'info@greenpages.sy' },
    contact_phone: { ar: '+963 11 123 4567', en: '+963 11 123 4567' },
    contact_mobile: { ar: '+963 999 123 456', en: '+963 999 123 456' },
    contact_whatsapp: { ar: '+963999123456', en: '+963999123456' },
    contact_address: { ar: 'دمشق، سوريا', en: 'Damascus, Syria' },
    contact_working_hours: { ar: 'السبت - الخميس: 9:00 ص - 6:00 م', en: 'Sat - Thu: 9:00 AM - 6:00 PM' },
    
    // Social
    social_facebook: { ar: '', en: '' },
    social_instagram: { ar: '', en: '' },
    social_twitter: { ar: '', en: '' },
    social_youtube: { ar: '', en: '' },
    social_linkedin: { ar: '', en: '' },
    social_tiktok: { ar: '', en: '' },
    social_telegram: { ar: '', en: '' },
    
    // SEO
    seo_google_analytics: { ar: '', en: '' },
    seo_google_tag_manager: { ar: '', en: '' },
    seo_facebook_pixel: { ar: '', en: '' },
    
    // Maintenance
    maintenance_mode: { ar: 'false', en: 'false' },
    maintenance_message: { ar: '', en: '' },
    
    // Reviews
    review_require_login: { ar: 'true', en: 'true' },
    
    // Security
    security_registration_enabled: { ar: 'true', en: 'true' },
  };
}
