import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { formatVND, formatDate } from '@vlxd/shared';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { useToast } from '../../components/ui/use-toast';
import { ArrowUpRight, Printer, Phone, Trash2 } from 'lucide-react';

interface PaymentItem {
  id: string;
  code: string;
  paymentType: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER';
  amount: number;
  paymentDate: string;
  payerReceiverName: string | null;
  notes: string | null;
  supplier?: { name: string; phone: string | null };
}

const EXPENSE_CATEGORIES = [
  { value: 'TRA_TIEN_NCC', label: 'Chi trả tiền hàng Nhà cung cấp' },
  { value: 'CHI_PHI_VAN_CHUYEN', label: 'Chi phí vận chuyển / Thuê xe ngoài' },
  { value: 'CHI_PHI_XANG_DAU', label: 'Chi phí xăng dầu xe tải / xe ben' },
  { value: 'CHI_LUONG_THO_LAI', label: 'Chi lương tài xế / bốc xếp' },
  { value: 'CHI_PHI_MAT_BANG', label: 'Chi thuê mặt bằng kho bãi' },
  { value: 'CHI_KHAC', label: 'Chi phí vận hành khác' },
];

export function PaymentSpendPage() {
  const [supplierId, setSupplierId] = useState('');
  const [category, setCategory] = useState('TRA_TIEN_NCC');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER'>('BANK_TRANSFER');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [receiverName, setReceiverName] = useState('');
  const [notes, setNotes] = useState('');

  const [selectedVoucher, setSelectedVoucher] = useState<PaymentItem | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ['payments-vouchers'],
    queryFn: async () => {
      const res = await apiClient.get('/payments', {
        params: { paymentType: 'PAYMENT' },
      });
      return res.data.data as PaymentItem[];
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await apiClient.get('/suppliers');
      return res.data.data as any[];
    },
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await apiClient.get('/settings');
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/payments/spend', {
        supplierId: supplierId || undefined,
        category,
        amount: parseInt(amount, 10),
        paymentMethod,
        paymentDate,
        payerReceiverName: receiverName || undefined,
        notes: notes || undefined,
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['payments-vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-debts'] });
      queryClient.invalidateQueries({ queryKey: ['cash-fund'] });
      queryClient.invalidateQueries({ queryKey: ['bank-fund'] });
      toast({ title: 'Tạo phiếu chi thành công', description: 'Đã trừ sổ quỹ và giảm nợ NCC (nếu có).' });
      setSelectedVoucher(res.data.data);
      resetForm();
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: err.response?.data?.error?.message || 'Không thể tạo phiếu chi',
      });
    },
  });

  const deleteVoucherMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/payments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments-vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-debts'] });
      queryClient.invalidateQueries({ queryKey: ['cash-fund'] });
      queryClient.invalidateQueries({ queryKey: ['bank-fund'] });
      toast({ title: 'Đã xóa phiếu chi', description: 'Đã xóa phiếu chi khỏi hệ thống.' });
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Lỗi khi xóa', description: err.response?.data?.error?.message });
    },
  });

  const resetForm = () => {
    setSupplierId('');
    setCategory('TRA_TIEN_NCC');
    setAmount('');
    setPaymentMethod('BANK_TRANSFER');
    setReceiverName('');
    setNotes('');
  };

  const handleSupplierChange = (sId: string) => {
    setSupplierId(sId);
    const s = suppliers.find((sup) => sup.id === sId);
    if (s) setReceiverName(s.name);
  };

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <h1 className="text-2xl font-bold tracking-tight">Chi tiền & Lập Phiếu Chi</h1>
        <p className="text-muted-foreground">
          Lập phiếu chi trả tiền hàng Nhà cung cấp, chi phí vận chuyển, xăng dầu, nhân công
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        {/* Form Create Voucher */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-amber-600" />
              Lập Phiếu Chi mới
            </CardTitle>
            <CardDescription>Nhập thông tin người nhận và số tiền chi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="pc-cat">Khoản mục chi *</Label>
              <select
                id="pc-cat"
                className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {category === 'TRA_TIEN_NCC' && (
              <div>
                <Label htmlFor="pc-sup">Nhà cung cấp nhận tiền</Label>
                <select
                  id="pc-sup"
                  className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                  value={supplierId}
                  onChange={(e) => handleSupplierChange(e.target.value)}
                >
                  <option value="">-- Chọn nhà cung cấp --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label htmlFor="pc-amount">Số tiền chi (VND) *</Label>
              <Input
                id="pc-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="VD: 10000000"
                className="font-mono text-base font-bold text-amber-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pc-method">Phương thức</Label>
                <select
                  id="pc-method"
                  className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                >
                  <option value="BANK_TRANSFER">Chuyển khoản</option>
                  <option value="CASH">Tiền mặt</option>
                </select>
              </div>

              <div>
                <Label htmlFor="pc-date">Ngày chi</Label>
                <Input
                  id="pc-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="pc-receiver">Họ tên người nhận tiền</Label>
              <Input
                id="pc-receiver"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="Người nhận tiền..."
              />
            </div>

            <div>
              <Label htmlFor="pc-notes">Lý do / Diễn giải chi</Label>
              <Input
                id="pc-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Thanh toán hóa đơn nhập hàng, đổ dầu xe tải..."
              />
            </div>

            <Button
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-11"
              onClick={() => createMutation.mutate()}
              disabled={!amount || createMutation.isPending}
            >
              {createMutation.isPending ? 'Đang lưu...' : 'Xác nhận Chi tiền'}
            </Button>
          </CardContent>
        </Card>

        {/* History Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Lịch sử Phiếu Chi gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Đang tải phiếu chi...</div>
            ) : vouchers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Chưa có phiếu chi nào</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Mã phiếu</th>
                      <th className="px-4 py-3">Ngày chi</th>
                      <th className="px-4 py-3">Người nhận / NCC</th>
                      <th className="px-4 py-3">Phương thức</th>
                      <th className="px-4 py-3 text-right">Số tiền chi</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {vouchers.map((v) => (
                      <tr key={v.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-mono font-bold text-amber-900">{v.code}</td>
                        <td className="px-4 py-3 text-xs">{formatDate(v.paymentDate)}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold block">{v.payerReceiverName || v.supplier?.name}</span>
                          {v.notes && <span className="text-xs text-muted-foreground">{v.notes}</span>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={v.paymentMethod === 'CASH' ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'}>
                            {v.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-amber-800">
                          {formatVND(v.amount)}
                        </td>
                        <td className="px-4 py-3 text-right space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedVoucher(v)} title="In phiếu chi">
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                            onClick={() => {
                              if (confirm(`Xác nhận xóa phiếu chi "${v.code}"?`)) {
                                deleteVoucherMutation.mutate(v.id);
                              }
                            }}
                            disabled={deleteVoucherMutation.isPending}
                            title="Xóa phiếu chi"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </div>

      {/* Printable Voucher Modal */}
      <Dialog open={!!selectedVoucher} onOpenChange={(open) => !open && setSelectedVoucher(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Phiếu Chi Tiền</DialogTitle>
          </DialogHeader>

          {selectedVoucher && (
            <div className="bg-white text-black p-6 rounded border font-sans text-xs space-y-4 print:p-0">
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <h3 className="font-bold text-sm uppercase">{settings?.storeName || 'CỬA HÀNG VẬT LIỆU XÂY DỰNG'}</h3>
                  <p className="text-[11px] text-muted-foreground">{settings?.storeAddress || 'Khu A - Cửa hàng chính'}</p>
                </div>
                <div className="text-right">
                  <h4 className="font-bold text-sm uppercase text-amber-800">PHIẾU CHI</h4>
                  <p className="font-mono font-bold">{selectedVoucher.code}</p>
                  <p className="text-muted-foreground">{formatDate(selectedVoucher.paymentDate)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Người nhận tiền:</span>
                  <span className="font-bold">{selectedVoucher.payerReceiverName || selectedVoucher.supplier?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phương thức:</span>
                  <span>{selectedVoucher.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản Ngân hàng'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lý do chi:</span>
                  <span>{selectedVoucher.notes || 'Thanh toán tiền hàng / chi phí vận hành'}</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-bold text-sm text-amber-900">
                  <span>Số tiền chi:</span>
                  <span className="font-mono text-base">{formatVND(selectedVoucher.amount)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 text-center text-xs">
                <div>
                  <p className="font-bold">Người nhận tiền</p>
                  <p className="text-[10px] text-muted-foreground italic">(Ký, họ tên)</p>
                  <div className="h-12"></div>
                </div>
                <div>
                  <p className="font-bold">Người lập phiếu</p>
                  <p className="text-[10px] text-muted-foreground italic">(Ký, họ tên)</p>
                  <div className="h-12"></div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t gap-2 print:hidden">
                <Button variant="outline" size="sm" onClick={() => setSelectedVoucher(null)}>
                  Đóng
                </Button>
                <Button size="sm" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-1" />
                  In phiếu
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
