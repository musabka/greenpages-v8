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

// =================== Agent Balances & Collections ===================

/**
 * الحصول على أرصدة المندوبين (المبالغ في ذمتهم)
 */
export function useAgentsBalances(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['agents-balances', params],
    queryFn: async () => {
      const response = await api.get('/governorate-manager/financial/agents-balances', { params });
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

/**
 * الحصول على المقبوضات غير المسلمة لمندوب معين
 */
export function useAgentPendingCollections(agentProfileId: string | null) {
  return useQuery({
    queryKey: ['agent-pending-collections', agentProfileId],
    queryFn: async () => {
      if (!agentProfileId) return null;
      const response = await api.get(`/governorate-manager/financial/agents/${agentProfileId}/pending-collections`);
      return response.data;
    },
    enabled: !!agentProfileId,
  });
}

/**
 * استلام المبلغ من المندوب
 */
export function useReceivePaymentFromAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      agentProfileId,
      amount,
      collectionIds,
      notes,
      receiptNumber,
    }: {
      agentProfileId: string;
      amount?: number;
      collectionIds?: string[];
      notes?: string;
      receiptNumber?: string;
    }) => {
      const response = await api.post(
        `/governorate-manager/financial/agents/${agentProfileId}/receive-payment`,
        { amount, collectionIds, notes, receiptNumber }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents-balances'] });
      queryClient.invalidateQueries({ queryKey: ['agent-pending-collections'] });
      queryClient.invalidateQueries({ queryKey: ['manager-settlements'] });
      queryClient.invalidateQueries({ queryKey: ['manager-financial-stats'] });
    },
  });
}

// =================== FINANCIAL SETTLEMENTS ===================

/**
 * الحصول على تسويات المندوبين (لمدير المحافظة)
 */
export function useAgentFinancialSettlements(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['agent-financial-settlements-manager', params],
    queryFn: async () => {
      const response = await api.get('/financial-settlements/agent/manager-view', { params });
      return response.data;
    },
  });
}

/**
 * إنشاء تسوية مالية جديدة للمندوب
 */
export function useCreateAgentSettlement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ agentProfileId, notes }: { agentProfileId: string; notes?: string }) => {
      const response = await api.post('/financial-settlements/agent', { agentProfileId, notes });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-financial-settlements-manager'] });
      queryClient.invalidateQueries({ queryKey: ['agents-balances'] });
    },
  });
}

/**
 * تأكيد التسوية
 */
export function useConfirmAgentSettlement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ settlementId, notes, signature }: { 
      settlementId: string; 
      notes?: string; 
      signature?: string;
    }) => {
      const response = await api.put(`/financial-settlements/agent/${settlementId}/confirm`, { 
        notes, 
        signature 
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-financial-settlements-manager'] });
      queryClient.invalidateQueries({ queryKey: ['agents-balances'] });
      queryClient.invalidateQueries({ queryKey: ['manager-financial-stats'] });
    },
  });
}

/**
 * إلغاء التسوية
 */
export function useCancelAgentSettlement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settlementId: string) => {
      const response = await api.delete(`/financial-settlements/agent/${settlementId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-financial-settlements-manager'] });
    },
  });
}

/**
 * تفاصيل تسوية
 */
export function useAgentSettlementDetails(settlementId: string | null) {
  return useQuery({
    queryKey: ['agent-settlement-details', settlementId],
    queryFn: async () => {
      if (!settlementId) return null;
      const response = await api.get(`/financial-settlements/agent/${settlementId}`);
      return response.data;
    },
    enabled: !!settlementId,
  });
}

/**
 * الحصول على تسوياتي كمدير محافظة مع الشركة
 */
export function useManagerFinancialSettlements(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['manager-financial-settlements', params],
    queryFn: async () => {
      const response = await api.get('/financial-settlements/manager/my-settlements', { params });
      return response.data;
    },
  });
}

/**
 * تفاصيل تسوية المدير
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

