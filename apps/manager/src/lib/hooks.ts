'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  api,
  businessApi,
  categoryApi,
  governorateApi,
  cityApi,
  districtApi,
  reviewApi,
  adApi,
  pageApi,
  settingsApi,
  packageApi,
  managerPortalApi,
  type BusinessSearchParams,
  type Business,
  type Category,
  type Governorate,
  type City,
  type District,
  type Review,
  type Ad,
  type Page,
  type Setting,
} from './api';
import toast from 'react-hot-toast';

// ==================== Manager Portal Hooks ====================

export function useManagerDashboard() {
  return useQuery({
    queryKey: ['manager-dashboard'],
    queryFn: () => managerPortalApi.getDashboard().then(res => res.data),
  });
}

// ==================== Business Hooks ====================

export function useBusinesses(params?: BusinessSearchParams) {
  return useQuery({
    queryKey: ['businesses', params],
    queryFn: () => businessApi.getAll(params).then(res => res.data),
  });
}

export function useBusinessBySlug(slug: string) {
  return useQuery({
    queryKey: ['business', 'slug', slug],
    queryFn: () => businessApi.getBySlug(slug).then(res => res.data),
    enabled: !!slug,
  });
}

export function useBusinessById(id: string) {
  return useQuery({
    queryKey: ['business', id],
    queryFn: () => businessApi.getById(id).then(res => res.data),
    enabled: !!id,
  });
}

// Alias for shared pages copied from Admin
export function useBusiness(id: string) {
  return useQuery({
    queryKey: ['business', id],
    queryFn: () => api.get(`/governorate-manager/businesses/${id}`).then((res) => res.data),
    enabled: !!id,
  });
}

export function useFeaturedBusinesses(limit = 10) {
  return useQuery({
    queryKey: ['businesses', 'featured', limit],
    queryFn: () => businessApi.getFeatured(limit).then(res => res.data),
  });
}

export function useNearbyBusinesses(lat: number, lng: number, radius = 10) {
  return useQuery({
    queryKey: ['businesses', 'nearby', lat, lng, radius],
    queryFn: () => businessApi.getNearby(lat, lng, radius).then(res => res.data),
    enabled: !!lat && !!lng,
  });
}

export function useSearchBusinesses(query: string, params?: BusinessSearchParams) {
  return useQuery({
    queryKey: ['businesses', 'search', query, params],
    queryFn: () => businessApi.search(query, params).then(res => res.data),
    enabled: !!query,
  });
}

export function useIncrementBusinessViews() {
  return useMutation({
    mutationFn: (id: string) => businessApi.incrementViews(id),
  });
}

// ==================== Category Hooks ====================

export function useCategories(params?: { limit?: number; includeChildren?: boolean }) {
  return useQuery({
    queryKey: ['categories', params],
    queryFn: () => categoryApi.getAll(params).then(res => res.data),
  });
}

export function useCategoriesTree() {
  return useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: () => categoryApi.getAll({ includeChildren: true }).then((res: any) => res.data),
  });
}

export function useCategoryBySlug(slug: string) {
  return useQuery({
    queryKey: ['category', 'slug', slug],
    queryFn: () => categoryApi.getBySlug(slug).then(res => res.data),
    enabled: !!slug,
  });
}

export function useFeaturedCategories() {
  return useQuery({
    queryKey: ['categories', 'featured'],
    queryFn: () => categoryApi.getFeatured().then(res => res.data),
  });
}

export function useParentCategories() {
  return useQuery({
    queryKey: ['categories', 'parents'],
    queryFn: () => categoryApi.getParents().then(res => res.data),
  });
}

// ==================== Governorate Hooks ====================

export function useGovernorates(params?: { limit?: number }) {
  return useQuery({
    queryKey: ['governorates', params],
    queryFn: () =>
      governorateApi.getAll({ page: 1, limit: params?.limit ?? 1000 }).then(res => res.data.data),
  });
}

export function useGovernorateBySlug(slug: string) {
  return useQuery({
    queryKey: ['governorate', 'slug', slug],
    queryFn: () => governorateApi.getBySlug(slug).then(res => res.data),
    enabled: !!slug,
  });
}

// ==================== City Hooks ====================

export function useCities(governorateId?: string) {
  return useQuery({
    queryKey: ['cities', governorateId],
    queryFn: () =>
      cityApi.getAll({ page: 1, limit: 1000, governorateId }).then(res => res.data.data),
  });
}

export function useCityBySlug(slug: string) {
  return useQuery({
    queryKey: ['city', 'slug', slug],
    queryFn: () => cityApi.getBySlug(slug).then(res => res.data),
    enabled: !!slug,
  });
}

// ==================== District Hooks ====================

export function useDistricts(cityId?: string) {
  return useQuery({
    queryKey: ['districts', cityId],
    queryFn: () =>
      districtApi.getAll({ page: 1, limit: 1000, cityId }).then(res => res.data.data),
  });
}

export function useDistrictBySlug(slug: string) {
  return useQuery({
    queryKey: ['district', 'slug', slug],
    queryFn: () => districtApi.getBySlug(slug).then(res => res.data),
    enabled: !!slug,
  });
}

// ==================== Review Hooks ====================

export function useBusinessReviews(businessSlug: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: ['reviews', 'business', businessSlug, page, limit],
    queryFn: () => reviewApi.getByBusiness(businessSlug, page, limit).then(res => res.data),
    enabled: !!businessSlug,
  });
}

export function useMyReviews(page = 1, limit = 10, status?: string) {
  return useQuery({
    queryKey: ['reviews', 'me', page, limit, status],
    queryFn: () => reviewApi.getMine(page, limit, status).then(res => res.data),
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: reviewApi.create,
    onSuccess: (_, variables) => {
      const key = (variables as any).businessSlug || (variables as any).businessId;
      if (key) {
        queryClient.invalidateQueries({ queryKey: ['reviews', 'business', key] });
        queryClient.invalidateQueries({ queryKey: ['business', 'slug', key] });
        queryClient.invalidateQueries({ queryKey: ['business', key] });
      }
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
    },
  });
}

// ==================== Ad Hooks ====================

export function useAdsByPosition(position: string) {
  return useQuery({
    queryKey: ['ads', 'position', position],
    queryFn: () => adApi.getByPosition(position).then(res => res.data),
    enabled: !!position,
  });
}

export function useTrackAdImpression() {
  return useMutation({
    mutationFn: (id: string) => adApi.trackImpression(id),
  });
}

export function useTrackAdClick() {
  return useMutation({
    mutationFn: (id: string) => adApi.trackClick(id),
  });
}

// ==================== Business Mutations ====================

export function useCreateBusiness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Business>) => api.post('/governorate-manager/businesses', data).then((res) => res.data),
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
      api.put(`/governorate-manager/businesses/${id}`, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      toast.success('تم تحديث النشاط التجاري بنجاح');
    },
    onError: (err: any) => {
      const details = err?.response?.data?.message;
      toast.error(Array.isArray(details) ? details.join('، ') : details || 'فشل في تحديث النشاط التجاري');
    },
  });
}

// ==================== Package Hooks ====================

export function useBusinessPackage(businessId: string) {
  return useQuery({
    queryKey: ['business-package', businessId],
    queryFn: () => packageApi.getBusinessPackage(businessId).then((res) => res.data),
    enabled: !!businessId,
  });
}

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

// ==================== Page Hooks ====================

export function usePageBySlug(slug: string) {
  return useQuery({
    queryKey: ['page', 'slug', slug],
    queryFn: () => pageApi.getBySlug(slug).then(res => res.data),
    enabled: !!slug,
  });
}

// ==================== Settings Hooks ====================

export function usePublicSettings() {
  return useQuery({
    queryKey: ['settings', 'public'],
    queryFn: () => settingsApi.getPublic().then(res => res.data),
  });
}

export function useAllSettings(group?: string) {
  return useQuery({
    queryKey: ['settings', group || 'all'],
    queryFn: () => settingsApi.getAll(group).then(res => res.data),
  });
}

export function useSettingsByGroup(group: string) {
  return useQuery({
    queryKey: ['settings', 'group', group],
    queryFn: () => settingsApi.getByGroup(group).then(res => res.data),
    enabled: !!group,
  });
}

export function useSettingByKey(key: string) {
  return useQuery({
    queryKey: ['settings', 'key', key],
    queryFn: () => settingsApi.getByKey(key).then(res => res.data),
    enabled: !!key,
  });
}
