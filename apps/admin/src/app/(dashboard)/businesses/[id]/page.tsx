'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { ArrowRight, Edit, Loader2, MapPin, Phone, Image as ImageIcon } from 'lucide-react';
import { useBusiness } from '@/lib/hooks';
import type { Business, BusinessContact, BusinessMedia, BusinessWorkingHours } from '@/lib/api';

const statusLabels: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'مسودة', className: 'badge-gray' },
  PENDING: { label: 'قيد المراجعة', className: 'badge-warning' },
  APPROVED: { label: 'مُعتمد', className: 'badge-success' },
  REJECTED: { label: 'مرفوض', className: 'badge-danger' },
  SUSPENDED: { label: 'موقوف', className: 'badge-gray' },
  CLOSED: { label: 'مغلق', className: 'badge-gray' },
};

const DAY_LABEL: Record<string, string> = {
  SUNDAY: 'الأحد',
  MONDAY: 'الإثنين',
  TUESDAY: 'الثلاثاء',
  WEDNESDAY: 'الأربعاء',
  THURSDAY: 'الخميس',
  FRIDAY: 'الجمعة',
  SATURDAY: 'السبت',
};

export default function BusinessDetailsPage() {
  const params = useParams();
  const id = String((params as any)?.id ?? '');

  const { data: business, isLoading } = useBusiness(id);

  const primaryCategory = useMemo(() => {
    const categories = (business as any)?.categories as any[] | undefined;
    if (!categories?.length) return undefined;
    return categories.find((c) => c.isPrimary)?.category ?? categories[0].category;
  }, [business]);

  const contacts = ((business as any)?.contacts ?? []) as BusinessContact[];
  const media = ((business as any)?.media ?? []) as BusinessMedia[];
  const workingHours = ((business as any)?.workingHours ?? []) as BusinessWorkingHours[];

  const gallery = media.filter((m) => m.type === 'GALLERY' || m.type === 'IMAGE');

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Link href="/businesses" className="hover:text-gray-900">
              الأنشطة التجارية
            </Link>
            <ArrowRight className="w-4 h-4" />
            <span className="text-gray-900">عرض نشاط</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {business?.nameAr ?? 'عرض نشاط تجاري'}
          </h1>
          <p className="text-gray-600 mt-2">تفاصيل النشاط التجاري</p>
        </div>
        {business?.id ? (
          <Link href={`/businesses/${business.id}/edit`} className="btn btn-primary">
            <Edit className="w-4 h-4" />
            تعديل
          </Link>
        ) : null}
      </div>

      <div className="card">
        <div className="card-body">
          {isLoading ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري تحميل البيانات...
            </div>
          ) : !business ? (
            <div className="text-gray-600">لم يتم العثور على النشاط</div>
          ) : (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                    {(business as Business).logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={(business as Business).logo!} alt="logo" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{business.nameAr}</span>
                      <span className={`badge ${statusLabels[business.status]?.className ?? 'badge-gray'}`}>
                        {statusLabels[business.status]?.label ?? business.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {primaryCategory?.nameAr ? `التصنيف: ${primaryCategory.nameAr}` : '—'}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  تم الإنشاء: {new Date(business.createdAt).toLocaleDateString('ar-SY')}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h2 className="font-bold text-gray-900 mb-3">الوصف</h2>
                    <p className="text-gray-700 whitespace-pre-line">{business.descriptionAr ?? business.shortDescAr ?? '—'}</p>
                  </div>

                  <div>
                    <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> الموقع
                    </h2>
                    <div className="text-gray-700 space-y-1">
                      <div>المحافظة: {business.governorate?.nameAr ?? '—'}</div>
                      <div>المدينة: {business.city?.nameAr ?? '—'}</div>
                      <div>الحي: {business.district?.nameAr ?? '—'}</div>
                      <div>العنوان: {business.addressAr ?? '—'}</div>
                    </div>
                  </div>

                  <div>
                    <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Phone className="w-4 h-4" /> التواصل
                    </h2>
                    {contacts.length ? (
                      <div className="space-y-2">
                        {contacts.map((c, idx) => (
                          <div key={`${c.type}-${idx}`} className="text-gray-700">
                            <span className="text-gray-500">{c.type}:</span> {c.value}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-600">—</div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h2 className="font-bold text-gray-900 mb-3">ساعات العمل</h2>
                    {workingHours.length ? (
                      <div className="space-y-2 text-sm">
                        {workingHours.map((wh, idx) => (
                          <div key={`${wh.dayOfWeek}-${idx}`} className="flex items-center justify-between">
                            <span className="text-gray-700">{DAY_LABEL[wh.dayOfWeek] ?? wh.dayOfWeek}</span>
                            {wh.isClosed ? (
                              <span className="text-gray-500">مغلق</span>
                            ) : (
                              <span className="text-gray-500" dir="ltr">
                                {wh.openTime ?? '--:--'} - {wh.closeTime ?? '--:--'}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-600">—</div>
                    )}
                  </div>

                  <div>
                    <h2 className="font-bold text-gray-900 mb-3">الصور</h2>
                    {gallery.length ? (
                      <div className="grid grid-cols-2 gap-3">
                        {gallery.slice(0, 4).map((m, idx) => (
                          <div key={`${m.url}-${idx}`} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={m.url} alt="media" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-600">—</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
