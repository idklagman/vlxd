import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { formatVND, formatDate } from '@vlxd/shared';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  Package,
  Printer,
  DollarSign,
  Calendar,
  Layers,
  PieChart,
} from 'lucide-react';

export function ReportHubPage() {
  const [activeTab, setActiveTab] = useState<'profit' | 'sales' | 'inventory'>('profit');

  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const defaultEnd = now.toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  // Queries
  const { data: profitReport, isLoading: isProfitLoading } = useQuery({
    queryKey: ['report-profit', startDate, endDate],
    queryFn: async () => {
      const res = await apiClient.get('/reports/profit', {
        params: { startDate, endDate },
      });
      return res.data.data;
    },
    enabled: activeTab === 'profit',
  });

  const { data: salesReport, isLoading: isSalesLoading } = useQuery({
    queryKey: ['report-sales', startDate, endDate],
    queryFn: async () => {
      const res = await apiClient.get('/reports/sales', {
        params: { startDate, endDate },
      });
      return res.data.data;
    },
    enabled: activeTab === 'sales',
  });

  const { data: inventoryReport, isLoading: isInvLoading } = useQuery({
    queryKey: ['report-inventory-valuation'],
    queryFn: async () => {
      const res = await apiClient.get('/reports/inventory-valuation');
      return res.data.data;
    },
    enabled: activeTab === 'inventory',
  });

  const handleSetQuickDate = (type: 'thisMonth' | '7days' | 'today') => {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (type === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (type === '7days') {
      const d7 = new Date();
      d7.setDate(d7.getDate() - 7);
      setStartDate(d7.toISOString().slice(0, 10));
      setEndDate(todayStr);
    } else if (type === 'thisMonth') {
      setStartDate(defaultStart);
      setEndDate(defaultEnd);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Date Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trung tâm Báo cáo & Phân tích</h1>
          <p className="text-muted-foreground">
            Báo cáo Lợi nhuận P&L, Doanh thu bán hàng, và Định giá tài sản hàng tồn kho
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1.5" />
            In báo cáo
          </Button>
        </div>
      </div>

      {/* Date Filter Toolbar */}
      <Card className="print:hidden">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => handleSetQuickDate('today')}
              >
                Hôm nay
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => handleSetQuickDate('7days')}
              >
                7 ngày qua
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => handleSetQuickDate('thisMonth')}
              >
                Tháng này
              </Button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Từ:
              </span>
              <Input
                type="date"
                className="h-8 text-xs w-36"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="text-muted-foreground">Đến:</span>
              <Input
                type="date"
                className="h-8 text-xs w-36"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-border print:hidden">
        <button
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'profit'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('profit')}
        >
          <TrendingUp className="w-4 h-4" />
          Báo cáo Lợi nhuận (P&L)
        </button>
        <button
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'sales'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('sales')}
        >
          <BarChart3 className="w-4 h-4" />
          Doanh thu & Mặt hàng bán chạy
        </button>
        <button
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'inventory'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('inventory')}
        >
          <Package className="w-4 h-4" />
          Định giá Giá trị Tồn kho
        </button>
      </div>

      {/* 1. PROFIT TAB (P&L) */}
      {activeTab === 'profit' && (
        <div className="space-y-6">
          {isProfitLoading ? (
            <div className="text-center py-12 text-muted-foreground">Đang tính toán báo cáo lợi nhuận...</div>
          ) : !profitReport ? (
            <div className="text-center py-12 text-muted-foreground">Không có dữ liệu trong khoảng thời gian này</div>
          ) : (
            <>
              {/* Financial KPI Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card className="bg-blue-50/40 border-blue-200">
                  <CardContent className="pt-4 space-y-1">
                    <span className="text-xs font-semibold text-blue-900 uppercase tracking-wider block">
                      Doanh thu thuần
                    </span>
                    <div className="text-xl font-bold font-mono text-blue-700">
                      {formatVND(profitReport.netRevenue)}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{profitReport.orderCount} đơn hàng</p>
                  </CardContent>
                </Card>

                <Card className="bg-amber-50/40 border-amber-200">
                  <CardContent className="pt-4 space-y-1">
                    <span className="text-xs font-semibold text-amber-900 uppercase tracking-wider block">
                      Giá vốn hàng bán (COGS)
                    </span>
                    <div className="text-xl font-bold font-mono text-amber-900">
                      {formatVND(profitReport.totalCogs)}
                    </div>
                    <p className="text-[11px] text-muted-foreground">Snapshot giá vốn di động</p>
                  </CardContent>
                </Card>

                <Card className="bg-emerald-50/40 border-emerald-200">
                  <CardContent className="pt-4 space-y-1">
                    <span className="text-xs font-semibold text-emerald-900 uppercase tracking-wider block">
                      Lợi nhuận gộp
                    </span>
                    <div className="text-xl font-bold font-mono text-emerald-700">
                      {formatVND(profitReport.grossProfit)}
                    </div>
                    <p className="text-[11px] text-emerald-700 font-semibold">
                      Biên lãi gộp: {profitReport.grossMarginPct}%
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-teal-50/40 border-teal-200">
                  <CardContent className="pt-4 space-y-1">
                    <span className="text-xs font-semibold text-teal-900 uppercase tracking-wider block">
                      Lợi nhuận ròng (Net Profit)
                    </span>
                    <div className="text-xl font-bold font-mono text-teal-800">
                      {formatVND(profitReport.netProfit)}
                    </div>
                    <p className="text-[11px] text-teal-800 font-semibold">
                      Biên lãi ròng: {profitReport.netMarginPct}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed P&L Income Statement Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Báo cáo Kết quả Kinh doanh (P&L Income Statement)</CardTitle>
                  <CardDescription>
                    Kỳ báo cáo: Từ {formatDate(startDate)} đến {formatDate(endDate)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <tbody className="divide-y divide-border font-sans">
                        <tr className="font-semibold bg-muted/40">
                          <td className="py-2.5 px-4">1. Tổng Doanh thu Bán hàng</td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold">
                            {formatVND(profitReport.grossRevenue)}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4 pl-8 text-muted-foreground text-xs">Trừ: Giảm giá & Chiết khấu</td>
                          <td className="py-2 px-4 text-right font-mono text-xs text-rose-600">
                            -{formatVND(profitReport.totalDiscount)}
                          </td>
                        </tr>
                        <tr className="font-bold bg-muted/20">
                          <td className="py-2.5 px-4 text-primary">2. Doanh thu Thuần (Net Sales)</td>
                          <td className="py-2.5 px-4 text-right font-mono text-primary font-bold">
                            {formatVND(profitReport.netRevenue)}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4">3. Giá vốn Hàng bán (COGS - Cost of Goods Sold)</td>
                          <td className="py-2.5 px-4 text-right font-mono text-amber-900 font-semibold">
                            -{formatVND(profitReport.totalCogs)}
                          </td>
                        </tr>
                        <tr className="font-bold bg-emerald-50 text-emerald-900">
                          <td className="py-3 px-4">4. LỢI NHUẬN GỘP (Gross Profit)</td>
                          <td className="py-3 px-4 text-right font-mono text-base font-bold">
                            {formatVND(profitReport.grossProfit)} ({profitReport.grossMarginPct}%)
                          </td>
                        </tr>
                        <tr className="font-semibold bg-muted/40">
                          <td className="py-2.5 px-4">5. Chi phí Hoạt động & Vận hành (Operating Expenses)</td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-600">
                            -{formatVND(profitReport.totalExpenses)}
                          </td>
                        </tr>
                        {profitReport.expenseBreakdown.map((exp: any, idx: number) => (
                          <tr key={idx} className="text-xs text-muted-foreground">
                            <td className="py-1.5 px-4 pl-8">• {exp.name}</td>
                            <td className="py-1.5 px-4 text-right font-mono">-{formatVND(exp.amount)}</td>
                          </tr>
                        ))}
                        {profitReport.totalShippingFee > 0 && (
                          <tr>
                            <td className="py-2 px-4 pl-8 text-xs text-muted-foreground">Cộng: Doanh thu Cước vận chuyển xe</td>
                            <td className="py-2 px-4 text-right font-mono text-xs text-emerald-600">
                              +{formatVND(profitReport.totalShippingFee)}
                            </td>
                          </tr>
                        )}
                        <tr className="font-bold bg-teal-600 text-white text-base">
                          <td className="py-3.5 px-4">6. LỢI NHUẬN RÒNG CUỐI CÙNG (Net Profit)</td>
                          <td className="py-3.5 px-4 text-right font-mono text-lg font-bold">
                            {formatVND(profitReport.netProfit)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* 2. SALES TAB */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          {isSalesLoading ? (
            <div className="text-center py-12 text-muted-foreground">Đang tải báo cáo bán hàng...</div>
          ) : !salesReport ? (
            <div className="text-center py-12 text-muted-foreground">Chưa có dữ liệu bán hàng</div>
          ) : (
            <>
              {/* Top 10 Best Selling Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top 10 Mặt hàng Bán chạy nhất</CardTitle>
                  <CardDescription>Xếp theo tổng doanh số bán ra trong kỳ</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-muted text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 text-center w-12">Hạng</th>
                          <th className="px-4 py-3">Tên sản phẩm / Quy cách</th>
                          <th className="px-4 py-3 text-right">Số lượng bán</th>
                          <th className="px-4 py-3 text-center">ĐVT</th>
                          <th className="px-4 py-3 text-right font-bold">Tổng doanh số (VND)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {salesReport.topItems.map((it: any, index: number) => (
                          <tr key={index} className="hover:bg-muted/40">
                            <td className="px-4 py-3 text-center font-bold font-mono text-xs text-muted-foreground">
                              #{index + 1}
                            </td>
                            <td className="px-4 py-3 font-semibold text-primary">{it.variantName}</td>
                            <td className="px-4 py-3 text-right font-mono font-bold">{it.totalQty}</td>
                            <td className="px-4 py-3 text-center text-xs">{it.unitCode}</td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                              {formatVND(it.totalRevenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* 3. INVENTORY VALUATION TAB */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {isInvLoading ? (
            <div className="text-center py-12 text-muted-foreground">Đang tính toán giá trị tồn kho...</div>
          ) : !inventoryReport ? (
            <div className="text-center py-12 text-muted-foreground">Chưa có dữ liệu tồn kho</div>
          ) : (
            <>
              {/* Asset Valuation KPI Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-indigo-50/40 border-indigo-200">
                  <CardContent className="pt-4 space-y-1">
                    <span className="text-xs font-semibold text-indigo-900 uppercase tracking-wider block">
                      Tổng Giá trị Tài sản Tồn kho
                    </span>
                    <div className="text-2xl font-bold font-mono text-indigo-700">
                      {formatVND(inventoryReport.totalInventoryValue)}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Tính theo Giá vốn bình quân di động (Moving Average Cost)
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Tổng số Mặt hàng trong kho
                    </span>
                    <div className="text-2xl font-bold font-mono text-foreground">
                      {inventoryReport.itemCount} quy cách
                    </div>
                    <p className="text-[11px] text-muted-foreground">Tất cả kho bãi</p>
                  </CardContent>
                </Card>
              </div>

              {/* Valuation Details Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Bảng Báo cáo Chi tiết Định giá Tồn kho</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-muted text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3">Tên sản phẩm / Quy cách</th>
                          <th className="px-4 py-3">Nhóm vật tư</th>
                          <th className="px-4 py-3">Kho</th>
                          <th className="px-4 py-3 text-right">Số lượng tồn</th>
                          <th className="px-4 py-3 text-center">ĐVT</th>
                          <th className="px-4 py-3 text-right">Giá vốn BQ (VND)</th>
                          <th className="px-4 py-3 text-right font-bold">Tổng giá trị (VND)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {inventoryReport.items.map((it: any, index: number) => (
                          <tr key={index} className="hover:bg-muted/40">
                            <td className="px-4 py-3 font-semibold text-primary">{it.variantName}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{it.categoryName}</td>
                            <td className="px-4 py-3 text-xs">{it.warehouseName}</td>
                            <td className="px-4 py-3 text-right font-mono font-bold">{it.currentStock}</td>
                            <td className="px-4 py-3 text-center text-xs">{it.baseUnitCode}</td>
                            <td className="px-4 py-3 text-right font-mono text-xs">{formatVND(it.averageCost)}</td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                              {formatVND(it.totalValue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}
