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
  Business,
  Category,
  Governorate,
  City,
  District,
  User,
  Review,
  Ad,
  Page,
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
    onError: () => toast.error('فشل في إضافة المستخدم'),
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
