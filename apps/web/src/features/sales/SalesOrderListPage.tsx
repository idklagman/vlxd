import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/api-client';
import { formatVND, formatDate } from '@vlxd/shared';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../components/ui/use-toast';
import {
  Plus,
  ShoppingCart,
  Building,
  CheckCircle,
  Truck,
  CheckCheck,
  XCircle,
  Eye,
  FileText,
  Trash2,
} from 'lucide-react';

interface SalesOrderItem {
  id: string;
  productVariant: { name: string; sku: string | null };
  inputQuantity: string;
  inputUnit: { code: string; name: string };
  unitPrice: number;
  totalAmount: number;
}

interface SalesOrder {
  id: string;
  code: string;
  customerId: string;
  projectId: string | null;
  warehouseId: string;
  orderDate: string;
  status: 'DRAFT' | 'CONFIRMED' | 'PREPARING' | 'DELIVERING' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
  subtotalAmount: number;
  discountAmount: number;
  shippingFee: number;
  grandTotal: number;
  paidAmount: number;
  debtAmount: number;
  notes: string | null;
  customer: { name: string; phone: string | null };
  project: { name: string } | null;
  warehouse: { name: string };
  items: SalesOrderItem[];
}

const ORDER_STATUSES = {
  DRAFT: { label: 'Đơn nháp / Báo giá', color: 'bg-amber-50 text-amber-700 border-amber-300' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'bg-blue-50 text-blue-700 border-blue-300' },
  PREPARING: { label: 'Đang soạn hàng', color: 'bg-indigo-50 text-indigo-700 border-indigo-300' },
  DELIVERING: { label: 'Đang giao hàng', color: 'bg-purple-50 text-purple-700 border-purple-300' },
  DELIVERED: { label: 'Đã giao hàng', color: 'bg-teal-50 text-teal-700 border-teal-300' },
  COMPLETED: { label: 'Hoàn thành', color: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-rose-50 text-rose-700 border-rose-300' },
};

export function SalesOrderListPage() {
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedProject, setSelectedProject] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['sales-orders', selectedCustomer, selectedProject, selectedStatus],
    queryFn: async () => {
      const res = await apiClient.get('/sales/orders', {
        params: {
          customerId: selectedCustomer || undefined,
          projectId: selectedProject || undefined,
          status: selectedStatus || undefined,
        },
      });
      return res.data.data as SalesOrder[];
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await apiClient.get('/customers');
      return res.data.data as { id: string; name: string }[];
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', selectedCustomer],
    queryFn: async () => {
      const res = await apiClient.get('/projects', {
        params: { customerId: selectedCustomer || undefined },
      });
      return res.data.data as { id: string; name: string }[];
    },
  });

  // Action Mutations
  const confirmMutation = useMutation({
    mutationFn: async (id: string) => apiClient.post(`/sales/orders/${id}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
      toast({ title: 'Đã xác nhận đơn hàng', description: 'Đã giữ chỗ số lượng trong tồn kho.' });
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Lỗi', description: err.response?.data?.error?.message });
    },
  });

  const dispatchMutation = useMutation({
    mutationFn: async (id: string) => apiClient.post(`/sales/orders/${id}/dispatch`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      toast({ title: 'Đã xuất kho giao hàng', description: 'Đã trừ tồn kho thực tế và ghi sổ cái.' });
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Lỗi xuất kho', description: err.response?.data?.error?.message });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => apiClient.post(`/sales/orders/${id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      toast({ title: 'Đã hoàn thành đơn hàng', description: 'Đơn hàng đã được đánh dấu hoàn thành.' });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => apiClient.post(`/sales/orders/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
      toast({ title: 'Đã hủy đơn hàng', description: 'Đã hoàn lại số lượng giữ chỗ vào kho.' });
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Lỗi', description: err.response?.data?.error?.message });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/sales/orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
      toast({ title: 'Đã xóa đơn hàng', description: 'Đã xóa vĩnh viễn đơn hàng khỏi hệ thống.' });
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Lỗi khi xóa', description: err.response?.data?.error?.message });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Đơn hàng Bán ra</h1>
          <p className="text-muted-foreground">
            Quản lý báo giá, đơn đặt hàng theo từng khách hàng & công trình, giữ chỗ và trừ tồn kho tự động
          </p>
        </div>
        <Button onClick={() => navigate('/don-hang/tao-moi')} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Tạo đơn bán hàng
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
              value={selectedCustomer}
              onChange={(e) => {
                setSelectedCustomer(e.target.value);
                setSelectedProject('');
              }}
            >
              <option value="">Tất cả Khách hàng</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="">Tất cả Công trình</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="DRAFT">Đơn nháp / Báo giá</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="DELIVERING">Đang giao hàng</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải đơn hàng...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có đơn bán hàng nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Mã đơn</th>
                    <th className="px-4 py-3">Ngày đặt</th>
                    <th className="px-4 py-3">Khách hàng / Công trình</th>
                    <th className="px-4 py-3">Mặt hàng</th>
                    <th className="px-4 py-3 text-right">Tổng thanh toán</th>
                    <th className="px-4 py-3 text-right">Công nợ đơn</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono font-bold text-primary">
                        <Link to={`/don-hang/${o.id}`} className="hover:underline">
                          {o.code}
                        </Link>
                      </td>

                      <td className="px-4 py-3 text-xs whitespace-nowrap">{formatDate(o.orderDate)}</td>

                      <td className="px-4 py-3">
                        <span className="font-semibold block text-primary">{o.customer?.name}</span>
                        {o.project && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Building className="w-3 h-3" />
                            {o.project.name}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs">
                        <div className="space-y-0.5">
                          {o.items.slice(0, 2).map((it) => (
                            <div key={it.id}>
                              <span className="font-medium">{it.productVariant?.name}</span>: {it.inputQuantity}{' '}
                              {it.inputUnit?.code}
                            </div>
                          ))}
                          {o.items.length > 2 && (
                            <span className="text-muted-foreground italic">
                              +{o.items.length - 2} mặt hàng khác...
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right font-bold font-mono text-emerald-700">
                        {formatVND(o.grandTotal)}
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {o.debtAmount > 0 ? (
                          <span className="text-rose-600 font-bold">{formatVND(o.debtAmount)}</span>
                        ) : (
                          <span className="text-emerald-600">Đã thanh toán</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <Badge variant="outline" className={ORDER_STATUSES[o.status]?.color}>
                          {ORDER_STATUSES[o.status]?.label || o.status}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => navigate(`/don-hang/${o.id}`)}
                          title="Xem chi tiết & In phiếu"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Chi tiết
                        </Button>

                        {o.status === 'DRAFT' && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white h-8"
                            onClick={() => {
                              if (confirm(`Xác nhận đơn "${o.code}"? Hệ thống sẽ giữ chỗ hàng trong kho.`)) {
                                confirmMutation.mutate(o.id);
                              }
                            }}
                            disabled={confirmMutation.isPending}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Xác nhận
                          </Button>
                        )}

                        {(o.status === 'CONFIRMED' || o.status === 'PREPARING') && (
                          <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 text-white h-8"
                            onClick={() => {
                              if (confirm(`Xuất kho giao hàng cho đơn "${o.code}"? Số lượng sẽ được trừ khỏi kho.`)) {
                                dispatchMutation.mutate(o.id);
                              }
                            }}
                            disabled={dispatchMutation.isPending}
                          >
                            <Truck className="w-3.5 h-3.5 mr-1" />
                            Xuất giao
                          </Button>
                        )}

                        {o.status === 'DELIVERING' && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8"
                            onClick={() => completeMutation.mutate(o.id)}
                            disabled={completeMutation.isPending}
                          >
                            <CheckCheck className="w-3.5 h-3.5 mr-1" />
                            Hoàn thành
                          </Button>
                        )}

                        {o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-rose-600 hover:bg-rose-50 h-8"
                            onClick={() => {
                              if (confirm(`Xác nhận hủy đơn "${o.code}"?`)) {
                                cancelMutation.mutate(o.id);
                              }
                            }}
                            disabled={cancelMutation.isPending}
                            title="Hủy đơn hàng"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                          onClick={() => {
                            if (confirm(`Xác nhận xóa vĩnh viễn đơn hàng "${o.code}"?`)) {
                              deleteOrderMutation.mutate(o.id);
                            }
                          }}
                          disabled={deleteOrderMutation.isPending}
                          title="Xóa đơn hàng"
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
