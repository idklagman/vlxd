import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { formatVND, formatDate } from '@vlxd/shared';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
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
  Plus,
  Receipt,
  Truck,
  User,
  CreditCard,
  Banknote,
  DollarSign,
  TrendingDown,
} from 'lucide-react';

interface ExpenseItem {
  id: string;
  code: string;
  categoryId: string;
  vehicleId: string | null;
  driverId: string | null;
  amount: number;
  expenseDate: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER';
  recipientName: string | null;
  notes: string | null;
  category?: { name: string; code: string };
  vehicle?: { plateNumber: string; vehicleType: string };
  driver?: { name: string };
}

export function ExpenseListPage() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');

  // Add Expense Dialog
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH');
  const [recipientName, setRecipientName] = useState('');
  const [notes, setNotes] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses', selectedCategory, selectedVehicle, selectedMethod],
    queryFn: async () => {
      const res = await apiClient.get('/expenses', {
        params: {
          categoryId: selectedCategory || undefined,
          vehicleId: selectedVehicle || undefined,
          paymentMethod: selectedMethod || undefined,
        },
      });
      return res.data.data as ExpenseItem[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const res = await apiClient.get('/expenses/categories');
      return res.data.data as any[];
    },
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await apiClient.get('/vehicles');
      return res.data.data as any[];
    },
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const res = await apiClient.get('/drivers');
      return res.data.data as any[];
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/expenses', {
        categoryId,
        vehicleId: vehicleId || undefined,
        driverId: driverId || undefined,
        amount: parseInt(amount, 10),
        expenseDate,
        paymentMethod,
        recipientName: recipientName || undefined,
        notes: notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['cash-fund'] });
      queryClient.invalidateQueries({ queryKey: ['bank-fund'] });
      toast({ title: 'Ghi nhận chi phí thành công', description: 'Đã lưu chi phí và tự động trừ sổ quỹ.' });
      setIsAddOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: err.response?.data?.error?.message || 'Không thể tạo chi phí',
      });
    },
  });

  const resetForm = () => {
    setCategoryId('');
    setVehicleId('');
    setDriverId('');
    setAmount('');
    setPaymentMethod('CASH');
    setRecipientName('');
    setNotes('');
  };

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalCashAmount = expenses
    .filter((e) => e.paymentMethod === 'CASH')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalBankAmount = expenses
    .filter((e) => e.paymentMethod === 'BANK_TRANSFER')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalVehicleAmount = expenses
    .filter((e) => !!e.vehicleId)
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chi phí Cửa hàng & Đội xe</h1>
          <p className="text-muted-foreground">
            Quản lý các khoản chi xăng dầu, bảo dưỡng xe tải, lương bốc xếp, thuê mặt bằng, điện nước
          </p>
        </div>

        <Button onClick={() => setIsAddOpen(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Thêm khoản chi
        </Button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-rose-50/40 border-rose-200">
          <CardContent className="pt-4 space-y-1">
            <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider block">
              Tổng chi phí vận hành
            </span>
            <div className="text-2xl font-bold font-mono text-rose-700">
              {formatVND(totalExpenseAmount)}
            </div>
            <p className="text-[11px] text-muted-foreground">{expenses.length} khoản chi</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Chi bằng Tiền mặt
            </span>
            <div className="text-xl font-bold font-mono text-amber-800 flex items-center gap-1">
              <Banknote className="w-4 h-4" />
              {formatVND(totalCashAmount)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Chi bằng Chuyển khoản
            </span>
            <div className="text-xl font-bold font-mono text-blue-700 flex items-center gap-1">
              <CreditCard className="w-4 h-4" />
              {formatVND(totalBankAmount)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Chi phí theo Đội xe
            </span>
            <div className="text-xl font-bold font-mono text-purple-700 flex items-center gap-1">
              <Truck className="w-4 h-4" />
              {formatVND(totalVehicleAmount)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense List Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Tất cả loại chi phí</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
            >
              <option value="">Tất cả xe tải</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plateNumber} ({v.type || v.name})
                </option>
              ))}
            </select>

            <select
              className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
            >
              <option value="">Tất cả hình thức</option>
              <option value="CASH">Tiền mặt</option>
              <option value="BANK_TRANSFER">Chuyển khoản</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải danh sách chi phí...</div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có khoản chi phí nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Mã phiếu</th>
                    <th className="px-4 py-3">Ngày chi</th>
                    <th className="px-4 py-3">Loại chi phí</th>
                    <th className="px-4 py-3">Xe tải / Tài xế</th>
                    <th className="px-4 py-3">Người nhận / Diễn giải</th>
                    <th className="px-4 py-3">Hình thức</th>
                    <th className="px-4 py-3 text-right">Số tiền chi (VND)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono font-bold text-primary">{exp.code}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">{formatDate(exp.expenseDate)}</td>
                      <td className="px-4 py-3 font-semibold">{exp.category?.name}</td>
                      <td className="px-4 py-3 text-xs">
                        {exp.vehicle ? (
                          <span className="font-bold font-mono block text-foreground">
                            {exp.vehicle.plateNumber}
                          </span>
                        ) : (
                          '—'
                        )}
                        {exp.driver && (
                          <span className="text-muted-foreground text-[11px] block">{exp.driver.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {exp.recipientName && (
                          <span className="font-medium block">{exp.recipientName}</span>
                        )}
                        <span className="text-muted-foreground">{exp.notes || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={
                            exp.paymentMethod === 'CASH'
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-blue-50 text-blue-800'
                          }
                        >
                          {exp.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">
                        {formatVND(exp.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Expense Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm Khoản Chi Phí Mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="exp-cat">Loại chi phí *</Label>
              <select
                id="exp-cat"
                className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm font-medium"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">-- Chọn loại chi phí --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="exp-veh">Xe tải (nếu chi cho xe)</Label>
                <select
                  id="exp-veh"
                  className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                >
                  <option value="">-- Không gán xe --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plateNumber} ({v.type || v.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="exp-drv">Tài xế / Người chi</Label>
                <select
                  id="exp-drv"
                  className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                >
                  <option value="">-- Không gán tài xế --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="exp-amount">Số tiền chi (VND) *</Label>
              <Input
                id="exp-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="VD: 1500000"
                className="font-mono text-base font-bold text-rose-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="exp-method">Phương thức thanh toán</Label>
                <select
                  id="exp-method"
                  className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                >
                  <option value="CASH">Tiền mặt (Quỹ két)</option>
                  <option value="BANK_TRANSFER">Chuyển khoản Ngân hàng</option>
                </select>
              </div>

              <div>
                <Label htmlFor="exp-date">Ngày chi</Label>
                <Input
                  id="exp-date"
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="exp-rec">Người nhận / Đơn vị cung cấp</Label>
              <Input
                id="exp-rec"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Cây xăng Petrolimex, Gara ô tô Tuấn Cường..."
              />
            </div>

            <div>
              <Label htmlFor="exp-notes">Ghi chú chi tiết</Label>
              <Input
                id="exp-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Đổ 50 lít dầu diesel cho xe 29C-123.45..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Hủy
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              onClick={() => createExpenseMutation.mutate()}
              disabled={!categoryId || !amount || createExpenseMutation.isPending}
            >
              {createExpenseMutation.isPending ? 'Đang lưu...' : 'Xác nhận Chi phí'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
