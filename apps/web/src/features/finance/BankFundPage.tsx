import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { formatVND, formatDateTime } from '@vlxd/shared';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Landmark, ArrowDownRight, ArrowUpRight, CreditCard } from 'lucide-react';

interface CashFlowItem {
  id: string;
  paymentId: string;
  accountType: string;
  direction: 'IN' | 'OUT';
  amount: number;
  balanceAfter: number;
  transactionDate: string;
  category: string;
  notes: string | null;
  createdAt: string;
  payment?: {
    code: string;
    payerReceiverName: string | null;
  };
}

export function BankFundPage() {
  const { data: fundData, isLoading } = useQuery({
    queryKey: ['bank-fund'],
    queryFn: async () => {
      const res = await apiClient.get('/finance/bank');
      return res.data.data;
    },
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await apiClient.get('/settings');
      return res.data.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sổ phụ Ngân hàng (Chuyển khoản)</h1>
          <p className="text-muted-foreground">
            Theo dõi dòng tiền chuyển khoản nhận và thanh toán qua tài khoản ngân hàng
          </p>
        </div>

        {settings?.bankAccount && (
          <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-blue-700 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-blue-900 block">{settings.bankName}</span>
              <span className="font-mono font-bold text-blue-700 text-sm">{settings.bankAccount}</span>
              <span className="text-muted-foreground ml-1.5 font-medium">({settings.bankAccountName})</span>
            </div>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-blue-50/50 border-blue-200">
          <CardContent className="pt-4 space-y-1">
            <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider block">
              Số dư tài khoản hiện tại
            </span>
            <div className="text-2xl font-bold font-mono text-blue-700">
              {formatVND(fundData?.currentBalance || 0)}
            </div>
            <p className="text-[11px] text-muted-foreground">Số dư tiền gửi ngân hàng</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Tổng thu chuyển khoản
            </span>
            <div className="text-xl font-bold font-mono text-emerald-600 flex items-center gap-1">
              <ArrowDownRight className="w-5 h-5" />
              {formatVND(fundData?.totalIn || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Tổng chi chuyển khoản
            </span>
            <div className="text-xl font-bold font-mono text-rose-600 flex items-center gap-1">
              <ArrowUpRight className="w-5 h-5" />
              {formatVND(fundData?.totalOut || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bank Flow Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lịch sử Giao dịch Ngân hàng</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải sổ phụ ngân hàng...</div>
          ) : !fundData?.entries || fundData.entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Landmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có giao dịch chuyển khoản nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Thời gian</th>
                    <th className="px-4 py-3">Mã phiếu</th>
                    <th className="px-4 py-3">Người nộp / nhận</th>
                    <th className="px-4 py-3">Khoản mục</th>
                    <th className="px-4 py-3 text-right">Thu vào</th>
                    <th className="px-4 py-3 text-right">Chi ra</th>
                    <th className="px-4 py-3 text-right">Số dư sau GD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {fundData.entries.map((e: CashFlowItem) => {
                    const isIncome = e.direction === 'IN';
                    return (
                      <tr key={e.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateTime(e.createdAt)}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-primary">
                          {e.payment?.code || '—'}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {e.payment?.payerReceiverName || '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {e.notes || e.category}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                          {isIncome ? `+${formatVND(e.amount)}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">
                          {!isIncome ? `-${formatVND(e.amount)}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                          {formatVND(e.balanceAfter)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
