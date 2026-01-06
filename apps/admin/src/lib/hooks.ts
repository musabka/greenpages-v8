import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  dashboardApi,
  businessApi,
  categoryApi,
  governorateApi,
  cityApi,
  districtApi,
  userApi,
  reviewApi,
  adApi,
  pageApi,
  settingsApi,
  packageApi,
  renewalsApi,
  Business,
  Category,
  Governorate,
  City,
  District,
  User,
  Review,
  Ad,
  Page,
  Package,
  RenewalRecord,
} from './api';
import toast from 'react-hot-toast';

// Dashboard Hooks
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardApi.getStats().then((res) => res.data),
  });
}

export function usePendingBusinesses(limit?: number) {
  return useQuery({
    queryKey: ['dashboard', 'pending-businesses', limit],
    queryFn: () => dashboardApi.getPendingBusinesses(limit).then((res) => res.data),
  });
}

export function usePendingReviews(limit?: number) {
  return useQuery({
    queryKey: ['dashboard', 'pending-reviews', limit],
    queryFn: () => dashboardApi.getPendingReviews(limit).then((res) => res.data),
  });
}

// Business Hooks
export function useBusinesses(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  categoryId?: string;
  governorateId?: string;
  ownerStatus?: 'unclaimed' | 'claimed' | 'verified' | 'all';
}) {
  return useQuery({
    queryKey: ['businesses', params],
    queryFn: () => businessApi.getAll(params).then((res) => res.data),
  });
}

export function useBusiness(id: string) {
  return useQuery({
    queryKey: ['businesses', id],
    queryFn: () => businessApi.getById(id).then((res) => res.data),
    enabled: !!id,
  });
}

export function useCreateBusiness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Business>) => businessApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      toast.success('تم إضافة النشاط التجاري بنجاح');
    },
    onError: () => toast.error('فشل في إضافة النشاط التجاري'),
  });
}

export function useUpdateBusiness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Business> }) =>
      businessApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      toast.success('تم تحديث النشاط التجاري بنجاح');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message;
      console.error('❌ Update failed:', error?.response?.data);
      if (Array.isArray(message)) {
        console.error('📋 Validation errors:', message);
        message.forEach((msg, i) => console.error(`  ${i + 1}. ${msg}`));
      }
      const details = Array.isArray(message) ? message.join(' • ') : message;
      toast.error(details || 'فشل في تحديث النشاط التجاري');
    },
  });
}

export function useDeleteBusiness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => businessApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      toast.success('تم حذف النشاط التجاري بنجاح');
    },
    onError: () => toast.error('فشل في حذف النشاط التجاري'),
  });
}

export function useApproveBusiness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => businessApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('تم قبول النشاط التجاري');
    },
    onError: () => toast.error('فشل في قبول النشاط التجاري'),
  });
}

export function useRejectBusiness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      businessApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('تم رفض النشاط التجاري');
    },
    onError: () => toast.error('فشل في رفض النشاط التجاري'),
  });
}

// Category Hooks
export function useCategories(params?: { includeChildren?: boolean }) {
  return useQuery({
    queryKey: ['categories', params],
    queryFn: () => categoryApi.getAll(params).then((res) => res.data),
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: ['categories', id],
    queryFn: () => categoryApi.getById(id).then((res) => res.data),
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Category>) => categoryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('تم إضافة التصنيف بنجاح');
    },
    onError: () => toast.error('فشل في إضافة التصنيف'),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
      categoryApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('تم تحديث التصنيف بنجاح');
    },
    onError: () => toast.error('فشل في تحديث التصنيف'),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('تم حذف التصنيف بنجاح');
    },
    onError: () => toast.error('فشل في حذف التصنيف'),
  });
}

// Governorate Hooks
export function useGovernorates() {
  return useQuery({
    queryKey: ['governorates'],
    queryFn: () =>
      governorateApi.getAll({ page: 1, limit: 1000 }).then((res) => res.data.data),
  });
}

export function useGovernorate(id: string) {
  return useQuery({
    queryKey: ['governorates', id],
    queryFn: () => governorateApi.getById(id).then((res) => res.data),
    enabled: !!id,
  });
}

export function useCreateGovernorate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Governorate>) => governorateApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governorates'] });
      toast.success('تم إضافة المحافظة بنجاح');
    },
    onError: () => toast.error('فشل في إضافة المحافظة'),
  });
}

export function useUpdateGovernorate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Governorate> }) =>
      governorateApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governorates'] });
      toast.success('تم تحديث المحافظة بنجاح');
    },
    onError: () => toast.error('فشل في تحديث المحافظة'),
  });
}

export function useDeleteGovernorate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => governorateApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governorates'] });
      toast.success('تم حذف المحافظة بنجاح');
    },
    onError: () => toast.error('فشل في حذف المحافظة'),
  });
}

// City Hooks
export function useCities(governorateId?: string) {
  return useQuery({
    queryKey: ['cities', governorateId],
    queryFn: () =>
      cityApi.getAll({ page: 1, limit: 1000, governorateId }).then((res) => res.data.data),
  });
}

export function useCity(id: string) {
  return useQuery({
    queryKey: ['cities', id],
    queryFn: () => cityApi.getById(id).then((res) => res.data),
    enabled: !!id,
  });
}

export function useCreateCity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<City>) => cityApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      toast.success('تم إضافة المدينة بنجاح');
    },
    onError: () => toast.error('فشل في إضافة المدينة'),
  });
}

export function useUpdateCity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<City> }) =>
      cityApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      toast.success('تم تحديث المدينة بنجاح');
    },
    onError: () => toast.error('فشل في تحديث المدينة'),
  });
}

export function useDeleteCity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cityApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      toast.success('تم حذف المدينة بنجاح');
    },
    onError: () => toast.error('فشل في حذف المدينة'),
  });
}

// District Hooks
export function useDistricts(cityId?: string) {
  return useQuery({
    queryKey: ['districts', cityId],
    queryFn: () =>
      districtApi.getAll({ page: 1, limit: 1000, cityId }).then((res) => res.data.data),
  });
}

export function useDistrict(id: string) {
  return useQuery({
    queryKey: ['districts', id],
    queryFn: () => districtApi.getById(id).then((res) => res.data),
    enabled: !!id,
  });
}

export function useCreateDistrict() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<District>) => districtApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['districts'] });
      toast.success('تم إضافة الحي بنجاح');
    },
    onError: () => toast.error('فشل في إضافة الحي'),
  });
}

export function useUpdateDistrict() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<District> }) =>
      districtApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['districts'] });
      toast.success('تم تحديث الحي بنجاح');
    },
    onError: () => toast.error('فشل في تحديث الحي'),
  });
}

export function useDeleteDistrict() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => districtApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['districts'] });
      toast.success('تم حذف الحي بنجاح');
    },
    onError: () => toast.error('فشل في حذف الحي'),
  });
}

// User Hooks
export function useUsers(params?: {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => userApi.getAll(params).then((res) => res.data),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => userApi.getById(id).then((res) => res.data),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<User> & { password: string }) =>
      userApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('تم إضافة المستخدم بنجاح');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'فشل في إضافة المستخدم';
      toast.error(msg);
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      userApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('تم تحديث المستخدم بنجاح');
    },
    onError: () => toast.error('فشل في تحديث المستخدم'),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('تم حذف المستخدم بنجاح');
    },
    onError: () => toast.error('فشل في حذف المستخدم'),
  });
}

// Review Hooks
export function useReviews(params?: {
  page?: number;
  limit?: number;
  status?: string;
  businessId?: string;
}) {
  return useQuery({
    queryKey: ['reviews', params],
    queryFn: () => reviewApi.getAll(params).then((res) => res.data),
  });
}

export function useApproveReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reviewApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('تم قبول التقييم');
    },
    onError: () => toast.error('فشل في قبول التقييم'),
  });
}

export function useRejectReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reviewApi.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('تم رفض التقييم');
    },
    onError: () => toast.error('فشل في رفض التقييم'),
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reviewApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('تم حذف التقييم بنجاح');
    },
    onError: () => toast.error('فشل في حذف التقييم'),
  });
}

// Ad Hooks
export function useAds(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return useQuery({
    queryKey: ['ads', params],
    queryFn: () => adApi.getAll(params).then((res) => res.data),
  });
}

export function useAd(id: string) {
  return useQuery({
    queryKey: ['ads', id],
    queryFn: () => adApi.getById(id).then((res) => res.data),
    enabled: !!id,
  });
}

export function useCreateAd() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Ad>) => adApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      toast.success('تم إنشاء الإعلان بنجاح');
    },
    onError: () => toast.error('فشل في إنشاء الإعلان'),
  });
}

export function useUpdateAd() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Ad> }) =>
      adApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      toast.success('تم تحديث الإعلان بنجاح');
    },
    onError: () => toast.error('فشل في تحديث الإعلان'),
  });
}

export function useDeleteAd() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      toast.success('تم حذف الإعلان بنجاح');
    },
    onError: () => toast.error('فشل في حذف الإعلان'),
  });
}

export function usePauseAd() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adApi.pause(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      toast.success('تم إيقاف الإعلان');
    },
    onError: () => toast.error('فشل في إيقاف الإعلان'),
  });
}

export function useResumeAd() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adApi.resume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      toast.success('تم تشغيل الإعلان');
    },
    onError: () => toast.error('فشل في تشغيل الإعلان'),
  });
}

// Page Hooks
export function usePages() {
  return useQuery({
    queryKey: ['pages'],
    queryFn: () => pageApi.getAll().then((res) => res.data),
  });
}

export function usePage(id: string) {
  return useQuery({
    queryKey: ['pages', id],
    queryFn: () => pageApi.getById(id).then((res) => res.data),
    enabled: !!id,
  });
}

export function useCreatePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Page>) => pageApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      toast.success('تم إنشاء الصفحة بنجاح');
    },
    onError: () => toast.error('فشل في إنشاء الصفحة'),
  });
}

export function useUpdatePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Page> }) =>
      pageApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      toast.success('تم تحديث الصفحة بنجاح');
    },
    onError: () => toast.error('فشل في تحديث الصفحة'),
  });
}

export function useDeletePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pageApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      toast.success('تم حذف الصفحة بنجاح');
    },
    onError: () => toast.error('فشل في حذف الصفحة'),
  });
}

// Settings Hooks
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getAll().then((res) => res.data),
  });
}

export function useSettingsByGroup(group: string) {
  return useQuery({
    queryKey: ['settings', group],
    queryFn: () => settingsApi.getByGroup(group).then((res) => res.data),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: { key: string; valueAr?: string; valueEn?: string }[]) =>
      settingsApi.updateBulk(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('تم حفظ الإعدادات بنجاح');
    },
    onError: () => toast.error('فشل في حفظ الإعدادات'),
  });
}

// Package Hooks
export function usePackages(params?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['packages', params],
    queryFn: () => packageApi.getAll(params).then((res) => res.data),
  });
}

export function usePackage(id: string) {
  return useQuery({
    queryKey: ['packages', id],
    queryFn: () => packageApi.getById(id).then((res) => res.data),
    enabled: !!id,
  });
}

export function useCreatePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Package>) => packageApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast.success('تم إضافة الباقة بنجاح');
    },
    onError: () => toast.error('فشل في إضافة الباقة'),
  });
}

export function useUpdatePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Package> }) =>
      packageApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast.success('تم تحديث الباقة بنجاح');
    },
    onError: () => toast.error('فشل في تحديث الباقة'),
  });
}

export function useDeletePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => packageApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast.success('تم حذف الباقة بنجاح');
    },
    onError: () => toast.error('فشل في حذف الباقة'),
  });
}

export function useSetDefaultPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => packageApi.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast.success('تم تعيين الباقة الافتراضية بنجاح');
    },
    onError: () => toast.error('فشل في تعيين الباقة الافتراضية'),
  });
}

export function useBusinessPackage(businessId: string) {
  return useQuery({
    queryKey: ['business-package', businessId],
    queryFn: () => packageApi.getBusinessPackage(businessId).then((res) => res.data),
    enabled: !!businessId,
  });
}

export function useAssignPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { businessId: string; packageId: string; durationDays?: number; customExpiryDate?: string }) =>
      packageApi.assignToBusiness(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-package'] });
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      toast.success('تم تعيين الباقة بنجاح');
    },
    onError: () => toast.error('فشل في تعيين الباقة'),
  });
}

// ============================================
// Renewal Hooks - متابعة التجديدات
// ============================================

export function useRenewals(params?: {
  status?: string;
  agentId?: string;
  priority?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['renewals', params],
    queryFn: () => renewalsApi.getAll(params).then((res) => res.data),
  });
}

export function useRenewal(id: string) {
  return useQuery({
    queryKey: ['renewals', id],
    queryFn: () => renewalsApi.getById(id).then((res) => res.data),
    enabled: !!id,
  });
}

export function useRenewalStatistics(agentId?: string) {
  return useQuery({
    queryKey: ['renewals', 'statistics', agentId],
    queryFn: () => renewalsApi.getStatistics(agentId).then((res) => res.data),
  });
}

export function useAgentPerformance(agentId: string, fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: ['renewals', 'agent-performance', agentId, fromDate, toDate],
    queryFn: () => renewalsApi.getAgentPerformance(agentId, fromDate, toDate).then((res) => res.data),
    enabled: !!agentId,
  });
}

export function useCreateRenewal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      businessId: string;
      assignedAgentId?: string;
      priority?: number;
      internalNotes?: string;
    }) => renewalsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renewals'] });
      toast.success('تم إنشاء سجل التجديد بنجاح');
    },
    onError: () => toast.error('فشل في إنشاء سجل التجديد'),
  });
}

export function useAssignRenewalAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, agentId }: { id: string; agentId: string }) =>
      renewalsApi.assignAgent(id, agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renewals'] });
      toast.success('تم تعيين المندوب بنجاح');
    },
    onError: () => toast.error('فشل في تعيين المندوب'),
  });
}

export function useBulkAssignRenewalAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ renewalRecordIds, agentId }: { renewalRecordIds: string[]; agentId: string }) =>
      renewalsApi.bulkAssignAgent(renewalRecordIds, agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renewals'] });
      toast.success('تم تعيين المندوب للمجموعة بنجاح');
    },
    onError: () => toast.error('فشل في تعيين المندوب'),
  });
}

export function useUpdateRenewalStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status: string; notes?: string; nextFollowUpDate?: string } }) =>
      renewalsApi.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renewals'] });
      toast.success('تم تحديث الحالة بنجاح');
    },
    onError: () => toast.error('فشل في تحديث الحالة'),
  });
}

export function useAddRenewalContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      renewalRecordId: string;
      contactMethod: string;
      contactDate: string;
      duration?: number;
      outcome?: string;
      notes?: string;
      visitAddress?: string;
      visitLatitude?: number;
      visitLongitude?: number;
      nextContactDate?: string;
    }) => renewalsApi.addContact(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['renewals'] });
      queryClient.invalidateQueries({ queryKey: ['renewals', variables.renewalRecordId] });
      toast.success('تم تسجيل التواصل بنجاح');
    },
    onError: () => toast.error('فشل في تسجيل التواصل'),
  });
}

export function useRenewalContacts(renewalRecordId: string) {
  return useQuery({
    queryKey: ['renewals', renewalRecordId, 'contacts'],
    queryFn: () => renewalsApi.getContacts(renewalRecordId).then((res) => res.data),
    enabled: !!renewalRecordId,
  });
}

export function useProcessRenewalDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: {
      id: string;
      data: {
        decision: string;
        notes?: string;
        newPackageId?: string;
        customExpiryDate?: string;
        durationDays?: number;
        postponeUntil?: string;
      };
    }) => renewalsApi.processDecision(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renewals'] });
      queryClient.invalidateQueries({ queryKey: ['business-package'] });
      toast.success('تم معالجة القرار بنجاح');
    },
    onError: () => toast.error('فشل في معالجة القرار'),
  });
}

export function useGenerateRenewals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => renewalsApi.generate(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renewals'] });
      toast.success('تم إنشاء سجلات التجديد بنجاح');
    },
    onError: () => toast.error('فشل في إنشاء سجلات التجديد'),
  });
}
