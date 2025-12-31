import type { Metadata } from 'next';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import { FaFacebook, FaInstagram, FaTwitter, FaWhatsapp } from 'react-icons/fa';

export const metadata: Metadata = {
  title: 'تواصل معنا',
  description: 'تواصل مع فريق الصفحات الخضراء - نحن هنا لمساعدتك',
};

const contactInfo = [
  {
    icon: MapPin,
    title: 'العنوان',
    content: 'دمشق، سوريا',
    link: null,
  },
  {
    icon: Phone,
    title: 'الهاتف',
    content: '+963 999 999 999',
    link: 'tel:+963999999999',
  },
  {
    icon: Mail,
    title: 'البريد الإلكتروني',
    content: 'info@greenpages.sy',
    link: 'mailto:info@greenpages.sy',
  },
  {
    icon: Clock,
    title: 'ساعات العمل',
    content: 'السبت - الخميس: 9 صباحاً - 6 مساءً',
    link: null,
  },
];

const socialLinks = [
  { name: 'Facebook', icon: FaFacebook, href: 'https://facebook.com', color: 'hover:bg-blue-600' },
  { name: 'Instagram', icon: FaInstagram, href: 'https://instagram.com', color: 'hover:bg-pink-600' },
  { name: 'Twitter', icon: FaTwitter, href: 'https://twitter.com', color: 'hover:bg-sky-500' },
  { name: 'WhatsApp', icon: FaWhatsapp, href: 'https://wa.me/963999999999', color: 'hover:bg-green-600' },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">تواصل معنا</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            نحن هنا لمساعدتك! سواء كان لديك سؤال، اقتراح، أو تحتاج إلى دعم،
            لا تتردد في التواصل معنا.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">أرسل لنا رسالة</h2>
              
              <form className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      الاسم الكامل
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                      placeholder="أدخل اسمك الكامل"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                      placeholder="example@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    رقم الهاتف (اختياري)
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                    placeholder="+963 999 999 999"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    الموضوع
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                  >
                    <option value="">اختر الموضوع</option>
                    <option value="general">استفسار عام</option>
                    <option value="business">إضافة نشاط تجاري</option>
                    <option value="advertising">الإعلانات والباقات</option>
                    <option value="technical">مشكلة تقنية</option>
                    <option value="suggestion">اقتراح</option>
                    <option value="complaint">شكوى</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    الرسالة
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all resize-none"
                    placeholder="اكتب رسالتك هنا..."
                  />
                </div>

                <button type="submit" className="btn btn-primary w-full md:w-auto">
                  <Send className="w-5 h-5" />
                  إرسال الرسالة
                </button>
              </form>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            {/* Info Cards */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">معلومات التواصل</h3>
              <div className="space-y-4">
                {contactInfo.map((info) => (
                  <div key={info.title} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                      <info.icon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{info.title}</h4>
                      {info.link ? (
                        <a
                          href={info.link}
                          className="text-gray-600 hover:text-primary-600 transition-colors"
                        >
                          {info.content}
                        </a>
                      ) : (
                        <p className="text-gray-600">{info.content}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">تابعنا على</h3>
              <div className="flex gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:text-white transition-colors ${social.color}`}
                    aria-label={social.name}
                  >
                    <social.icon className="w-6 h-6" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Help */}
            <div className="bg-primary-50 rounded-2xl p-6 border border-primary-100">
              <h3 className="text-lg font-bold text-primary-900 mb-2">هل تحتاج مساعدة سريعة؟</h3>
              <p className="text-primary-700 mb-4">
                تحقق من قسم الأسئلة الشائعة للحصول على إجابات فورية لأكثر الأسئلة شيوعاً.
              </p>
              <a href="/faq" className="btn btn-primary w-full">
                الأسئلة الشائعة
              </a>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="mt-12">
          <div className="bg-white rounded-2xl shadow-sm p-4 overflow-hidden">
            <div className="aspect-[21/9] rounded-xl bg-gray-100 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <MapPin className="w-12 h-12 mx-auto mb-2" />
                <p>خريطة الموقع</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
