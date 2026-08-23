import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { getErrorMessage } from '../../lib/error-utils';
import { formatVND, formatDateTime, formatDate } from '@vlxd/shared';
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
import {
  Wallet,
  Search,
  Phone,
  Building,
  ArrowDownRight,
  History,
  CheckCircle,
  Plus,
} from 'lucide-react';

interface ProjectDebt {
  projectId: string;
  projectName: string;
  projectStatus: string;
  debtAmount: number;
}

interface CustomerDebtSummary {
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  customerType: string;
  totalDebt: number;
  projectDebts: ProjectDebt[];
}

export function CustomerDebtPage() {
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Quick Collect Dialog
  const [isCollectOpen, setIsCollectOpen] = useState(false);
  const [collectCustomerId, setCollectCustomerId] = useState('');
  const [collectProjectId, setCollectProjectId] = useState('');
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMethod, setCollectMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH');
  const [collectDate, setCollectDate] = useState(new Date().toISOString().slice(0, 10));
  const [collectPayer, setCollectPayer] = useState('');
  const [collectNotes, setCollectNotes] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customerDebts = [], isLoading } = useQuery({
    queryKey: ['customer-debts'],
    queryFn: async () => {
      const res = await apiClient.get('/debt/customers');
      return res.data.data as CustomerDebtSummary[];
    },
  });

  const { data: customerLedger = [], isLoading: isLoadingLedger } = useQuery({
    queryKey: ['customer-ledger', selectedCustomerId],
    queryFn: async () => {
      if (!selectedCustomerId) return [];
      const res = await apiClient.get(`/debt/customers/${selectedCustomerId}/ledger`);
      return res.data.data as any[];
    },
    enabled: !!selectedCustomerId,
  });

  const collectMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/payments/receipt', {
        customerId: collectCustomerId,
        projectId: collectProjectId || undefined,
        amount: parseInt(collectAmount, 10),
        paymentMethod: collectMethod,
        paymentDate: collectDate,
        payerReceiverName: collectPayer || undefined,
        notes: collectNotes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-debts'] });
      queryClient.invalidateQueries({ queryKey: ['customer-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['cash-fund'] });
      queryClient.invalidateQueries({ queryKey: ['bank-fund'] });
      toast({ title: 'Thu tiền thành công', description: 'Đã giảm nợ khách hàng và ghi nhận vào sổ quỹ.' });
      setIsCollectOpen(false);
      resetCollectForm();
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi thu tiền',
        description: getErrorMessage(err, 'Không thể ghi nhận thu tiền. Vui lòng kiểm tra lại.'),
      });
    },
  });

  const resetCollectForm = () => {
    setCollectCustomerId('');
    setCollectProjectId('');
    setCollectAmount('');
    setCollectMethod('CASH');
    setCollectPayer('');
    setCollectNotes('');
  };

  const handleOpenCollect = (cId: string) => {
    const cust = customerDebts.find((c) => c.customerId === cId);
    setCollectCustomerId(cId);
    setCollectProjectId('');
    setCollectAmount(cust && cust.totalDebt > 0 ? String(cust.totalDebt) : '');
    setCollectPayer(cust ? cust.customerName : '');
    setIsCollectOpen(true);
  };

  const filteredCustomers = customerDebts.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.customerName.toLowerCase().includes(s) ||
      (c.customerPhone && c.customerPhone.includes(s))
    );
  });

  const totalOutstandingDebt = customerDebts.reduce((sum, c) => sum + Math.max(0, c.totalDebt), 0);

  const selectedCustomerObj = customerDebts.find((c) => c.customerId === selectedCustomerId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sổ cái Công nợ Khách hàng</h1>
          <p className="text-muted-foreground">
            Theo dõi tổng nợ của Khách lẻ, Thợ xây, Đội thầu và phân rã chi tiết theo từng Công trình
          </p>
        </div>

        <div className="bg-rose-50 border border-rose-200 px-4 py-2 rounded-lg text-right">
          <span className="text-xs text-rose-700 block font-medium">Tổng nợ phải thu khách hàng</span>
          <span className="text-xl font-bold font-mono text-rose-700">{formatVND(totalOutstandingDebt)}</span>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm tên khách hàng hoặc SĐT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải sổ công nợ...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có dữ liệu công nợ khách hàng</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Khách hàng / Nhà thầu</th>
                    <th className="px-4 py-3">Điện thoại</th>
                    <th className="px-4 py-3">Nợ chi tiết theo Công trình</th>
                    <th className="px-4 py-3 text-right">Tổng nợ hiện tại (VND)</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCustomers.map((c) => (
                    <tr key={c.customerId} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <span className="font-bold text-primary block">{c.customerName}</span>
                      </td>

                      <td className="px-4 py-3 font-mono text-xs">
                        {c.customerPhone ? (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            {c.customerPhone}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {c.projectDebts.length === 0 ? (
                          <span className="text-xs text-muted-foreground">Mua lẻ không theo công trình</span>
                        ) : (
                          <div className="space-y-1">
                            {c.projectDebts.map((p) => (
                              <div key={p.projectId} className="flex items-center justify-between text-xs bg-muted/40 px-2 py-0.5 rounded">
                                <span className="flex items-center gap-1 font-medium">
                                  <Building className="w-3 h-3 text-muted-foreground" />
                                  {p.projectName}
                                </span>
                                <span className={`font-mono font-bold ml-3 ${p.debtAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                  {formatVND(p.debtAmount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-base">
                        {c.totalDebt > 0 ? (
                          <span className="text-rose-600">{formatVND(c.totalDebt)}</span>
                        ) : c.totalDebt < 0 ? (
                          <span className="text-emerald-600">Trả thừa {formatVND(Math.abs(c.totalDebt))}</span>
                        ) : (
                          <span className="text-muted-foreground">0 ₫ (Hết nợ)</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white h-8"
                          onClick={() => handleOpenCollect(c.customerId)}
                        >
                          <ArrowDownRight className="w-3.5 h-3.5 mr-1" />
                          Thu tiền
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => setSelectedCustomerId(c.customerId)}
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

      {/* Customer Ledger Dialog */}
      <Dialog open={!!selectedCustomerId} onOpenChange={(open) => !open && setSelectedCustomerId(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Sổ cái Công nợ chi tiết: {selectedCustomerObj?.customerName}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {isLoadingLedger ? (
              <div className="text-center py-8 text-muted-foreground">Đang tải lịch sử sổ nợ...</div>
            ) : customerLedger.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Chưa có phát sinh nợ nào</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted uppercase text-muted-foreground">
                    <tr>
                      <th className="p-2.5">Thời gian</th>
                      <th className="p-2.5">Loại giao dịch</th>
                      <th className="p-2.5">Công trình</th>
                      <th className="p-2.5 text-right">Phát sinh (VND)</th>
                      <th className="p-2.5 text-right">Dư nợ sau (VND)</th>
                      <th className="p-2.5">Diễn giải</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {customerLedger.map((e: any) => {
                      const isPlus = e.amount > 0;
                      return (
                        <tr key={e.id} className="hover:bg-muted/30">
                          <td className="p-2.5 font-mono whitespace-nowrap">{formatDateTime(e.createdAt)}</td>
                          <td className="p-2.5 whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className={
                                e.transactionType === 'SALE'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }
                            >
                              {e.transactionType === 'SALE' ? 'Mua hàng (Ghi nợ)' : 'Trả tiền (Giảm nợ)'}
                            </Badge>
                          </td>
                          <td className="p-2.5">{e.project?.name || '—'}</td>
                          <td
                            className={`p-2.5 text-right font-mono font-bold ${
                              isPlus ? 'text-rose-600' : 'text-emerald-600'
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
            <Button variant="outline" onClick={() => setSelectedCustomerId(null)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Collect Dialog */}
      <Dialog open={isCollectOpen} onOpenChange={setIsCollectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lập Phiếu Thu tiền Khách hàng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="qc-cust">Khách hàng / Nhà thầu</Label>
              <select
                id="qc-cust"
                className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                value={collectCustomerId}
                onChange={(e) => setCollectCustomerId(e.target.value)}
              >
                <option value="">-- Chọn khách hàng --</option>
                {customerDebts.map((c) => (
                  <option key={c.customerId} value={c.customerId}>
                    {c.customerName} (Còn nợ: {formatVND(c.totalDebt)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="qc-amount">Số tiền thu (VND) *</Label>
              <Input
                id="qc-amount"
                type="number"
                min="1"
                value={collectAmount}
                onChange={(e) => setCollectAmount(e.target.value.replace(/-/g, ''))}
                placeholder="VD: 5000000"
                className="font-mono text-base font-bold text-emerald-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="qc-method">Phương thức thanh toán</Label>
                <select
                  id="qc-method"
                  className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                  value={collectMethod}
                  onChange={(e) => setCollectMethod(e.target.value as any)}
                >
                  <option value="CASH">Tiền mặt (Quỹ két)</option>
                  <option value="BANK_TRANSFER">Chuyển khoản Ngân hàng</option>
                </select>
              </div>

              <div>
                <Label htmlFor="qc-date">Ngày thu tiền</Label>
                <Input
                  id="qc-date"
                  type="date"
                  value={collectDate}
                  onChange={(e) => setCollectDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="qc-payer">Họ tên người nộp tiền</Label>
              <Input
                id="qc-payer"
                value={collectPayer}
                onChange={(e) => setCollectPayer(e.target.value)}
                placeholder="VD: Anh Tuấn thợ xây..."
              />
            </div>

            <div>
              <Label htmlFor="qc-notes">Nội dung thu tiền</Label>
              <Input
                id="qc-notes"
                value={collectNotes}
                onChange={(e) => setCollectNotes(e.target.value)}
                placeholder="Thu tiền vật tư đợt 2, thanh toán tiền cát..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCollectOpen(false)}>
              Hủy
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => collectMutation.mutate()}
              disabled={!collectCustomerId || !collectAmount || collectMutation.isPending}
            >
              {collectMutation.isPending ? 'Đang lưu...' : 'Xác nhận Thu tiền'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
