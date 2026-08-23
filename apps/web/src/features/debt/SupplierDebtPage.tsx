import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { getErrorMessage } from '../../lib/error-utils';
import { formatVND, formatDateTime } from '@vlxd/shared';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { useToast } from '../../components/ui/use-toast';
import { Truck, Search, Phone, ArrowUpRight, History } from 'lucide-react';

interface SupplierDebtSummary {
  supplierId: string;
  supplierName: string;
  supplierPhone: string | null;
  supplierAddress: string | null;
  totalDebt: number;
}

export function SupplierDebtPage() {
  const [search, setSearch] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  // Quick Spend Dialog
  const [isSpendOpen, setIsSpendOpen] = useState(false);
  const [spendSupplierId, setSpendSupplierId] = useState('');
  const [spendAmount, setSpendAmount] = useState('');
  const [spendMethod, setSpendMethod] = useState<'CASH' | 'BANK_TRANSFER'>('BANK_TRANSFER');
  const [spendDate, setSpendDate] = useState(new Date().toISOString().slice(0, 10));
  const [spendReceiver, setSpendReceiver] = useState('');
  const [spendNotes, setSpendNotes] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: supplierDebts = [], isLoading } = useQuery({
    queryKey: ['supplier-debts'],
    queryFn: async () => {
      const res = await apiClient.get('/debt/suppliers');
      return res.data.data as SupplierDebtSummary[];
    },
  });

  const { data: supplierLedger = [], isLoading: isLoadingLedger } = useQuery({
    queryKey: ['supplier-ledger', selectedSupplierId],
    queryFn: async () => {
      if (!selectedSupplierId) return [];
      const res = await apiClient.get(`/debt/suppliers/${selectedSupplierId}/ledger`);
      return res.data.data as any[];
    },
    enabled: !!selectedSupplierId,
  });

  const spendMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/payments/spend', {
        supplierId: spendSupplierId,
        amount: parseInt(spendAmount, 10),
        paymentMethod: spendMethod,
        paymentDate: spendDate,
        payerReceiverName: spendReceiver || undefined,
        category: 'TRA_TIEN_NCC',
        notes: spendNotes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-debts'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['cash-fund'] });
      queryClient.invalidateQueries({ queryKey: ['bank-fund'] });
      toast({ title: 'Chi trả thành công', description: 'Đã giảm nợ NCC và trừ sổ quỹ.' });
      setIsSpendOpen(false);
      resetSpendForm();
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi chi tiền',
        description: getErrorMessage(err, 'Không thể ghi nhận chi tiền. Vui lòng kiểm tra lại.'),
      });
    },
  });

  const resetSpendForm = () => {
    setSpendSupplierId('');
    setSpendAmount('');
    setSpendMethod('BANK_TRANSFER');
    setSpendReceiver('');
    setSpendNotes('');
  };

  const handleOpenSpend = (sId: string) => {
    const sup = supplierDebts.find((s) => s.supplierId === sId);
    setSpendSupplierId(sId);
    setSpendAmount(sup && sup.totalDebt > 0 ? String(sup.totalDebt) : '');
    setSpendReceiver(sup ? sup.supplierName : '');
    setIsSpendOpen(true);
  };

  const filteredSuppliers = supplierDebts.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.supplierName.toLowerCase().includes(q) || (s.supplierPhone && s.supplierPhone.includes(q));
  });

  const totalPayableDebt = supplierDebts.reduce((sum, s) => sum + Math.max(0, s.totalDebt), 0);
  const selectedSupplierObj = supplierDebts.find((s) => s.supplierId === selectedSupplierId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sổ cái Công nợ Nhà cung cấp</h1>
          <p className="text-muted-foreground">
            Theo dõi công nợ phải trả cho các nhà máy Thép, tổng kho Xi măng, mỏ Cát sỏi
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg text-right">
          <span className="text-xs text-amber-800 block font-medium">Tổng nợ phải trả Nhà cung cấp</span>
          <span className="text-xl font-bold font-mono text-amber-900">{formatVND(totalPayableDebt)}</span>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm tên nhà cung cấp hoặc SĐT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải sổ nợ nhà cung cấp...</div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có dữ liệu công nợ nhà cung cấp</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Nhà cung cấp / Nhà máy</th>
                    <th className="px-4 py-3">Điện thoại</th>
                    <th className="px-4 py-3">Địa chỉ / Bến bãi</th>
                    <th className="px-4 py-3 text-right">Tổng nợ phải trả (VND)</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredSuppliers.map((s) => (
                    <tr key={s.supplierId} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-semibold text-primary">{s.supplierName}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {s.supplierPhone ? (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            {s.supplierPhone}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{s.supplierAddress || '—'}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-base">
                        {s.totalDebt > 0 ? (
                          <span className="text-amber-800">{formatVND(s.totalDebt)}</span>
                        ) : (
                          <span className="text-muted-foreground">0 ₫ (Đã thanh toán hết)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                        <Button
                          size="sm"
                          className="bg-amber-600 hover:bg-amber-700 text-white h-8"
                          onClick={() => handleOpenSpend(s.supplierId)}
                        >
                          <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                          Chi trả nợ
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => setSelectedSupplierId(s.supplierId)}
                        >
                          <History className="w-3.5 h-3.5 mr-1" />
                          Xem sổ nợ
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supplier Ledger Dialog */}
      <Dialog open={!!selectedSupplierId} onOpenChange={(open) => !open && setSelectedSupplierId(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sổ cái Công nợ chi tiết: {selectedSupplierObj?.supplierName}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {isLoadingLedger ? (
              <div className="text-center py-8 text-muted-foreground">Đang tải lịch sử sổ nợ...</div>
            ) : supplierLedger.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Chưa có phát sinh nợ nào</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted uppercase text-muted-foreground">
                    <tr>
                      <th className="p-2.5">Thời gian</th>
                      <th className="p-2.5">Loại giao dịch</th>
                      <th className="p-2.5 text-right">Phát sinh (VND)</th>
                      <th className="p-2.5 text-right">Dư nợ sau (VND)</th>
                      <th className="p-2.5">Diễn giải</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {supplierLedger.map((e: any) => {
                      const isPlus = e.amount > 0;
                      return (
                        <tr key={e.id} className="hover:bg-muted/30">
                          <td className="p-2.5 font-mono whitespace-nowrap">{formatDateTime(e.createdAt)}</td>
                          <td className="p-2.5 whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className={
                                e.transactionType === 'PURCHASE'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              }
                            >
                              {e.transactionType === 'PURCHASE' ? 'Nhập hàng (Ghi nợ)' : 'Thanh toán (Giảm nợ)'}
                            </Badge>
                          </td>
                          <td
                            className={`p-2.5 text-right font-mono font-bold ${
                              isPlus ? 'text-amber-800' : 'text-emerald-600'
                            }`}
                          >
                            {isPlus ? `+${formatVND(e.amount)}` : formatVND(e.amount)}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-foreground">
                            {formatVND(e.balanceAfter)}
                          </td>
                          <td className="p-2.5 text-muted-foreground">{e.notes || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSupplierId(null)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Spend Dialog */}
      <Dialog open={isSpendOpen} onOpenChange={setIsSpendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lập Phiếu Chi trả nợ Nhà cung cấp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="qs-sup">Nhà cung cấp</Label>
              <select
                id="qs-sup"
                className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                value={spendSupplierId}
                onChange={(e) => setSpendSupplierId(e.target.value)}
              >
                <option value="">-- Chọn nhà cung cấp --</option>
                {supplierDebts.map((s) => (
                  <option key={s.supplierId} value={s.supplierId}>
                    {s.supplierName} (Còn nợ: {formatVND(s.totalDebt)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="qs-amount">Số tiền chi trả (VND) *</Label>
              <Input
                id="qs-amount"
                type="number"
                min="1"
                value={spendAmount}
                onChange={(e) => setSpendAmount(e.target.value.replace(/-/g, ''))}
                placeholder="VD: 10000000"
                className="font-mono text-base font-bold text-amber-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="qs-method">Phương thức thanh toán</Label>
                <select
                  id="qs-method"
                  className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                  value={spendMethod}
                  onChange={(e) => setSpendMethod(e.target.value as any)}
                >
                  <option value="BANK_TRANSFER">Chuyển khoản Ngân hàng</option>
                  <option value="CASH">Tiền mặt (Quỹ két)</option>
                </select>
              </div>

              <div>
                <Label htmlFor="qs-date">Ngày thanh toán</Label>
                <Input
                  id="qs-date"
                  type="date"
                  value={spendDate}
                  onChange={(e) => setSpendDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="qs-receiver">Họ tên người / đơn vị nhận tiền</Label>
              <Input
                id="qs-receiver"
                value={spendReceiver}
                onChange={(e) => setSpendReceiver(e.target.value)}
                placeholder="VD: Nhà máy thép Hòa Phát..."
              />
            </div>

            <div>
              <Label htmlFor="qs-notes">Nội dung thanh toán</Label>
              <Input
                id="qs-notes"
                value={spendNotes}
                onChange={(e) => setSpendNotes(e.target.value)}
                placeholder="Thanh toán tiền thép đợt 1, trả nợ xi măng..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSpendOpen(false)}>
              Hủy
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => spendMutation.mutate()}
              disabled={!spendSupplierId || !spendAmount || spendMutation.isPending}
            >
              {spendMutation.isPending ? 'Đang lưu...' : 'Xác nhận Chi tiền'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
