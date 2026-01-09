'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Search, ChevronDown, User, LogIn, LogOut, LayoutDashboard, Building2, MessageSquare, Wallet, Star, FileText, BookOpen, BarChart3 } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { useSettings } from '@/components/settings-context';

const navigation = [
  { name: 'الرئيسية', href: '/' },
  { name: 'التصنيفات', href: '/categories' },
  { name: 'البحث', href: '/search' },
  { name: 'الخريطة', href: '/map' },
  { name: 'من نحن', href: '/about' },
  { name: 'تواصل معنا', href: '/contact' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { getSetting, getSettingBool } = useSettings();

  // Get settings values - these are already loaded from server
  const siteName = getSetting('site_name', 'ar', 'الصفحات الخضراء');
  const siteTagline = getSetting('site_tagline', 'ar', 'دليل الأنشطة التجارية في سوريا');
  const logo = getSetting('logo');
  const contactPhone = getSetting('contact_phone', 'ar', '+963 999 999 999');
  const contactEmail = getSetting('contact_email', 'ar', 'info@greenpages.sy');
  
  // Header settings
  const showTopbar = getSettingBool('header_show_topbar');
  const topbarText = getSetting('header_topbar_text');
  const logoDisplay = getSetting('header_logo_display', 'ar', 'logo_with_text');
  const showSearch = getSettingBool('header_show_search');
  const showAddBusiness = getSettingBool('header_show_add_business');
  const isSticky = getSettingBool('header_sticky');

  return (
    <header 
      className={`${isSticky ? 'sticky top-0' : ''} z-50 shadow-sm`}
      style={{ backgroundColor: 'var(--color-header-bg, #ffffff)' }}
    >
      {/* Top bar */}
      {showTopbar && (
        <div 
          className="text-white text-sm py-2"
          style={{ backgroundColor: 'var(--color-primary, #16a34a)' }}
        >
          <div className="container flex items-center justify-between">
            <div className="flex items-center gap-4">
              {topbarText ? (
                <span>{topbarText}</span>
              ) : (
                <>
                  <a href={`tel:${contactPhone.replace(/\s/g, '')}`} className="hover:opacity-80 transition-opacity">
                    {contactPhone}
                  </a>
                  <span className="hidden sm:inline">|</span>
                  <a href={`mailto:${contactEmail}`} className="hidden sm:inline hover:opacity-80 transition-opacity">
                    {contactEmail}
                  </a>
                </>
              )}
            </div>
            <div className="flex items-center gap-4">
              {showAddBusiness && (
                <Link href="/add-business" className="hover:opacity-80 transition-opacity">
                  أضف نشاطك التجاري
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main header */}
      <div className="container py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            {logoDisplay === 'logo_only' && logo && (
              <img src={logo} alt={siteName} className="h-12 w-auto" />
            )}
            
            {logoDisplay === 'text_only' && (
              <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--color-primary, #16a34a)' }}>
                  {siteName}
                </h1>
                <p className="text-xs text-gray-500">{siteTagline}</p>
              </div>
            )}
            
            {logoDisplay === 'logo_with_text' && (
              <>
                {logo ? (
                  <img src={logo} alt={siteName} className="h-12 w-auto" />
                ) : (
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-primary, #16a34a)' }}
                  >
                    <span className="text-white font-bold text-xl">ص</span>
                  </div>
                )}
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold" style={{ color: 'var(--color-primary, #16a34a)' }}>
                    {siteName}
                  </h1>
                  <p className="text-xs text-gray-500">{siteTagline}</p>
                </div>
              </>
            )}
            
            {/* Fallback if logoDisplay is not set or invalid */}
            {!logoDisplay && !logo && (
              <>
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: 'var(--color-primary, #16a34a)' }}
                >
                  <span className="text-white font-bold text-xl">ص</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold" style={{ color: 'var(--color-primary, #16a34a)' }}>
                    {siteName}
                  </h1>
                  <p className="text-xs text-gray-500">{siteTagline}</p>
                </div>
              </>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                style={{ color: 'var(--color-header-text, #111827)' }}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search Button */}
            {showSearch && (
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="بحث"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ 
                    backgroundColor: userMenuOpen ? 'var(--color-primary, #16a34a)' : 'transparent',
                    color: userMenuOpen ? 'white' : 'inherit'
                  }}
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ 
                      backgroundColor: userMenuOpen ? 'rgba(255,255,255,0.2)' : '#e5e7eb'
                    }}
                  >
                    <User className={`w-4 h-4 ${userMenuOpen ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <span className="hidden md:inline text-sm font-medium">
                    {user.firstName} {user.lastName}
                  </span>
                  <ChevronDown 
                    className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                    style={{ color: userMenuOpen ? 'white' : '#9ca3af' }}
                  />
                </button>

                {userMenuOpen && (
                  <>
                    {/* Overlay */}
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    
                    {/* Menu */}
                    <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 overflow-hidden">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>

                      {/* Navigation Links */}
                      <div className="py-1">
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <LayoutDashboard className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">لوحة التحكم</span>
                        </Link>

                        <Link
                          href="/profile"
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">الملف الشخصي</span>
                        </Link>

                        <Link
                          href="/dashboard/wallet"
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Wallet className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">المحفظة</span>
                        </Link>

                        <Link
                          href="/my-reviews"
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <MessageSquare className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">مراجعاتي</span>
                        </Link>

                        <Link
                          href="/business-reviews"
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Star className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">المراجعات الواردة</span>
                        </Link>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={() => {
                            logout();
                            setUserMenuOpen(false);
                          }}
                          className="flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 w-full text-right transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm font-medium">تسجيل الخروج</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors"
                style={{ backgroundColor: 'var(--color-primary, #16a34a)' }}
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">تسجيل الدخول</span>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="القائمة"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <div className="mt-4 pb-2">
            <form action="/search" className="relative">
              <input
                type="search"
                name="q"
                placeholder="ابحث عن نشاط تجاري، خدمة، أو منتج..."
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 focus:ring-2 focus:border-transparent"
                style={{ 
                  outline: 'none',
                }}
                autoFocus
              />
              <button
                type="submit"
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-white"
                style={{ backgroundColor: 'var(--color-primary, #16a34a)' }}
              >
                <Search className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-white">
          <nav className="container py-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
