import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../lib/api-client';
import { formatVND, formatDate } from '@vlxd/shared';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../components/ui/use-toast';
import {
  ArrowLeft,
  Printer,
  Play,
  CheckCircle,
  XCircle,
  Truck,
  Building,
  User,
  MapPin,
  Phone,
  Calendar,
  Trash2,
} from 'lucide-react';

const DELIVERY_STATUSES = {
  PENDING: { label: 'Chờ xếp xe / điều xe', color: 'bg-amber-50 text-amber-700 border-amber-300' },
  IN_TRANSIT: { label: 'Xe đang giao hàng', color: 'bg-purple-50 text-purple-700 border-purple-300' },
  DELIVERED: { label: 'Đã giao tại công trình', color: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  CANCELLED: { label: 'Đã hủy chuyến', color: 'bg-rose-50 text-rose-700 border-rose-300' },
};

export function DeliveryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'details' | 'print'>('details');

  const { data: delivery, isLoading } = useQuery({
    queryKey: ['delivery', id],
    queryFn: async () => {
      const res = await apiClient.get(`/deliveries/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await apiClient.get('/settings');
      return res.data.data;
    },
  });

  const dispatchMutation = useMutation({
    mutationFn: async () => apiClient.post(`/deliveries/${id}/dispatch`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery', id] });
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      toast({ title: 'Xuất bến thành công', description: 'Chuyến xe đang trên đường đi giao.' });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => apiClient.post(`/deliveries/${id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery', id] });
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      toast({ title: 'Giao hàng thành công', description: 'Đã hoàn thành chuyến giao hàng.' });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => apiClient.post(`/deliveries/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery', id] });
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast({ title: 'Đã hủy chuyến xe', description: 'Chuyến xe đã được hủy.' });
    },
  });

  const deleteDeliveryMutation = useMutation({
    mutationFn: async () => apiClient.delete(`/deliveries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast({ title: 'Đã xóa chuyến xe', description: 'Chuyến xe đã được xóa vĩnh viễn.' });
      navigate('/giao-hang');
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Lỗi', description: err.response?.data?.error?.message });
    },
  });

  if (isLoading || !delivery) {
    return <div className="text-center py-12 text-muted-foreground">Đang tải thông tin chuyến xe...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/giao-hang')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Danh sách
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-mono text-primary">{delivery.code}</h1>
              <Badge
                variant="outline"
                className={DELIVERY_STATUSES[delivery.status as keyof typeof DELIVERY_STATUSES]?.color}
              >
                {DELIVERY_STATUSES[delivery.status as keyof typeof DELIVERY_STATUSES]?.label || delivery.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Đơn hàng:{' '}
              <Link to={`/don-hang/${delivery.salesOrder?.id}`} className="font-mono font-bold hover:underline">
                {delivery.salesOrder?.code}
              </Link>{' '}
              • Khách: <strong>{delivery.salesOrder?.customer?.name}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {delivery.status === 'PENDING' && (
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => dispatchMutation.mutate()}
              disabled={dispatchMutation.isPending}
            >
              <Play className="w-4 h-4 mr-1.5" />
              Xuất bến giao hàng
            </Button>
          )}

          {delivery.status === 'IN_TRANSIT' && (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
            >
              <CheckCircle className="w-4 h-4 mr-1.5" />
              Xác nhận đã giao
            </Button>
          )}

          {delivery.status !== 'DELIVERED' && delivery.status !== 'CANCELLED' && (
            <Button
              variant="outline"
              className="text-rose-600 hover:bg-rose-50"
              onClick={() => {
                if (confirm(`Hủy chuyến xe "${delivery.code}"?`)) {
                  cancelMutation.mutate();
                }
              }}
              disabled={cancelMutation.isPending}
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              Hủy chuyến
            </Button>
          )}

          <Button
            variant="outline"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              if (confirm(`Xác nhận xóa vĩnh viễn chuyến xe "${delivery.code}"?`)) {
                deleteDeliveryMutation.mutate();
              }
            }}
            disabled={deleteDeliveryMutation.isPending}
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Xóa chuyến
          </Button>

          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1.5" />
            In phiếu điều xe
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border print:hidden">
        <button
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'details'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('details')}
        >
          Chi tiết chuyến xe
        </button>
        <button
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'print'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('print')}
        >
          Xem trước Phiếu điều xe / Giao hàng
        </button>
      </div>

      {/* Detail Tab View */}
      {activeTab === 'details' && (
        <div className="space-y-6 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Phương tiện & Tài xế
                </span>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" />
                  <span className="font-bold text-base">
                    {delivery.vehicle ? delivery.vehicle.plateNumber : 'Xe thuê ngoài'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Lái xe: <strong>{delivery.driver?.name || 'Chưa gán tài xế'}</strong>
                  {delivery.driver?.phone ? `(${delivery.driver.phone})` : ''}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Điểm đến & Liên hệ
                </span>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">
                    {delivery.deliveryAddress || 'Giao tại công trình'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  {delivery.deliveryContactName} ({delivery.deliveryContactPhone || '—'})
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Cước & Chi phí chuyến
                </span>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cước thu khách:</span>
                    <span className="font-mono font-bold text-emerald-700">{formatVND(delivery.shippingFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Công lái xe:</span>
                    <span className="font-mono font-bold text-amber-800">{formatVND(delivery.driverCost)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Vật tư bốc trên chuyến xe này</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">STT</th>
                      <th className="px-4 py-3">Tên vật tư / Quy cách</th>
                      <th className="px-4 py-3 text-right">Số lượng bốc xe</th>
                      <th className="px-4 py-3 text-center">ĐVT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {delivery.items.map((it: any, index: number) => (
                      <tr key={it.id} className="hover:bg-muted/40">
                        <td className="px-4 py-3 text-xs text-muted-foreground">{index + 1}</td>
                        <td className="px-4 py-3 font-semibold text-primary">
                          {it.productVariant?.name}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                          {it.quantity}
                        </td>
                        <td className="px-4 py-3 text-center">{it.unit?.code}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Printable Delivery Dispatch Note View */}
      <div
        className={`${
          activeTab === 'print' ? 'block' : 'hidden print:block'
        } bg-white text-black p-8 rounded-lg shadow-sm border border-border print:p-0 print:border-none print:shadow-none font-sans text-xs space-y-4`}
      >
        <div className="flex justify-between items-start border-b pb-4">
          <div>
            <h2 className="text-base font-bold uppercase">{settings?.storeName || 'CỬA HÀNG VẬT LIỆU XÂY DỰNG'}</h2>
            <p className="text-muted-foreground text-[11px] mt-0.5">Địa chỉ: {settings?.storeAddress}</p>
            <p className="text-muted-foreground text-[11px]">Hotline: {settings?.storePhone}</p>
          </div>
          <div className="text-right">
            <h3 className="text-base font-bold uppercase text-primary">PHIẾU ĐIỀU XE & GIAO HÀNG</h3>
            <p className="font-mono font-bold text-xs">Mã chuyến: {delivery.code}</p>
            <p className="text-muted-foreground text-[11px]">Ngày: {formatDate(delivery.deliveryDate)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-2 border-b">
          <div className="space-y-1">
            <p>
              Khách hàng: <strong>{delivery.salesOrder?.customer?.name}</strong>
            </p>
            {delivery.salesOrder?.project && (
              <p>
                Công trình: <strong>{delivery.salesOrder.project.name}</strong>
              </p>
            )}
            <p>Địa điểm giao: {delivery.deliveryAddress || 'Tại công trình'}</p>
            <p>
              Người nhận: {delivery.deliveryContactName} ({delivery.deliveryContactPhone || '—'})
            </p>
          </div>

          <div className="space-y-1 text-right sm:text-left">
            <p>
              Đơn hàng gốc: <strong>{delivery.salesOrder?.code}</strong>
            </p>
            <p>
              Xe vận chuyển: <strong>{delivery.vehicle?.plateNumber || 'Xe ngoài'}</strong>
            </p>
            <p>
              Lái xe: <strong>{delivery.driver?.name || '—'}</strong> ({delivery.driver?.phone || '—'})
            </p>
          </div>
        </div>

        <div className="py-2">
          <table className="w-full text-xs text-left border-collapse border border-gray-300">
            <thead className="bg-gray-100 uppercase">
              <tr>
                <th className="border border-gray-300 px-2 py-1.5 text-center w-8">STT</th>
                <th className="border border-gray-300 px-3 py-1.5">Tên vật tư / Quy cách bốc lên xe</th>
                <th className="border border-gray-300 px-2 py-1.5 text-center w-16">ĐVT</th>
                <th className="border border-gray-300 px-3 py-1.5 text-right w-24">Số lượng</th>
                <th className="border border-gray-300 px-3 py-1.5">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {delivery.items.map((it: any, index: number) => (
                <tr key={it.id}>
                  <td className="border border-gray-300 px-2 py-1.5 text-center">{index + 1}</td>
                  <td className="border border-gray-300 px-3 py-1.5 font-semibold">
                    {it.productVariant?.name}
                  </td>
                  <td className="border border-gray-300 px-2 py-1.5 text-center">{it.unit?.code}</td>
                  <td className="border border-gray-300 px-3 py-1.5 text-right font-mono font-bold">
                    {it.quantity}
                  </td>
                  <td className="border border-gray-300 px-3 py-1.5 text-muted-foreground">
                    {it.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-8 text-center text-xs">
          <div>
            <p className="font-bold">Người lập phiếu</p>
            <p className="text-[10px] text-muted-foreground italic">(Ký, họ tên)</p>
            <div className="h-14"></div>
          </div>
          <div>
            <p className="font-bold">Lái xe / Người giao</p>
            <p className="text-[10px] text-muted-foreground italic">(Ký, họ tên)</p>
            <div className="h-14"></div>
          </div>
          <div>
            <p className="font-bold">Người nhận tại công trình</p>
            <p className="text-[10px] text-muted-foreground italic">(Ký, họ tên)</p>
            <div className="h-14"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
