import { Bell, AlertCircle, Clock, FileText } from 'lucide-react';
import Link from 'next/link';

interface AlertsCardProps {
  capabilities: any[];
}

export function AlertsCard({ capabilities }: AlertsCardProps) {
  // هنا سنجلب التنبيهات من API في المستقبل
  // الآن سنعرض تنبيهات افتراضية كمثال

  const alerts: string[] = [
    // يمكن إضافة منطق لجلب التنبيهات الحقيقية
  ];

  // إذا لم تكن هناك تنبيهات، لا تعرض شيئاً
  if (alerts.length === 0) return null;

  return (
    <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <Bell className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-yellow-900 mb-2">تنبيهات مهمة</h3>
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm text-yellow-800"
              >
                <Clock className="w-4 h-4" />
                <span>{alert}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
