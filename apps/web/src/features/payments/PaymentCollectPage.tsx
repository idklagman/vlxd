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
import { ArrowDownRight, Printer, Search, Phone, Trash2 } from 'lucide-react';

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
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
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
      let finalCustomerId = customerId;
      if (isNewCustomer) {
        const custRes = await apiClient.post('/customers', {
          name: newCustomerName.trim(),
          phone: newCustomerPhone.trim() || undefined,
          address: newCustomerAddress.trim() || undefined,
          customerType: 'RETAIL',
        });
        finalCustomerId = custRes.data.data.id;
        queryClient.invalidateQueries({ queryKey: ['customers'] });
      }

      return apiClient.post('/payments/receipt', {
        customerId: finalCustomerId,
        projectId: projectId || undefined,
        amount: parseInt(amount, 10),
        paymentMethod,
        paymentDate,
        payerReceiverName: payerName || (isNewCustomer ? newCustomerName : undefined),
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

  const deleteReceiptMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/payments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['customer-debts'] });
      queryClient.invalidateQueries({ queryKey: ['cash-fund'] });
      queryClient.invalidateQueries({ queryKey: ['bank-fund'] });
      toast({ title: 'Đã xóa phiếu thu', description: 'Đã xóa phiếu thu khỏi hệ thống.' });
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Lỗi khi xóa', description: err.response?.data?.error?.message });
    },
  });

  const resetForm = () => {
    setIsNewCustomer(false);
    setCustomerId('');
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerAddress('');
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
      <div className="print:hidden">
        <h1 className="text-2xl font-bold tracking-tight">Thu tiền & Lập Phiếu Thu</h1>
        <p className="text-muted-foreground">
          Ghi nhận các khoản thu tiền hàng, thu nợ khách hàng / thợ xây bằng Tiền mặt hoặc Chuyển khoản
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
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
            {/* Customer Mode Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">Khách hàng nộp tiền *</Label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant={!isNewCustomer ? 'default' : 'outline'}
                    size="sm"
                    className="h-6 text-[11px] px-2"
                    onClick={() => setIsNewCustomer(false)}
                  >
                    Khách có sẵn
                  </Button>
                  <Button
                    type="button"
                    variant={isNewCustomer ? 'default' : 'outline'}
                    size="sm"
                    className="h-6 text-[11px] px-2 text-primary"
                    onClick={() => setIsNewCustomer(true)}
                  >
                    + Khách mới
                  </Button>
                </div>
              </div>

              {!isNewCustomer ? (
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
              ) : (
                <div className="space-y-2.5 p-3 rounded-lg border border-primary/30 bg-primary/5">
                  <div>
                    <Label className="text-xs font-bold text-primary">Tên khách hàng mới *</Label>
                    <Input
                      placeholder="VD: Anh Nam Thợ Xây"
                      className="h-8 text-xs bg-background mt-1"
                      value={newCustomerName}
                      onChange={(e) => {
                        setNewCustomerName(e.target.value);
                        setPayerName(e.target.value);
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Số điện thoại</Label>
                      <Input
                        placeholder="0912..."
                        className="h-8 text-xs bg-background mt-1"
                        value={newCustomerPhone}
                        onChange={(e) => setNewCustomerPhone(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Địa chỉ / Công trình</Label>
                      <Input
                        placeholder="Thôn, xã..."
                        className="h-8 text-xs bg-background mt-1"
                        value={newCustomerAddress}
                        onChange={(e) => setNewCustomerAddress(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="rc-proj">Công trình (nếu thu đích danh)</Label>
              <select
                id="rc-proj"
                className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                disabled={isNewCustomer || !customerId}
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
              disabled={(!isNewCustomer && !customerId) || (isNewCustomer && !newCustomerName.trim()) || !amount || createMutation.isPending}
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
                      <th className="px-4 py-3 text-right">Thao tác</th>
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
                        <td className="px-4 py-3 text-right space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedReceipt(r)} title="In phiếu thu">
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                            onClick={() => {
                              if (confirm(`Xác nhận xóa phiếu thu "${r.code}"?`)) {
                                deleteReceiptMutation.mutate(r.id);
                              }
                            }}
                            disabled={deleteReceiptMutation.isPending}
                            title="Xóa phiếu thu"
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

              {/* VietinBank VietQR */}
              <div className="flex items-center gap-4 p-3 bg-gray-50 border border-gray-300 rounded-xl text-xs">
                <img
                  src={`https://img.vietqr.io/image/vietinbank-${settings?.bankAccount || '12283456'}-compact2.png?amount=${selectedReceipt.amount}&addInfo=${encodeURIComponent(selectedReceipt.code)}&accountName=${encodeURIComponent(settings?.bankAccountName || 'NGUYEN VAN CHU')}`}
                  alt="VietQR VietinBank"
                  className="w-36 h-36 object-contain border-2 border-primary/40 bg-white rounded-lg p-1 shrink-0 shadow-xs"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="space-y-1">
                  <p className="font-extrabold text-primary uppercase text-xs">Tài khoản nhận tiền VietinBank</p>
                  <p className="text-gray-600">Ngân hàng: <strong className="text-black">{settings?.bankName || 'VietinBank'}</strong></p>
                  <p className="text-gray-600">STK: <strong className="font-mono text-base font-black text-primary">{settings?.bankAccount || '12283456'}</strong></p>
                  <p className="text-gray-600">Chủ TK: <strong className="uppercase text-black">{settings?.bankAccountName || 'NGUYEN VAN CHU'}</strong></p>
                  <p className="text-muted-foreground italic text-[11px] pt-0.5 border-t border-gray-200">Quét mã VietQR chuyển khoản theo mã phiếu</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 text-center text-xs">
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
