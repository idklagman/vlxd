import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  Package,
  Search,
  AlertTriangle,
  SlidersHorizontal,
  ArrowRightLeft,
  Warehouse,
  History,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface InventoryBalanceItem {
  id: string;
  warehouseId: string;
  warehouseName: string;
  productVariantId: string;
  productName: string;
  variantName: string;
  sku: string | null;
  categoryName: string;
  brandName: string | null;
  baseUnitCode: string;
  baseUnitName: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minimumStock: number | null;
  isLowStock: boolean;
  steelCalculation: {
    weightPerBar: number;
    fullBars: number;
    remainingKg: number;
    formattedStock: string;
  } | null;
  updatedAt: string;
}

export function InventoryBalancePage() {
  const [search, setSearch] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  const { data: balances = [], isLoading } = useQuery({
    queryKey: ['inventory-balances', selectedWarehouse, selectedCategory, search, onlyLowStock],
    queryFn: async () => {
      const res = await apiClient.get('/inventory/balances', {
        params: {
          warehouseId: selectedWarehouse || undefined,
          categoryId: selectedCategory || undefined,
          search: search || undefined,
          belowMinimumStock: onlyLowStock ? 'true' : undefined,
        },
      });
      return res.data.data as InventoryBalanceItem[];
    },
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await apiClient.get('/warehouses');
      return res.data.data as { id: string; name: string }[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get('/categories');
      return res.data.data as { id: string; name: string }[];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tồn kho tức thời</h1>
          <p className="text-muted-foreground">
            Bảng cân đối tồn kho theo từng kho bãi. Sắt thép hiển thị quy đổi Cây + kg dư, xi măng bao, cát sỏi m³.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/ton-kho/so-cai">
              <History className="w-4 h-4 mr-2" />
              Sổ cái biến động
            </Link>
          </Button>
          <Button asChild>
            <Link to="/ton-kho/dieu-chinh">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Kiểm kê & Điều chỉnh
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm sản phẩm, quy cách, SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Tất cả nhóm hàng</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2 px-2">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground">
                <input
                  type="checkbox"
                  checked={onlyLowStock}
                  onChange={(e) => setOnlyLowStock(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary w-4 h-4"
                />
                <span className="flex items-center gap-1 text-rose-600">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Chỉ hiện hàng sắp hết
                </span>
              </label>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải số dư tồn kho...</div>
          ) : balances.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Không có sản phẩm nào phù hợp điều kiện lọc</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Sản phẩm / Quy cách</th>
                    <th className="px-4 py-3">Kho chứa</th>
                    <th className="px-4 py-3">Nhóm / Hãng</th>
                    <th className="px-4 py-3 text-right">Tồn thực tế</th>
                    <th className="px-4 py-3 text-right">Giữ chỗ</th>
                    <th className="px-4 py-3 text-right">Khả dụng</th>
                    <th className="px-4 py-3">Quy đổi hiển thị (Sắt cây / Bao)</th>
                    <th className="px-4 py-3 text-center">Cảnh báo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {balances.map((b) => (
                    <tr key={b.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <span className="font-bold text-primary block">{b.variantName}</span>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{b.productName}</span>
                          {b.sku && <span className="font-mono">({b.sku})</span>}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <Warehouse className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{b.warehouseName}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs">
                        <Badge variant="outline" className="mr-1">
                          {b.categoryName}
                        </Badge>
                        {b.brandName && (
                          <span className="text-muted-foreground">{b.brandName}</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold">
                        {new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(
                          b.currentStock
                        )}{' '}
                        <span className="text-xs font-normal text-muted-foreground">
                          {b.baseUnitCode}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                        {b.reservedStock > 0 ? (
                          <span className="text-amber-700 font-bold">
                            {new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(
                              b.reservedStock
                            )}
                          </span>
                        ) : (
                          '0'
                        )}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                        {new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(
                          b.availableStock
                        )}{' '}
                        <span className="text-xs font-normal">{b.baseUnitCode}</span>
                      </td>

                      <td className="px-4 py-3">
                        {b.steelCalculation ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-blue-700 block text-xs">
                              {b.steelCalculation.fullBars} cây
                              {b.steelCalculation.remainingKg > 0.001
                                ? ` + ${b.steelCalculation.remainingKg} kg dư`
                                : ''}
                            </span>
                            <span className="text-[11px] text-muted-foreground block font-mono">
                              Barem: {b.steelCalculation.weightPerBar} kg/cây
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {b.currentStock} {b.baseUnitName}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {b.isLowStock ? (
                          <Badge
                            variant="outline"
                            className="bg-rose-50 text-rose-700 border-rose-300 font-semibold text-[11px]"
                          >
                            Tồn ít (&lt; {b.minimumStock} {b.baseUnitCode})
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]"
                          >
                            Đủ hàng
                          </Badge>
                        )}
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
