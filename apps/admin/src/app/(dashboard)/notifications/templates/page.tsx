'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Search, Filter, Eye, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface NotificationTemplate {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: string;
  priority: string;
  titleAr: string;
  titleEn?: string;
  messageAr: string;
  messageEn?: string;
  channels: string[];
  emailSubjectAr?: string;
  emailSubjectEn?: string;
  emailBodyAr?: string;
  emailBodyEn?: string;
  smsTemplateAr?: string;
  smsTemplateEn?: string;
  isActive: boolean;
  createdAt: string;
}

const NOTIFICATION_TYPES = [
  { value: 'SYSTEM', label: 'نظام' },
  { value: 'SUBSCRIPTION_EXPIRING', label: 'اشتراك ينتهي قريباً' },
  { value: 'SUBSCRIPTION_EXPIRED', label: 'اشتراك منتهي' },
  { value: 'BUSINESS_PENDING', label: 'نشاط قيد المراجعة' },
  { value: 'BUSINESS_APPROVED', label: 'نشاط موافق عليه' },
  { value: 'BUSINESS_REJECTED', label: 'نشاط مرفوض' },
  { value: 'BUSINESS_UPDATE_REMINDER', label: 'تذكير تحديث النشاط' },
  { value: 'REVIEW_NEW', label: 'تقييم جديد' },
  { value: 'AGENT_REMINDER', label: 'تذكير للمندوب' },
  { value: 'RENEWAL_REMINDER', label: 'تذكير بالتجديد' },
  { value: 'PROMOTIONAL', label: 'ترويجي' },
  { value: 'TARGETED', label: 'مستهدف' },
];

const PRIORITIES = [
  { value: 'LOW', label: 'منخفضة' },
  { value: 'MEDIUM', label: 'متوسطة' },
  { value: 'HIGH', label: 'عالية' },
  { value: 'URGENT', label: 'عاجلة' },
];

const CHANNELS = [
  { value: 'IN_APP', label: 'داخل التطبيق' },
  { value: 'PUSH', label: 'Push Notification' },
  { value: 'EMAIL', label: 'بريد إلكتروني' },
  { value: 'SMS', label: 'رسالة نصية' },
];

export default function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<NotificationTemplate | null>(null);
  const [showVariablesGuide, setShowVariablesGuide] = useState(false);
  const [formData, setFormData] = useState<Partial<NotificationTemplate>>({
    channels: ['IN_APP'],
    priority: 'MEDIUM',
    isActive: true,
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, filterType, filterChannel]);

  const filterTemplates = () => {
    let filtered = [...templates];

    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterType) {
      filtered = filtered.filter(t => t.type === filterType);
    }

    if (filterChannel) {
      filtered = filtered.filter(t => t.channels.includes(filterChannel));
    }

    setFilteredTemplates(filtered);
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/templates`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const templatesData = data.templates || data.data || data;
        setTemplates(Array.isArray(templatesData) ? templatesData : []);
      } else {
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    
    try {
      const url = editingTemplate
        ? `${process.env.NEXT_PUBLIC_API_URL}/notifications/templates/${editingTemplate.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/notifications/templates`;
      
      const method = editingTemplate ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadTemplates();
        setShowModal(false);
        setEditingTemplate(null);
        setFormData({ channels: ['IN_APP'], priority: 'MEDIUM', isActive: true });
        setMessage({ 
          type: 'success', 
          text: editingTemplate ? 'تم تحديث القالب بنجاح' : 'تم إنشاء القالب بنجاح' 
        });
        setTimeout(() => setMessage(null), 5000);
      } else {
        const errorData = await response.json();
        setMessage({ 
          type: 'error', 
          text: errorData.message || 'فشل في حفظ القالب' 
        });
      }
    } catch (error) {
      console.error('Error saving template:', error);
      setMessage({ type: 'error', text: 'حدث خطأ أثناء حفظ القالب' });
    }
  };

  const handleEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setFormData(template);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القالب؟')) return;

    setMessage(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/templates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        await loadTemplates();
        setMessage({ type: 'success', text: 'تم حذف القالب بنجاح' });
        setTimeout(() => setMessage(null), 5000);
      } else {
        const errorData = await response.json();
        setMessage({ 
          type: 'error', 
          text: errorData.message || 'فشل في حذف القالب. قد يكون قالب نظام محمي.' 
        });
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      setMessage({ type: 'error', text: 'حدث خطأ أثناء حذف القالب' });
    }
  };

  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormData({ channels: ['IN_APP'], priority: 'MEDIUM', isActive: true });
    setShowModal(true);
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
          <h1 className="text-2xl font-bold text-gray-900">قوالب الإشعارات</h1>
          <p className="text-gray-600 mt-1">إدارة قوالب الإشعارات المخصصة</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowVariablesGuide(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Info className="w-4 h-4" />
            دليل المتغيرات
          </button>
          <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            قالب جديد
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">إجمالي القوالب</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{templates.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Filter className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">القوالب النشطة</p>
              <p className="text-3xl font-bold text-green-900 mt-1">
                {templates.filter(t => t.isActive).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="card bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">القوالب غير النشطة</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {templates.filter(t => !t.isActive).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث بالاسم، الكود، أو الوصف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pr-10 w-full"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input"
          >
            <option value="">جميع الأنواع</option>
            {NOTIFICATION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="input"
          >
            <option value="">جميع القنوات</option>
            {CHANNELS.map((channel) => (
              <option key={channel.value} value={channel.value}>
                {channel.label}
              </option>
            ))}
          </select>
        </div>
        
        {(searchQuery || filterType || filterChannel) && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {filteredTemplates.length} من {templates.length} قالب
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterType('');
                setFilterChannel('');
              }}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              إعادة تعيين
            </button>
          </div>
        )}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">
              {searchQuery || filterType || filterChannel 
                ? 'لا توجد قوالب مطابقة للبحث' 
                : 'لا توجد قوالب بعد'}
            </p>
          </div>
        ) : (
          filteredTemplates.map((template) => (
          <div key={template.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{template.code}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {template.isActive ? 'نشط' : 'غير نشط'}
              </span>
            </div>

            {template.description && (
              <p className="text-sm text-gray-600 mb-3">{template.description}</p>
            )}

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">النوع:</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  {NOTIFICATION_TYPES.find(t => t.value === template.type)?.label || template.type}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">الأولوية:</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  template.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                  template.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                  template.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {PRIORITIES.find(p => p.value === template.priority)?.label}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {template.channels.map((channel) => (
                  <span key={channel} className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                    {CHANNELS.find(c => c.value === channel)?.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-2 rounded text-xs mb-3">
              <p className="font-semibold mb-1">{template.titleAr}</p>
              <p className="text-gray-600">{template.messageAr}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setPreviewTemplate(template);
                  setShowPreview(true);
                }}
                className="flex-1 btn-secondary text-sm py-2"
              >
                <Eye className="w-3 h-3 inline mr-1" />
                معاينة
              </button>
              <button
                onClick={() => handleEdit(template)}
                className="flex-1 btn-secondary text-sm py-2"
              >
                <Edit className="w-3 h-3 inline mr-1" />
                تعديل
              </button>
              <button
                onClick={() => handleDelete(template.id)}
                className="btn-danger text-sm py-2 px-3"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">
                  {editingTemplate ? 'تعديل القالب' : 'قالب جديد'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">كود القالب *</label>
                  <input
                    type="text"
                    required
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="input"
                    placeholder="SUBSCRIPTION_EXPIRING_30"
                  />
                </div>
                <div>
                  <label className="label">اسم القالب *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="تذكير انتهاء الاشتراك"
                  />
                </div>
              </div>

              <div>
                <label className="label">الوصف</label>
                <input
                  type="text"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  placeholder="وصف القالب"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">نوع الإشعار *</label>
                  <select
                    required
                    value={formData.type || ''}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input"
                  >
                    <option value="">اختر النوع</option>
                    {NOTIFICATION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">الأولوية *</label>
                  <select
                    required
                    value={formData.priority || 'MEDIUM'}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="input"
                  >
                    {PRIORITIES.map((priority) => (
                      <option key={priority.value} value={priority.value}>{priority.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">الحالة</label>
                  <select
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                    className="input"
                  >
                    <option value="true">نشط</option>
                    <option value="false">غير نشط</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">قنوات الإرسال *</label>
                <div className="flex flex-wrap gap-3">
                  {CHANNELS.map((channel) => (
                    <label key={channel.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.channels?.includes(channel.value)}
                        onChange={(e) => {
                          const channels = formData.channels || [];
                          if (e.target.checked) {
                            setFormData({ ...formData, channels: [...channels, channel.value] });
                          } else {
                            setFormData({ ...formData, channels: channels.filter(c => c !== channel.value) });
                          }
                        }}
                        className="checkbox"
                      />
                      <span className="text-sm">{channel.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">محتوى الإشعار داخل التطبيق</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">العنوان (عربي) *</label>
                    <input
                      type="text"
                      required
                      value={formData.titleAr || ''}
                      onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                      className="input"
                      placeholder="اشتراكك ينتهي قريباً"
                    />
                  </div>
                  <div>
                    <label className="label">العنوان (إنجليزي)</label>
                    <input
                      type="text"
                      value={formData.titleEn || ''}
                      onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                      className="input"
                      placeholder="Your subscription is expiring soon"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="label">الرسالة (عربي) *</label>
                    <textarea
                      required
                      value={formData.messageAr || ''}
                      onChange={(e) => setFormData({ ...formData, messageAr: e.target.value })}
                      className="input"
                      rows={3}
                      placeholder="يمكنك استخدام {{variableName}} للمتغيرات"
                    />
                  </div>
                  <div>
                    <label className="label">الرسالة (إنجليزي)</label>
                    <textarea
                      value={formData.messageEn || ''}
                      onChange={(e) => setFormData({ ...formData, messageEn: e.target.value })}
                      className="input"
                      rows={3}
                      placeholder="You can use {{variableName}} for variables"
                    />
                  </div>
                </div>
              </div>

              {formData.channels?.includes('EMAIL') && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">محتوى البريد الإلكتروني</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">موضوع البريد (عربي)</label>
                      <input
                        type="text"
                        value={formData.emailSubjectAr || ''}
                        onChange={(e) => setFormData({ ...formData, emailSubjectAr: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">موضوع البريد (إنجليزي)</label>
                      <input
                        type="text"
                        value={formData.emailSubjectEn || ''}
                        onChange={(e) => setFormData({ ...formData, emailSubjectEn: e.target.value })}
                        className="input"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="label">نص البريد (عربي)</label>
                      <textarea
                        value={formData.emailBodyAr || ''}
                        onChange={(e) => setFormData({ ...formData, emailBodyAr: e.target.value })}
                        className="input"
                        rows={4}
                      />
                    </div>
                    <div>
                      <label className="label">نص البريد (إنجليزي)</label>
                      <textarea
                        value={formData.emailBodyEn || ''}
                        onChange={(e) => setFormData({ ...formData, emailBodyEn: e.target.value })}
                        className="input"
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.channels?.includes('SMS') && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">محتوى الرسالة النصية</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">نص الرسالة (عربي)</label>
                      <textarea
                        value={formData.smsTemplateAr || ''}
                        onChange={(e) => setFormData({ ...formData, smsTemplateAr: e.target.value })}
                        className="input"
                        rows={2}
                        maxLength={160}
                        placeholder="حد أقصى 160 حرف"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {(formData.smsTemplateAr || '').length}/160 حرف
                      </p>
                    </div>
                    <div>
                      <label className="label">نص الرسالة (إنجليزي)</label>
                      <textarea
                        value={formData.smsTemplateEn || ''}
                        onChange={(e) => setFormData({ ...formData, smsTemplateEn: e.target.value })}
                        className="input"
                        rows={2}
                        maxLength={160}
                        placeholder="Max 160 characters"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {(formData.smsTemplateEn || '').length}/160 characters
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <button type="submit" className="btn-primary flex-1">
                  <Save className="w-4 h-4 inline ml-2" />
                  حفظ القالب
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  معاينة القالب
                </h2>
                <button onClick={() => setShowPreview(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Template Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{previewTemplate.name}</h3>
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    previewTemplate.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {previewTemplate.isActive ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  <strong>الكود:</strong> {previewTemplate.code}
                </p>
                {previewTemplate.description && (
                  <p className="text-sm text-gray-600">
                    <strong>الوصف:</strong> {previewTemplate.description}
                  </p>
                )}
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-2">
                    <strong>النوع:</strong>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {NOTIFICATION_TYPES.find(t => t.value === previewTemplate.type)?.label}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <strong>الأولوية:</strong>
                    <span className={`px-2 py-1 rounded ${
                      previewTemplate.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                      previewTemplate.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                      previewTemplate.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {PRIORITIES.find(p => p.value === previewTemplate.priority)?.label}
                    </span>
                  </span>
                </div>
                <div className="flex gap-2">
                  <strong className="text-sm">القنوات:</strong>
                  {previewTemplate.channels.map((channel) => (
                    <span key={channel} className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      {CHANNELS.find(c => c.value === channel)?.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Preview Content with Sample Data */}
              <div className="space-y-4">
                <div className="bg-blue-50 border-r-4 border-blue-500 p-4 rounded">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    مثال على البيانات الفعلية:
                  </h4>
                  <p className="text-sm text-blue-800">
                    سيتم استبدال المتغيرات بالقيم الفعلية عند الإرسال
                  </p>
                </div>

                {/* IN_APP Preview */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    داخل التطبيق (IN_APP)
                  </h4>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="font-bold text-gray-900 mb-2">
                      {previewTemplate.titleAr.replace(/\{\{(\w+)\}\}/g, (_, key) => {
                        const sampleData: Record<string, string> = {
                          userName: 'أحمد محمد',
                          businessName: 'مطعم النخيل',
                          packageName: 'الباقة الذهبية',
                          daysLeft: '7',
                          expiryDate: '2026-01-31',
                          reviewerName: 'سارة أحمد',
                          rating: '5',
                        };
                        return sampleData[key] || `{{${key}}}`;
                      })}
                    </p>
                    <p className="text-gray-700 text-sm">
                      {previewTemplate.messageAr.replace(/\{\{(\w+)\}\}/g, (_, key) => {
                        const sampleData: Record<string, string> = {
                          userName: 'أحمد محمد',
                          businessName: 'مطعم النخيل',
                          packageName: 'الباقة الذهبية',
                          daysLeft: '7',
                          expiryDate: '2026-01-31',
                          reviewerName: 'سارة أحمد',
                          rating: '5',
                          reviewText: 'خدمة ممتازة وطعام رائع!',
                        };
                        return sampleData[key] || `{{${key}}}`;
                      })}
                    </p>
                  </div>
                </div>

                {/* EMAIL Preview */}
                {previewTemplate.channels.includes('EMAIL') && previewTemplate.emailSubjectAr && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      البريد الإلكتروني (EMAIL)
                    </h4>
                    <div className="bg-white rounded-lg shadow-sm">
                      <div className="border-b p-3">
                        <p className="text-sm text-gray-600">الموضوع:</p>
                        <p className="font-semibold">
                          {previewTemplate.emailSubjectAr.replace(/\{\{(\w+)\}\}/g, (_, key) => {
                            const sampleData: Record<string, string> = {
                              userName: 'أحمد محمد',
                              businessName: 'مطعم النخيل',
                              packageName: 'الباقة الذهبية',
                            };
                            return sampleData[key] || `{{${key}}}`;
                          })}
                        </p>
                      </div>
                      <div className="p-4">
                        <div className="prose prose-sm max-w-none">
                          {previewTemplate.emailBodyAr?.replace(/\{\{(\w+)\}\}/g, (_, key) => {
                            const sampleData: Record<string, string> = {
                              userName: 'أحمد محمد',
                              businessName: 'مطعم النخيل',
                              packageName: 'الباقة الذهبية',
                              daysLeft: '7',
                              expiryDate: '2026-01-31',
                            };
                            return sampleData[key] || `{{${key}}}`;
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SMS Preview */}
                {previewTemplate.channels.includes('SMS') && previewTemplate.smsTemplateAr && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      رسالة نصية (SMS)
                    </h4>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <p className="text-sm">
                        {previewTemplate.smsTemplateAr.replace(/\{\{(\w+)\}\}/g, (_, key) => {
                          const sampleData: Record<string, string> = {
                            packageName: 'الباقة الذهبية',
                            daysLeft: '7',
                          };
                          return sampleData[key] || `{{${key}}}`;
                        })}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        الطول: {previewTemplate.smsTemplateAr.length} حرف
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Variables Guide Modal */}
      {showVariablesGuide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  دليل المتغيرات الديناميكية
                </h2>
                <button onClick={() => setShowVariablesGuide(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border-r-4 border-blue-500 p-4 rounded">
                <h4 className="font-semibold text-blue-900 mb-2">كيفية الاستخدام:</h4>
                <p className="text-sm text-blue-800">
                  استخدم الصيغة <code className="bg-blue-100 px-2 py-1 rounded">{'{{variableName}}'}</code> في نصوص القالب.
                  سيتم استبدال المتغيرات تلقائياً بالقيم الفعلية عند إرسال الإشعار.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 mb-3 pb-2 border-b">متغيرات المستخدم</h3>
                  {[
                    { var: 'userName', desc: 'اسم المستخدم' },
                    { var: 'userEmail', desc: 'البريد الإلكتروني' },
                    { var: 'userPhone', desc: 'رقم الهاتف' },
                  ].map((item) => (
                    <div key={item.var} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <code className="text-sm bg-gray-200 px-2 py-1 rounded">{`{{${item.var}}}`}</code>
                      <span className="text-sm text-gray-600">{item.desc}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 mb-3 pb-2 border-b">متغيرات النشاط التجاري</h3>
                  {[
                    { var: 'businessName', desc: 'اسم النشاط' },
                    { var: 'businessId', desc: 'معرف النشاط' },
                    { var: 'categoryName', desc: 'اسم الفئة' },
                  ].map((item) => (
                    <div key={item.var} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <code className="text-sm bg-gray-200 px-2 py-1 rounded">{`{{${item.var}}}`}</code>
                      <span className="text-sm text-gray-600">{item.desc}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 mb-3 pb-2 border-b">متغيرات الباقة/الاشتراك</h3>
                  {[
                    { var: 'packageName', desc: 'اسم الباقة' },
                    { var: 'expiryDate', desc: 'تاريخ الانتهاء' },
                    { var: 'daysLeft', desc: 'الأيام المتبقية' },
                    { var: 'price', desc: 'السعر' },
                  ].map((item) => (
                    <div key={item.var} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <code className="text-sm bg-gray-200 px-2 py-1 rounded">{`{{${item.var}}}`}</code>
                      <span className="text-sm text-gray-600">{item.desc}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 mb-3 pb-2 border-b">متغيرات التقييمات</h3>
                  {[
                    { var: 'reviewerName', desc: 'اسم المقيّم' },
                    { var: 'rating', desc: 'التقييم' },
                    { var: 'reviewText', desc: 'نص التقييم' },
                  ].map((item) => (
                    <div key={item.var} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <code className="text-sm bg-gray-200 px-2 py-1 rounded">{`{{${item.var}}}`}</code>
                      <span className="text-sm text-gray-600">{item.desc}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <h3 className="font-semibold text-gray-900 mb-3 pb-2 border-b">متغيرات عامة أخرى</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { var: 'reason', desc: 'السبب (للرفض)' },
                      { var: 'actionUrl', desc: 'رابط الإجراء' },
                      { var: 'date', desc: 'التاريخ' },
                      { var: 'time', desc: 'الوقت' },
                    ].map((item) => (
                      <div key={item.var} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <code className="text-sm bg-gray-200 px-2 py-1 rounded">{`{{${item.var}}}`}</code>
                        <span className="text-sm text-gray-600">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border-r-4 border-yellow-500 p-4 rounded">
                <h4 className="font-semibold text-yellow-900 mb-2">ملاحظات مهمة:</h4>
                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                  <li>استخدم نفس أسماء المتغيرات بالضبط (حساسة لحالة الأحرف)</li>
                  <li>تأكد من أن المتغيرات متوفرة في السياق عند إرسال الإشعار</li>
                  <li>المتغيرات غير المتوفرة ستبقى كما هي (مثل {'{{variableName}}'})</li>
                  <li>استخدم المعاينة لاختبار كيف ستظهر المتغيرات</li>
                </ul>
              </div>

              <div className="bg-green-50 border-r-4 border-green-500 p-4 rounded">
                <h4 className="font-semibold text-green-900 mb-2">مثال كامل:</h4>
                <div className="bg-white p-3 rounded text-sm">
                  <p className="mb-2">
                    <strong>العنوان:</strong> اشتراكك ينتهي قريباً يا {'{{userName}}'} 👋
                  </p>
                  <p>
                    <strong>الرسالة:</strong> مرحباً {'{{userName}}'}, سينتهي اشتراكك في باقة "{'{{packageName}}'}'" 
                    خلال {'{{daysLeft}}'} أيام بتاريخ {'{{expiryDate}}'}. جدّد الآن!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
