'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './auth-provider';
import {
  LayoutDashboard,
  Building2,
  FolderTree,
  MapPin,
  Users,
  Star,
  Megaphone,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Package,
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'الرئيسية', href: '/', icon: LayoutDashboard },
  { name: 'الأنشطة التجارية', href: '/businesses', icon: Building2 },
  { name: 'الباقات', href: '/packages', icon: Package },
  { name: 'التصنيفات', href: '/categories', icon: FolderTree },
  {
    name: 'المواقع الجغرافية',
    icon: MapPin,
    children: [
      { name: 'المحافظات', href: '/governorates' },
      { name: 'المدن', href: '/cities' },
      { name: 'الأحياء', href: '/districts' },
    ],
  },
  { name: 'المستخدمين', href: '/users', icon: Users },
  { name: 'التقييمات', href: '/reviews', icon: Star },
  { name: 'الإعلانات', href: '/ads', icon: Megaphone },
  { name: 'الصفحات', href: '/pages', icon: FileText },
  { name: 'الإعدادات', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const isActive = (href: string) => pathname === href;
  const isChildActive = (children: { href: string }[]) =>
    children.some((child) => pathname === child.href);

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="px-4 py-6 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">ص</span>
          </div>
          <div>
            <h1 className="font-bold text-white">الصفحات الخضراء</h1>
            <p className="text-xs text-gray-400">لوحة التحكم</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              {item.children ? (
                <div>
                  <button
                    onClick={() => toggleExpand(item.name)}
                    className={`w-full sidebar-item ${
                      isChildActive(item.children) ? 'text-white bg-gray-800' : ''
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="flex-1 text-right">{item.name}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        expandedItems.includes(item.name) ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {expandedItems.includes(item.name) && (
                    <ul className="mt-1 mr-8 space-y-1">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={`block px-4 py-2 text-sm rounded-lg transition-colors ${
                              isActive(child.href)
                                ? 'bg-primary-600 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                            }`}
                            onClick={() => setMobileOpen(false)}
                          >
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={`sidebar-item ${
                    isActive(item.href) ? 'sidebar-item-active' : ''
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
            <span className="text-white font-medium">
              {user?.firstName?.charAt(0) || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-gray-900 text-white rounded-lg"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute top-0 right-0 h-full w-64 bg-gray-900 text-white flex flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 left-4 p-1 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <NavContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex sidebar flex-col">
        <NavContent />
      </aside>
    </>
  );
}
