import type { Metadata } from 'next';
import { Cairo, Tajawal } from 'next/font/google';
import './globals.css';
import { getServerSettings, getSetting, generateCssVariables } from '@/lib/settings.server';
import { RootLayoutClient } from '@/components/layout/root-layout-client';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
});

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['200', '300', '400', '500', '700', '800', '900'],
  variable: '--font-tajawal',
  display: 'swap',
});

// Generate dynamic metadata from settings
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getServerSettings();
  
  const siteName = getSetting(settings, 'site_name', 'ar', 'الصفحات الخضراء');
  const siteTagline = getSetting(settings, 'site_tagline', 'ar', 'دليل الأنشطة التجارية في سوريا');
  const siteDescription = getSetting(settings, 'seo_meta_description', 'ar', 'الدليل التجاري الرقمي الأول والأشمل للأنشطة التجارية في سوريا');
  const siteUrl = getSetting(settings, 'site_url', 'ar', 'https://greenpages.sy');
  const ogImage = getSetting(settings, 'og_image', 'ar', '/og-image.png');
  const favicon = getSetting(settings, 'favicon', 'ar', '/favicon.ico');
  const metaKeywords = getSetting(settings, 'seo_meta_keywords', 'ar', 'دليل تجاري، سوريا، شركات');
  const googleVerification = getSetting(settings, 'seo_google_verification', 'ar', '');
  
  return {
    title: {
      default: `${siteName} | ${siteTagline}`,
      template: `%s | ${siteName}`,
    },
    description: siteDescription,
    keywords: metaKeywords.split('،').map(k => k.trim()),
    authors: [{ name: 'Green Core Team' }],
    creator: 'النواة الخضراء',
    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
    },
    openGraph: {
      type: 'website',
      locale: 'ar_SY',
      url: siteUrl,
      siteName: siteName,
      title: `${siteName} | ${siteTagline}`,
      description: siteDescription,
      images: [
        {
          url: ogImage || '/og-image.png',
          width: 1200,
          height: 630,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${siteName} | ${siteTagline}`,
      description: siteDescription,
      images: [ogImage || '/og-image.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: googleVerification ? {
      google: googleVerification,
    } : undefined,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch settings on the server BEFORE rendering
  const settings = await getServerSettings();
  
  // Generate CSS variables from settings
  const cssVariables = generateCssVariables(settings);
  
  // Get analytics IDs
  const googleAnalytics = getSetting(settings, 'seo_google_analytics');
  const googleTagManager = getSetting(settings, 'seo_google_tag_manager');
  const facebookPixel = getSetting(settings, 'seo_facebook_pixel');

  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable}`}>
      <head>
        {/* Inject CSS variables directly - no flash */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                ${cssVariables}
              }
            `,
          }}
        />
        
        {/* Google Analytics */}
        {googleAnalytics && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalytics}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${googleAnalytics}');
                `,
              }}
            />
          </>
        )}
        
        {/* Google Tag Manager */}
        {googleTagManager && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${googleTagManager}');
              `,
            }}
          />
        )}
        
        {/* Facebook Pixel */}
        {facebookPixel && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${facebookPixel}');
                fbq('track', 'PageView');
              `,
            }}
          />
        )}
      </head>
      <body className="min-h-screen flex flex-col">
        {/* Google Tag Manager (noscript) */}
        {googleTagManager && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${googleTagManager}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        
        {/* Client-side providers with pre-fetched settings */}
        <RootLayoutClient settings={settings}>
          {children}
        </RootLayoutClient>
      </body>
    </html>
  );
}
