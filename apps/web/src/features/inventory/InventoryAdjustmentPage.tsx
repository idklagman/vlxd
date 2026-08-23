import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/api-client';
import { getErrorMessage } from '../../lib/error-utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { useToast } from '../../components/ui/use-toast';
import { Plus, Trash2, SlidersHorizontal, ArrowLeft, AlertCircle } from 'lucide-react';

export function InventoryAdjustmentPage() {
  const [warehouseId, setWarehouseId] = useState('');
  const [adjustmentDate, setAdjustmentDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');
  const [items, setItems] = useState<
    Array<{
      productVariantId: string;
      newQuantity: string;
      notes: string;
    }>
  >([
    {
      productVariantId: '',
      newQuantity: '0',
      notes: '',
    },
  ]);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await apiClient.get('/warehouses');
      const data = res.data.data as { id: string; name: string }[];
      if (data.length > 0 && !warehouseId) {
        setWarehouseId(data[0].id);
      }
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await apiClient.get('/products');
      return res.data.data as any[];
    },
  });

  const { data: balances = [] } = useQuery({
    queryKey: ['inventory-balances', warehouseId],
    queryFn: async () => {
      if (!warehouseId) return [];
      const res = await apiClient.get('/inventory/balances', {
        params: { warehouseId },
      });
      return res.data.data as any[];
    },
    enabled: !!warehouseId,
  });

  const allVariants = products.flatMap((p) =>
    p.variants.map((v: any) => ({
      ...v,
      productName: p.name,
    }))
  );

  const getVariantCurrentStock = (variantId: string) => {
    const b = balances.find((bal) => bal.productVariantId === variantId);
    return b ? b.currentStock : 0;
  };

  const getVariantBaseUnit = (variantId: string) => {
    const v = allVariants.find((varItem) => varItem.id === variantId);
    return v?.baseUnit?.code || '';
  };

  const adjustmentMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/inventory/adjustments', {
        warehouseId,
        adjustmentDate,
        reason,
        items: items.map((it) => ({
          productVariantId: it.productVariantId,
          newQuantity: parseFloat(it.newQuantity) || 0,
          notes: it.notes || undefined,
        })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      toast({
        title: 'Điều chỉnh thành công',
        description: 'Đã cập nhật số lượng tồn kho và lưu bút toán kiểm kê vào sổ cái.',
      });
      navigate('/ton-kho');
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi kiểm kê',
        description: getErrorMessage(err, 'Không thể lưu phiếu kiểm kê. Vui lòng kiểm tra lại.'),
      });
    },
  });

  const handleAddItem = () => {
    setItems((prev) => [...prev, { productVariantId: '', newQuantity: '0', notes: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, idx) => idx !== index));
    }
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    let sanitizedValue = value;
    if (field === 'newQuantity') {
      sanitizedValue = value.replace(/-/g, '');
    }

    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: sanitizedValue };
      if (field === 'productVariantId') {
        const curStock = getVariantCurrentStock(sanitizedValue);
        updated[index].newQuantity = String(curStock);
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
          <h1 className="text-2xl font-bold tracking-tight">Kiểm kê & Điều chỉnh Tồn kho</h1>
          <p className="text-muted-foreground">
            Cân đối lại số lượng thực tế trong kho bãi và ghi lý do giải trình vào sổ cái
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <p className="font-semibold text-sm">Nguyên tắc kiểm kê VLXD:</p>
          <p>
            Mọi sự thay đổi số lượng tồn kho (do kiểm đếm định kỳ, hao hụt bốc dỡ cát sỏi, rách bao xi măng...)
            đều <strong>bắt buộc phải ghi rõ Lý do</strong>. Hệ thống sẽ ghi nhận giao dịch <em>Kiểm kê điều chỉnh</em> vào Sổ cái bất biến.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin Phiếu kiểm kê</CardTitle>
          <CardDescription>Kho hàng: {warehouses[0]?.name || 'Kho Tổng VLXD'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="adj-wh">Kho hàng</Label>
              <Input
                id="adj-wh"
                value={warehouses[0]?.name || 'Kho Tổng VLXD'}
                disabled
                className="bg-muted text-foreground font-medium"
              />
            </div>

            <div>
              <Label htmlFor="adj-date">Ngày kiểm kê *</Label>
              <Input
                id="adj-date"
                type="date"
                value={adjustmentDate}
                onChange={(e) => setAdjustmentDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="adj-reason">Lý do điều chỉnh (Bắt buộc) *</Label>
            <Input
              id="adj-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Kiểm kê định kỳ cuối tháng, Bù hao hụt cát bốc dỡ, Rách 2 bao xi măng..."
            />
          </div>

          {/* Items */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-bold">Danh sách mặt hàng kiểm đếm</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                disabled={!warehouseId}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Thêm sản phẩm
              </Button>
            </div>

            {!warehouseId ? (
              <div className="text-center py-6 text-xs text-muted-foreground bg-muted/20 border border-dashed rounded">
                Vui lòng chọn Kho hàng ở trên trước khi chọn mặt hàng kiểm kê
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => {
                  const currentStock = getVariantCurrentStock(item.productVariantId);
                  const baseUnit = getVariantBaseUnit(item.productVariantId);
                  const newStock = parseFloat(item.newQuantity) || 0;
                  const diff = Number((newStock - currentStock).toFixed(4));

                  return (
                    <div
                      key={index}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-card p-3 rounded-lg border border-border"
                    >
                      <div className="sm:col-span-5">
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

                      <div className="sm:col-span-2 text-center bg-muted/40 p-2 rounded">
                        <span className="text-[11px] text-muted-foreground block">Tồn trên sổ</span>
                        <span className="font-mono font-bold text-xs">
                          {currentStock} {baseUnit}
                        </span>
                      </div>

                      <div className="sm:col-span-2">
                        <Label className="text-xs text-muted-foreground">Tồn thực tế mới</Label>
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          className="h-9 text-xs font-mono font-bold text-primary"
                          value={item.newQuantity}
                          onChange={(e) => handleItemChange(index, 'newQuantity', e.target.value)}
                        />
                      </div>

                      <div className="sm:col-span-2 text-center">
                        <span className="text-[11px] text-muted-foreground block">Chênh lệch</span>
                        <span
                          className={`font-mono font-bold text-xs ${
                            diff > 0
                              ? 'text-emerald-600'
                              : diff < 0
                              ? 'text-rose-600'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {diff > 0 ? `+${diff}` : diff} {baseUnit}
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
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => navigate('/ton-kho')}>
              Hủy bỏ
            </Button>
            <Button
              onClick={() => adjustmentMutation.mutate()}
              disabled={
                !warehouseId ||
                reason.trim().length < 3 ||
                items.some((it) => !it.productVariantId) ||
                adjustmentMutation.isPending
              }
            >
              <SlidersHorizontal className="w-4 h-4 mr-1.5" />
              {adjustmentMutation.isPending ? 'Đang lưu...' : 'Xác nhận điều chỉnh'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
