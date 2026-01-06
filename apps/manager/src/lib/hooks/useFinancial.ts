import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

// Manager Financial Hooks
export function useManagerBalance() {
  return useQuery({
    queryKey: ['manager-balance'],
    queryFn: async () => {
      const response = await api.get('/financial/manager/balance');
      return response.data;
    },
  });
}

export function useManagerAgents(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['manager-agents', params],
    queryFn: async () => {
      const response = await api.get('/financial/manager/agents', { params });
      return response.data;
    },
  });
}

export function useUpdateAgentSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ agentId, baseSalary, commissionRate }: { 
      agentId: string; 
      baseSalary: number; 
      commissionRate: number;
    }) => {
      const response = await api.put(`/financial/manager/agents/${agentId}`, {
        baseSalary,
        commissionRate,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-agents'] });
    },
  });
}

export function useManagerCommissionRate() {
  return useQuery({
    queryKey: ['manager-commission-rate'],
    queryFn: async () => {
      const response = await api.get('/financial/manager/commission-rate');
      return response.data;
    },
  });
}
