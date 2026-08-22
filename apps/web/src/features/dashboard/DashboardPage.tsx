import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../lib/api-client';
import { formatVND, formatDate } from '@vlxd/shared';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  TrendingUp,
  DollarSign,
  Wallet,
  Truck,
  ShoppingCart,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  FileText,
  Landmark,
  Banknote,
  Package,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  Sparkles
} from 'lucide-react';

export function DashboardPage() {
  const navigate = useNavigate();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const res = await apiClient.get('/reports/dashboard');
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-muted-foreground">Đang tải dữ liệu tổng quan kinh doanh...</p>
      </div>
    );
  }

  const grossProfitMargin = metrics?.revenueThisMonth 
    ? ((metrics.grossProfitThisMonth / metrics.revenueThisMonth) * 100).toFixed(1)
    : '0';

  const netProfitMargin = metrics?.revenueThisMonth 
    ? ((metrics.netProfitThisMonth / metrics.revenueThisMonth) * 100).toFixed(1)
    : '0';

  const totalFund = (metrics?.cashBalance || 0) + (metrics?.bankBalance || 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-md border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold backdrop-blur border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Tổng quan kinh doanh tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Cửa Hàng Vật Liệu Xây Dựng
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Hệ thống theo dõi doanh thu, giá vốn snapshot, công nợ công trình và tồn kho cây/kg thời gian thực.
            </p>
          </div>

          {/* Quick Operations Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => navigate('/don-hang/tao-moi')}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-lg hover:shadow-amber-500/20 text-xs h-10 px-4 gap-2 transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              Lên đơn bán hàng
            </Button>
            <Button
              onClick={() => navigate('/nhap-hang')}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs h-10 px-3.5 gap-1.5"
            >
              <Package className="w-4 h-4 text-emerald-400" />
              Nhập kho NCC
            </Button>
            <Button
              onClick={() => navigate('/thu-tien')}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs h-10 px-3.5 gap-1.5"
            >
              <ArrowDownRight className="w-4 h-4 text-cyan-400" />
              Thu tiền
            </Button>
            <Button
              onClick={() => navigate('/giao-hang/tao-chuyen')}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs h-10 px-3.5 gap-1.5"
            >
              <Truck className="w-4 h-4 text-amber-400" />
              Điều xe
            </Button>
          </div>
        </div>

        {/* Decorative subtle ambient circle */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Primary Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Revenue */}
        <Card className="rounded-xl border border-blue-200/80 bg-gradient-to-br from-white to-blue-50/40 shadow-sm hover:shadow transition-all">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                Doanh thu tháng này
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-blue-700 tracking-tight">
                {formatVND(metrics?.revenueThisMonth || 0)}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Badge variant="outline" className="bg-blue-100/60 text-blue-800 border-blue-200 text-[10px] px-1.5 py-0">
                  {metrics?.orderCountThisMonth || 0} đơn hàng
                </Badge>
                <span>hoàn tất trong tháng</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gross Profit */}
        <Card className="rounded-xl border border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/40 shadow-sm hover:shadow transition-all">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                Lợi nhuận gộp (Gross)
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-700 tracking-tight">
                {formatVND(metrics?.grossProfitThisMonth || 0)}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Badge variant="outline" className="bg-emerald-100/60 text-emerald-800 border-emerald-200 text-[10px] px-1.5 py-0 font-mono font-bold">
                  {grossProfitMargin}%
                </Badge>
                <span>biên lãi gộp (Doanh thu - COGS)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className="rounded-xl border border-teal-200/80 bg-gradient-to-br from-white to-teal-50/40 shadow-sm hover:shadow transition-all">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                Lợi nhuận ròng (Net Profit)
              </span>
              <div className="w-9 h-9 rounded-xl bg-teal-600/10 text-teal-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-teal-800 tracking-tight">
                {formatVND(metrics?.netProfitThisMonth || 0)}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Badge variant="outline" className="bg-teal-100/60 text-teal-800 border-teal-200 text-[10px] px-1.5 py-0 font-mono font-bold">
                  {netProfitMargin}%
                </Badge>
                <span>sau trừ {formatVND(metrics?.expensesThisMonth || 0)} chi phí</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Debt */}
        <Card className="rounded-xl border border-rose-200/80 bg-gradient-to-br from-white to-rose-50/40 shadow-sm hover:shadow transition-all">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                Công nợ Khách hàng
              </span>
              <div className="w-9 h-9 rounded-xl bg-rose-600/10 text-rose-600 flex items-center justify-center font-bold">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-700 tracking-tight">
                {formatVND(metrics?.totalCustomerDebt || 0)}
              </div>
              <Link to="/cong-no/khach-hang" className="text-xs text-rose-600 hover:text-rose-700 font-semibold inline-flex items-center gap-1">
                Xem sổ nợ theo công trình <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Supplier Debt */}
        <Card className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-white to-amber-50/40 shadow-sm hover:shadow transition-all">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Công nợ Nhà cung cấp
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-600/10 text-amber-600 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-900 tracking-tight">
                {formatVND(metrics?.totalSupplierDebt || 0)}
              </div>
              <Link to="/cong-no/nha-cung-cap" className="text-xs text-amber-800 hover:text-amber-900 font-semibold inline-flex items-center gap-1">
                Xem sổ nợ nhà máy &rarr;
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Cash & Bank Balances */}
        <Card className="rounded-xl border border-border/80 bg-card shadow-sm hover:shadow transition-all">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Tổng tồn quỹ sẵn sàng
              </span>
              <span className="text-sm font-extrabold font-mono text-foreground">
                {formatVND(totalFund)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                to="/tien-mat"
                className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/50 hover:bg-amber-50 transition-colors block"
              >
                <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-900 mb-0.5">
                  <Banknote className="w-3.5 h-3.5 text-amber-600" /> Két tiền mặt
                </div>
                <span className="font-mono font-bold text-xs text-amber-800 block">
                  {formatVND(metrics?.cashBalance || 0)}
                </span>
              </Link>

              <Link
                to="/ngan-hang"
                className="p-2.5 rounded-lg border border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition-colors block"
              >
                <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-900 mb-0.5">
                  <Landmark className="w-3.5 h-3.5 text-blue-600" /> Ngân hàng
                </div>
                <span className="font-mono font-bold text-xs text-blue-700 block">
                  {formatVND(metrics?.bankBalance || 0)}
                </span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Grid: Pending Orders & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Orders */}
        <Card className="rounded-xl border border-border shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-border/50">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" />
                Đơn hàng cần xử lý
              </CardTitle>
              <CardDescription className="text-xs">Đơn nháp, chờ giữ kho hoặc đang giao hàng</CardDescription>
            </div>
            <Link to="/don-hang" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
              Tất cả &rarr;
            </Link>
          </CardHeader>
          <CardContent className="pt-4">
            {!metrics?.pendingOrders || metrics.pendingOrders.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-xs">
                <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center mx-auto mb-2 text-muted-foreground">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                Không có đơn hàng nào đang chờ xử lý
              </div>
            ) : (
              <div className="space-y-2.5">
                {metrics.pendingOrders.map((o: any) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-card hover:bg-muted/40 transition-all hover:border-primary/40 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link to={`/don-hang/${o.id}`} className="font-mono font-bold text-primary group-hover:underline text-xs">
                          {o.code}
                        </Link>
                        <Badge
                          variant="outline"
                          className={
                            o.status === 'CONFIRMED'
                              ? 'bg-blue-50 text-blue-800 border-blue-200 text-[10px] py-0'
                              : o.status === 'DELIVERING'
                              ? 'bg-amber-50 text-amber-800 border-amber-200 text-[10px] py-0'
                              : 'bg-muted text-muted-foreground text-[10px] py-0'
                          }
                        >
                          {o.status === 'DRAFT' ? 'Nháp' : o.status === 'CONFIRMED' ? 'Đã xác nhận' : o.status === 'DELIVERING' ? 'Đang giao' : o.status}
                        </Badge>
                      </div>
                      <span className="text-xs font-bold text-foreground block">{o.customer?.name}</span>
                      {o.project && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {o.project.name}
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-sm block text-emerald-700">
                        {formatVND(o.grandTotal)}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center justify-end gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" /> {formatDate(o.orderDate)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="rounded-xl border border-border shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-border/50">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-4 h-4" />
                Cảnh báo Vật tư sắp hết kho
              </CardTitle>
              <CardDescription className="text-xs">Số lượng tồn dưới định mức tồn an toàn</CardDescription>
            </div>
            <Link to="/ton-kho" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
              Xem kho &rarr;
            </Link>
          </CardHeader>
          <CardContent className="pt-4">
            {!metrics?.lowStockItems || metrics.lowStockItems.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-xs">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                Tất cả mặt hàng đều đảm bảo mức tồn an toàn!
              </div>
            ) : (
              <div className="space-y-2.5">
                {metrics.lowStockItems.map((it: any) => (
                  <div
                    key={it.variantId}
                    className="flex items-center justify-between p-3 rounded-xl border border-rose-200/90 bg-rose-50/40 text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-foreground block text-xs">{it.variantName}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {it.productName} • Kho: <strong className="text-slate-700">{it.warehouseName}</strong>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-extrabold text-rose-600 block text-sm">
                        {it.currentStock} {it.unitCode}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Định mức: {it.minStockLevel} {it.unitCode}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
