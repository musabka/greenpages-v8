import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GreenPages - لوحة تحكم المحاسب',
  description: 'نظام إدارة محاسبة احترافي لـ GreenPages',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-gray-50 antialiased">{children}</body>
    </html>
  )
}
