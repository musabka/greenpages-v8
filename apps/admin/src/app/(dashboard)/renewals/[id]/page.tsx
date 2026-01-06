'use client';

import { useState, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  Phone,
  User,
  Calendar,
  Clock,
  MapPin,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Package,
  Plus,
  Loader2,
  PhoneCall,
  Mail,
  MessageCircle,
} from 'lucide-react';
import {
  useRenewal,
  useRenewalContacts,
  useAddRenewalContact,
  useProcessRenewalDecision,
  useUpdateRenewalStatus,
  usePackages,
} from '@/lib/hooks';
import { PackageSelector } from '@/components/packages/package-selector';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'بانتظار التواصل', color: 'bg-gray-100 text-gray-700' },
  CONTACTED: { label: 'تم التواصل', color: 'bg-blue-100 text-blue-700' },
  VISIT_SCHEDULED: { label: 'موعد زيارة', color: 'bg-purple-100 text-purple-700' },
  VISITED: { label: 'تمت الزيارة', color: 'bg-indigo-100 text-indigo-700' },
  RENEWED: { label: 'تم التجديد', color: 'bg-green-100 text-green-700' },
  DECLINED: { label: 'رفض التجديد', color: 'bg-red-100 text-red-700' },
  POSTPONED: { label: 'تم التأجيل', color: 'bg-yellow-100 text-yellow-700' },
  NO_RESPONSE: { label: 'لا يوجد رد', color: 'bg-orange-100 text-orange-700' },
  EXPIRED: { label: 'انتهت بدون تجديد', color: 'bg-red-100 text-red-700' },
};

const CONTACT_METHOD_MAP: Record<string, { label: string; icon: any }> = {
  PHONE_CALL: { label: 'مكالمة هاتفية', icon: PhoneCall },
  WHATSAPP: { label: 'واتساب', icon: MessageCircle },
  VISIT: { label: 'زيارة ميدانية', icon: MapPin },
  EMAIL: { label: 'بريد إلكتروني', icon: Mail },
  SMS: { label: 'رسالة نصية', icon: MessageSquare },
};

const DECISION_MAP: Record<string, { label: string; color: string }> = {
  ACCEPTED: { label: 'قبول التجديد', color: 'text-green-600' },
  DECLINED: { label: 'رفض التجديد', color: 'text-red-600' },
  THINKING: { label: 'يفكر', color: 'text-yellow-600' },
  UPGRADE: { label: 'ترقية', color: 'text-blue-600' },
  DOWNGRADE: { label: 'تخفيض', color: 'text-orange-600' },
};

export default function RenewalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: renewal, isLoading } = useRenewal(id);
  const { data: contacts = [] } = useRenewalContacts(id);
  const { data: packagesData } = usePackages({ status: 'ACTIVE', limit: 50 });
  const packages = Array.isArray(packagesData) ? packagesData : packagesData?.data || [];

  const addContact = useAddRenewalContact();
  const processDecision = useProcessRenewalDecision();
  const updateStatus = useUpdateRenewalStatus();

  const [showContactForm, setShowContactForm] = useState(false);
  const [showDecisionForm, setShowDecisionForm] = useState(false);

  // Contact form state
  const [contactMethod, setContactMethod] = useState('PHONE_CALL');
  const [contactDate, setContactDate] = useState(new Date().toISOString().slice(0, 16));
  const [duration, setDuration] = useState('');
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [nextContactDate, setNextContactDate] = useState('');

  // Decision form state
  const [decision, setDecision] = useState('');
  const [newPackageId, setNewPackageId] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [customExpiryDate, setCustomExpiryDate] = useState('');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [postponeUntil, setPostponeUntil] = useState('');

  const handleAddContact = async () => {
    await addContact.mutateAsync({
      renewalRecordId: id,
      contactMethod,
      contactDate,
      duration: duration ? parseInt(duration) : undefined,
      outcome: outcome || undefined,
      notes: notes || undefined,
      nextContactDate: nextContactDate || undefined,
    });
    setShowContactForm(false);
    resetContactForm();
  };

  const handleProcessDecision = async () => {
    await processDecision.mutateAsync({
      id,
      data: {
        decision,
        notes: decisionNotes || undefined,
        newPackageId: newPackageId || undefined,
        durationDays: durationDays ? parseInt(durationDays) : undefined,
        customExpiryDate: customExpiryDate || undefined,
        postponeUntil: postponeUntil || undefined,
      },
    });
    setShowDecisionForm(false);
  };

  const resetContactForm = () => {
    setContactMethod('PHONE_CALL');
    setContactDate(new Date().toISOString().slice(0, 16));
    setDuration('');
    setOutcome('');
    setNotes('');
    setNextContactDate('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!renewal) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">سجل التجديد غير موجود</p>
      </div>
    );
  }

  const status = STATUS_MAP[renewal.status] || STATUS_MAP.PENDING;
  const daysRemaining = Math.ceil((new Date(renewal.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div>
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="page-title">تفاصيل سجل التجديد</h1>
            <p className="text-gray-500 mt-1">{renewal.business.nameAr}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Info Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-600" />
              معلومات النشاط التجاري
            </h2>
            <div className="flex items-start gap-4">
              {renewal.business.logo ? (
                <img
                  src={renewal.business.logo}
                  alt={renewal.business.nameAr}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <Link
                  href={`/businesses/${renewal.businessId}`}
                  className="text-lg font-semibold text-gray-900 hover:text-primary-600"
                >
                  {renewal.business.nameAr}
                </Link>
                {renewal.business.nameEn && (
                  <p className="text-gray-500">{renewal.business.nameEn}</p>
                )}
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                  {renewal.business.phone && (
                    <a href={`tel:${renewal.business.phone}`} className="flex items-center gap-1 hover:text-primary-600">
                      <Phone className="w-4 h-4" />
                      {renewal.business.phone}
                    </a>
                  )}
                  {renewal.business.mobile && (
                    <a href={`tel:${renewal.business.mobile}`} className="flex items-center gap-1 hover:text-primary-600">
                      <Phone className="w-4 h-4" />
                      {renewal.business.mobile}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Owner Info - يتم تحميله من البيانات الموسعة */}
            {(renewal as any).business?.owner && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">صاحب النشاط</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {(renewal as any).business.owner.firstName} {(renewal as any).business.owner.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{(renewal as any).business.owner.phone}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contact History */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary-600" />
                سجل التواصل
              </h2>
              <button
                onClick={() => setShowContactForm(true)}
                className="btn-primary !py-2 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                تسجيل تواصل
              </button>
            </div>

            {contacts.length === 0 ? (
              <p className="text-center py-8 text-gray-500">لا يوجد سجل تواصل بعد</p>
            ) : (
              <div className="space-y-4">
                {contacts.map((contact: any) => {
                  const method = CONTACT_METHOD_MAP[contact.contactMethod] || CONTACT_METHOD_MAP.PHONE_CALL;
                  const MethodIcon = method.icon;
                  const outcomeInfo = contact.outcome ? DECISION_MAP[contact.outcome] : null;

                  return (
                    <div key={contact.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <MethodIcon className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{method.label}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(contact.contactDate).toLocaleString('ar-SY')}
                              {contact.duration && ` • ${contact.duration} دقيقة`}
                            </p>
                          </div>
                        </div>
                        {outcomeInfo && (
                          <span className={`text-sm font-medium ${outcomeInfo.color}`}>
                            {outcomeInfo.label}
                          </span>
                        )}
                      </div>
                      {contact.notes && (
                        <p className="mt-3 text-gray-600 text-sm bg-gray-50 rounded-lg p-3">
                          {contact.notes}
                        </p>
                      )}
                      {contact.agent && (
                        <p className="mt-2 text-xs text-gray-400">
                          بواسطة: {contact.agent.firstName} {contact.agent.lastName}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Package Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary-600" />
              معلومات الباقة
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">الباقة الحالية</p>
                <p className="font-medium text-gray-900">{renewal.currentPackage.nameAr}</p>
                <p className="text-sm text-primary-600">
                  {Number(renewal.currentPackage.price).toLocaleString('ar-SY')} ل.س
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">تاريخ الانتهاء</p>
                <p className="font-medium text-gray-900">
                  {new Date(renewal.expiryDate).toLocaleDateString('ar-SY')}
                </p>
                <p className={`text-sm ${daysRemaining <= 0 ? 'text-red-600 font-bold' : daysRemaining <= 7 ? 'text-orange-600' : 'text-gray-500'}`}>
                  {daysRemaining <= 0 ? '⚠️ منتهية' : `${daysRemaining} يوم متبقي`}
                </p>
              </div>
              {renewal.newPackage && (
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-500">الباقة الجديدة</p>
                  <p className="font-medium text-green-600">{renewal.newPackage.nameAr}</p>
                </div>
              )}
            </div>
          </div>

          {/* Agent Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-600" />
              المندوب المسؤول
            </h2>
            {renewal.assignedAgent ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {renewal.assignedAgent.firstName} {renewal.assignedAgent.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{renewal.assignedAgent.phone}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">لم يتم تعيين مندوب بعد</p>
            )}
          </div>

          {/* Actions */}
          {!['RENEWED', 'DECLINED', 'EXPIRED'].includes(renewal.status) && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">الإجراءات</h2>
              <div className="space-y-3">
                <button
                  onClick={() => setShowDecisionForm(true)}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  تسجيل قرار العميل
                </button>
                <button
                  onClick={() => updateStatus.mutate({ id, data: { status: 'NO_RESPONSE' } })}
                  className="w-full btn-secondary flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  لا يوجد رد
                </button>
              </div>
            </div>
          )}

          {/* Notes */}
          {renewal.internalNotes && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">ملاحظات داخلية</h2>
              <p className="text-gray-600 text-sm whitespace-pre-wrap">{renewal.internalNotes}</p>
            </div>
          )}
        </div>

        {/* Sidebar - Package Information */}
        <div className="lg:col-span-1 space-y-6">
          {/* Current Package */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary-600" />
              الباقة الحالية
            </h2>
            {renewal.currentPackage ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">اسم الباقة</p>
                  <p className="font-semibold text-gray-900">{renewal.currentPackage.nameAr}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">السعر</p>
                  <p className="font-semibold text-gray-900">
                    {renewal.currentPackage.price ? `${Number(renewal.currentPackage.price).toFixed(2)} $` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">المدة</p>
                  <p className="font-semibold text-gray-900">{renewal.currentPackage.durationDays} يوم</p>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">حالة الصلاحية</p>
                  <div className="flex items-center gap-2">
                    {daysRemaining > 0 ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">نشطة</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-600">منتهية</span>
                      </>
                    )}
                  </div>
                  <p className={`text-sm mt-2 ${daysRemaining <= 0 ? 'text-red-600 font-bold' : daysRemaining <= 7 ? 'text-orange-600' : 'text-gray-500'}`}>
                    {daysRemaining <= 0 ? '⚠️ منتهية' : `${daysRemaining} يوم متبقي`}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">لا توجد معلومات باقة</p>
            )}
          </div>

          {/* New Package (if exists) */}
          {renewal.newPackage && (
            <div className="bg-green-50 rounded-lg border border-green-200 p-6">
              <h2 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                الباقة الجديدة
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-green-700">اسم الباقة</p>
                  <p className="font-semibold text-green-900">{renewal.newPackage.nameAr}</p>
                </div>
                <div>
                  <p className="text-sm text-green-700">السعر</p>
                  <p className="font-semibold text-green-900">
                    {renewal.newPackage.price ? `${Number(renewal.newPackage.price).toFixed(2)} $` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-green-700">المدة</p>
                  <p className="font-semibold text-green-900">{renewal.newPackage.durationDays} يوم</p>
                </div>
              </div>
            </div>
          )}

          {/* Renewal Information Summary */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              ملخص التجديد
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-blue-700">تاريخ الانتهاء:</span>
                <span className="font-semibold text-blue-900">
                  {new Date(renewal.expiryDate).toLocaleDateString('ar-SY')}
                </span>
              </div>
              {renewal.finalDecision && (
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">القرار النهائي:</span>
                  <span className={`font-semibold ${DECISION_MAP[renewal.finalDecision]?.color}`}>
                    {DECISION_MAP[renewal.finalDecision]?.label}
                  </span>
                </div>
              )}
              {renewal.decisionDate && (
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">تاريخ القرار:</span>
                  <span className="font-semibold text-blue-900">
                    {new Date(renewal.decisionDate).toLocaleDateString('ar-SY')}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-blue-700">عدد التواصلات:</span>
                <span className="font-semibold text-blue-900">{contacts.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">تسجيل تواصل جديد</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">طريقة التواصل</label>
                <select
                  value={contactMethod}
                  onChange={(e) => setContactMethod(e.target.value)}
                  className="input-field"
                >
                  {Object.entries(CONTACT_METHOD_MAP).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ ووقت التواصل</label>
                <input
                  type="datetime-local"
                  value={contactDate}
                  onChange={(e) => setContactDate(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المدة (بالدقائق)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="input-field"
                  placeholder="اختياري"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نتيجة التواصل</label>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="input-field"
                >
                  <option value="">لم يتم تحديد</option>
                  {Object.entries(DECISION_MAP).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="تفاصيل المحادثة..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">موعد التواصل التالي</label>
                <input
                  type="datetime-local"
                  value={nextContactDate}
                  onChange={(e) => setNextContactDate(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={() => setShowContactForm(false)} className="btn-secondary">
                إلغاء
              </button>
              <button
                onClick={handleAddContact}
                disabled={addContact.isPending}
                className="btn-primary"
              >
                {addContact.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decision Form Modal */}
      {showDecisionForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">تسجيل قرار العميل</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">القرار</label>
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  className="input-field"
                >
                  <option value="">اختر القرار</option>
                  <option value="ACCEPTED">قبول التجديد</option>
                  <option value="UPGRADE">ترقية لباقة أعلى</option>
                  <option value="DOWNGRADE">تخفيض لباقة أقل</option>
                  <option value="DECLINED">رفض التجديد</option>
                  <option value="THINKING">يفكر (تأجيل)</option>
                </select>
              </div>

              {['ACCEPTED', 'UPGRADE', 'DOWNGRADE'].includes(decision) && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800 font-medium mb-2">
                      💡 اختيار الباقة والمدة
                    </p>
                    <p className="text-xs text-blue-600">
                      اختر الباقة المناسبة والمدة المطلوبة. يمكنك استخدام الفترات المحددة مسبقاً أو تحديد تاريخ انتهاء مخصص.
                    </p>
                  </div>
                  
                  <PackageSelector
                    businessId={String(renewal.business.id)}
                    selectedPackageId={newPackageId}
                    onPackageSelect={(id) => setNewPackageId(id || '')}
                    durationDays={durationDays ? Number(durationDays) : 0}
                    onDurationDaysChange={(days) => setDurationDays(String(days))}
                    customExpiryDate={customExpiryDate}
                    onCustomExpiryDateChange={setCustomExpiryDate}
                  />
                </div>
              )}

              {decision === 'THINKING' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">موعد المتابعة</label>
                  <input
                    type="datetime-local"
                    value={postponeUntil}
                    onChange={(e) => setPostponeUntil(e.target.value)}
                    className="input-field"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                <textarea
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="أي ملاحظات إضافية..."
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={() => setShowDecisionForm(false)} className="btn-secondary">
                إلغاء
              </button>
              <button
                onClick={handleProcessDecision}
                disabled={processDecision.isPending || !decision}
                className="btn-primary"
              >
                {processDecision.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تأكيد'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
