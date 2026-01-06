'use client';

import { useEffect, useState, use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';
import {
  User,
  MapPin,
  Phone,
  Mail,
  Save,
  ArrowRight,
  DollarSign,
} from 'lucide-react';
import Link from 'next/link';
import { useGovernorates } from '@/lib/hooks';
import { formatNumber } from '@/lib/format';

export default function AgentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: agentId } = use(params);
  const queryClient = useQueryClient();

  const [salary, setSalary] = useState<string>('');
  const [commission, setCommission] = useState<string>('');
  const [managedGovernorateIds, setManagedGovernorateIds] = useState<string[]>([]);

  const { data: governoratesData } = useGovernorates();
  const governorates = (governoratesData as any[]) ?? [];

  const { data: agent, isLoading, isError } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      const res = await api.get(`/governorate-manager/agents/${agentId}`);
      return res.data;
    },
  });

  // Update local state when data loads
  useEffect(() => {
    if (!agent) return;
    setSalary((agent.baseSalary ?? '').toString());
    setCommission((agent.commissionRate ?? '').toString());
    setManagedGovernorateIds(agent.governorates?.map((g: any) => g.governorateId) || []);
  }, [agent]);

  const updateFinancialsMutation = useMutation({
    mutationFn: async (data: { baseSalary: number; commissionRate: number }) => {
      await api.patch(`/governorate-manager/agents/${agentId}/financials`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
      alert('تم تحديث البيانات المالية بنجاح');
    },
    onError: () => {
      alert('حدث خطأ أثناء التحديث');
    },
  });

  const updateGovernoratesMutation = useMutation({
    mutationFn: async (governorateIds: string[]) => {
      await api.patch(`/governorate-manager/agents/${agentId}/governorates`, { governorateIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
      alert('تم تحديث المحافظات المخصصة بنجاح');
    },
    onError: () => {
      alert('حدث خطأ أثناء التحديث');
    },
  });

  const handleSaveFinancials = () => {
    updateFinancialsMutation.mutate({
      baseSalary: Number(salary),
      commissionRate: Number(commission),
    });
  };

  const handleSaveGovernorates = () => {
    if (managedGovernorateIds.length === 0) {
      alert('يجب اختيار محافظة واحدة على الأقل');
      return;
    }
    updateGovernoratesMutation.mutate(managedGovernorateIds);
  };

  if (isLoading) return <div className="p-8 text-center">جاري التحميل...</div>;
  if (isError) return <div className="p-8 text-center text-red-600">حدث خطأ في تحميل البيانات</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/agents"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowRight className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {agent.user.firstName} {agent.user.lastName}
          </h1>
          <p className="text-gray-500">تعديل بيانات المندوب</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <User className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {agent.user.firstName} {agent.user.lastName}
            </h2>
            <span className={`mt-2 px-3 py-1 rounded-full text-sm font-medium ${
              agent.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {agent.isActive ? 'نشط' : 'غير نشط'}
            </span>
          </div>

          <div className="space-y-4 pt-6 border-t">
            <div className="flex items-center gap-3 text-gray-600">
              <Mail className="w-5 h-5" />
              <span className="text-sm">{agent.user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Phone className="w-5 h-5" />
              <span className="text-sm" dir="ltr">{agent.user.phone}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 pt-6 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{formatNumber(agent._count.visits)}</p>
              <p className="text-xs text-gray-500">الزيارات</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{formatNumber(agent._count.commissions)}</p>
              <p className="text-xs text-gray-500">العمولات</p>
            </div>
          </div>
        </div>

        {/* Edit Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Settings */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">الإعدادات المالية</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الراتب الأساسي (ل.س)
                </label>
                <input
                  type="number"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  dir="ltr"
                />
                <p className="mt-1 text-xs text-gray-500">الراتب الشهري الثابت للمندوب</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نسبة العمولة %
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={commission}
                    onChange={(e) => setCommission(e.target.value)}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10"
                    dir="ltr"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                    %
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">نسبة المندوب من المبيعات</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveFinancials}
                disabled={updateFinancialsMutation.isPending}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {updateFinancialsMutation.isPending ? 'جاري الحفظ...' : 'حفظ المالية'}
              </button>
            </div>
          </div>

          {/* Managed Governorates */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                المحافظات المخصصة <span className="text-red-500">*</span>
              </h3>
            </div>

            <p className="text-sm font-medium text-gray-700 mb-2">
              اختر المحافظات التي يمكن للمندوب العمل فيها <span className="text-red-500">*</span>
            </p>
            <p className="text-xs text-gray-500 mb-4">
              هذه المحافظات هي التي يمكن للمندوب إضافة أنشطة تجارية فيها
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 mb-6">
              {governorates.map((gov: any) => (
                <label
                  key={gov.id}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={managedGovernorateIds.includes(gov.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setManagedGovernorateIds([...managedGovernorateIds, gov.id]);
                      } else {
                        setManagedGovernorateIds(managedGovernorateIds.filter(id => id !== gov.id));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {gov.nameAr}
                  </span>
                </label>
              ))}
            </div>

            {managedGovernorateIds.length > 0 && (
              <p className="text-sm text-blue-600 mb-4">
                تم اختيار {formatNumber(managedGovernorateIds.length)} محافظة
              </p>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleSaveGovernorates}
                disabled={updateGovernoratesMutation.isPending || managedGovernorateIds.length === 0}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {updateGovernoratesMutation.isPending ? 'جاري الحفظ...' : 'حفظ المحافظات'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
