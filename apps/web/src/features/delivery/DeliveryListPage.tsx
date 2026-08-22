import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/api-client';
import { formatDate } from '@vlxd/shared';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../components/ui/use-toast';
import {
  Plus,
  Truck,
  Building,
  User,
  MapPin,
  Play,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
} from 'lucide-react';

interface DeliveryItem {
  id: string;
  code: string;
  salesOrderId: string;
  deliveryDate: string;
  deliveryAddress: string | null;
  deliveryContactName: string | null;
  deliveryContactPhone: string | null;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  shippingFee: number;
  driverCost: number;
  notes: string | null;
  salesOrder?: {
    code: string;
    customer?: { name: string };
    project?: { name: string };
  };
  vehicle?: { plateNumber: string; vehicleType: string };
  driver?: { name: string; phone: string | null };
  items: Array<{
    id: string;
    productVariant?: { name: string };
    quantity: string;
    unit?: { code: string };
  }>;
}

const DELIVERY_STATUSES = {
  PENDING: { label: 'Chờ xếp xe / điều xe', color: 'bg-amber-50 text-amber-700 border-amber-300' },
  IN_TRANSIT: { label: 'Xe đang giao hàng', color: 'bg-purple-50 text-purple-700 border-purple-300' },
  DELIVERED: { label: 'Đã giao tại công trình', color: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  CANCELLED: { label: 'Đã hủy chuyến', color: 'bg-rose-50 text-rose-700 border-rose-300' },
};

export function DeliveryListPage() {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: deliveries = [], isLoading } = useQuery({
    queryKey: ['deliveries', selectedStatus, selectedVehicle, selectedDriver],
    queryFn: async () => {
      const res = await apiClient.get('/deliveries', {
        params: {
          status: selectedStatus || undefined,
          vehicleId: selectedVehicle || undefined,
          driverId: selectedDriver || undefined,
        },
      });
      return res.data.data as DeliveryItem[];
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

  // Action Mutations
  const dispatchMutation = useMutation({
    mutationFn: async (id: string) => apiClient.post(`/deliveries/${id}/dispatch`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      toast({ title: 'Xuất bến thành công', description: 'Chuyến xe đã chuyển sang trạng thái đang giao hàng.' });
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Lỗi', description: err.response?.data?.error?.message });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => apiClient.post(`/deliveries/${id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      toast({ title: 'Giao hàng thành công', description: 'Đã xác nhận bàn giao vật tư tại chân công trình.' });
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Lỗi', description: err.response?.data?.error?.message });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => apiClient.post(`/deliveries/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast({ title: 'Đã hủy chuyến xe', description: 'Chuyến xe đã được hủy.' });
    },
  });

  const deleteDeliveryMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/deliveries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast({ title: 'Đã xóa chuyến xe', description: 'Chuyến xe đã được xóa vĩnh viễn.' });
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Lỗi', description: err.response?.data?.error?.message });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Chuyến xe Giao hàng</h1>
          <p className="text-muted-foreground">
            Điều xe tải / xe ben chở vật tư, theo dõi hành trình giao nhận tại chân công trình
          </p>
        </div>

        <Button onClick={() => navigate('/giao-hang/tao-chuyen')} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Điều chuyến xe mới
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xếp xe / điều xe</option>
              <option value="IN_TRANSIT">Xe đang giao hàng</option>
              <option value="DELIVERED">Đã giao tại công trình</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>

            <select
              className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
            >
              <option value="">Tất cả xe tải</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plateNumber} ({v.vehicleType})
                </option>
              ))}
            </select>

            <select
              className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
            >
              <option value="">Tất cả tài xế</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải danh sách chuyến xe...</div>
          ) : deliveries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có chuyến xe giao hàng nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Mã chuyến</th>
                    <th className="px-4 py-3">Ngày giao</th>
                    <th className="px-4 py-3">Đơn hàng / Công trình</th>
                    <th className="px-4 py-3">Xe & Tài xế</th>
                    <th className="px-4 py-3">Vật tư bốc lên xe</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {deliveries.map((d) => (
                    <tr key={d.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono font-bold text-primary">
                        <Link to={`/giao-hang/${d.id}`} className="hover:underline">
                          {d.code}
                        </Link>
                      </td>

                      <td className="px-4 py-3 text-xs whitespace-nowrap">{formatDate(d.deliveryDate)}</td>

                      <td className="px-4 py-3">
                        <span className="font-semibold block text-primary font-mono">
                          {d.salesOrder?.code}
                        </span>
                        <span className="text-xs text-muted-foreground block">
                          Khách: {d.salesOrder?.customer?.name}
                        </span>
                        {d.salesOrder?.project && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Building className="w-3 h-3" />
                            {d.salesOrder.project.name}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs">
                        <span className="font-bold font-mono block text-foreground">
                          {d.vehicle ? `${d.vehicle.plateNumber}` : 'Xe thuê ngoài'}
                        </span>
                        <span className="text-muted-foreground flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3" />
                          {d.driver?.name || 'Chưa gán lái xe'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-xs">
                        <div className="space-y-0.5">
                          {d.items.slice(0, 2).map((it) => (
                            <div key={it.id}>
                              <span className="font-medium">{it.productVariant?.name}</span>: {it.quantity}{' '}
                              {it.unit?.code}
                            </div>
                          ))}
                          {d.items.length > 2 && (
                            <span className="text-muted-foreground italic">
                              +{d.items.length - 2} mặt hàng khác...
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <Badge variant="outline" className={DELIVERY_STATUSES[d.status]?.color}>
                          {DELIVERY_STATUSES[d.status]?.label || d.status}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => navigate(`/giao-hang/${d.id}`)}
                          title="Xem chi tiết & In phiếu điều xe"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Chi tiết
                        </Button>

                        {d.status === 'PENDING' && (
                          <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 text-white h-8"
                            onClick={() => {
                              if (confirm(`Cho xe "${d.code}" xuất bến đi giao?`)) {
                                dispatchMutation.mutate(d.id);
                              }
                            }}
                            disabled={dispatchMutation.isPending}
                          >
                            <Play className="w-3.5 h-3.5 mr-1" />
                            Xuất bến
                          </Button>
                        )}

                        {d.status === 'IN_TRANSIT' && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8"
                            onClick={() => {
                              if (confirm(`Xác nhận đã giao hàng thành công chuyến "${d.code}"?`)) {
                                completeMutation.mutate(d.id);
                              }
                            }}
                            disabled={completeMutation.isPending}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Đã giao
                          </Button>
                        )}

                        {d.status !== 'DELIVERED' && d.status !== 'CANCELLED' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-rose-600 hover:bg-rose-50 h-8"
                            onClick={() => {
                              if (confirm(`Hủy chuyến xe "${d.code}"?`)) {
                                cancelMutation.mutate(d.id);
                              }
                            }}
                            disabled={cancelMutation.isPending}
                            title="Hủy chuyến"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                          onClick={() => {
                            if (confirm(`Xác nhận xóa vĩnh viễn chuyến xe "${d.code}"?`)) {
                              deleteDeliveryMutation.mutate(d.id);
                            }
                          }}
                          disabled={deleteDeliveryMutation.isPending}
                          title="Xóa chuyến xe"
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
  );
}
