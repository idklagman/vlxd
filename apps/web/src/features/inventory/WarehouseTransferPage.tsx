import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/api-client';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { useToast } from '../../components/ui/use-toast';
import { Plus, Trash2, ArrowRightLeft, ArrowLeft } from 'lucide-react';

export function WarehouseTransferPage() {
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<
    Array<{
      productVariantId: string;
      quantity: string;
      unitId: string;
    }>
  >([
    {
      productVariantId: '',
      quantity: '1',
      unitId: '',
    },
  ]);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  const transferMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/inventory/transfers', {
        fromWarehouseId,
        toWarehouseId,
        transferDate,
        notes: notes || undefined,
        items: items.map((it) => ({
          productVariantId: it.productVariantId,
          quantity: parseFloat(it.quantity) || 0,
          unitId: it.unitId,
        })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      toast({
        title: 'Chuyển kho thành công',
        description: 'Đã hoàn tất điều chuyển hàng hóa giữa 2 kho bãi.',
      });
      navigate('/ton-kho');
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi chuyển kho',
        description: err.response?.data?.error?.message || 'Không thể tạo phiếu chuyển kho',
      });
    },
  });

  const handleAddItem = () => {
    setItems((prev) => [...prev, { productVariantId: '', quantity: '1', unitId: '' }]);
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
      if (field === 'productVariantId') {
        const variant = allVariants.find((v) => v.id === value);
        if (variant && !updated[index].unitId) {
          updated[index].unitId = variant.baseUnitId;
        }
      }
      return updated;
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/ton-kho')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chuyển kho nội bộ</h1>
          <p className="text-muted-foreground">
            Điều chuyển vật liệu xây dựng từ Kho xuất sang Kho nhận (tự động xuất/nhập vào sổ cái)
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin Phiếu chuyển kho</CardTitle>
          <CardDescription>Chọn kho xuất, kho nhận và ngày thực hiện</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="trans-from">Kho xuất hàng *</Label>
              <select
                id="trans-from"
                className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                value={fromWarehouseId}
                onChange={(e) => setFromWarehouseId(e.target.value)}
              >
                <option value="">-- Chọn kho xuất --</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="trans-to">Kho nhận hàng *</Label>
              <select
                id="trans-to"
                className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                value={toWarehouseId}
                onChange={(e) => setToWarehouseId(e.target.value)}
              >
                <option value="">-- Chọn kho nhận --</option>
                {warehouses
                  .filter((w) => w.id !== fromWarehouseId)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <Label htmlFor="trans-date">Ngày chuyển *</Label>
              <Input
                id="trans-date"
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="trans-notes">Ghi chú điều chuyển</Label>
            <Input
              id="trans-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Xe 29C-123.45 chở, phục vụ tập kết..."
            />
          </div>

          {/* Items */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-bold">Danh sách mặt hàng chuyển</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Thêm sản phẩm
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-card p-3 rounded-lg border border-border"
                >
                  <div className="sm:col-span-6">
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

                  <div className="sm:col-span-3">
                    <Label className="text-xs text-muted-foreground">Số lượng chuyển</Label>
                    <Input
                      type="number"
                      step="any"
                      className="h-9 text-xs"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">Đơn vị</Label>
                    <select
                      className="w-full h-9 px-2 border border-input rounded bg-background text-xs"
                      value={item.unitId}
                      onChange={(e) => handleItemChange(index, 'unitId', e.target.value)}
                    >
                      <option value="">-- Đơn vị --</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.code} ({u.name})
                        </option>
                      ))}
                    </select>
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
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => navigate('/ton-kho')}>
              Hủy bỏ
            </Button>
            <Button
              onClick={() => transferMutation.mutate()}
              disabled={
                !fromWarehouseId ||
                !toWarehouseId ||
                fromWarehouseId === toWarehouseId ||
                items.some((it) => !it.productVariantId || !it.unitId) ||
                transferMutation.isPending
              }
            >
              <ArrowRightLeft className="w-4 h-4 mr-1.5" />
              {transferMutation.isPending ? 'Đang chuyển...' : 'Xác nhận chuyển kho'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
