import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/api-client';
import { formatVND, formatDate } from '@vlxd/shared';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../components/ui/use-toast';
import {
  ArrowLeft,
  Printer,
  CheckCircle,
  Truck,
  CheckCheck,
  XCircle,
  Building,
  User,
  MapPin,
  Phone,
  Calendar,
  Warehouse,
  Trash2,
} from 'lucide-react';

const ORDER_STATUSES = {
  DRAFT: { label: 'Đơn nháp / Báo giá', color: 'bg-amber-50 text-amber-700 border-amber-300' },
  CONFIRMED: { label: 'Đã xác nhận (Đã giữ kho)', color: 'bg-blue-50 text-blue-700 border-blue-300' },
  PREPARING: { label: 'Đang soạn hàng', color: 'bg-indigo-50 text-indigo-700 border-indigo-300' },
  DELIVERING: { label: 'Đang giao hàng (Đã trừ kho)', color: 'bg-purple-50 text-purple-700 border-purple-300' },
  DELIVERED: { label: 'Đã giao hàng', color: 'bg-teal-50 text-teal-700 border-teal-300' },
  COMPLETED: { label: 'Hoàn thành', color: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-rose-50 text-rose-700 border-rose-300' },
};

export function SalesOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'details' | 'print'>('details');

  const { data: order, isLoading } = useQuery({
    queryKey: ['sales-order', id],
    queryFn: async () => {
      const res = await apiClient.get(`/sales/orders/${id}`);
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

  // Action Mutations
  const confirmMutation = useMutation({
    mutationFn: async () => apiClient.post(`/sales/orders/${id}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-order', id] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
      toast({ title: 'Thành công', description: 'Đã xác nhận đơn hàng và giữ chỗ tồn kho.' });
    },
  });

  const dispatchMutation = useMutation({
    mutationFn: async () => apiClient.post(`/sales/orders/${id}/dispatch`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-order', id] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      toast({ title: 'Thành công', description: 'Đã xuất kho giao hàng và trừ số lượng tồn thực tế.' });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => apiClient.post(`/sales/orders/${id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-order', id] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      toast({ title: 'Thành công', description: 'Đơn hàng đã hoàn thành.' });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => apiClient.post(`/sales/orders/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-order', id] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
      toast({ title: 'Đã hủy đơn hàng', description: 'Đã hoàn trả tồn kho nếu có giữ chỗ.' });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async () => apiClient.delete(`/sales/orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
      toast({ title: 'Đã xóa đơn hàng', description: 'Đơn hàng đã được xóa vĩnh viễn.' });
      navigate('/don-hang');
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Lỗi', description: err.response?.data?.error?.message });
    },
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || !order) {
    return <div className="text-center py-12 text-muted-foreground">Đang tải thông tin đơn hàng...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header with Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/don-hang')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Danh sách
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-mono text-primary">{order.code}</h1>
              <Badge variant="outline" className={ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES]?.color}>
                {ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES]?.label || order.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ngày đặt: {formatDate(order.orderDate)} • Khách hàng: <strong>{order.customer?.name}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {order.status === 'DRAFT' && (
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending}
            >
              <CheckCircle className="w-4 h-4 mr-1.5" />
              Xác nhận đơn (Giữ kho)
            </Button>
          )}

          {(order.status === 'CONFIRMED' || order.status === 'PREPARING') && (
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => dispatchMutation.mutate()}
              disabled={dispatchMutation.isPending}
            >
              <Truck className="w-4 h-4 mr-1.5" />
              Xuất kho giao hàng
            </Button>
          )}

          {order.status === 'DELIVERING' && (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
            >
              <CheckCheck className="w-4 h-4 mr-1.5" />
              Hoàn thành đơn
            </Button>
          )}

          {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
            <Button
              variant="outline"
              className="text-rose-600 hover:bg-rose-50"
              onClick={() => {
                if (confirm(`Xác nhận hủy đơn "${order.code}"?`)) {
                  cancelMutation.mutate();
                }
              }}
              disabled={cancelMutation.isPending}
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              Hủy đơn
            </Button>
          )}

          <Button
            variant="outline"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              if (confirm(`Xác nhận xóa vĩnh viễn đơn "${order.code}"? Hành động này không thể hoàn tác.`)) {
                deleteOrderMutation.mutate();
              }
            }}
            disabled={deleteOrderMutation.isPending}
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Xóa đơn
          </Button>

          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1.5" />
            In phiếu giao hàng
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
          Chi tiết đơn hàng
        </button>
        <button
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'print'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('print')}
        >
          Xem trước Phiếu giao hàng / Hóa đơn
        </button>
      </div>

      {/* Detail Tab View */}
      {activeTab === 'details' && (
        <div className="space-y-6 print:hidden">
          {/* Top Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Khách hàng & Công trình
                </span>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <span className="font-bold text-base">{order.customer?.name}</span>
                </div>
                {order.customer?.phone && (
                  <p className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> {order.customer.phone}
                  </p>
                )}
                {order.project && (
                  <p className="text-xs text-primary font-medium flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5" /> {order.project.name}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Địa điểm giao hàng
                </span>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">
                    {order.deliveryAddress || 'Giao tại cửa hàng / bãi'}
                  </span>
                </div>
                {(order.deliveryContactName || order.deliveryContactPhone) && (
                  <p className="text-xs text-muted-foreground">
                    Người nhận: {order.deliveryContactName} ({order.deliveryContactPhone})
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Kho xuất hàng
                </span>
                <div className="flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">{order.warehouse?.name}</span>
                </div>
                {order.notes && (
                  <p className="text-xs text-muted-foreground bg-muted/40 p-2 rounded">
                    Ghi chú: {order.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Line Items Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Danh sách mặt hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">STT</th>
                      <th className="px-4 py-3">Tên sản phẩm / Quy cách</th>
                      <th className="px-4 py-3 text-right">Số lượng bán</th>
                      <th className="px-4 py-3">Đơn vị</th>
                      <th className="px-4 py-3 text-right">Quy đổi cơ sở</th>
                      <th className="px-4 py-3 text-right">Đơn giá bán</th>
                      <th className="px-4 py-3 text-right">Chiết khấu</th>
                      <th className="px-4 py-3 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {order.items.map((it: any, idx: number) => (
                      <tr key={it.id} className="hover:bg-muted/40">
                        <td className="px-4 py-3 text-xs text-muted-foreground">{idx + 1}</td>
                        <td className="px-4 py-3 font-semibold text-primary">
                          {it.productVariant?.name}
                          {it.productVariant?.sku && (
                            <span className="text-xs font-mono text-muted-foreground ml-2">
                              ({it.productVariant.sku})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold">{it.inputQuantity}</td>
                        <td className="px-4 py-3">{it.inputUnit?.code}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                          {it.baseQuantity} {it.baseUnit?.code}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">{formatVND(it.unitPrice)}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                          {it.discountAmount > 0 ? formatVND(it.discountAmount) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                          {formatVND(it.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Calculation Card */}
              <div className="flex justify-end pt-6">
                <div className="w-full sm:w-80 space-y-2 text-sm bg-muted/30 p-4 rounded-lg border border-border">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tổng tiền hàng:</span>
                    <span className="font-mono font-semibold">{formatVND(order.subtotalAmount)}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Chiết khấu đơn:</span>
                      <span className="font-mono">-{formatVND(order.discountAmount)}</span>
                    </div>
                  )}
                  {order.shippingFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phí vận chuyển:</span>
                      <span className="font-mono">+{formatVND(order.shippingFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t font-bold text-base text-primary">
                    <span>Tổng thanh toán:</span>
                    <span className="font-mono">{formatVND(order.grandTotal)}</span>
                  </div>
                  <div className="flex justify-between pt-1 text-xs">
                    <span className="text-muted-foreground">Đã thanh toán:</span>
                    <span className="font-mono font-bold text-emerald-700">{formatVND(order.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between pt-1 text-xs font-bold">
                    <span className="text-rose-600">Công nợ đơn hàng:</span>
                    <span className="font-mono text-rose-600">{formatVND(order.debtAmount)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Printable Invoice / Phiếu giao hàng View */}
      <div
        className={`${
          activeTab === 'print' ? 'block' : 'hidden print:block'
        } bg-white text-black p-8 rounded-lg shadow-sm border border-border print:p-0 print:border-none print:shadow-none font-sans`}
      >
        {/* Invoice Header */}
        <div className="flex justify-between items-start border-b pb-4">
          <div>
            <h2 className="text-xl font-bold uppercase tracking-wide text-foreground">
              {settings?.storeName || 'CỬA HÀNG VẬT LIỆU XÂY DỰNG'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Địa chỉ: {settings?.storeAddress || 'Khu A - Cửa hàng chính'}
            </p>
            <p className="text-xs text-muted-foreground">
              Hotline: {settings?.storePhone || '0987.654.321'}
            </p>
          </div>
          <div className="text-right">
            <h3 className="text-lg font-bold uppercase text-primary">PHIẾU GIAO HÀNG</h3>
            <p className="text-xs font-mono font-bold">Số phiếu: {order.code}</p>
            <p className="text-xs text-muted-foreground">Ngày: {formatDate(order.orderDate)}</p>
          </div>
        </div>

        {/* Customer & Delivery info */}
        <div className="grid grid-cols-2 gap-4 py-4 text-xs border-b">
          <div className="space-y-1">
            <p>
              Khách hàng: <strong>{order.customer?.name}</strong>
            </p>
            <p>Điện thoại: {order.customer?.phone || '—'}</p>
            {order.project && <p>Công trình: <strong>{order.project.name}</strong></p>}
          </div>
          <div className="space-y-1 text-right sm:text-left">
            <p>Địa điểm giao: {order.deliveryAddress || 'Giao tại kho bãi'}</p>
            <p>
              Người nhận hàng: {order.deliveryContactName || order.customer?.name}{' '}
              {order.deliveryContactPhone ? `(${order.deliveryContactPhone})` : ''}
            </p>
            <p>Kho xuất: {order.warehouse?.name}</p>
          </div>
        </div>

        {/* Table */}
        <div className="py-4">
          <table className="w-full text-xs text-left border-collapse border border-gray-300">
            <thead className="bg-gray-100 uppercase">
              <tr>
                <th className="border border-gray-300 px-2 py-1.5 text-center w-8">STT</th>
                <th className="border border-gray-300 px-3 py-1.5">Tên vật tư / Quy cách</th>
                <th className="border border-gray-300 px-2 py-1.5 text-center w-16">ĐVT</th>
                <th className="border border-gray-300 px-2 py-1.5 text-right w-20">Số lượng</th>
                <th className="border border-gray-300 px-3 py-1.5 text-right w-28">Đơn giá (VND)</th>
                <th className="border border-gray-300 px-3 py-1.5 text-right w-32">Thành tiền (VND)</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((it: any, index: number) => (
                <tr key={it.id}>
                  <td className="border border-gray-300 px-2 py-1.5 text-center">{index + 1}</td>
                  <td className="border border-gray-300 px-3 py-1.5 font-semibold">
                    {it.productVariant?.name}
                  </td>
                  <td className="border border-gray-300 px-2 py-1.5 text-center">{it.inputUnit?.code}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right font-bold">
                    {it.inputQuantity}
                  </td>
                  <td className="border border-gray-300 px-3 py-1.5 text-right font-mono">
                    {formatVND(it.unitPrice)}
                  </td>
                  <td className="border border-gray-300 px-3 py-1.5 text-right font-mono font-bold">
                    {formatVND(it.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals and Bank Info */}
        <div className="grid grid-cols-2 gap-4 pt-2 text-xs border-t">
          <div className="flex items-start gap-3 bg-gray-50 p-2.5 rounded border border-gray-200 text-xs">
            <img
              src={`https://img.vietqr.io/image/vietinbank-${settings?.bankAccount || '12283456'}-compact2.png?amount=${order.debtAmount > 0 ? order.debtAmount : order.grandTotal}&addInfo=${encodeURIComponent(order.code)}&accountName=${encodeURIComponent(settings?.bankAccountName || 'NGUYEN VAN CHU')}`}
              alt="VietQR VietinBank"
              className="w-24 h-24 object-contain border bg-white rounded p-1 shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="space-y-0.5">
              <p className="font-bold text-primary text-[11px] uppercase">Quét mã VietQR chuyển khoản</p>
              <p>Ngân hàng: <strong>{settings?.bankName || 'VietinBank'}</strong></p>
              <p>Số tài khoản: <strong className="font-mono text-sm text-primary">{settings?.bankAccount || '12283456'}</strong></p>
              <p>Chủ TK: <strong className="uppercase">{settings?.bankAccountName || 'NGUYEN VAN CHU'}</strong></p>
              <p className="text-[10px] text-muted-foreground italic">Nội dung CK: <strong>{order.code}</strong></p>
            </div>
          </div>

          <div className="space-y-1 text-right">
            <div className="flex justify-between">
              <span>Tổng cộng:</span>
              <span className="font-mono font-semibold">{formatVND(order.subtotalAmount)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between">
                <span>Chiết khấu:</span>
                <span className="font-mono">-{formatVND(order.discountAmount)}</span>
              </div>
            )}
            {order.shippingFee > 0 && (
              <div className="flex justify-between">
                <span>Cước vận chuyển:</span>
                <span className="font-mono">+{formatVND(order.shippingFee)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-black pt-1 border-t">
              <span>Thanh toán:</span>
              <span className="font-mono">{formatVND(order.grandTotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Đã trả:</span>
              <span className="font-mono">{formatVND(order.paidAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-rose-700">
              <span>Còn nợ:</span>
              <span className="font-mono">{formatVND(order.debtAmount)}</span>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-4 pt-8 text-center text-xs">
          <div>
            <p className="font-bold">Người lập phiếu</p>
            <p className="text-[10px] text-muted-foreground italic">(Ký, ghi rõ họ tên)</p>
            <div className="h-16"></div>
          </div>
          <div>
            <p className="font-bold">Người giao hàng</p>
            <p className="text-[10px] text-muted-foreground italic">(Ký, ghi rõ họ tên)</p>
            <div className="h-16"></div>
          </div>
          <div>
            <p className="font-bold">Người nhận hàng</p>
            <p className="text-[10px] text-muted-foreground italic">(Ký, ghi rõ họ tên)</p>
            <div className="h-16"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
