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
import { ArrowDownRight, Printer, Search, Phone } from 'lucide-react';

interface PaymentItem {
  id: string;
  code: string;
  paymentType: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER';
  amount: number;
  paymentDate: string;
  payerReceiverName: string | null;
  notes: string | null;
  customer?: { name: string; phone: string | null };
  project?: { name: string };
}

export function PaymentCollectPage() {
  const [customerId, setCustomerId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [payerName, setPayerName] = useState('');
  const [notes, setNotes] = useState('');

  const [selectedReceipt, setSelectedReceipt] = useState<PaymentItem | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ['payments-receipts'],
    queryFn: async () => {
      const res = await apiClient.get('/payments', {
        params: { paymentType: 'RECEIPT' },
      });
      return res.data.data as PaymentItem[];
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await apiClient.get('/customers');
      return res.data.data as any[];
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', customerId],
    queryFn: async () => {
      const res = await apiClient.get('/projects', {
        params: { customerId: customerId || undefined },
      });
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
      return apiClient.post('/payments/receipt', {
        customerId,
        projectId: projectId || undefined,
        amount: parseInt(amount, 10),
        paymentMethod,
        paymentDate,
        payerReceiverName: payerName || undefined,
        notes: notes || undefined,
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['payments-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['customer-debts'] });
      queryClient.invalidateQueries({ queryKey: ['cash-fund'] });
      queryClient.invalidateQueries({ queryKey: ['bank-fund'] });
      toast({ title: 'Tạo phiếu thu thành công', description: 'Đã cập nhật giảm nợ và tăng sổ quỹ.' });
      setSelectedReceipt(res.data.data);
      resetForm();
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: err.response?.data?.error?.message || 'Không thể tạo phiếu thu',
      });
    },
  });

  const resetForm = () => {
    setCustomerId('');
    setProjectId('');
    setAmount('');
    setPaymentMethod('CASH');
    setPayerName('');
    setNotes('');
  };

  const handleCustomerChange = (cId: string) => {
    setCustomerId(cId);
    setProjectId('');
    const c = customers.find((cust) => cust.id === cId);
    if (c) setPayerName(c.name);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Thu tiền & Lập Phiếu Thu</h1>
        <p className="text-muted-foreground">
          Ghi nhận các khoản thu tiền hàng, thu nợ khách hàng / thợ xây bằng Tiền mặt hoặc Chuyển khoản
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Create Receipt */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowDownRight className="w-5 h-5 text-emerald-600" />
              Lập Phiếu Thu mới
            </CardTitle>
            <CardDescription>Nhập thông tin người nộp và số tiền</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="rc-cust">Khách hàng nộp tiền *</Label>
              <select
                id="rc-cust"
                className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                value={customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
              >
                <option value="">-- Chọn khách hàng --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="rc-proj">Công trình (nếu thu đích danh)</Label>
              <select
                id="rc-proj"
                className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                disabled={!customerId}
              >
                <option value="">-- Thu chung khách hàng --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="rc-amount">Số tiền thu (VND) *</Label>
              <Input
                id="rc-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="VD: 5000000"
                className="font-mono text-base font-bold text-emerald-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="rc-method">Phương thức</Label>
                <select
                  id="rc-method"
                  className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                >
                  <option value="CASH">Tiền mặt</option>
                  <option value="BANK_TRANSFER">Chuyển khoản</option>
                </select>
              </div>

              <div>
                <Label htmlFor="rc-date">Ngày thu</Label>
                <Input
                  id="rc-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="rc-payer">Họ tên người nộp tiền</Label>
              <Input
                id="rc-payer"
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                placeholder="Người trực tiếp đưa tiền / CK..."
              />
            </div>

            <div>
              <Label htmlFor="rc-notes">Nội dung thu</Label>
              <Input
                id="rc-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Thu tiền vật tư công trình..."
              />
            </div>

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11"
              onClick={() => createMutation.mutate()}
              disabled={!customerId || !amount || createMutation.isPending}
            >
              {createMutation.isPending ? 'Đang lưu...' : 'Xác nhận Thu tiền'}
            </Button>
          </CardContent>
        </Card>

        {/* History Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Lịch sử Phiếu Thu gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Đang tải phiếu thu...</div>
            ) : receipts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Chưa có phiếu thu nào</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Mã phiếu</th>
                      <th className="px-4 py-3">Ngày thu</th>
                      <th className="px-4 py-3">Người nộp / Khách</th>
                      <th className="px-4 py-3">Phương thức</th>
                      <th className="px-4 py-3 text-right">Số tiền</th>
                      <th className="px-4 py-3 text-right">In</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {receipts.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-mono font-bold text-primary">{r.code}</td>
                        <td className="px-4 py-3 text-xs">{formatDate(r.paymentDate)}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold block">{r.payerReceiverName || r.customer?.name}</span>
                          {r.project && <span className="text-xs text-muted-foreground">{r.project.name}</span>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={r.paymentMethod === 'CASH' ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'}>
                            {r.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                          {formatVND(r.amount)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedReceipt(r)}>
                            <Printer className="w-4 h-4" />
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

      {/* Printable Receipt Modal */}
      <Dialog open={!!selectedReceipt} onOpenChange={(open) => !open && setSelectedReceipt(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Phiếu Thu Tiền</DialogTitle>
          </DialogHeader>

          {selectedReceipt && (
            <div className="bg-white text-black p-6 rounded border font-sans text-xs space-y-4 print:p-0">
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <h3 className="font-bold text-sm uppercase">{settings?.storeName || 'CỬA HÀNG VẬT LIỆU XÂY DỰNG'}</h3>
                  <p className="text-[11px] text-muted-foreground">{settings?.storeAddress || 'Khu A - Cửa hàng chính'}</p>
                </div>
                <div className="text-right">
                  <h4 className="font-bold text-sm uppercase text-emerald-700">PHIẾU THU</h4>
                  <p className="font-mono font-bold">{selectedReceipt.code}</p>
                  <p className="text-muted-foreground">{formatDate(selectedReceipt.paymentDate)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Người nộp tiền:</span>
                  <span className="font-bold">{selectedReceipt.payerReceiverName || selectedReceipt.customer?.name}</span>
                </div>
                {selectedReceipt.customer?.phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Điện thoại:</span>
                    <span className="font-mono">{selectedReceipt.customer.phone}</span>
                  </div>
                )}
                {selectedReceipt.project && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Công trình:</span>
                    <span>{selectedReceipt.project.name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phương thức:</span>
                  <span>{selectedReceipt.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản Ngân hàng'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lý do nộp:</span>
                  <span>{selectedReceipt.notes || 'Thu tiền hàng vật liệu xây dựng'}</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-bold text-sm text-emerald-800">
                  <span>Số tiền thu:</span>
                  <span className="font-mono text-base">{formatVND(selectedReceipt.amount)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 text-center text-xs">
                <div>
                  <p className="font-bold">Người nộp tiền</p>
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
                <Button variant="outline" size="sm" onClick={() => setSelectedReceipt(null)}>
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
