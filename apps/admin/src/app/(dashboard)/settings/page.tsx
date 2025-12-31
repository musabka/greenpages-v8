'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Save,
  Globe,
  Phone,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  Palette,
  Bell,
  Shield,
  Loader2,
  PanelTop,
  PanelBottom,
  Search as SearchIcon,
  Upload,
  AlertTriangle,
  RefreshCw,
  Eye,
  Building2,
  Star,
  Send,
  MessageCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { useSettings, useUpdateSettings } from '@/lib/hooks';
import { uploadApi, type Setting } from '@/lib/api';
import toast from 'react-hot-toast';

interface FormDataType {
  [key: string]: {
    ar: string;
    en: string;
  };
}

// Setting groups configuration
const SETTING_GROUPS = [
  { id: 'general', label: 'الإعدادات العامة', icon: Globe, description: 'اسم الموقع والوصف واللغة' },
  { id: 'branding', label: 'الهوية البصرية', icon: ImageIcon, description: 'الشعار والأيقونة وصورة المشاركة' },
  { id: 'colors', label: 'الألوان', icon: Palette, description: 'ألوان الموقع الأساسية والثانوية' },
  { id: 'seo', label: 'تحسين محركات البحث', icon: SearchIcon, description: 'إعدادات SEO والتحليلات' },
  { id: 'header', label: 'الهيدر', icon: PanelTop, description: 'إعدادات رأس الصفحة' },
  { id: 'footer', label: 'الفوتر', icon: PanelBottom, description: 'إعدادات تذييل الصفحة' },
  { id: 'contact', label: 'التواصل', icon: Phone, description: 'معلومات الاتصال والعنوان' },
  { id: 'social', label: 'التواصل الاجتماعي', icon: Facebook, description: 'روابط منصات التواصل' },
  { id: 'business', label: 'الأنشطة التجارية', icon: Building2, description: 'إعدادات الأنشطة التجارية' },
  { id: 'reviews', label: 'التقييمات', icon: Star, description: 'إعدادات نظام التقييمات' },
  { id: 'notifications', label: 'الإشعارات', icon: Bell, description: 'إعدادات الإشعارات' },
  { id: 'security', label: 'الأمان', icon: Shield, description: 'إعدادات الأمان والتسجيل' },
  { id: 'maintenance', label: 'الصيانة', icon: AlertTriangle, description: 'وضع الصيانة' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState<FormDataType>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const { data: settings, isLoading, refetch } = useSettings();
  const updateSettings = useUpdateSettings();

  // Initialize form data from settings
  useEffect(() => {
    if (settings && Array.isArray(settings)) {
      const data: FormDataType = {};
      settings.forEach((setting: Setting) => {
        data[setting.key] = {
          ar: setting.valueAr || '',
          en: setting.valueEn || '',
        };
      });
      setFormData(data);
    }
  }, [settings]);

  const handleChange = useCallback((key: string, lang: 'ar' | 'en', value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [lang]: value,
      },
    }));
    setHasChanges(true);
  }, []);

  // Handle both AR and EN together (for colors, images, etc.)
  const handleChangeBoth = useCallback((key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: {
        ar: value,
        en: value,
      },
    }));
    setHasChanges(true);
  }, []);

  const handleSave = async () => {
    try {
      const settingsToUpdate = Object.entries(formData).map(([key, value]) => ({
        key,
        valueAr: value.ar || undefined,
        valueEn: value.en || undefined,
      }));
      await updateSettings.mutateAsync(settingsToUpdate);
      setHasChanges(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleImageUpload = async (key: string, file: File) => {
    setUploadingField(key);
    try {
      const response = await uploadApi.uploadImage(file, 'settings');
      handleChangeBoth(key, response.data.url);
      toast.success('تم رفع الصورة بنجاح');
    } catch (error) {
      toast.error('فشل في رفع الصورة');
    } finally {
      setUploadingField(null);
    }
  };

  const getValueAr = (key: string, defaultValue = '') => formData[key]?.ar ?? defaultValue;
  const getValueEn = (key: string, defaultValue = '') => formData[key]?.en ?? defaultValue;
  const getValue = (key: string, defaultValue = '') => formData[key]?.ar ?? defaultValue;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">جاري تحميل الإعدادات...</p>
        </div>
      </div>
    );
  }

  const renderTextField = (
    key: string,
    label: string,
    placeholder?: string,
    type: 'text' | 'email' | 'url' | 'tel' | 'number' = 'text',
    bilingual = true
  ) => (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {bilingual ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">عربي</label>
            <input
              type={type}
              className="input"
              placeholder={placeholder}
              value={getValueAr(key)}
              onChange={(e) => handleChange(key, 'ar', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">English</label>
            <input
              type={type}
              className="input"
              placeholder={placeholder}
              value={getValueEn(key)}
              onChange={(e) => handleChange(key, 'en', e.target.value)}
              dir="ltr"
            />
          </div>
        </div>
      ) : (
        <input
          type={type}
          className="input"
          placeholder={placeholder}
          value={getValue(key)}
          onChange={(e) => handleChangeBoth(key, e.target.value)}
          dir={type === 'url' || type === 'email' ? 'ltr' : 'rtl'}
        />
      )}
    </div>
  );

  const renderTextareaField = (key: string, label: string, rows = 3, bilingual = true) => (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {bilingual ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">عربي</label>
            <textarea
              className="input"
              rows={rows}
              value={getValueAr(key)}
              onChange={(e) => handleChange(key, 'ar', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">English</label>
            <textarea
              className="input"
              rows={rows}
              value={getValueEn(key)}
              onChange={(e) => handleChange(key, 'en', e.target.value)}
              dir="ltr"
            />
          </div>
        </div>
      ) : (
        <textarea
          className="input"
          rows={rows}
          value={getValue(key)}
          onChange={(e) => handleChangeBoth(key, e.target.value)}
        />
      )}
    </div>
  );

  const renderColorField = (key: string, label: string) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={getValue(key, '#16a34a')}
          onChange={(e) => handleChangeBoth(key, e.target.value)}
          className="w-12 h-12 rounded-lg cursor-pointer border border-gray-300"
        />
        <input
          type="text"
          className="input w-32"
          value={getValue(key, '#16a34a')}
          onChange={(e) => handleChangeBoth(key, e.target.value)}
          dir="ltr"
          placeholder="#000000"
        />
        <div
          className="w-12 h-12 rounded-lg border border-gray-300"
          style={{ backgroundColor: getValue(key, '#16a34a') }}
        />
      </div>
    </div>
  );

  const renderBooleanField = (key: string, label: string, description?: string) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={getValue(key) === 'true'}
          onChange={(e) => handleChangeBoth(key, e.target.checked ? 'true' : 'false')}
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
      </label>
    </div>
  );

  const renderSelectField = (key: string, label: string, options: { value: string; label: string }[], description?: string) => (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {description && <p className="text-xs text-gray-500 mb-2">{description}</p>}
      <select
        className="input"
        value={getValue(key)}
        onChange={(e) => handleChangeBoth(key, e.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  const renderImageField = (key: string, label: string, description?: string) => (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {description && <p className="text-xs text-gray-500">{description}</p>}
      <div className="flex items-start gap-4">
        <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden">
          {getValue(key) ? (
            <img
              src={getValue(key)}
              alt={label}
              className="w-full h-full object-contain"
            />
          ) : (
            <ImageIcon className="w-8 h-8 text-gray-400" />
          )}
        </div>
        <div className="flex-1 space-y-3">
          <input
            type="text"
            className="input"
            placeholder="رابط الصورة"
            value={getValue(key)}
            onChange={(e) => handleChangeBoth(key, e.target.value)}
            dir="ltr"
          />
          <div className="flex gap-2">
            <label className="btn btn-outline cursor-pointer">
              {uploadingField === key ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              رفع صورة
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(key, file);
                }}
                disabled={uploadingField === key}
              />
            </label>
            {getValue(key) && (
              <button
                type="button"
                className="btn btn-ghost text-red-600"
                onClick={() => handleChangeBoth(key, '')}
              >
                حذف
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">الإعدادات</h1>
          <p className="text-gray-500 mt-1">إعدادات النظام والتطبيق - جميع التغييرات تؤثر على الموقع مباشرة</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="btn btn-ghost"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
          <a
            href="http://localhost:3002"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
          >
            <Eye className="w-4 h-4" />
            معاينة الموقع
          </a>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!hasChanges || updateSettings.isPending}
          >
            {updateSettings.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            حفظ التغييرات
          </button>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <p className="text-amber-800">لديك تغييرات غير محفوظة. اضغط على "حفظ التغييرات" لتطبيقها.</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-72 shrink-0">
          <div className="card sticky top-24">
            <nav className="p-2">
              {SETTING_GROUPS.map((group) => {
                const Icon = group.icon;
                return (
                  <button
                    key={group.id}
                    onClick={() => setActiveTab(group.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-colors ${
                      activeTab === group.id
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <div className="flex-1 text-right">
                      <span className="block font-medium">{group.label}</span>
                      <span className="block text-xs text-gray-400 mt-0.5">{group.description}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary-600" />
                  الإعدادات العامة
                </h2>
              </div>
              <div className="card-body space-y-6">
                {renderTextField('site_name', 'اسم الموقع')}
                {renderTextField('site_tagline', 'الشعار النصي (Tagline)')}
                {renderTextareaField('site_description', 'وصف الموقع')}
                {renderTextField('site_url', 'رابط الموقع', 'https://greenpages.sy', 'url', false)}
                {renderSelectField('default_language', 'اللغة الافتراضية', [
                  { value: 'ar', label: 'العربية' },
                  { value: 'en', label: 'English' },
                ])}
                {renderTextField('timezone', 'المنطقة الزمنية', 'Asia/Damascus', 'text', false)}
              </div>
            </div>
          )}

          {/* Branding Settings */}
          {activeTab === 'branding' && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary-600" />
                  الهوية البصرية
                </h2>
              </div>
              <div className="card-body space-y-8">
                {renderImageField('logo', 'شعار الموقع', 'يفضل صورة PNG بخلفية شفافة بأبعاد 200x60 بكسل')}
                {renderImageField('logo_dark', 'شعار الوضع الداكن', 'للاستخدام على الخلفيات الداكنة')}
                {renderImageField('favicon', 'أيقونة الموقع (Favicon)', 'صورة مربعة بأبعاد 32x32 أو 64x64 بكسل')}
                {renderImageField('og_image', 'صورة المشاركة (Open Graph)', 'تظهر عند مشاركة الموقع على منصات التواصل - أبعاد 1200x630 بكسل')}
              </div>
            </div>
          )}

          {/* Colors Settings */}
          {activeTab === 'colors' && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary-600" />
                  ألوان الموقع
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  هذه الألوان ستطبق على جميع صفحات الموقع
                </p>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {renderColorField('color_primary', 'اللون الأساسي')}
                  {renderColorField('color_primary_light', 'اللون الأساسي الفاتح')}
                  {renderColorField('color_primary_dark', 'اللون الأساسي الداكن')}
                  {renderColorField('color_secondary', 'اللون الثانوي')}
                  {renderColorField('color_accent', 'لون التمييز')}
                </div>
                <hr className="my-6" />
                <h3 className="font-medium text-gray-900 mb-4">ألوان الهيدر والفوتر</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {renderColorField('color_header_bg', 'خلفية الهيدر')}
                  {renderColorField('color_header_text', 'نص الهيدر')}
                  {renderColorField('color_footer_bg', 'خلفية الفوتر')}
                  {renderColorField('color_footer_text', 'نص الفوتر')}
                </div>

                {/* Color Preview */}
                <div className="mt-8 p-6 bg-gray-50 rounded-xl">
                  <h4 className="font-medium text-gray-900 mb-4">معاينة الألوان</h4>
                  <div className="flex flex-wrap gap-3">
                    <button
                      className="px-4 py-2 rounded-lg text-white"
                      style={{ backgroundColor: getValue('color_primary', '#16a34a') }}
                    >
                      زر أساسي
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg text-white"
                      style={{ backgroundColor: getValue('color_secondary', '#0ea5e9') }}
                    >
                      زر ثانوي
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg text-white"
                      style={{ backgroundColor: getValue('color_accent', '#f59e0b') }}
                    >
                      زر مميز
                    </button>
                  </div>
                  <div className="mt-4 flex gap-4">
                    <div
                      className="flex-1 p-4 rounded-lg"
                      style={{
                        backgroundColor: getValue('color_header_bg', '#ffffff'),
                        color: getValue('color_header_text', '#111827'),
                      }}
                    >
                      معاينة الهيدر
                    </div>
                    <div
                      className="flex-1 p-4 rounded-lg"
                      style={{
                        backgroundColor: getValue('color_footer_bg', '#111827'),
                        color: getValue('color_footer_text', '#d1d5db'),
                      }}
                    >
                      معاينة الفوتر
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SEO Settings */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              <div className="card">
                <div className="card-header">
                  <h2 className="font-bold text-gray-900 flex items-center gap-2">
                    <SearchIcon className="w-5 h-5 text-primary-600" />
                    إعدادات تحسين محركات البحث (SEO)
                  </h2>
                </div>
                <div className="card-body space-y-6">
                  {renderTextField('seo_title_template', 'قالب عنوان الصفحة', '%s | الصفحات الخضراء')}
                  <p className="text-xs text-gray-500 -mt-4">استخدم %s للإشارة إلى عنوان الصفحة</p>
                  {renderTextField('seo_meta_title', 'عنوان الموقع الرئيسي (Meta Title)')}
                  {renderTextareaField('seo_meta_description', 'وصف الموقع (Meta Description)', 3)}
                  {renderTextareaField('seo_meta_keywords', 'الكلمات المفتاحية', 2)}
                  {renderSelectField('seo_robots', 'تعليمات الروبوتات', [
                    { value: 'index, follow', label: 'index, follow - السماح بالفهرسة والتتبع' },
                    { value: 'index, nofollow', label: 'index, nofollow - الفهرسة بدون تتبع' },
                    { value: 'noindex, follow', label: 'noindex, follow - التتبع بدون فهرسة' },
                    { value: 'noindex, nofollow', label: 'noindex, nofollow - منع الفهرسة والتتبع' },
                  ])}
                  {renderTextField('seo_canonical_url', 'الرابط الأساسي (Canonical URL)', 'https://greenpages.sy', 'url', false)}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h2 className="font-bold text-gray-900">التحقق والتحليلات</h2>
                </div>
                <div className="card-body space-y-6">
                  {renderTextField('seo_google_verification', 'كود التحقق من Google Search Console', '', 'text', false)}
                  {renderTextField('seo_bing_verification', 'كود التحقق من Bing Webmaster', '', 'text', false)}
                  {renderTextField('seo_google_analytics', 'معرف Google Analytics (GA4)', 'G-XXXXXXXXXX', 'text', false)}
                  {renderTextField('seo_google_tag_manager', 'معرف Google Tag Manager', 'GTM-XXXXXXX', 'text', false)}
                  {renderTextField('seo_facebook_pixel', 'معرف Facebook Pixel', '', 'text', false)}
                </div>
              </div>
            </div>
          )}

          {/* Header Settings */}
          {activeTab === 'header' && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <PanelTop className="w-5 h-5 text-primary-600" />
                  إعدادات الهيدر
                </h2>
              </div>
              <div className="card-body space-y-4">
                {renderBooleanField('header_sticky', 'تثبيت الهيدر عند التمرير', 'يبقى الهيدر ظاهراً في أعلى الصفحة')}
                {renderBooleanField('header_show_topbar', 'إظهار الشريط العلوي', 'الشريط الذي يحتوي على معلومات التواصل')}
                {renderTextField('header_topbar_text', 'نص الشريط العلوي')}
                {renderSelectField('header_logo_display', 'طريقة عرض الشعار', [
                  { value: 'logo_with_text', label: 'الشعار مع اسم الموقع والسلوجان' },
                  { value: 'logo_only', label: 'الشعار فقط' },
                  { value: 'text_only', label: 'اسم الموقع والسلوجان فقط' },
                ], 'اختر كيف يظهر الشعار في الهيدر')}
                {renderBooleanField('header_show_search', 'إظهار شريط البحث', 'شريط البحث في الهيدر')}
                {renderBooleanField('header_show_add_business', 'إظهار رابط إضافة نشاط', 'رابط "أضف نشاطك التجاري"')}
              </div>
            </div>
          )}

          {/* Footer Settings */}
          {activeTab === 'footer' && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <PanelBottom className="w-5 h-5 text-primary-600" />
                  إعدادات الفوتر
                </h2>
              </div>
              <div className="card-body space-y-6">
                {renderTextareaField('footer_description', 'وصف الفوتر')}
                {renderTextField('footer_copyright', 'نص حقوق النشر')}
                <p className="text-xs text-gray-500 -mt-4">استخدم {'{year}'} لإدراج السنة الحالية تلقائياً</p>
                {renderBooleanField('footer_show_newsletter', 'إظهار نموذج الاشتراك بالنشرة البريدية')}
                {renderTextField('footer_newsletter_title', 'عنوان النشرة البريدية')}
                {renderBooleanField('footer_show_payment_methods', 'إظهار طرق الدفع', 'عرض شعارات طرق الدفع المتاحة')}
              </div>
            </div>
          )}

          {/* Contact Settings */}
          {activeTab === 'contact' && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary-600" />
                  معلومات التواصل
                </h2>
              </div>
              <div className="card-body space-y-6">
                {renderTextField('contact_email', 'البريد الإلكتروني', 'info@greenpages.sy', 'email', false)}
                {renderTextField('contact_phone', 'رقم الهاتف', '+963 11 123 4567', 'tel', false)}
                {renderTextField('contact_mobile', 'رقم الجوال', '+963 999 123 456', 'tel', false)}
                {renderTextField('contact_whatsapp', 'رقم الواتساب', '+963999123456', 'tel', false)}
                {renderTextareaField('contact_address', 'العنوان', 2)}
                {renderTextField('contact_working_hours', 'ساعات العمل')}
                <div className="grid grid-cols-2 gap-4">
                  {renderTextField('contact_map_lat', 'خط العرض', '33.5138', 'text', false)}
                  {renderTextField('contact_map_lng', 'خط الطول', '36.2765', 'text', false)}
                </div>
              </div>
            </div>
          )}

          {/* Social Media Settings */}
          {activeTab === 'social' && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Facebook className="w-5 h-5 text-primary-600" />
                  روابط التواصل الاجتماعي
                </h2>
              </div>
              <div className="card-body space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Facebook className="w-4 h-4 text-blue-600" />
                      فيسبوك
                    </label>
                    <input
                      type="url"
                      className="input"
                      placeholder="https://facebook.com/greenpages"
                      value={getValue('social_facebook')}
                      onChange={(e) => handleChangeBoth('social_facebook', e.target.value)}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Instagram className="w-4 h-4 text-pink-600" />
                      إنستغرام
                    </label>
                    <input
                      type="url"
                      className="input"
                      placeholder="https://instagram.com/greenpages"
                      value={getValue('social_instagram')}
                      onChange={(e) => handleChangeBoth('social_instagram', e.target.value)}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Twitter className="w-4 h-4 text-sky-500" />
                      تويتر / X
                    </label>
                    <input
                      type="url"
                      className="input"
                      placeholder="https://x.com/greenpages"
                      value={getValue('social_twitter')}
                      onChange={(e) => handleChangeBoth('social_twitter', e.target.value)}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Youtube className="w-4 h-4 text-red-600" />
                      يوتيوب
                    </label>
                    <input
                      type="url"
                      className="input"
                      placeholder="https://youtube.com/@greenpages"
                      value={getValue('social_youtube')}
                      onChange={(e) => handleChangeBoth('social_youtube', e.target.value)}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Linkedin className="w-4 h-4 text-blue-700" />
                      لينكدإن
                    </label>
                    <input
                      type="url"
                      className="input"
                      placeholder="https://linkedin.com/company/greenpages"
                      value={getValue('social_linkedin')}
                      onChange={(e) => handleChangeBoth('social_linkedin', e.target.value)}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                      </svg>
                      تيك توك
                    </label>
                    <input
                      type="url"
                      className="input"
                      placeholder="https://tiktok.com/@greenpages"
                      value={getValue('social_tiktok')}
                      onChange={(e) => handleChangeBoth('social_tiktok', e.target.value)}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Send className="w-4 h-4 text-blue-500" />
                      تيليغرام
                    </label>
                    <input
                      type="url"
                      className="input"
                      placeholder="https://t.me/greenpages"
                      value={getValue('social_telegram')}
                      onChange={(e) => handleChangeBoth('social_telegram', e.target.value)}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-green-500" />
                      قناة واتساب
                    </label>
                    <input
                      type="url"
                      className="input"
                      placeholder="https://whatsapp.com/channel/..."
                      value={getValue('social_whatsapp_channel')}
                      onChange={(e) => handleChangeBoth('social_whatsapp_channel', e.target.value)}
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Business Settings */}
          {activeTab === 'business' && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary-600" />
                  إعدادات الأنشطة التجارية
                </h2>
              </div>
              <div className="card-body space-y-4">
                {renderBooleanField('business_auto_approve', 'الموافقة التلقائية على الأنشطة', 'قبول الأنشطة التجارية تلقائياً بدون مراجعة')}
                {renderBooleanField('business_require_verification', 'طلب التحقق من الأنشطة', 'يجب على الأنشطة تقديم وثائق للتحقق')}
                {renderTextField('business_max_images', 'الحد الأقصى للصور', '10', 'number', false)}
                {renderTextField('business_max_products', 'الحد الأقصى للمنتجات/الخدمات', '50', 'number', false)}
              </div>
            </div>
          )}

          {/* Review Settings */}
          {activeTab === 'reviews' && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary-600" />
                  إعدادات التقييمات
                </h2>
              </div>
              <div className="card-body space-y-4">
                {renderBooleanField('review_auto_approve', 'الموافقة التلقائية على التقييمات', 'نشر التقييمات مباشرة بدون مراجعة')}
                {renderBooleanField('review_require_login', 'طلب تسجيل الدخول للتقييم', 'يجب على المستخدم تسجيل الدخول لإضافة تقييم')}
                {renderTextField('review_min_length', 'الحد الأدنى لطول التقييم (حرف)', '10', 'number', false)}
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary-600" />
                  إعدادات الإشعارات
                </h2>
              </div>
              <div className="card-body space-y-4">
                {renderBooleanField('notification_email_enabled', 'تفعيل إشعارات البريد الإلكتروني', 'إرسال إشعارات للمدراء عبر البريد')}
                {renderBooleanField('notification_new_business', 'إشعار نشاط تجاري جديد', 'عند تسجيل نشاط تجاري جديد')}
                {renderBooleanField('notification_new_review', 'إشعار تقييم جديد', 'عند إضافة تقييم جديد')}
                {renderBooleanField('notification_new_contact', 'إشعار رسالة تواصل', 'عند استلام رسالة عبر نموذج التواصل')}
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary-600" />
                  إعدادات الأمان
                </h2>
              </div>
              <div className="card-body space-y-4">
                {renderBooleanField('security_registration_enabled', 'السماح بتسجيل حسابات جديدة', 'السماح للزوار بإنشاء حسابات')}
                {renderBooleanField('security_require_email_verification', 'طلب التحقق من البريد الإلكتروني', 'طلب تأكيد البريد عند التسجيل')}
                {renderBooleanField('security_require_phone_verification', 'طلب التحقق من رقم الهاتف', 'طلب تأكيد الهاتف عند التسجيل')}
                {renderTextField('security_session_timeout', 'مدة انتهاء الجلسة (بالدقائق)', '60', 'number', false)}
                {renderTextField('security_max_login_attempts', 'الحد الأقصى لمحاولات تسجيل الدخول الفاشلة', '5', 'number', false)}
              </div>
            </div>
          )}

          {/* Maintenance Settings */}
          {activeTab === 'maintenance' && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  وضع الصيانة
                </h2>
              </div>
              <div className="card-body space-y-6">
                <div className={`p-4 rounded-xl ${getValue('maintenance_mode') === 'true' ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
                  {renderBooleanField('maintenance_mode', 'تفعيل وضع الصيانة', 'عند التفعيل، سيظهر للزوار صفحة الصيانة فقط')}
                </div>
                {getValue('maintenance_mode') === 'true' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-amber-800 font-medium flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      تحذير: وضع الصيانة مفعل حالياً. الموقع غير متاح للزوار.
                    </p>
                  </div>
                )}
                {renderTextareaField('maintenance_message', 'رسالة الصيانة', 4)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
