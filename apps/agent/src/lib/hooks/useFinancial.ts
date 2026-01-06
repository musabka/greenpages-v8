import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

// Agent Financial Hooks
export function useAgentBalance() {
  return useQuery({
    queryKey: ['agent-balance'],
    queryFn: async () => {
      const response = await api.get('/financial/agent/balance');
      return response.data;
    },
  });
}

export function useAgentCollections(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['agent-collections', params],
    queryFn: async () => {
      const response = await api.get('/financial/agent/collections', { params });
      return response.data;
    },
  });
}

export function useAgentCommissions(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['agent-commissions', params],
    queryFn: async () => {
      const response = await api.get('/financial/agent/commissions', { params });
      return response.data;
    },
  });
}

export function useRecordCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { businessId: string; amount: number; packageId: string; notes?: string }) => {
      const response = await api.post('/financial/agent/collect', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-balance'] });
      queryClient.invalidateQueries({ queryKey: ['agent-collections'] });
    },
  });
}

export function useSubmitPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { amount: number; accountantId: string; notes?: string }) => {
      const response = await api.post('/financial/agent/submit-payment', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-balance'] });
      queryClient.invalidateQueries({ queryKey: ['agent-collections'] });
    },
  });
}
