import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Setting } from '@greenpages/database';

// Default settings with their metadata
const DEFAULT_SETTINGS = [
  // ==================== General Settings ====================
  { key: 'site_name', valueAr: 'الصفحات الخضراء', valueEn: 'Green Pages', type: 'text', group: 'general', isPublic: true, description: 'اسم الموقع' },
  { key: 'site_tagline', valueAr: 'دليل الأنشطة التجارية في سوريا', valueEn: 'Business Directory in Syria', type: 'text', group: 'general', isPublic: true, description: 'الشعار النصي للموقع' },
  { key: 'site_description', valueAr: 'الدليل التجاري الرقمي الأول والأشمل للأنشطة التجارية في سوريا', valueEn: 'The first and most comprehensive digital business directory in Syria', type: 'textarea', group: 'general', isPublic: true, description: 'وصف الموقع' },
  { key: 'site_url', valueAr: 'https://greenpages.sy', valueEn: 'https://greenpages.sy', type: 'text', group: 'general', isPublic: true, description: 'رابط الموقع' },
  { key: 'default_language', valueAr: 'ar', valueEn: 'ar', type: 'select', group: 'general', isPublic: true, description: 'اللغة الافتراضية' },
  { key: 'timezone', valueAr: 'Asia/Damascus', valueEn: 'Asia/Damascus', type: 'text', group: 'general', isPublic: false, description: 'المنطقة الزمنية' },

  // ==================== Branding Settings ====================
  { key: 'logo', valueAr: '', valueEn: '', type: 'image', group: 'branding', isPublic: true, description: 'شعار الموقع' },
  { key: 'logo_dark', valueAr: '', valueEn: '', type: 'image', group: 'branding', isPublic: true, description: 'شعار الموقع (الوضع الداكن)' },
  { key: 'favicon', valueAr: '', valueEn: '', type: 'image', group: 'branding', isPublic: true, description: 'أيقونة الموقع (Favicon)' },
  { key: 'og_image', valueAr: '', valueEn: '', type: 'image', group: 'branding', isPublic: true, description: 'صورة المشاركة الافتراضية (Open Graph)' },

  // ==================== Colors Settings ====================
  { key: 'color_primary', valueAr: '#16a34a', valueEn: '#16a34a', type: 'color', group: 'colors', isPublic: true, description: 'اللون الأساسي' },
  { key: 'color_primary_light', valueAr: '#22c55e', valueEn: '#22c55e', type: 'color', group: 'colors', isPublic: true, description: 'اللون الأساسي الفاتح' },
  { key: 'color_primary_dark', valueAr: '#15803d', valueEn: '#15803d', type: 'color', group: 'colors', isPublic: true, description: 'اللون الأساسي الداكن' },
  { key: 'color_secondary', valueAr: '#0ea5e9', valueEn: '#0ea5e9', type: 'color', group: 'colors', isPublic: true, description: 'اللون الثانوي' },
  { key: 'color_accent', valueAr: '#f59e0b', valueEn: '#f59e0b', type: 'color', group: 'colors', isPublic: true, description: 'لون التمييز' },
  { key: 'color_header_bg', valueAr: '#ffffff', valueEn: '#ffffff', type: 'color', group: 'colors', isPublic: true, description: 'لون خلفية الهيدر' },
  { key: 'color_header_text', valueAr: '#111827', valueEn: '#111827', type: 'color', group: 'colors', isPublic: true, description: 'لون نص الهيدر' },
  { key: 'color_footer_bg', valueAr: '#111827', valueEn: '#111827', type: 'color', group: 'colors', isPublic: true, description: 'لون خلفية الفوتر' },
  { key: 'color_footer_text', valueAr: '#d1d5db', valueEn: '#d1d5db', type: 'color', group: 'colors', isPublic: true, description: 'لون نص الفوتر' },

  // ==================== SEO Settings ====================
  { key: 'seo_title_template', valueAr: '%s | الصفحات الخضراء', valueEn: '%s | Green Pages', type: 'text', group: 'seo', isPublic: true, description: 'قالب عنوان الصفحة (%s = عنوان الصفحة)' },
  { key: 'seo_meta_title', valueAr: 'الصفحات الخضراء | دليل الأنشطة التجارية في سوريا', valueEn: 'Green Pages | Business Directory in Syria', type: 'text', group: 'seo', isPublic: true, description: 'عنوان الموقع الرئيسي للبحث' },
  { key: 'seo_meta_description', valueAr: 'الدليل التجاري الرقمي الأول والأشمل للأنشطة التجارية في سوريا. ابحث عن الشركات، المطاعم، الخدمات والمزيد.', valueEn: 'The first and most comprehensive digital business directory in Syria. Search for companies, restaurants, services and more.', type: 'textarea', group: 'seo', isPublic: true, description: 'وصف الموقع للبحث' },
  { key: 'seo_meta_keywords', valueAr: 'دليل تجاري، سوريا، شركات، أنشطة تجارية، مطاعم، خدمات، الصفحات الخضراء', valueEn: 'business directory, syria, companies, businesses, restaurants, services, green pages', type: 'textarea', group: 'seo', isPublic: true, description: 'الكلمات المفتاحية' },
  { key: 'seo_google_verification', valueAr: '', valueEn: '', type: 'text', group: 'seo', isPublic: true, description: 'كود التحقق من Google Search Console' },
  { key: 'seo_bing_verification', valueAr: '', valueEn: '', type: 'text', group: 'seo', isPublic: true, description: 'كود التحقق من Bing Webmaster' },
  { key: 'seo_google_analytics', valueAr: '', valueEn: '', type: 'text', group: 'seo', isPublic: true, description: 'معرف Google Analytics (GA4)' },
  { key: 'seo_google_tag_manager', valueAr: '', valueEn: '', type: 'text', group: 'seo', isPublic: true, description: 'معرف Google Tag Manager' },
  { key: 'seo_facebook_pixel', valueAr: '', valueEn: '', type: 'text', group: 'seo', isPublic: true, description: 'معرف Facebook Pixel' },
  { key: 'seo_robots', valueAr: 'index, follow', valueEn: 'index, follow', type: 'select', group: 'seo', isPublic: true, description: 'تعليمات الروبوتات' },
  { key: 'seo_canonical_url', valueAr: 'https://greenpages.sy', valueEn: 'https://greenpages.sy', type: 'text', group: 'seo', isPublic: true, description: 'الرابط الأساسي (Canonical)' },

  // ==================== Header Settings ====================
  { key: 'header_show_topbar', valueAr: 'true', valueEn: 'true', type: 'boolean', group: 'header', isPublic: true, description: 'إظهار الشريط العلوي' },
  { key: 'header_topbar_text', valueAr: 'مرحباً بكم في الصفحات الخضراء', valueEn: 'Welcome to Green Pages', type: 'text', group: 'header', isPublic: true, description: 'نص الشريط العلوي' },
  { key: 'header_logo_display', valueAr: 'logo_with_text', valueEn: 'logo_with_text', type: 'select', group: 'header', isPublic: true, description: 'طريقة عرض الشعار (logo_only: الشعار فقط، text_only: النص فقط، logo_with_text: الشعار مع النص)' },
  { key: 'header_show_search', valueAr: 'true', valueEn: 'true', type: 'boolean', group: 'header', isPublic: true, description: 'إظهار شريط البحث' },
  { key: 'header_show_add_business', valueAr: 'true', valueEn: 'true', type: 'boolean', group: 'header', isPublic: true, description: 'إظهار رابط إضافة نشاط' },
  { key: 'header_sticky', valueAr: 'true', valueEn: 'true', type: 'boolean', group: 'header', isPublic: true, description: 'تثبيت الهيدر عند التمرير' },

  // ==================== Footer Settings ====================
  { key: 'footer_description', valueAr: 'الدليل التجاري الرقمي الأول والأشمل للأنشطة التجارية في سوريا. نساعدك في الوصول إلى آلاف الشركات والخدمات في جميع المحافظات السورية.', valueEn: 'The first and most comprehensive digital business directory in Syria. We help you reach thousands of companies and services in all Syrian governorates.', type: 'textarea', group: 'footer', isPublic: true, description: 'وصف الفوتر' },
  { key: 'footer_copyright', valueAr: '© {year} الصفحات الخضراء. جميع الحقوق محفوظة.', valueEn: '© {year} Green Pages. All rights reserved.', type: 'text', group: 'footer', isPublic: true, description: 'نص حقوق النشر ({year} = السنة الحالية)' },
  { key: 'footer_show_newsletter', valueAr: 'true', valueEn: 'true', type: 'boolean', group: 'footer', isPublic: true, description: 'إظهار نموذج الاشتراك بالنشرة' },
  { key: 'footer_newsletter_title', valueAr: 'اشترك في نشرتنا البريدية', valueEn: 'Subscribe to our newsletter', type: 'text', group: 'footer', isPublic: true, description: 'عنوان النشرة البريدية' },
  { key: 'footer_show_payment_methods', valueAr: 'false', valueEn: 'false', type: 'boolean', group: 'footer', isPublic: true, description: 'إظهار طرق الدفع' },

  // ==================== Contact Settings ====================
  { key: 'contact_email', valueAr: 'info@greenpages.sy', valueEn: 'info@greenpages.sy', type: 'email', group: 'contact', isPublic: true, description: 'البريد الإلكتروني' },
  { key: 'contact_phone', valueAr: '+963 11 123 4567', valueEn: '+963 11 123 4567', type: 'tel', group: 'contact', isPublic: true, description: 'رقم الهاتف' },
  { key: 'contact_mobile', valueAr: '+963 999 123 456', valueEn: '+963 999 123 456', type: 'tel', group: 'contact', isPublic: true, description: 'رقم الجوال' },
  { key: 'contact_whatsapp', valueAr: '+963999123456', valueEn: '+963999123456', type: 'tel', group: 'contact', isPublic: true, description: 'رقم الواتساب' },
  { key: 'contact_address', valueAr: 'دمشق، سوريا', valueEn: 'Damascus, Syria', type: 'textarea', group: 'contact', isPublic: true, description: 'العنوان' },
  { key: 'contact_map_lat', valueAr: '33.5138', valueEn: '33.5138', type: 'text', group: 'contact', isPublic: true, description: 'خط العرض' },
  { key: 'contact_map_lng', valueAr: '36.2765', valueEn: '36.2765', type: 'text', group: 'contact', isPublic: true, description: 'خط الطول' },
  { key: 'contact_working_hours', valueAr: 'السبت - الخميس: 9:00 ص - 6:00 م', valueEn: 'Sat - Thu: 9:00 AM - 6:00 PM', type: 'text', group: 'contact', isPublic: true, description: 'ساعات العمل' },

  // ==================== Social Media Settings ====================
  { key: 'social_facebook', valueAr: '', valueEn: '', type: 'url', group: 'social', isPublic: true, description: 'رابط فيسبوك' },
  { key: 'social_instagram', valueAr: '', valueEn: '', type: 'url', group: 'social', isPublic: true, description: 'رابط إنستغرام' },
  { key: 'social_twitter', valueAr: '', valueEn: '', type: 'url', group: 'social', isPublic: true, description: 'رابط تويتر/X' },
  { key: 'social_youtube', valueAr: '', valueEn: '', type: 'url', group: 'social', isPublic: true, description: 'رابط يوتيوب' },
  { key: 'social_linkedin', valueAr: '', valueEn: '', type: 'url', group: 'social', isPublic: true, description: 'رابط لينكدإن' },
  { key: 'social_tiktok', valueAr: '', valueEn: '', type: 'url', group: 'social', isPublic: true, description: 'رابط تيك توك' },
  { key: 'social_telegram', valueAr: '', valueEn: '', type: 'url', group: 'social', isPublic: true, description: 'رابط تيليغرام' },
  { key: 'social_whatsapp_channel', valueAr: '', valueEn: '', type: 'url', group: 'social', isPublic: true, description: 'رابط قناة واتساب' },

  // ==================== Business Settings ====================
  { key: 'business_auto_approve', valueAr: 'false', valueEn: 'false', type: 'boolean', group: 'business', isPublic: false, description: 'الموافقة التلقائية على الأنشطة' },
  { key: 'business_require_verification', valueAr: 'true', valueEn: 'true', type: 'boolean', group: 'business', isPublic: false, description: 'طلب التحقق من الأنشطة' },
  { key: 'business_max_images', valueAr: '10', valueEn: '10', type: 'number', group: 'business', isPublic: true, description: 'الحد الأقصى للصور' },
  { key: 'business_max_products', valueAr: '50', valueEn: '50', type: 'number', group: 'business', isPublic: true, description: 'الحد الأقصى للمنتجات' },

  // ==================== Review Settings ====================
  { key: 'review_auto_approve', valueAr: 'false', valueEn: 'false', type: 'boolean', group: 'reviews', isPublic: false, description: 'الموافقة التلقائية على التقييمات' },
  { key: 'review_require_login', valueAr: 'true', valueEn: 'true', type: 'boolean', group: 'reviews', isPublic: true, description: 'طلب تسجيل الدخول للتقييم' },
  { key: 'review_min_length', valueAr: '10', valueEn: '10', type: 'number', group: 'reviews', isPublic: true, description: 'الحد الأدنى لطول التقييم' },

  // ==================== Security Settings ====================
  { key: 'security_registration_enabled', valueAr: 'true', valueEn: 'true', type: 'boolean', group: 'security', isPublic: true, description: 'السماح بالتسجيل' },
  { key: 'security_require_email_verification', valueAr: 'true', valueEn: 'true', type: 'boolean', group: 'security', isPublic: false, description: 'طلب تأكيد البريد' },
  { key: 'security_require_phone_verification', valueAr: 'false', valueEn: 'false', type: 'boolean', group: 'security', isPublic: false, description: 'طلب تأكيد الهاتف' },
  { key: 'security_session_timeout', valueAr: '60', valueEn: '60', type: 'number', group: 'security', isPublic: false, description: 'مدة الجلسة بالدقائق' },
  { key: 'security_max_login_attempts', valueAr: '5', valueEn: '5', type: 'number', group: 'security', isPublic: false, description: 'الحد الأقصى لمحاولات الدخول' },

  // ==================== Notification Settings ====================
  { key: 'notification_email_enabled', valueAr: 'true', valueEn: 'true', type: 'boolean', group: 'notifications', isPublic: false, description: 'تفعيل إشعارات البريد' },
  { key: 'notification_new_business', valueAr: 'true', valueEn: 'true', type: 'boolean', group: 'notifications', isPublic: false, description: 'إشعار نشاط تجاري جديد' },
  { key: 'notification_new_review', valueAr: 'true', valueEn: 'true', type: 'boolean', group: 'notifications', isPublic: false, description: 'إشعار تقييم جديد' },
  { key: 'notification_new_contact', valueAr: 'true', valueEn: 'true', type: 'boolean', group: 'notifications', isPublic: false, description: 'إشعار رسالة تواصل' },

  // ==================== Maintenance Settings ====================
  { key: 'maintenance_mode', valueAr: 'false', valueEn: 'false', type: 'boolean', group: 'maintenance', isPublic: true, description: 'وضع الصيانة' },
  { key: 'maintenance_message', valueAr: 'الموقع تحت الصيانة. سنعود قريباً!', valueEn: 'Site is under maintenance. We will be back soon!', type: 'textarea', group: 'maintenance', isPublic: true, description: 'رسالة الصيانة' },
];

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultSettings();
  }

  // Seed default settings on startup
  async seedDefaultSettings() {
    for (const setting of DEFAULT_SETTINGS) {
      const existing = await this.prisma.setting.findUnique({
        where: { key: setting.key },
      });
      if (!existing) {
        await this.prisma.setting.create({ data: setting });
      }
    }
  }

  async findAll(group?: string, publicOnly?: boolean) {
    const where: any = {};
    if (group) where.group = group;
    if (publicOnly) where.isPublic = true;

    return this.prisma.setting.findMany({ where, orderBy: [{ group: 'asc' }, { key: 'asc' }] });
  }

  async findByKey(key: string): Promise<Setting | null> {
    return this.prisma.setting.findUnique({ where: { key } });
  }

  async getPublicSettings() {
    const settings = await this.prisma.setting.findMany({ where: { isPublic: true } });
    const result: Record<string, { ar: string | null; en: string | null; type: string }> = {};
    for (const s of settings) {
      result[s.key] = { ar: s.valueAr, en: s.valueEn, type: s.type };
    }
    return result;
  }

  async getSettingsByGroup(group: string) {
    return this.prisma.setting.findMany({
      where: { group },
      orderBy: { key: 'asc' },
    });
  }

  async update(key: string, data: { valueAr?: string; valueEn?: string }): Promise<Setting> {
    const setting = await this.findByKey(key);
    if (!setting) throw new NotFoundException('الإعداد غير موجود');
    return this.prisma.setting.update({ where: { key }, data });
  }

  async upsert(key: string, data: any): Promise<Setting> {
    // Find the default setting metadata
    const defaultSetting = DEFAULT_SETTINGS.find(s => s.key === key);
    const createData = defaultSetting
      ? { ...defaultSetting, ...data }
      : { key, type: 'text', group: 'general', isPublic: false, ...data };

    return this.prisma.setting.upsert({
      where: { key },
      update: { valueAr: data.valueAr, valueEn: data.valueEn },
      create: createData,
    });
  }

  async bulkUpdate(settings: { key: string; valueAr?: string; valueEn?: string }[]): Promise<void> {
    await Promise.all(settings.map((s) => this.upsert(s.key, s)));
  }

  // Get settings formatted for frontend consumption
  async getSettingsForFrontend(lang: 'ar' | 'en' = 'ar') {
    const settings = await this.prisma.setting.findMany({ where: { isPublic: true } });
    const result: Record<string, string | null> = {};
    for (const s of settings) {
      result[s.key] = lang === 'ar' ? s.valueAr : s.valueEn;
    }
    return result;
  }

  // Get CSS variables for dynamic colors
  async getColorVariables() {
    const colorSettings = await this.prisma.setting.findMany({
      where: { group: 'colors' },
    });
    const colors: Record<string, string> = {};
    for (const s of colorSettings) {
      colors[s.key] = s.valueAr || s.valueEn || '';
    }
    return colors;
  }
}
