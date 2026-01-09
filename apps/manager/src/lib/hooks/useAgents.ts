import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Agent {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  governorates?: { governorate: { nameAr: string } }[];
  commissionRate?: number;
  _count?: {
    commissions?: number;
    visits?: number;
  };
  isActive: boolean;
}

interface AgentsResponse {
  data: Agent[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function useAgents(params?: { page?: number; limit?: number; isActive?: boolean; search?: string }) {
  return useQuery<AgentsResponse>({
    queryKey: ['manager-agents', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());
      if (params?.search) searchParams.append('search', params.search);

      const url = `/governorate-manager/agents${searchParams.toString() ? `?${searchParams}` : ''}`;
      const response = await api.get(url);
      
      // Handle different response formats
      if (response.data.data) {
        return response.data;
      }
      return {
        data: response.data,
        meta: {
          total: response.data.length,
          page: params?.page || 1,
          limit: params?.limit || 20,
          totalPages: 1,
        },
      };
    },
  });
}

export function useAgentDetails(agentId: string | null) {
  return useQuery<Agent>({
    queryKey: ['manager-agent-details', agentId],
    queryFn: async () => {
      const response = await api.get(`/governorate-manager/agents/${agentId}`);
      return response.data;
    },
    enabled: !!agentId,
  });
}
