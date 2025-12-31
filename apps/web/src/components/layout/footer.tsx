'use client';

import Link from 'next/link';
import { Facebook, Instagram, Twitter, Youtube, Linkedin, Send, Phone, Mail, MapPin, Clock } from 'lucide-react';
import { useSettings } from '@/components/settings-context';

export function Footer() {
  const { getSetting, getSettingBool } = useSettings();

  // Get settings - already loaded from server
  const siteName = getSetting('site_name', 'ar', 'الصفحات الخضراء');
  const footerDescription = getSetting('footer_description', 'ar', 'الدليل التجاري الرقمي الأول والأشمل للأنشطة التجارية في سوريا');
  const copyright = getSetting('footer_copyright', 'ar', '© {year} الصفحات الخضراء. جميع الحقوق محفوظة.')
    .replace('{year}', new Date().getFullYear().toString());
  const showNewsletter = getSettingBool('footer_show_newsletter');
  const newsletterTitle = getSetting('footer_newsletter_title', 'ar', 'اشترك في نشرتنا البريدية');
  
  // Contact info
  const contactEmail = getSetting('contact_email', 'ar', 'info@greenpages.sy');
  const contactPhone = getSetting('contact_phone', 'ar', '+963 11 123 4567');
  const contactAddress = getSetting('contact_address', 'ar', 'دمشق، سوريا');
  const workingHours = getSetting('contact_working_hours', 'ar', 'السبت - الخميس: 9:00 ص - 6:00 م');
  
  // Social links
  const socialLinks = [
    { name: 'Facebook', icon: Facebook, url: getSetting('social_facebook') },
    { name: 'Instagram', icon: Instagram, url: getSetting('social_instagram') },
    { name: 'Twitter', icon: Twitter, url: getSetting('social_twitter') },
    { name: 'YouTube', icon: Youtube, url: getSetting('social_youtube') },
    { name: 'LinkedIn', icon: Linkedin, url: getSetting('social_linkedin') },
    { name: 'Telegram', icon: Send, url: getSetting('social_telegram') },
  ].filter(link => link.url);

  const quickLinks = [
    { name: 'الرئيسية', href: '/' },
    { name: 'التصنيفات', href: '/categories' },
    { name: 'البحث', href: '/search' },
    { name: 'الخريطة', href: '/map' },
  ];

  const helpLinks = [
    { name: 'من نحن', href: '/about' },
    { name: 'تواصل معنا', href: '/contact' },
    { name: 'سياسة الخصوصية', href: '/privacy' },
    { name: 'الشروط والأحكام', href: '/terms' },
  ];

  return (
    <footer 
      className="text-gray-300 pt-16 pb-8"
      style={{ 
        backgroundColor: 'var(--color-footer-bg, #111827)',
        color: 'var(--color-footer-text, #d1d5db)'
      }}
    >
      <div className="container">
        {/* Newsletter Section */}
        {showNewsletter && (
          <div 
            className="rounded-2xl p-8 mb-12 text-center"
            style={{ backgroundColor: 'var(--color-primary, #16a34a)' }}
          >
            <h3 className="text-2xl font-bold text-white mb-2">{newsletterTitle}</h3>
            <p className="text-white/80 mb-6">احصل على آخر الأخبار والعروض الحصرية</p>
            <form className="max-w-md mx-auto flex gap-2">
              <input
                type="email"
                placeholder="بريدك الإلكتروني"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
                dir="ltr"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-white rounded-lg font-semibold transition-colors"
                style={{ color: 'var(--color-primary, #16a34a)' }}
              >
                اشترك
              </button>
            </form>
          </div>
        )}

        {/* Main Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* About Section */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-primary, #16a34a)' }}
              >
                <span className="text-white font-bold">ص</span>
              </div>
              <span className="text-xl font-bold text-white">{siteName}</span>
            </Link>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-footer-text, #9ca3af)' }}>
              {footerDescription}
            </p>
            
            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="flex gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
                    style={{ backgroundColor: 'var(--color-primary, #16a34a)' }}
                    aria-label={social.name}
                  >
                    <social.icon className="w-4 h-4 text-white" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">روابط سريعة</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-white transition-colors"
                    style={{ color: 'var(--color-footer-text, #9ca3af)' }}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">المساعدة</h4>
            <ul className="space-y-2">
              {helpLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-white transition-colors"
                    style={{ color: 'var(--color-footer-text, #9ca3af)' }}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">تواصل معنا</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-primary, #16a34a)' }} />
                <span className="text-sm" style={{ color: 'var(--color-footer-text, #9ca3af)' }}>
                  {contactAddress}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-primary, #16a34a)' }} />
                <a 
                  href={`tel:${contactPhone.replace(/\s/g, '')}`}
                  className="text-sm hover:text-white transition-colors"
                  style={{ color: 'var(--color-footer-text, #9ca3af)' }}
                  dir="ltr"
                >
                  {contactPhone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-primary, #16a34a)' }} />
                <a 
                  href={`mailto:${contactEmail}`}
                  className="text-sm hover:text-white transition-colors"
                  style={{ color: 'var(--color-footer-text, #9ca3af)' }}
                >
                  {contactEmail}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-primary, #16a34a)' }} />
                <span className="text-sm" style={{ color: 'var(--color-footer-text, #9ca3af)' }}>
                  {workingHours}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div 
          className="border-t pt-8 text-center text-sm"
          style={{ 
            borderColor: 'rgba(255,255,255,0.1)',
            color: 'var(--color-footer-text, #9ca3af)' 
          }}
        >
          <p>{copyright}</p>
        </div>
      </div>
    </footer>
  );
}
