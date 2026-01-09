import { Wallet, ArrowUpCircle, CreditCard, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

interface WalletCardProps {
  wallet: {
    balance: number;
    frozenBalance: number;
    totalDeposits: number;
    totalWithdrawals: number;
    totalSpent: number;
    status: string;
  } | null;
  hasBusinessAccess?: boolean; // حالة المستخدم
}

export function WalletCard({ wallet, hasBusinessAccess = false }: WalletCardProps) {
  const balance = wallet?.balance || 0;
  const availableBalance = balance - (wallet?.frozenBalance || 0);

  return (
    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 shadow-lg text-white lg:col-span-1">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-green-100 text-sm font-medium">محفظتي</p>
          <p className="text-3xl font-bold mt-1">
            {availableBalance.toLocaleString('ar-SY')}
          </p>
          <p className="text-green-100 text-xs mt-1">ليرة سورية</p>
        </div>
        <div className="p-3 rounded-lg bg-white/20 backdrop-blur">
          <Wallet className="w-6 h-6" />
        </div>
      </div>

      {wallet?.frozenBalance && wallet.frozenBalance > 0 && (
        <div className="mb-4 p-2 bg-white/10 rounded-lg">
          <p className="text-xs text-green-100">
            رصيد مجمد: {wallet.frozenBalance.toLocaleString('ar-SY')} ل.س
          </p>
        </div>
      )}

      {/* استخدامات المحفظة - فقط لأصحاب الأنشطة */}
      {hasBusinessAccess && (
        <div className="mb-4 p-3 bg-white/10 rounded-lg">
          <p className="text-xs text-green-100 font-medium mb-1">استخدامات المحفظة:</p>
          <ul className="text-xs text-green-100 space-y-0.5">
            <li>• شراء وتجديد باقات الأنشطة التجارية</li>
            <li>• إنشاء وإدارة الإعلانات</li>
            <li>• شراء خدمات الصفحات الخضراء</li>
          </ul>
        </div>
      )}

      {/* الأزرار - مختلفة حسب نوع المستخدم */}
      <div className={`grid gap-2 ${hasBusinessAccess ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <Link
          href="/dashboard/wallet/top-up"
          className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
        >
          <ArrowUpCircle className="w-5 h-5" />
          <span className="text-xs font-medium">شحن</span>
        </Link>

        <Link
          href="/dashboard/wallet"
          className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
        >
          <CreditCard className="w-5 h-5" />
          <span className="text-xs font-medium">العمليات</span>
        </Link>

        {/* زر الباقات - فقط لأصحاب الأنشطة */}
        {hasBusinessAccess && (
          <Link
            href="/dashboard/packages"
            className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-xs font-medium">الباقات</span>
          </Link>
        )}
      </div>
    </div>
  );
}
