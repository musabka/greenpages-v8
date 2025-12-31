import axios from 'axios';

// Default API runs on 3000; admin runs on 3001.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (typeof window === 'undefined') {
          return Promise.reject(error);
        }

        const refreshToken = localStorage.getItem('refreshToken') || localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
            refreshToken,
          });
          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.removeItem('access_token');
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'AGENT' | 'USER';
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
  isActive?: boolean;
  emailVerified?: boolean;
  isEmailVerified?: boolean;
  governorateId?: string;
  cityId?: string;
  districtId?: string;
  addressLine?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Business {
  id: string;
  slug: string;

  nameAr: string;
  nameEn?: string;
  shortDescAr?: string;
  shortDescEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;

  logo?: string;
  cover?: string;

  governorateId: string;
  cityId: string;
  districtId?: string;
  addressAr?: string;
  addressEn?: string;
  latitude?: number;
  longitude?: number;

  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'CLOSED';
  verificationStatus?: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  publishedAt?: string;

  isFeatured: boolean;
  isVerified: boolean;
  isActive?: boolean;

  viewsCount?: number;
  reviewsCount?: number;
  averageRating?: number | string;

  metaTitleAr?: string;
  metaTitleEn?: string;
  metaDescAr?: string;
  metaDescEn?: string;
  metaKeywordsAr?: string;
  metaKeywordsEn?: string;

  ownerId?: string;
  agentId?: string;
  createdById?: string;

  governorate?: Governorate;
  city?: City;
  district?: District;
  owner?: { id: string; email?: string; displayName?: string };
  agent?: { id: string; email?: string; displayName?: string };

  categories?: BusinessCategory[];
  contacts?: BusinessContact[];
  workingHours?: BusinessWorkingHours[];
  branches?: BusinessBranch[];
  persons?: BusinessPerson[];
  products?: BusinessProduct[];
  media?: BusinessMedia[];
  _count?: { reviews?: number; branches?: number };

  createdAt: string;
  updatedAt: string;
}

export interface BusinessCategory {
  businessId?: string;
  categoryId: string;
  isPrimary?: boolean;
  category?: Category;
}

export interface BusinessContact {
  type:
    | 'PHONE'
    | 'MOBILE'
    | 'WHATSAPP'
    | 'EMAIL'
    | 'WEBSITE'
    | 'FACEBOOK'
    | 'INSTAGRAM'
    | 'TWITTER'
    | 'LINKEDIN'
    | 'YOUTUBE'
    | 'TIKTOK'
    | 'TELEGRAM'
    | 'OTHER';
  value: string;
  label?: string;
  isPrimary?: boolean;
  isPublic?: boolean;
  sortOrder?: number;
}

export type DayOfWeek =
  | 'SUNDAY'
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY';

export interface BusinessWorkingHours {
  dayOfWeek: DayOfWeek;
  openTime?: string;
  closeTime?: string;
  isClosed?: boolean;
  is24Hours?: boolean;
}

export interface BusinessBranch {
  nameAr: string;
  nameEn?: string;
  cityId: string;
  districtId?: string;
  addressAr?: string;
  addressEn?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  isMain?: boolean;
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

export interface BusinessMedia {
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOGO' | 'COVER' | 'GALLERY';
  url: string;
  thumbnailUrl?: string;
  titleAr?: string;
  titleEn?: string;
  altAr?: string;
  altEn?: string;
  sortOrder?: number;
}

export interface Category {
  id: string;
  nameAr: string;
  nameEn?: string;
  slug: string;
  descriptionAr?: string;
  descriptionEn?: string;
  icon?: string;
  image?: string;
  color?: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  _count?: { businesses: number };
  metaTitleAr?: string;
  metaTitleEn?: string;
  metaDescAr?: string;
  metaDescEn?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Governorate {
  id: string;
  nameAr: string;
  nameEn?: string;
  slug: string;
  description?: string;
  isActive: boolean;
  sortOrder?: number;
  latitude?: number;
  longitude?: number;
  _count?: { cities: number; businesses: number };
  createdAt?: string;
  updatedAt?: string;
}

export interface City {
  id: string;
  nameAr: string;
  nameEn?: string;
  slug?: string;
  description?: string;
  governorateId: string;
  governorate?: Governorate;
  isActive: boolean;
  latitude?: number;
  longitude?: number;
  sortOrder?: number;
  _count?: { districts: number; businesses: number };
  createdAt?: string;
  updatedAt?: string;
}

export interface District {
  id: string;
  nameAr: string;
  nameEn?: string;
  slug?: string;
  description?: string;
  cityId: string;
  city?: City;
  isActive: boolean;
  latitude?: number;
  longitude?: number;
  sortOrder?: number;
  _count?: { businesses: number };
  createdAt?: string;
  updatedAt?: string;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  businessId: string;
  business?: Business;
  userId: string;
  user?: User;
  reply?: string;
  repliedAt?: string;
  createdAt: string;
}

export type AdStatus = 'DRAFT' | 'PENDING' | 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'REJECTED';
export type AdType = 'BANNER' | 'FEATURED' | 'SPONSORED' | 'POPUP';
export type AdPosition =
  | 'HOME_TOP'
  | 'HOME_MIDDLE'
  | 'HOME_BOTTOM'
  | 'SIDEBAR'
  | 'CATEGORY_TOP'
  | 'SEARCH_RESULTS'
  | 'BUSINESS_PAGE';

export interface Ad {
  id: string;
  businessId?: string;
  business?: { id: string; nameAr: string; slug: string } | Business;
  type: AdType;
  position: AdPosition;
  titleAr: string;
  titleEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  imageDesktop?: string;
  imageMobile?: string;
  linkUrl?: string;
  status: AdStatus;
  priority: number;
  startDate: string;
  endDate: string;
  impressions: number;
  clicks: number;
  // Geographic Targeting
  targetAllLocations?: boolean;
  targetGovernorateIds?: string[];
  targetCityIds?: string[];
  targetGovernorates?: { governorate: { id: string; nameAr: string } }[];
  targetCities?: { city: { id: string; nameAr: string } }[];
  createdAt?: string;
  updatedAt?: string;
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
  metaDescAr?: string;
  metaDescEn?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Setting {
  id: string;
  key: string;
  valueAr: string | null;
  valueEn: string | null;
  type: string;
  group: string;
  description?: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page?: number;
    // Some endpoints return `limit`, others return `pageSize`.
    limit?: number;
    pageSize?: number;
    totalPages?: number;
  };
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface DashboardStats {
  businesses: { total: number; pending: number; approved: number };
  users: { total: number; active: number };
  reviews: { total: number; pending: number };
  views: { total: number; today: number };
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<User>('/auth/me'),
  refreshToken: (refreshToken: string) =>
    api.post<{ accessToken: string }>('/auth/refresh', { refreshToken }),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get<DashboardStats>('/admin/stats'),
  getPendingBusinesses: (limit?: number) =>
    api.get<Business[]>('/admin/pending-businesses', { params: { limit } }),
  getPendingReviews: (limit?: number) =>
    api.get<Review[]>('/admin/pending-reviews', { params: { limit } }),
  getRecentActivity: (limit?: number) =>
    api.get<any[]>('/admin/recent-activity', { params: { limit } }),
};

// Business API
export const businessApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    categoryId?: string;
    governorateId?: string;
  }) => api.get<PaginatedResponse<Business>>('/businesses', { params }),
  getById: (id: string) => api.get<Business>(`/businesses/${id}`),
  create: (data: Partial<Business>) => api.post<Business>('/businesses', data),
  update: (id: string, data: Partial<Business>) =>
    api.put<Business>(`/businesses/${id}`, data),
  delete: (id: string) => api.delete(`/businesses/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/businesses/${id}/status`, { status }),
  approve: (id: string) => api.patch(`/businesses/${id}/status`, { status: 'APPROVED' }),
  reject: (id: string, _reason?: string) =>
    api.patch(`/businesses/${id}/status`, { status: 'REJECTED' }),
  suspend: (id: string, _reason?: string) =>
    api.patch(`/businesses/${id}/status`, { status: 'SUSPENDED' }),
};

// Category API
export const categoryApi = {
  getAll: (params?: { includeChildren?: boolean }) => {
    if (params?.includeChildren) {
      return api.get<Category[]>('/categories/tree');
    }
    return api.get<PaginatedResponse<Category>>('/categories');
  },
  getById: (id: string) => api.get<Category>(`/categories/${id}`),
  create: (data: Partial<Category>) => api.post<Category>('/categories', data),
  update: (id: string, data: Partial<Category>) =>
    api.put<Category>(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
  reorder: (items: { id: string; sortOrder: number }[]) =>
    api.post('/categories/reorder', { items }),
};

// Governorate API
export const governorateApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Governorate>>('/governorates', { params }),
  getById: (id: string) => api.get<Governorate>(`/governorates/${id}`),
  create: (data: Partial<Governorate>) =>
    api.post<Governorate>('/governorates', data),
  update: (id: string, data: Partial<Governorate>) =>
    api.put<Governorate>(`/governorates/${id}`, data),
  delete: (id: string) => api.delete(`/governorates/${id}`),
};

// City API
export const cityApi = {
  getAll: (params?: { page?: number; limit?: number; governorateId?: string }) =>
    api.get<PaginatedResponse<City>>('/cities', { params }),
  getById: (id: string) => api.get<City>(`/cities/${id}`),
  create: (data: Partial<City>) => api.post<City>('/cities', data),
  update: (id: string, data: Partial<City>) =>
    api.put<City>(`/cities/${id}`, data),
  delete: (id: string) => api.delete(`/cities/${id}`),
};

// District API
export const districtApi = {
  getAll: (params?: { page?: number; limit?: number; cityId?: string }) =>
    api.get<PaginatedResponse<District>>('/districts', { params }),
  getById: (id: string) => api.get<District>(`/districts/${id}`),
  create: (data: Partial<District>) => api.post<District>('/districts', data),
  update: (id: string, data: Partial<District>) =>
    api.put<District>(`/districts/${id}`, data),
  delete: (id: string) => api.delete(`/districts/${id}`),
};

// User API
export const userApi = {
  getAll: (params?: { page?: number; limit?: number; role?: string; search?: string }) =>
    api.get<PaginatedResponse<User>>('/users', { params }),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  create: (data: Partial<User> & { password: string }) =>
    api.post<User>('/users', data),
  update: (id: string, data: Partial<User>) =>
    api.put<User>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  activate: (id: string) => api.post(`/users/${id}/activate`),
  deactivate: (id: string) => api.post(`/users/${id}/deactivate`),
};

// Review API
export const reviewApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    businessId?: string;
  }) => api.get<PaginatedResponse<Review>>('/reviews', { params }),
  getById: (id: string) => api.get<Review>(`/reviews/${id}`),
  approve: (id: string) => api.patch(`/reviews/${id}/status`, { status: 'APPROVED' }),
  reject: (id: string) => api.patch(`/reviews/${id}/status`, { status: 'REJECTED' }),
  delete: (id: string) => api.delete(`/reviews/${id}`),
};

// Ad API
export const adApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; position?: string }) =>
    api.get<PaginatedResponse<Ad>>('/ads', { params }),
  getById: (id: string) => api.get<Ad>(`/ads/${id}`),
  create: (data: Partial<Ad>) => api.post<Ad>('/ads', data),
  update: (id: string, data: Partial<Ad>) => api.put<Ad>(`/ads/${id}`, data),
  delete: (id: string) => api.delete(`/ads/${id}`),
  pause: (id: string) => api.put<Ad>(`/ads/${id}`, { status: 'PAUSED' }),
  resume: (id: string) => api.put<Ad>(`/ads/${id}`, { status: 'ACTIVE' }),
};

// Page API
export const pageApi = {
  getAll: () => api.get<Page[]>('/pages'),
  getById: (id: string) => api.get<Page>(`/pages/${id}`),
  create: (data: Partial<Page>) => api.post<Page>('/pages', data),
  update: (id: string, data: Partial<Page>) =>
    api.put<Page>(`/pages/${id}`, data),
  delete: (id: string) => api.delete(`/pages/${id}`),
};

// Settings API
export const settingsApi = {
  getAll: () => api.get<Setting[]>('/settings'),
  getByGroup: (group: string) => api.get<Setting[]>(`/settings?group=${group}`),
  update: (key: string, data: { valueAr?: string; valueEn?: string }) =>
    api.put<Setting>(`/settings/${key}`, data),
  updateBulk: (settings: { key: string; valueAr?: string; valueEn?: string }[]) =>
    api.post('/settings/bulk', { settings }),
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
  // API currently does not expose delete endpoint for uploaded files.
  deleteImage: (_url: string) => Promise.reject(new Error('Delete image is not supported')),
};

export default api;
