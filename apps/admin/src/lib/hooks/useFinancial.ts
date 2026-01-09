import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';

// Admin Financial Hooks
export function useFinancialOverview() {
  return useQuery({
    queryKey: ['financial-overview'],
    queryFn: async () => {
      const response = await api.get('/financial/admin/overview');
      return response.data;
    },
  });
}

export function useManagerBalances(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['manager-balances', params],
    queryFn: async () => {
      const response = await api.get('/financial/admin/managers', { params });
      return response.data;
    },
  });
}

export function useUpdateManagerCommission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ managerId, rate, notes }: { 
      managerId: string; 
      rate: number;
      notes?: string;
    }) => {
      const response = await api.put(`/financial/admin/managers/${managerId}/commission`, {
        rate,
        notes,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-balances'] });
    },
  });
}

export function useReceivePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { 
      managerId: string;
      amount: number;
      notes?: string;
    }) => {
      const response = await api.post('/financial/admin/receive-payment', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-overview'] });
      queryClient.invalidateQueries({ queryKey: ['manager-balances'] });
    },
  });
}

// =================== MANAGER SETTLEMENTS ===================

/**
 * الحصول على جميع تسويات مدراء المحافظات
 */
export function useAllManagerSettlements(params?: { 
  status?: string; 
  page?: number; 
  limit?: number;
}) {
  return useQuery({
    queryKey: ['all-manager-settlements', params],
    queryFn: async () => {
      const response = await api.get('/financial-settlements/manager/all', { params });
      return response.data;
    },
  });
}

/**
 * تفاصيل تسوية مدير
 */
export function useManagerSettlementDetails(settlementId: string | null) {
  return useQuery({
    queryKey: ['manager-settlement-details', settlementId],
    queryFn: async () => {
      if (!settlementId) return null;
      const response = await api.get(`/financial-settlements/manager/${settlementId}`);
      return response.data;
    },
    enabled: !!settlementId,
  });
}

/**
 * إنشاء تسوية مالية لمدير محافظة
 */
export function useCreateManagerSettlement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ 
      managerId, 
      periodStart, 
      periodEnd, 
      notes 
    }: { 
      managerId: string; 
      periodStart: string; 
      periodEnd: string; 
      notes?: string;
    }) => {
      const response = await api.post(`/financial-settlements/manager/${managerId}`, { 
        periodStart, 
        periodEnd, 
        notes 
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-manager-settlements'] });
      queryClient.invalidateQueries({ queryKey: ['manager-balances'] });
    },
  });
}

/**
 * تأكيد تسوية المدير
 */
export function useConfirmManagerSettlement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ 
      settlementId, 
      notes, 
      signature 
    }: { 
      settlementId: string; 
      notes?: string; 
      signature?: string;
    }) => {
      const response = await api.put(`/financial-settlements/manager/${settlementId}/confirm`, { 
        notes, 
        signature 
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-manager-settlements'] });
      queryClient.invalidateQueries({ queryKey: ['manager-balances'] });
      queryClient.invalidateQueries({ queryKey: ['financial-overview'] });
    },
  });
}

/**
 * إلغاء تسوية المدير
 */
export function useCancelManagerSettlement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settlementId: string) => {
      const response = await api.delete(`/financial-settlements/manager/${settlementId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-manager-settlements'] });
    },
  });
}
