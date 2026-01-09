'use client';

import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';

interface NotificationSettings {
  // Firebase FCM
  fcm_enabled: boolean;
  fcm_server_key: string;
  fcm_sender_id: string;
  fcm_project_id: string;

  // SMTP Email
  smtp_enabled: boolean;
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_password: string;
  smtp_from_email: string;
  smtp_from_name: string;
  smtp_secure: boolean;

  // SMS Gateway
  sms_enabled: boolean;
  sms_provider: 'twilio' | 'nexmo' | 'custom';
  sms_api_key: string;
  sms_api_secret: string;
  sms_from_number: string;
  sms_account_sid?: string; // For Twilio
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    fcm_enabled: false,
    fcm_server_key: '',
    fcm_sender_id: '',
    fcm_project_id: '',
    smtp_enabled: false,
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_password: '',
    smtp_from_email: '',
    smtp_from_name: 'الصفحات الخضراء',
    smtp_secure: true,
    sms_enabled: false,
    sms_provider: 'twilio',
    sms_api_key: '',
    sms_api_secret: '',
    sms_from_number: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testingService, setTestingService] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/group/notifications`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const settingsObj: any = {};
        
        data.forEach((setting: any) => {
          const key = setting.key.replace('notification_', '');
          if (setting.type === 'boolean') {
            settingsObj[key] = setting.value_ar === 'true';
          } else {
            settingsObj[key] = setting.value_ar || '';
          }
        });

        setSettings(prev => ({ ...prev, ...settingsObj }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key: `notification_${key}`,
        value_ar: String(value),
        value_en: String(value),
        type: typeof value === 'boolean' ? 'boolean' : 'text',
        group: 'notifications',
        description: `Notification setting: ${key}`,
        is_public: false,
      }));

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ settings: settingsArray }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'تم حفظ الإعدادات بنجاح' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'فشل حفظ الإعدادات' });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (service: 'fcm' | 'smtp' | 'sms') => {
    setTestingService(service);
    setMessage(null);

    try {
      let endpoint = '';
      let body = {};

      if (service === 'fcm') {
        endpoint = `${process.env.NEXT_PUBLIC_API_URL}/notifications/integration/test/fcm`;
        body = {
          serverKey: settings.fcm_server_key,
          senderId: settings.fcm_sender_id,
          projectId: settings.fcm_project_id,
        };
      } else if (service === 'smtp') {
        const testEmail = prompt('أدخل البريد الإلكتروني لإرسال رسالة اختبار (اختياري):');
        endpoint = `${process.env.NEXT_PUBLIC_API_URL}/notifications/integration/test/smtp`;
        body = {
          host: settings.smtp_host,
          port: settings.smtp_port,
          user: settings.smtp_user,
          password: settings.smtp_password,
          secure: settings.smtp_secure,
          fromEmail: settings.smtp_from_email,
          testEmail: testEmail || '',
        };
      } else if (service === 'sms') {
        const testNumber = prompt('أدخل رقم الهاتف لإرسال رسالة اختبار (اختياري):');
        endpoint = `${process.env.NEXT_PUBLIC_API_URL}/notifications/integration/test/sms`;
        body = {
          provider: settings.sms_provider,
          apiKey: settings.sms_api_key,
          apiSecret: settings.sms_api_secret,
          fromNumber: settings.sms_from_number,
          accountSid: settings.sms_account_sid,
          testNumber: testNumber || '',
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: data.message });
      } else {
        throw new Error(data.message || 'فشل الاختبار');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || `فشل اختبار ${service}` });
    } finally {
      setTestingService(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إعدادات الإشعارات</h1>
          <p className="text-gray-600 mt-1">قم بتكوين خدمات الإشعارات (Push، Email، SMS)</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Firebase FCM Settings */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Firebase Cloud Messaging (FCM)</h2>
            <p className="text-sm text-gray-500 mt-1">إرسال إشعارات Push للتطبيقات (Mobile & Web)</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm">تفعيل</span>
            <input
              type="checkbox"
              checked={settings.fcm_enabled}
              onChange={(e) => setSettings({ ...settings, fcm_enabled: e.target.checked })}
              className="toggle"
            />
          </label>
        </div>

        {settings.fcm_enabled && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded text-sm text-gray-600">
              <strong>كيفية الحصول على المفاتيح:</strong><br />
              1. افتح <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Firebase Console</a><br />
              2. اختر مشروعك أو أنشئ مشروع جديد<br />
              3. اذهب إلى Project Settings → Cloud Messaging<br />
              4. انسخ Server Key و Sender ID و Project ID
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Server Key <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  value={settings.fcm_server_key}
                  onChange={(e) => setSettings({ ...settings, fcm_server_key: e.target.value })}
                  className="input"
                  placeholder="AAAAxxxxxxxx:xxxxxxxxxxxxxxxxxxx"
                />
                <span className="text-xs text-gray-500">يبدأ عادة بـ AAAA</span>
              </div>
              <div>
                <label className="label">Sender ID <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={settings.fcm_sender_id}
                  onChange={(e) => setSettings({ ...settings, fcm_sender_id: e.target.value })}
                  className="input"
                  placeholder="123456789012"
                />
                <span className="text-xs text-gray-500">رقم مكون من 12 خانة</span>
              </div>
              <div className="md:col-span-2">
                <label className="label">Project ID <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={settings.fcm_project_id}
                  onChange={(e) => setSettings({ ...settings, fcm_project_id: e.target.value })}
                  className="input"
                  placeholder="my-firebase-project"
                />
                <span className="text-xs text-gray-500">معرف المشروع في Firebase</span>
              </div>
            </div>
            <button
              onClick={() => testConnection('fcm')}
              disabled={testingService === 'fcm' || !settings.fcm_server_key || !settings.fcm_sender_id || !settings.fcm_project_id}
              className="btn-secondary text-sm"
            >
              {testingService === 'fcm' ? 'جاري الاختبار...' : 'اختبار الاتصال'}
            </button>
          </div>
        )}
      </div>

      {/* SMTP Settings */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">إعدادات البريد الإلكتروني (SMTP)</h2>
            <p className="text-sm text-gray-500 mt-1">إرسال الإشعارات عبر البريد الإلكتروني</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm">تفعيل</span>
            <input
              type="checkbox"
              checked={settings.smtp_enabled}
              onChange={(e) => setSettings({ ...settings, smtp_enabled: e.target.checked })}
              className="toggle"
            />
          </label>
        </div>

        {settings.smtp_enabled && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded text-sm text-gray-600">
              <strong>أمثلة على إعدادات SMTP الشائعة:</strong><br />
              • <strong>Gmail:</strong> smtp.gmail.com | Port: 587 | TLS: نعم | استخدم App Password<br />
              • <strong>Outlook:</strong> smtp-mail.outlook.com | Port: 587 | TLS: نعم<br />
              • <strong>Custom SMTP:</strong> استخدم الإعدادات المقدمة من مزود الخدمة
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">SMTP Host <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={settings.smtp_host}
                  onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                  className="input"
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <label className="label">SMTP Port <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={settings.smtp_port}
                  onChange={(e) => setSettings({ ...settings, smtp_port: e.target.value })}
                  className="input"
                  placeholder="587"
                />
                <span className="text-xs text-gray-500">عادة 587 (TLS) أو 465 (SSL)</span>
              </div>
              <div>
                <label className="label">SMTP Username <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={settings.smtp_user}
                  onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                  className="input"
                  placeholder="your-email@gmail.com"
                />
              </div>
              <div>
                <label className="label">SMTP Password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  value={settings.smtp_password}
                  onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })}
                  className="input"
                  placeholder="••••••••"
                />
                <span className="text-xs text-gray-500">استخدم App Password للـ Gmail</span>
              </div>
              <div>
                <label className="label">From Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={settings.smtp_from_email}
                  onChange={(e) => setSettings({ ...settings, smtp_from_email: e.target.value })}
                  className="input"
                  placeholder="noreply@greenpages.sy"
                />
                <span className="text-xs text-gray-500">البريد الذي سيظهر كمرسل</span>
              </div>
              <div>
                <label className="label">From Name</label>
                <input
                  type="text"
                  value={settings.smtp_from_name}
                  onChange={(e) => setSettings({ ...settings, smtp_from_name: e.target.value })}
                  className="input"
                  placeholder="الصفحات الخضراء"
                />
                <span className="text-xs text-gray-500">الاسم الذي سيظهر كمرسل</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="smtp_secure"
                checked={settings.smtp_secure}
                onChange={(e) => setSettings({ ...settings, smtp_secure: e.target.checked })}
                className="checkbox"
              />
              <label htmlFor="smtp_secure" className="text-sm">استخدام اتصال آمن (TLS/SSL)</label>
            </div>
            <button
              onClick={() => testConnection('smtp')}
              disabled={testingService === 'smtp' || !settings.smtp_host || !settings.smtp_user || !settings.smtp_password}
              className="btn-secondary text-sm"
            >
              {testingService === 'smtp' ? 'جاري الاختبار...' : 'اختبار الاتصال وإرسال رسالة تجريبية'}
            </button>
          </div>
        )}
      </div>

      {/* SMS Settings */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">إعدادات الرسائل النصية (SMS)</h2>
            <p className="text-sm text-gray-500 mt-1">إرسال الإشعارات عبر الرسائل النصية</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm">تفعيل</span>
            <input
              type="checkbox"
              checked={settings.sms_enabled}
              onChange={(e) => setSettings({ ...settings, sms_enabled: e.target.checked })}
              className="toggle"
            />
          </label>
        </div>

        {settings.sms_enabled && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded text-sm text-gray-600">
              <strong>مزودو خدمة SMS:</strong><br />
              • <strong>Twilio:</strong> الأكثر شيوعاً، يحتاج Account SID + Auth Token<br />
              • <strong>Nexmo/Vonage:</strong> بديل موثوق، يحتاج API Key + API Secret<br />
              • <strong>Custom:</strong> لمزودي الخدمة المحليين
            </div>
            <div>
              <label className="label">مزود الخدمة <span className="text-red-500">*</span></label>
              <select
                value={settings.sms_provider}
                onChange={(e) => setSettings({ ...settings, sms_provider: e.target.value as any })}
                className="input"
              >
                <option value="twilio">Twilio</option>
                <option value="nexmo">Nexmo (Vonage)</option>
                <option value="custom">Custom Provider</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {settings.sms_provider === 'twilio' && (
                <div className="md:col-span-2">
                  <label className="label">Account SID <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={settings.sms_account_sid || ''}
                    onChange={(e) => setSettings({ ...settings, sms_account_sid: e.target.value })}
                    className="input"
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                  <span className="text-xs text-gray-500">يبدأ عادة بـ AC</span>
                </div>
              )}
              <div>
                <label className="label">
                  {settings.sms_provider === 'twilio' ? 'Auth Token' : 'API Key'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={settings.sms_api_key}
                  onChange={(e) => setSettings({ ...settings, sms_api_key: e.target.value })}
                  className="input"
                  placeholder={settings.sms_provider === 'twilio' ? 'Auth Token' : 'API Key'}
                />
              </div>
              <div>
                <label className="label">API Secret {settings.sms_provider !== 'twilio' && <span className="text-red-500">*</span>}</label>
                <input
                  type="password"
                  value={settings.sms_api_secret}
                  onChange={(e) => setSettings({ ...settings, sms_api_secret: e.target.value })}
                  className="input"
                  placeholder="API Secret"
                  disabled={settings.sms_provider === 'twilio'}
                />
                {settings.sms_provider === 'twilio' && (
                  <span className="text-xs text-gray-500">غير مطلوب لـ Twilio</span>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="label">From Number <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={settings.sms_from_number}
                  onChange={(e) => setSettings({ ...settings, sms_from_number: e.target.value })}
                  className="input"
                  placeholder="+1234567890"
                />
                <span className="text-xs text-gray-500">الرقم الذي سيظهر كمرسل (يجب أن يكون مسجل في الخدمة)</span>
              </div>
            </div>
            <button
              onClick={() => testConnection('sms')}
              disabled={testingService === 'sms' || !settings.sms_api_key || !settings.sms_from_number || (settings.sms_provider === 'twilio' && !settings.sms_account_sid)}
              className="btn-secondary text-sm"
            >
              {testingService === 'sms' ? 'جاري الاختبار...' : 'اختبار الاتصال'}
            </button>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          ملاحظات وإرشادات مهمة
        </h3>
        <div className="text-sm text-blue-800 space-y-3">
          <div>
            <strong>Firebase Cloud Messaging:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>احصل على المفاتيح من <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Firebase Console</a></li>
              <li>تأكد من تفعيل Cloud Messaging API في مشروعك</li>
              <li>Server Key يجب أن يبدأ بـ "AAAA"</li>
            </ul>
          </div>
          <div>
            <strong>SMTP (البريد الإلكتروني):</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>للـ Gmail: استخدم <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer" className="underline font-semibold">App Password</a> بدلاً من كلمة المرور العادية</li>
              <li>تأكد من تفعيل "Less secure app access" أو استخدام OAuth2</li>
              <li>Port 587 للـ TLS، Port 465 للـ SSL</li>
              <li>اختبر الاتصال قبل الحفظ لتجنب الأخطاء</li>
            </ul>
          </div>
          <div>
            <strong>SMS Gateway:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>سجّل حساب في <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Twilio</a> أو <a href="https://www.vonage.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Nexmo</a></li>
              <li>تأكد من تسجيل رقم المرسل (From Number) في حسابك</li>
              <li>للـ Twilio: ستحتاج Account SID + Auth Token</li>
              <li>تحقق من رصيد حسابك لتجنب فشل الإرسال</li>
            </ul>
          </div>
          <div className="bg-white p-3 rounded border border-blue-300 mt-3">
            <strong>🔒 أمان المعلومات:</strong>
            <p className="mt-1">جميع المفاتيح والكلمات السرية محفوظة بشكل آمن في قاعدة البيانات ولا يمكن الوصول إليها من الواجهة العامة.</p>
          </div>
        </div>
      </div>

      {/* Quick Test Guide */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          دليل الاختبار السريع
        </h3>
        <div className="text-sm text-green-800 space-y-2">
          <p><strong>خطوات اختبار الإعدادات:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li>قم بتفعيل الخدمة المطلوبة (FCM، SMTP، أو SMS)</li>
            <li>املأ جميع الحقول الإلزامية (المميزة بـ <span className="text-red-500">*</span>)</li>
            <li>اضغط على زر "اختبار الاتصال"</li>
            <li>للـ SMTP: ستُطالب بإدخال بريد إلكتروني لإرسال رسالة اختبار</li>
            <li>للـ SMS: ستُطالب بإدخال رقم هاتف لإرسال رسالة اختبار</li>
            <li>إذا نجح الاختبار، احفظ الإعدادات</li>
          </ol>
          <p className="mt-2 bg-white p-2 rounded border border-green-300">
            <strong>💡 نصيحة:</strong> احفظ الإعدادات بعد كل اختبار ناجح للتأكد من عدم فقدان البيانات
          </p>
        </div>
      </div>
    </div>
  );
}
