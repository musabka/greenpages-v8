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
