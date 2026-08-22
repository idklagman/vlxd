import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { getErrorMessage } from '../../lib/error-utils';
import { formatVND, formatDate } from '@vlxd/shared';
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
  Plus,
  ArrowDownToLine,
  Search,
  CheckCircle,
  XCircle,
  FileText,
  Trash2,
  PackageCheck,
} from 'lucide-react';

interface PurchaseItem {
  id: string;
  productVariant: { name: string; sku: string | null };
  inputQuantity: string;
  inputUnit: { code: string; name: string };
  baseQuantity: string;
  baseUnit: { code: string; name: string };
  unitPrice: number;
  totalAmount: number;
}

interface Purchase {
  id: string;
  code: string;
  supplierId: string;
  warehouseId: string;
  purchaseDate: string;
  status: 'DRAFT' | 'RECEIVED' | 'CANCELLED';
  subtotalAmount: number;
  discountAmount: number;
  grandTotal: number;
  paidAmount: number;
  debtAmount: number;
  notes: string | null;
  receivedAt: string | null;
  supplier: { name: string; phone: string | null };
  warehouse: { name: string };
  items: PurchaseItem[];
}

const PURCHASE_STATUSES = {
  DRAFT: { label: 'Đơn nháp', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  RECEIVED: { label: 'Đã nhập kho', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export function PurchaseListPage() {
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Create Purchase Dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [discountAmount, setDiscountAmount] = useState('0');
  const [paidAmount, setPaidAmount] = useState('0');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<
    Array<{
      productVariantId: string;
      inputQuantity: string;
      inputUnitId: string;
      unitPrice: string;
    }>
  >([
    {
      productVariantId: '',
      inputQuantity: '1',
      inputUnitId: '',
      unitPrice: '0',
    },
  ]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ['purchases', selectedSupplier, selectedWarehouse, selectedStatus],
    queryFn: async () => {
      const res = await apiClient.get('/purchases', {
        params: {
          supplierId: selectedSupplier || undefined,
          warehouseId: selectedWarehouse || undefined,
          status: selectedStatus || undefined,
        },
      });
      return res.data.data as Purchase[];
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await apiClient.get('/suppliers');
      return res.data.data as { id: string; name: string }[];
    },
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await apiClient.get('/warehouses');
      return res.data.data as { id: string; name: string }[];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await apiClient.get('/products');
      return res.data.data as any[];
    },
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const res = await apiClient.get('/units');
      return res.data.data as { id: string; code: string; name: string }[];
    },
  });

  const allVariants = products.flatMap((p) =>
    p.variants.map((v: any) => ({
      ...v,
      productName: p.name,
    }))
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/purchases', {
        supplierId,
        warehouseId,
        purchaseDate,
        discountAmount: parseInt(discountAmount, 10) || 0,
        paidAmount: parseInt(paidAmount, 10) || 0,
        notes: notes || undefined,
        items: items.map((it) => ({
          productVariantId: it.productVariantId,
          inputQuantity: parseFloat(it.inputQuantity),
          inputUnitId: it.inputUnitId,
          unitPrice: parseInt(it.unitPrice, 10),
        })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast({ title: 'Thành công', description: 'Đã tạo đơn nhập hàng (trạng thái Nháp)' });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi tạo đơn nhập',
        description: getErrorMessage(err, 'Không thể tạo đơn nhập hàng. Vui lòng kiểm tra lại.'),
      });
    },
  });

  const receiveMutation = useMutation({
    mutationFn: async (purchaseId: string) => {
      return apiClient.post(`/purchases/${purchaseId}/receive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
      toast({
        title: 'Nhập kho thành công',
        description: 'Đã tăng số lượng tồn kho và cập nhật giá vốn bình quân di động.',
      });
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi nhập kho',
        description: getErrorMessage(err, 'Không thể xác nhận nhập kho.'),
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (purchaseId: string) => {
      return apiClient.post(`/purchases/${purchaseId}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast({ title: 'Đã hủy đơn', description: 'Đơn nhập hàng đã được chuyển sang trạng thái Hủy' });
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi hủy đơn nhập',
        description: getErrorMessage(err, 'Không thể hủy đơn nhập hàng.'),
      });
    },
  });

  const deletePurchaseMutation = useMutation({
    mutationFn: async (purchaseId: string) => {
      return apiClient.delete(`/purchases/${purchaseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
      toast({ title: 'Đã xóa đơn nhập', description: 'Đơn nhập hàng đã được xóa khỏi hệ thống.' });
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi xóa đơn nhập',
        description: getErrorMessage(err, 'Không thể xóa đơn nhập hàng.'),
      });
    },
  });

  const resetForm = () => {
    setSupplierId('');
    setWarehouseId('');
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setDiscountAmount('0');
    setPaidAmount('0');
    setNotes('');
    setItems([{ productVariantId: '', inputQuantity: '1', inputUnitId: '', unitPrice: '0' }]);
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { productVariantId: '', inputQuantity: '1', inputUnitId: '', unitPrice: '0' },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, idx) => idx !== index));
    }
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // Auto set inputUnitId to baseUnitId if variant is selected and unit not yet selected
      if (field === 'productVariantId') {
        const variant = allVariants.find((v) => v.id === value);
        if (variant && !updated[index].inputUnitId) {
          updated[index].inputUnitId = variant.baseUnitId;
        }
      }
      return updated;
    });
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, it) => {
      const qty = parseFloat(it.inputQuantity) || 0;
      const price = parseInt(it.unitPrice, 10) || 0;
      return sum + qty * price;
    }, 0);
  };

  const grandTotal = Math.max(0, calculateSubtotal() - (parseInt(discountAmount, 10) || 0));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Nhập hàng</h1>
          <p className="text-muted-foreground">
            Tạo đơn nhập vật liệu từ Nhà cung cấp, hỗ trợ quy đổi đơn vị và tự động tính giá vốn bình quân di động
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Tạo đơn nhập hàng
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
            >
              <option value="">Tất cả Nhà cung cấp</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
            >
              <option value="">Tất cả Kho nhận</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <select
              className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="DRAFT">Đơn nháp</option>
              <option value="RECEIVED">Đã nhập kho</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải đơn nhập hàng...</div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ArrowDownToLine className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có đơn nhập hàng nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Mã đơn</th>
                    <th className="px-4 py-3">Ngày nhập</th>
                    <th className="px-4 py-3">Nhà cung cấp</th>
                    <th className="px-4 py-3">Kho nhận</th>
                    <th className="px-4 py-3">Sản phẩm</th>
                    <th className="px-4 py-3">Tổng tiền (VND)</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono font-bold text-primary">{p.code}</td>
                      <td className="px-4 py-3">{formatDate(p.purchaseDate)}</td>
                      <td className="px-4 py-3 font-medium">{p.supplier?.name}</td>
                      <td className="px-4 py-3 text-xs">{p.warehouse?.name}</td>
                      <td className="px-4 py-3 text-xs">
                        <div className="space-y-0.5">
                          {p.items.map((it) => (
                            <div key={it.id}>
                              <span className="font-semibold">{it.productVariant.name}</span>: {it.inputQuantity}{' '}
                              {it.inputUnit.code}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold font-mono text-emerald-700">
                        {formatVND(p.grandTotal)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={PURCHASE_STATUSES[p.status]?.color}>
                          {PURCHASE_STATUSES[p.status]?.label || p.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                        {p.status === 'DRAFT' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white h-8"
                              onClick={() => {
                                if (confirm(`Xác nhận nhập kho cho đơn "${p.code}"? Số lượng sẽ được tăng vào kho.`)) {
                                  receiveMutation.mutate(p.id);
                                }
                              }}
                              disabled={receiveMutation.isPending}
                            >
                              <PackageCheck className="w-3.5 h-3.5 mr-1" />
                              Nhập kho
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-rose-600 hover:bg-rose-50 h-8"
                              onClick={() => {
                                if (confirm(`Xác nhận hủy đơn nhập "${p.code}"?`)) {
                                  cancelMutation.mutate(p.id);
                                }
                              }}
                              disabled={cancelMutation.isPending}
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Hủy đơn
                            </Button>
                          </>
                        )}
                        {p.status === 'RECEIVED' && (
                          <span className="text-xs text-muted-foreground font-mono mr-2">
                            Đã vào sổ kho: {p.receivedAt ? formatDate(p.receivedAt) : ''}
                          </span>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                          onClick={() => {
                            if (confirm(`Xác nhận xóa vĩnh viễn đơn nhập "${p.code}"?`)) {
                              deletePurchaseMutation.mutate(p.id);
                            }
                          }}
                          disabled={deletePurchaseMutation.isPending}
                          title="Xóa đơn nhập"
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

      {/* Create Purchase Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo đơn nhập hàng từ Nhà cung cấp</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="pur-sup">Nhà cung cấp *</Label>
                <select
                  id="pur-sup"
                  className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                >
                  <option value="">-- Chọn nhà cung cấp --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="pur-wh">Kho nhập hàng *</Label>
                <select
                  id="pur-wh"
                  className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                >
                  <option value="">-- Chọn kho bãi --</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="pur-date">Ngày nhập hàng *</Label>
                <Input
                  id="pur-date"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-bold">Danh sách mặt hàng nhập</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Thêm dòng
                </Button>
              </div>

              <div className="space-y-3 border rounded-lg p-3 bg-muted/20">
                {items.map((item, index) => {
                  const lineTotal =
                    (parseFloat(item.inputQuantity) || 0) * (parseInt(item.unitPrice, 10) || 0);

                  return (
                    <div
                      key={index}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-card p-2.5 rounded border border-border"
                    >
                      <div className="sm:col-span-4">
                        <Label className="text-xs text-muted-foreground">Sản phẩm / Quy cách</Label>
                        <select
                          className="w-full h-9 px-2 border border-input rounded bg-background text-xs"
                          value={item.productVariantId}
                          onChange={(e) => handleItemChange(index, 'productVariantId', e.target.value)}
                        >
                          <option value="">-- Chọn sản phẩm --</option>
                          {allVariants.map((v: any) => (
                            <option key={v.id} value={v.id}>
                              {v.name} ({v.productName})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <Label className="text-xs text-muted-foreground">Số lượng</Label>
                        <Input
                          type="number"
                          step="any"
                          className="h-9 text-xs"
                          value={item.inputQuantity}
                          onChange={(e) => handleItemChange(index, 'inputQuantity', e.target.value)}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <Label className="text-xs text-muted-foreground">Đơn vị nhập</Label>
                        <select
                          className="w-full h-9 px-2 border border-input rounded bg-background text-xs"
                          value={item.inputUnitId}
                          onChange={(e) => handleItemChange(index, 'inputUnitId', e.target.value)}
                        >
                          <option value="">-- Đơn vị --</option>
                          {units.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.code} ({u.name})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <Label className="text-xs text-muted-foreground">Đơn giá (VND)</Label>
                        <Input
                          type="number"
                          className="h-9 text-xs"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        />
                      </div>

                      <div className="sm:col-span-1 text-right">
                        <Label className="text-xs text-muted-foreground block">Thành tiền</Label>
                        <span className="text-xs font-bold font-mono text-primary">
                          {formatVND(lineTotal)}
                        </span>
                      </div>

                      <div className="sm:col-span-1 flex justify-end">
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <Label htmlFor="pur-notes">Ghi chú đơn hàng</Label>
                <Input
                  id="pur-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Số hóa đơn đỏ, biển số xe giao..."
                />
              </div>

              <div className="space-y-2 bg-muted/40 p-3 rounded-lg text-sm">
                <div className="flex justify-between">
                  <span>Tổng tiền hàng:</span>
                  <span className="font-mono font-semibold">{formatVND(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Chiết khấu giảm giá:</span>
                  <Input
                    type="number"
                    className="w-32 h-8 text-right font-mono text-xs"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                  />
                </div>
                <div className="flex justify-between items-center pt-2 border-t font-bold text-base text-primary">
                  <span>Tổng thanh toán:</span>
                  <span className="font-mono">{formatVND(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={
                !supplierId ||
                !warehouseId ||
                items.some((it) => !it.productVariantId || !it.inputUnitId) ||
                createMutation.isPending
              }
            >
              {createMutation.isPending ? 'Đang tạo...' : 'Lưu đơn nháp'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
