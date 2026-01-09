'use client';

import { useState, useEffect } from 'react';
import { Send, Users, MapPin, Briefcase, Calendar, Eye, CheckCircle2, AlertCircle, X, Clock, FileText, TrendingUp } from 'lucide-react';

interface BulkNotification {
  id: string;
  titleAr: string;
  titleEn?: string;
  messageAr: string;
  messageEn?: string;
  priority: string;
  channels: string[];
  targetCriteria: {
    roles?: string[];
    governorates?: string[];
    cities?: string[];
    districts?: string[];
    professions?: string[];
    activeLastDays?: number;
  };
  status: string;
  targetCount?: number;
  sentCount?: number;
  createdAt: string;
}

interface Location {
  id: string;
  nameAr: string;
  nameEn?: string;
}

interface NotificationTemplate {
  id: string;
  code: string;
  name: string;
  titleAr: string;
  titleEn?: string;
  messageAr: string;
  messageEn?: string;
  type: string;
  priority: string;
  channels: string[];
}

const ROLES = [
  { value: 'USER', label: 'مستخدم' },
  { value: 'BUSINESS', label: 'صاحب نشاط' },
  { value: 'AGENT', label: 'مندوب' },
];

const PRIORITIES = [
  { value: 'LOW', label: 'منخفضة' },
  { value: 'MEDIUM', label: 'متوسطة' },
  { value: 'HIGH', label: 'عالية' },
  { value: 'URGENT', label: 'عاجلة' },
];

const CHANNELS = [
  { value: 'IN_APP', label: 'داخل التطبيق' },
  { value: 'PUSH', label: 'إشعار فوري' },
  { value: 'EMAIL', label: 'بريد إلكتروني' },
  { value: 'SMS', label: 'رسالة نصية' },
];

export default function BulkNotificationsPage() {
  const [formData, setFormData] = useState({
    titleAr: '',
    titleEn: '',
    messageAr: '',
    messageEn: '',
    priority: 'MEDIUM',
    channels: ['IN_APP'],
    actionUrl: '',
    imageUrl: '',
    targetCriteria: {
      roles: [] as string[],
      governorates: [] as string[],
      cities: [] as string[],
      districts: [] as string[],
      professions: [] as string[],
      activeLastDays: undefined as number | undefined,
    },
  });

  const [governorates, setGovernorates] = useState<Location[]>([]);
  const [cities, setCities] = useState<Location[]>([]);
  const [districts, setDistricts] = useState<Location[]>([]);
  const [estimatedCount, setEstimatedCount] = useState<number>(0);
  const [sending, setSending] = useState(false);
  const [notifications, setNotifications] = useState<BulkNotification[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, sent: 0, pending: 0, failed: 0 });

  useEffect(() => {
    loadLocations();
    loadNotifications();
    loadTemplates();
    loadStats();
  }, []);

  const loadLocations = async () => {
    try {
      const [govResponse, citiesResponse, districtsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/governorates`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/cities`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/districts`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      if (govResponse.ok) {
        const data = await govResponse.json();
        const govData = data.governorates || data.data || data;
        setGovernorates(Array.isArray(govData) ? govData : []);
      }
      if (citiesResponse.ok) {
        const data = await citiesResponse.json();
        const citiesData = data.cities || data.data || data;
        setCities(Array.isArray(citiesData) ? citiesData : []);
      }
      if (districtsResponse.ok) {
        const data = await districtsResponse.json();
        const districtsData = data.districts || data.data || data;
        setDistricts(Array.isArray(districtsData) ? districtsData : []);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
      // Set empty arrays on error
      setGovernorates([]);
      setCities([]);
      setDistricts([]);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/bulk`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });

      if (response.ok) {
        const result = await response.json();
        // API returns { data: [...], meta: {...} }
        const bulkData = result.data || result.bulkNotifications || result;
        setNotifications(Array.isArray(bulkData) ? bulkData : []);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/templates`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });

      if (response.ok) {
        const data = await response.json();
        const templatesData = data.templates || data.data || data;
        setTemplates(Array.isArray(templatesData) ? templatesData.filter((t: any) => t.isActive) : []);
      } else {
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/bulk`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });

      if (response.ok) {
        const result = await response.json();
        const bulkData = result.data || [];
        setStats({
          total: bulkData.length,
          sent: bulkData.filter((n: any) => n.status === 'COMPLETED').length,
          pending: bulkData.filter((n: any) => n.status === 'PENDING' || n.status === 'PROCESSING').length,
          failed: bulkData.filter((n: any) => n.status === 'FAILED').length,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const applyTemplate = (template: NotificationTemplate) => {
    setFormData({
      ...formData,
      titleAr: template.titleAr,
      titleEn: template.titleEn || '',
      messageAr: template.messageAr,
      messageEn: template.messageEn || '',
      priority: template.priority,
      channels: template.channels,
    });
    setShowTemplates(false);
    setMessage({ type: 'success', text: `تم تطبيق القالب: ${template.name}` });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleTargetChange = (field: keyof typeof formData.targetCriteria, value: any) => {
    setFormData({
      ...formData,
      targetCriteria: {
        ...formData.targetCriteria,
        [field]: value,
      },
    });
  };

  const toggleArrayItem = (field: keyof typeof formData.targetCriteria, item: string) => {
    const currentArray = (formData.targetCriteria[field] as string[]) || [];
    const newArray = currentArray.includes(item)
      ? currentArray.filter(i => i !== item)
      : [...currentArray, item];
    
    handleTargetChange(field, newArray);
  };

  const estimateTargets = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/bulk/estimate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ targetCriteria: formData.targetCriteria }),
      });

      if (response.ok) {
        const data = await response.json();
        setEstimatedCount(data.count || 0);
      } else {
        setEstimatedCount(0);
      }
    } catch (error) {
      console.error('Error estimating targets:', error);
      setEstimatedCount(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSending(true);
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...formData,
          scheduledFor: scheduledDate || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'فشل إنشاء الإشعار');
      }

      const data = await response.json();
      const bulkId = data.id || data.bulkNotification?.id;
      
      if (!bulkId) {
        throw new Error('لم يتم إرجاع معرف الإشعار');
      }

      // إرسال الإشعار فوراً إذا لم يكن مجدولاً
      if (!scheduledDate) {
        const sendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/bulk/${bulkId}/send`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!sendResponse.ok) {
          throw new Error('فشل إرسال الإشعار');
        }

        setMessage({ type: 'success', text: 'تم إرسال الإشعار الجماعي بنجاح!' });
      } else {
        setMessage({ type: 'success', text: 'تم جدولة الإشعار بنجاح!' });
      }
      
      // إعادة تعيين النموذج
      setFormData({
        titleAr: '',
        titleEn: '',
        messageAr: '',
        messageEn: '',
        priority: 'MEDIUM',
        channels: ['IN_APP'],
        actionUrl: '',
        imageUrl: '',
        targetCriteria: {
          roles: [],
          governorates: [],
          cities: [],
          districts: [],
          professions: [],
          activeLastDays: undefined,
        },
      });
      setEstimatedCount(0);
      setScheduledDate('');
      await loadNotifications();
      await loadStats();
      setTimeout(() => setMessage(null), 5000);
    } catch (error: any) {
      console.error('Error sending notification:', error);
      setMessage({ type: 'error', text: error.message || 'فشل إرسال الإشعار' });
    } finally {
      setSending(false);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إرسال إشعار جماعي</h1>
          <p className="text-gray-600 mt-1">أرسل إشعارات مستهدفة لمجموعة محددة من المستخدمين</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowTemplates(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            اختيار قالب
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="btn-secondary flex items-center gap-2"
            disabled={!formData.titleAr || !formData.messageAr}
          >
            <Eye className="w-4 h-4" />
            معاينة
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
          <button 
            onClick={() => setMessage(null)}
            className="mr-auto hover:opacity-70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">إجمالي الإشعارات</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">تم الإرسال</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{stats.sent}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">قيد الانتظار</p>
              <p className="text-3xl font-bold text-yellow-900 mt-1">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="card bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">فشل</p>
              <p className="text-3xl font-bold text-red-900 mt-1">{stats.failed}</p>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Content */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">محتوى الإشعار</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">العنوان (عربي) *</label>
                    <input
                      type="text"
                      required
                      value={formData.titleAr}
                      onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                      className="input"
                      placeholder="عنوان الإشعار"
                    />
                  </div>
                  <div>
                    <label className="label">العنوان (إنجليزي)</label>
                    <input
                      type="text"
                      value={formData.titleEn}
                      onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                      className="input"
                      placeholder="Notification Title"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">الرسالة (عربي) *</label>
                    <textarea
                      required
                      value={formData.messageAr}
                      onChange={(e) => setFormData({ ...formData, messageAr: e.target.value })}
                      className="input"
                      rows={4}
                      placeholder="نص الرسالة"
                    />
                  </div>
                  <div>
                    <label className="label">الرسالة (إنجليزي)</label>
                    <textarea
                      value={formData.messageEn}
                      onChange={(e) => setFormData({ ...formData, messageEn: e.target.value })}
                      className="input"
                      rows={4}
                      placeholder="Message Text"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">رابط الإجراء</label>
                    <input
                      type="url"
                      value={formData.actionUrl}
                      onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                      className="input"
                      placeholder="https://example.com/action"
                    />
                  </div>
                  <div>
                    <label className="label">رابط الصورة</label>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="input"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">الأولوية</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="input"
                    >
                      {PRIORITIES.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">قنوات الإرسال *</label>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {CHANNELS.map(channel => (
                        <label key={channel.value} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.channels.includes(channel.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, channels: [...formData.channels, channel.value] });
                              } else {
                                setFormData({ ...formData, channels: formData.channels.filter(c => c !== channel.value) });
                              }
                            }}
                            className="checkbox"
                          />
                          <span className="text-sm">{channel.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Targeting */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                استهداف المستخدمين
              </h2>

              <div className="space-y-4">
                {/* Roles */}
                <div>
                  <label className="label flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    الأدوار
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ROLES.map(role => (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => toggleArrayItem('roles', role.value)}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                          formData.targetCriteria.roles?.includes(role.value)
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {role.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Governorates */}
                <div>
                  <label className="label flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    المحافظات
                  </label>
                  <select
                    multiple
                    value={formData.targetCriteria.governorates || []}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      handleTargetChange('governorates', selected);
                    }}
                    className="input"
                    size={4}
                  >
                    {governorates.map(gov => (
                      <option key={gov.id} value={gov.id}>{gov.nameAr}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">اضغط Ctrl للتحديد المتعدد</p>
                </div>

                {/* Professions */}
                <div>
                  <label className="label">المهن (اختياري)</label>
                  <input
                    type="text"
                    value={formData.targetCriteria.professions?.join(', ') || ''}
                    onChange={(e) => {
                      const professions = e.target.value.split(',').map(p => p.trim()).filter(Boolean);
                      handleTargetChange('professions', professions);
                    }}
                    className="input"
                    placeholder="طبيب, مهندس, معلم (افصل بفاصلة)"
                  />
                </div>

                {/* Active Days */}
                <div>
                  <label className="label flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    نشط خلال آخر (أيام)
                  </label>
                  <input
                    type="number"
                    value={formData.targetCriteria.activeLastDays || ''}
                    onChange={(e) => handleTargetChange('activeLastDays', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="input"
                    placeholder="30"
                    min="1"
                  />
                </div>

                <button
                  type="button"
                  onClick={estimateTargets}
                  className="btn-secondary w-full"
                >
                  تقدير عدد المستهدفين
                </button>

                {estimatedCount > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <p className="text-sm text-blue-800">
                      العدد المتوقع: <span className="font-bold text-lg">{estimatedCount}</span> مستخدم
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Scheduling */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                جدولة الإرسال (اختياري)
              </h2>

              <div>
                <label className="label">تاريخ ووقت الإرسال</label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="input"
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  اتركه فارغاً للإرسال الفوري، أو حدد تاريخ ووقت لجدولة الإرسال
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={sending || !formData.titleAr || !formData.messageAr || loading}
              className="btn-primary w-full py-3 text-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  جاري المعالجة...
                </>
              ) : scheduledDate ? (
                <>
                  <Clock className="w-5 h-5" />
                  جدولة الإرسال
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  إرسال فوراً
                </>
              )}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">الإشعارات السابقة</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {notifications.map(notification => (
                <div key={notification.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-sm">{notification.titleAr}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      notification.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      notification.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                      notification.status === 'PENDING' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {notification.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">{notification.messageAr}</p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{notification.sentCount || 0}/{notification.targetCount || 0}</span>
                    <span>{new Date(notification.createdAt).toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  معاينة الإشعار
                </h2>
                <button onClick={() => setShowPreview(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* IN_APP Preview */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  داخل التطبيق (IN_APP)
                </h4>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <Send className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 mb-1">{formData.titleAr}</p>
                      <p className="text-gray-700 text-sm">{formData.messageAr}</p>
                      {formData.actionUrl && (
                        <button className="text-primary-600 text-sm mt-2 hover:underline">
                          اضغط للمزيد ←
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Targeting Info */}
              <div className="border rounded-lg p-4 bg-blue-50">
                <h4 className="font-semibold mb-3 text-blue-900">معلومات الاستهداف:</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>الأولوية:</strong> {PRIORITIES.find(p => p.value === formData.priority)?.label}</p>
                  <p><strong>القنوات:</strong> {formData.channels.map(c => CHANNELS.find(ch => ch.value === c)?.label).join(', ')}</p>
                  {formData.targetCriteria.roles && formData.targetCriteria.roles.length > 0 && (
                    <p><strong>الأدوار:</strong> {formData.targetCriteria.roles.map(r => ROLES.find(role => role.value === r)?.label).join(', ')}</p>
                  )}
                  {estimatedCount > 0 && (
                    <p><strong>العدد المتوقع:</strong> {estimatedCount} مستخدم</p>
                  )}
                  {scheduledDate && (
                    <p><strong>وقت الإرسال:</strong> {new Date(scheduledDate).toLocaleString('ar-EG')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  اختيار قالب جاهز
                </h2>
                <button onClick={() => setShowTemplates(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {templates.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">لا توجد قوالب نشطة متاحة</p>
                  <p className="text-sm text-gray-500 mt-1">يمكنك إنشاء قوالب جديدة من صفحة القوالب</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map(template => (
                    <div
                      key={template.id}
                      className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => applyTemplate(template)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{template.name}</h3>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {template.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{template.code}</p>
                      <div className="bg-gray-50 p-2 rounded text-xs">
                        <p className="font-semibold mb-1">{template.titleAr}</p>
                        <p className="text-gray-600 line-clamp-2">{template.messageAr}</p>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {template.channels.map(channel => (
                          <span key={channel} className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                            {CHANNELS.find(c => c.value === channel)?.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
