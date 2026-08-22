import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/api-client';
import { formatVND } from '@vlxd/shared';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useToast } from '../../components/ui/use-toast';
import { ArrowLeft, Truck, Package, Building, User, MapPin } from 'lucide-react';

export function DeliveryCreatePage() {
  const [salesOrderId, setSalesOrderId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10));
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryContactName, setDeliveryContactName] = useState('');
  const [deliveryContactPhone, setDeliveryContactPhone] = useState('');
  const [shippingFee, setShippingFee] = useState('0');
  const [driverCost, setDriverCost] = useState('0');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<
    Array<{
      salesOrderItemId: string;
      productVariantId: string;
      productName: string;
      orderQuantity: string;
      quantity: string;
      unitId: string;
      unitCode: string;
    }>
  >([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: orders = [] } = useQuery({
    queryKey: ['sales-orders-for-delivery'],
    queryFn: async () => {
      const res = await apiClient.get('/sales/orders');
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

  const handleOrderChange = (orderId: string) => {
    setSalesOrderId(orderId);
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      setDeliveryAddress(order.deliveryAddress || '');
      setDeliveryContactName(order.deliveryContactName || order.customer?.name || '');
      setDeliveryContactPhone(order.deliveryContactPhone || order.customer?.phone || '');
      setShippingFee(String(order.shippingFee || 0));

      const loadedItems = order.items.map((it: any) => ({
        salesOrderItemId: it.id,
        productVariantId: it.productVariantId,
        productName: it.productVariant?.name || 'Vật tư',
        orderQuantity: it.inputQuantity,
        quantity: it.inputQuantity, // Default load full quantity
        unitId: it.inputUnitId,
        unitCode: it.inputUnit?.code || '',
      }));
      setItems(loadedItems);
    } else {
      setItems([]);
    }
  };

  const handleItemQuantityChange = (index: number, qty: string) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: qty };
      return updated;
    });
  };

  const createDeliveryMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/deliveries', {
        salesOrderId,
        vehicleId: vehicleId || undefined,
        driverId: driverId || undefined,
        deliveryDate,
        deliveryAddress: deliveryAddress || undefined,
        deliveryContactName: deliveryContactName || undefined,
        deliveryContactPhone: deliveryContactPhone || undefined,
        shippingFee: parseInt(shippingFee, 10) || 0,
        driverCost: parseInt(driverCost, 10) || 0,
        notes: notes || undefined,
        items: items
          .filter((it) => parseFloat(it.quantity) > 0)
          .map((it) => ({
            salesOrderItemId: it.salesOrderItemId,
            productVariantId: it.productVariantId,
            quantity: parseFloat(it.quantity),
            unitId: it.unitId,
          })),
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      toast({ title: 'Tạo chuyến xe thành công', description: 'Đã lập phiếu điều xe giao hàng.' });
      navigate(`/giao-hang/${res.data.data.id}`);
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi tạo chuyến xe',
        description: err.response?.data?.error?.message || 'Không thể tạo chuyến giao hàng',
      });
    },
  });

  const selectedOrderObj = orders.find((o) => o.id === salesOrderId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/giao-hang')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Điều Chuyến Xe Giao Hàng Mới</h1>
          <p className="text-muted-foreground">
            Lập phiếu điều xe tải / xe ben chở vật tư giao đến công trình
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Order & Vehicle Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Thông tin Đơn hàng & Xe giao</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="del-order">Đơn hàng cần giao *</Label>
                <select
                  id="del-order"
                  className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm font-medium"
                  value={salesOrderId}
                  onChange={(e) => handleOrderChange(e.target.value)}
                >
                  <option value="">-- Chọn đơn hàng bán --</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.code} - {o.customer?.name} ({o.project ? o.project.name : 'Khách lẻ'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="del-date">Ngày giao hàng *</Label>
                <Input
                  id="del-date"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="del-veh">Xe tải / Xe ben giao hàng</Label>
                <select
                  id="del-veh"
                  className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                >
                  <option value="">-- Chọn xe hoặc Xe thuê ngoài --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plateNumber} ({v.type || v.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="del-drv">Tài xế phụ trách</Label>
                <select
                  id="del-drv"
                  className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                >
                  <option value="">-- Chọn tài xế --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.phone ? `(${d.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <Label className="text-xs text-muted-foreground">Người nhận tại bãi/công trình</Label>
                <Input
                  className="h-9 text-xs"
                  value={deliveryContactName}
                  onChange={(e) => setDeliveryContactName(e.target.value)}
                  placeholder="Tên người nhận..."
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">SĐT người nhận</Label>
                <Input
                  className="h-9 text-xs font-mono"
                  value={deliveryContactPhone}
                  onChange={(e) => setDeliveryContactPhone(e.target.value)}
                  placeholder="09..."
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Địa chỉ giao</Label>
                <Input
                  className="h-9 text-xs"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Địa chỉ công trình..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loaded Items Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Danh sách vật tư bốc lên chuyến xe này</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Vui lòng chọn đơn hàng ở trên để tải danh sách vật tư
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">STT</th>
                      <th className="px-4 py-3">Tên vật tư / Quy cách</th>
                      <th className="px-4 py-3 text-right">Tổng số lượng đơn</th>
                      <th className="px-4 py-3 text-center">ĐVT</th>
                      <th className="px-4 py-3 text-right w-44">Số lượng bốc lên xe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((it, idx) => (
                      <tr key={it.salesOrderItemId} className="hover:bg-muted/40">
                        <td className="px-4 py-3 text-xs text-muted-foreground">{idx + 1}</td>
                        <td className="px-4 py-3 font-semibold text-primary">{it.productName}</td>
                        <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                          {it.orderQuantity}
                        </td>
                        <td className="px-4 py-3 text-center">{it.unitCode}</td>
                        <td className="px-4 py-3 text-right">
                          <Input
                            type="number"
                            step="any"
                            className="h-9 text-right font-mono font-bold text-foreground"
                            value={it.quantity}
                            onChange={(e) => handleItemQuantityChange(idx, e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t mt-4">
              <div>
                <Label htmlFor="del-ship">Cước vận chuyển thu của khách (VND)</Label>
                <Input
                  id="del-ship"
                  type="number"
                  className="font-mono text-sm"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="del-cost">Tiền công / Bồi dưỡng tài xế (VND)</Label>
                <Input
                  id="del-cost"
                  type="number"
                  className="font-mono text-sm"
                  value={driverCost}
                  onChange={(e) => setDriverCost(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4">
              <Label htmlFor="del-notes">Ghi chú giao hàng</Label>
              <Input
                id="del-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Giao trước 10h sáng, đường hẹp xe 5 tấn vào được..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            size="lg"
            className="w-full sm:w-auto font-bold"
            onClick={() => createDeliveryMutation.mutate()}
            disabled={
              !salesOrderId ||
              items.filter((it) => parseFloat(it.quantity) > 0).length === 0 ||
              createDeliveryMutation.isPending
            }
          >
            <Truck className="w-4 h-4 mr-2" />
            {createDeliveryMutation.isPending ? 'Đang lưu...' : 'Lập Phiếu Điều Xe'}
          </Button>
        </div>
      </div>
    </div>
  );
}
