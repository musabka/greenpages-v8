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

// Agent Invoices
export function useAgentInvoices(params?: {
  status?: string;
  page?: number;
  limit?: number;
  businessId?: string;
}) {
  return useQuery({
    queryKey: ['agent-invoices', params],
    queryFn: async () => {
      console.log('🔍 Fetching agent invoices with params:', params);
      console.log('📍 API baseURL:', api.defaults.baseURL);
      const response = await api.get('/agent-portal/invoices', { params });
      console.log('✅ Agent invoices response:', response.data);
      return response.data;
    },
  });
}

// Renew Business Package
export function useRenewPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      businessId: string;
      packageId: string;
      paymentMethod: 'CASH' | 'WALLET';
      notes?: string;
    }) => {
      const response = await api.post(`/agent-portal/businesses/${data.businessId}/renew`, {
        packageId: data.packageId,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['agent-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['agent-balance'] });
      queryClient.invalidateQueries({ queryKey: ['agent-renewals'] });
    },
  });
}

// Record Renewal Visit Result
export function useRecordRenewalVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      renewalId: string;
      outcome: 'ACCEPTED' | 'DECLINED' | 'POSTPONED' | 'NOT_AVAILABLE';
      newPackageId?: string;
      notes?: string;
      nextVisitDate?: string;
    }) => {
      const response = await api.post(`/agent-portal/renewals/${data.renewalId}/record-visit`, {
        outcome: data.outcome,
        newPackageId: data.newPackageId,
        notes: data.notes,
        nextVisitDate: data.nextVisitDate,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-renewals'] });
      queryClient.invalidateQueries({ queryKey: ['agent-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['agent-invoices'] });
    },
  });
}

// Agent Renewals
export function useAgentRenewals(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['agent-renewals', params],
    queryFn: async () => {
      const response = await api.get('/agent-portal/renewals', { params });
      return response.data;
    },
  });
}

// Agent Dashboard
export function useAgentDashboard() {
  return useQuery({
    queryKey: ['agent-dashboard'],
    queryFn: async () => {
      const response = await api.get('/agent-portal/dashboard');
      return response.data;
    },
    staleTime: 60_000,
  });
}

// Agent Businesses
export function useAgentBusinesses(params?: {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: ['agent-businesses', params],
    queryFn: async () => {
      const response = await api.get('/agent-portal/businesses', { params });
      return response.data;
    },
  });
}

// Agent Visits
export function useAgentVisits(params?: { status?: string; page?: number; limit?: number; date?: string }) {
  return useQuery({
    queryKey: ['agent-visits', params],
    queryFn: async () => {
      const response = await api.get('/agent-portal/visits', { params });
      return response.data;
    },
  });
}

// Create Visit
export function useCreateVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      purpose: string;
      governorateId: string;
      cityId?: string;
      businessId?: string;
      scheduledAt: Date;
      address?: string;
      notes?: string;
    }) => {
      const response = await api.post('/agent-portal/visits', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-visits'] });
      queryClient.invalidateQueries({ queryKey: ['agent-dashboard'] });
    },
  });
}

// Update Visit Status
export function useUpdateVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      visitId: string;
      status: string;
      outcome?: string;
      notes?: string;
    }) => {
      const response = await api.patch(`/agent-portal/visits/${data.visitId}`, {
        status: data.status,
        outcome: data.outcome,
        notes: data.notes,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-visits'] });
      queryClient.invalidateQueries({ queryKey: ['agent-dashboard'] });
    },
  });
}

// Available Packages
export function usePackages() {
  return useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const response = await api.get('/packages');
      return response.data;
    },
  });
}

// =================== FINANCIAL SETTLEMENTS ===================

// Get agent's financial settlements
export function useAgentFinancialSettlements(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['agent-financial-settlements', params],
    queryFn: async () => {
      const response = await api.get('/financial-settlements/agent/my-settlements', { params });
      return response.data;
    },
  });
}

// Get agent's financial settlements summary
export function useAgentFinancialSettlementsSummary() {
  return useQuery({
    queryKey: ['agent-financial-settlements-summary'],
    queryFn: async () => {
      const response = await api.get('/financial-settlements/agent/my-summary');
      return response.data;
    },
  });
}

// Get single settlement details
export function useAgentFinancialSettlementDetails(settlementId: string | null) {
  return useQuery({
    queryKey: ['agent-financial-settlement', settlementId],
    queryFn: async () => {
      if (!settlementId) return null;
      const response = await api.get(`/financial-settlements/agent/${settlementId}`);
      return response.data;
    },
    enabled: !!settlementId,
  });
}
