import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_URL = `${API_BASE}/api/v1`;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export default api;

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 errors (token refresh)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          return api(originalRequest);
        }
      } catch (refreshError) {
        // Clear tokens and surface error without forced redirect
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }

    return Promise.reject(error);
  }
);

// API Types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Governorate {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  code: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  sortOrder: number;
  cities?: City[];
  _count?: {
    cities: number;
    businesses: number;
  };
}

export interface City {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  governorateId: string;
  governorate?: Governorate;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  sortOrder: number;
  districts?: District[];
  _count?: {
    districts: number;
    businesses: number;
  };
}

export interface District {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  cityId: string;
  city?: City;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  sortOrder: number;
  _count?: {
    businesses: number;
  };
}

export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  descriptionAr?: string;
  descriptionEn?: string;
  icon?: string;
  image?: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  metaTitleAr?: string;
  metaTitleEn?: string;
  metaDescriptionAr?: string;
  metaDescriptionEn?: string;
  _count?: {
    children: number;
    businesses: number;
  };
}

export interface BusinessContact {
  id: string;
  type: 'PHONE' | 'MOBILE' | 'WHATSAPP' | 'EMAIL' | 'WEBSITE' | 'FACEBOOK' | 'INSTAGRAM' | 'TWITTER' | 'LINKEDIN' | 'YOUTUBE' | 'TIKTOK' | 'TELEGRAM';
  value: string;
  label?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface BusinessWorkingHours {
  id?: string;
  dayOfWeek: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  openTime?: string;
  closeTime?: string;
  isClosed?: boolean;
}

export interface BusinessMedia {
  id: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOGO' | 'COVER';
  url: string;
  thumbnailUrl?: string;
  title?: string;
  altText?: string;
  sortOrder: number;
}

export interface BusinessBranch {
  id?: string;
  nameAr?: string;
  nameEn?: string;
  addressAr: string;
  addressEn?: string;
  phone?: string;
  email?: string;
  cityId: string;
  city?: City;
  districtId?: string;
  district?: District;
  latitude?: number;
  longitude?: number;
  isMainBranch?: boolean;
  isActive?: boolean;
}

export interface BusinessPerson {
  id?: string;
  nameAr: string;
  nameEn?: string;
  positionAr?: string;
  positionEn?: string;
  bioAr?: string;
  bioEn?: string;
  photo?: string;
  phone?: string;
  email?: string;
  isPublic?: boolean;
  sortOrder?: number;
}

export interface BusinessProduct {
  id?: string;
  type: 'PRODUCT' | 'SERVICE';
  nameAr: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  image?: string;
  price?: number;
  currency?: string;
  priceNote?: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
}

export type PackageStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type FeatureKey =
  | 'AD_ALLOWED'
  | 'SHOW_DESCRIPTION'
  | 'SHOW_GALLERY'
  | 'SHOW_TEAM'
  | 'SHOW_PRODUCTS'
  | 'SHOW_BRANCHES'
  | 'SHOW_WORKING_HOURS'
  | 'SHOW_REVIEWS'
  | 'SHOW_PHONE'
  | 'SHOW_WHATSAPP'
  | 'SHOW_EMAIL'
  | 'SHOW_WEBSITE'
  | 'SHOW_SOCIAL_LINKS'
  | 'SHOW_MAP'
  | 'SHOW_ADDRESS';

export type LimitKey =
  | 'MAX_BRANCHES'
  | 'MAX_PERSONS'
  | 'MAX_ADS'
  | 'MAX_GALLERY_PHOTOS'
  | 'MAX_PRODUCTS';

export interface PackageFeature {
  id?: string;
  packageId?: string;
  featureKey: FeatureKey;
  isEnabled: boolean;
}

export interface PackageLimit {
  id?: string;
  packageId?: string;
  limitKey: LimitKey;
  limitValue: number;
}

export interface Package {
  id: string;
  nameAr: string;
  nameEn?: string;
  slug: string;
  descriptionAr?: string;
  descriptionEn?: string;
  price: number | string;
  durationDays: number;
  status: PackageStatus;
  isPublic: boolean;
  isDefault: boolean;
  sortOrder: number;
  features?: PackageFeature[];
  limits?: PackageLimit[];
  _count?: {
    businessPackages?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BusinessPackage {
  id: string;
  businessId: string;
  packageId: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  autoRenew: boolean;
  overrideEnabled: boolean;
  overrideReason?: string;
  overrideExpiresAt?: string;
  overrideByUserId?: string;
  package?: Package;
  business?: Partial<Business>;
  createdAt: string;
  updatedAt: string;
}

export interface Business {
  id: string;
  nameAr: string;
  nameEn?: string;
  slug: string;
  descriptionAr?: string;
  descriptionEn?: string;
  shortDescAr?: string;
  shortDescEn?: string;
  logo?: string;
  cover?: string;
  addressAr?: string;
  addressEn?: string;
  governorateId: string;
  governorate?: Governorate;
  cityId: string;
  city?: City;
  districtId?: string;
  district?: District;
  categoryId: string;
  category?: Category;
  subcategoryId?: string;
  subcategory?: Category;
  latitude?: number;
  longitude?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  isFeatured: boolean;
  isVerified: boolean;
  isPremium: boolean;
  viewsCount: number;
  reviewsCount: number;
  averageRating: number;
  establishedYear?: number;
  employeesCount?: string;
  contacts?: BusinessContact[];
  workingHours?: BusinessWorkingHours[];
  branches?: BusinessBranch[];
  media?: BusinessMedia[];
  persons?: BusinessPerson[];
  products?: BusinessProduct[];
  categories?: { categoryId: string; isPrimary: boolean; category?: Category }[];
  owner?: {
    id: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    email?: string;
    phone?: string;
    avatar?: string;
  };
  package?: BusinessPackage;
  _count?: {
    reviews: number;
    branches: number;
  };
  tags: string[];
  metaTitleAr?: string;
  metaTitleEn?: string;
  metaDescriptionAr?: string;
  metaDescriptionEn?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  businessId: string;
  business?: Business;
  userId: string;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  rating: number;
  title?: string;
  content?: string;
  pros?: string;
  cons?: string;
  isVerified: boolean;
  isApproved: boolean;
  likesCount: number;
  createdAt: string;
}

export interface Ad {
  id: string;
  titleAr: string;
  titleEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  imageUrl: string;
  linkUrl?: string;
  type: 'BANNER' | 'SIDEBAR' | 'POPUP' | 'FEATURED' | 'SPONSORED';
  position: string;
  businessId?: string;
  business?: Business;
  startDate: string;
  endDate: string;
  isActive: boolean;
  impressions: number;
  clicks: number;
}

export interface Page {
  id: string;
  titleAr: string;
  titleEn?: string;
  slug: string;
  contentAr: string;
  contentEn?: string;
  isPublished: boolean;
  sortOrder: number;
  metaTitleAr?: string;
  metaTitleEn?: string;
  metaDescriptionAr?: string;
  metaDescriptionEn?: string;
}

export interface Setting {
  id: string;
  key: string;
  valueAr?: string;
  valueEn?: string;
  type?: 'text' | 'textarea' | 'number' | 'boolean' | 'json' | 'image';
  group?: string;
  description?: string;
  isPublic?: boolean;
}

// Search Params
export interface BusinessSearchParams {
  search?: string;
  governorateId?: string;
  cityId?: string;
  districtId?: string;
  categoryId?: string;
  subcategoryId?: string;
  featured?: boolean;
  verified?: boolean;
  status?: string;
  ownerStatus?: 'unclaimed' | 'claimed' | 'verified' | 'all';
  minRating?: number;
  tags?: string[];
  lat?: number;
  lng?: number;
  radius?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// API Functions
export const businessApi = {
  getAll: (params?: BusinessSearchParams) =>
    api.get<PaginatedResponse<Business>>('/businesses', { params }),

  getBySlug: (slug: string) =>
    api.get<Business>(`/businesses/slug/${slug}`),

  getById: (id: string) =>
    api.get<Business>(`/businesses/${id}`),

  create: (data: Partial<Business>) => api.post<Business>('/businesses', data),

  update: (id: string, data: Partial<Business>) => api.put<Business>(`/businesses/${id}`, data),

  getFeatured: (limit = 10) =>
    api.get<Business[]>('/businesses/featured', { params: { limit } }),

  getByCategory: (categoryId: string, params?: BusinessSearchParams) =>
    api.get<PaginatedResponse<Business>>('/businesses', { params: { ...params, categoryId } }),

  getNearby: (lat: number, lng: number, radius = 10) =>
    api.get<Business[]>('/businesses/nearby', { params: { lat, lng, radius } }),

  search: (query: string, params?: BusinessSearchParams) =>
    api.get<PaginatedResponse<Business>>('/businesses/search', { params: { ...params, q: query } }),

  incrementViews: (id: string) =>
    api.post(`/businesses/${id}/view`),
};

export const categoryApi = {
  getAll: (params?: { limit?: number; includeChildren?: boolean }) => {
    if (params?.includeChildren) {
      return api.get<Category[]>('/categories/tree');
    }
    return api.get<Category[]>('/categories', { params });
  },

  getBySlug: (slug: string) =>
    api.get<Category>(`/categories/slug/${slug}`),

  getFeatured: () =>
    api.get<Category[]>('/categories/featured'),

  getParents: () =>
    api.get<Category[]>('/categories/parents'),
};

export const governorateApi = {
  getAll: (params?: { limit?: number }) =>
    api.get<Governorate[]>('/governorates', { params }),

  getBySlug: (slug: string) =>
    api.get<Governorate>(`/governorates/slug/${slug}`),
};

export const cityApi = {
  getAll: (governorateId?: string) =>
    api.get<City[]>('/cities', { params: { governorateId } }),

  getBySlug: (slug: string) =>
    api.get<City>(`/cities/slug/${slug}`),
};

export const districtApi = {
  getAll: (cityId?: string) =>
    api.get<District[]>('/districts', { params: { cityId } }),

  getBySlug: (slug: string) =>
    api.get<District>(`/districts/slug/${slug}`),
};

export const reviewApi = {
  getByBusiness: (businessSlug: string, page = 1, limit = 10) =>
    api.get<PaginatedResponse<Review>>(`/reviews/business/${businessSlug}`, { params: { page, limit } }),

  getMine: (page = 1, limit = 10, status?: string) =>
    api.get<PaginatedResponse<Review>>('/reviews/me', { params: { page, limit, status } }),

  create: ({ businessSlug: _slug, ...payload }: { businessId: string; businessSlug?: string; rating: number; titleAr?: string; contentAr?: string; pros?: string[]; cons?: string[] }) =>
    api.post<Review>('/reviews', payload),
};

export const adApi = {
  getByPosition: (position: string) =>
    api.get<Ad[]>(`/ads/position/${position}`),

  trackImpression: (id: string) =>
    api.post(`/ads/${id}/impression`),

  trackClick: (id: string) =>
    api.post(`/ads/${id}/click`),
};

export const pageApi = {
  getBySlug: (slug: string) =>
    api.get<Page>(`/pages/slug/${slug}`),
};

// Upload API
export const uploadApi = {
  uploadImage: (file: File, folder?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) formData.append('folder', folder);
    return api.post<{ url: string }>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteImage: (_url: string) => Promise.reject(new Error('Delete image is not supported')),
};

// Package API
export const packageApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<PaginatedResponse<Package>>('/packages', { params }),
  getById: (id: string) => api.get<Package>(`/packages/${id}`),
  create: (data: Partial<Package>) => api.post<Package>('/packages', data),
  update: (id: string, data: Partial<Package>) =>
    api.put<Package>(`/packages/${id}`, data),
  delete: (id: string) => api.delete(`/packages/${id}`),
  setDefault: (id: string) => api.post(`/packages/${id}/set-default`),
  assignToBusiness: (data: { businessId: string; packageId: string; durationDays?: number; customExpiryDate?: string }) =>
    api.post('/packages/assign', data),
  getBusinessPackage: (businessId: string) =>
    api.get<BusinessPackage>(`/packages/business/${businessId}`),
  getExpiring: (days?: number) =>
    api.get<BusinessPackage[]>('/packages/expiring', { params: { days } }),
};

export const settingsApi = {
  getPublic: () =>
    api.get('/settings/public'),

  getAll: (group?: string) =>
    api.get('/settings', { params: { group } }),

  getByGroup: (group: string) =>
    api.get<Setting[]>('/settings', { params: { group } }),

  getByKey: (key: string) =>
    api.get<Setting>(`/settings/${key}`),
};

export const agentPortalApi = {
  getProfile: () =>
    api.get('/agent-portal/profile'),

  getDashboard: () =>
    api.get('/agent-portal/dashboard'),
};

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    governorateId?: string;
    cityId?: string;
    districtId?: string;
  }) =>
    api.post('/auth/register', data),

  me: () =>
    api.get('/auth/me'),

  logout: () =>
    api.post('/auth/logout'),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
};
