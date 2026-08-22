import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { formatDateTime, formatVND } from '@vlxd/shared';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { History, Warehouse, ArrowDownRight, ArrowUpRight, ArrowRightLeft, SlidersHorizontal, RefreshCw } from 'lucide-react';

interface InventoryTransactionItem {
  id: string;
  warehouseId: string;
  warehouse: { name: string };
  productVariantId: string;
  productVariant: {
    name: string;
    product: { name: string };
  };
  transactionType: 'PURCHASE_IN' | 'SALE_OUT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'MANUAL_ADJUSTMENT' | 'REVERSAL';
  referenceType: string;
  referenceId: string | null;
  originalQuantity: string;
  originalUnit: { code: string; name: string };
  baseQuantity: string;
  baseUnit: { code: string; name: string };
  costPerBaseUnit: number | null;
  totalCost: number | null;
  notes: string | null;
  createdAt: string;
}

const TRANSACTION_TYPES = {
  PURCHASE_IN: { label: 'Nhập hàng', color: 'bg-emerald-50 text-emerald-700 border-emerald-300', icon: ArrowDownRight },
  SALE_OUT: { label: 'Xuất bán', color: 'bg-blue-50 text-blue-700 border-blue-300', icon: ArrowUpRight },
  TRANSFER_IN: { label: 'Nhận chuyển kho', color: 'bg-purple-50 text-purple-700 border-purple-300', icon: ArrowRightLeft },
  TRANSFER_OUT: { label: 'Xuất chuyển kho', color: 'bg-indigo-50 text-indigo-700 border-indigo-300', icon: ArrowRightLeft },
  MANUAL_ADJUSTMENT: { label: 'Kiểm kê điều chỉnh', color: 'bg-amber-50 text-amber-700 border-amber-300', icon: SlidersHorizontal },
  REVERSAL: { label: 'Hoàn tác giao dịch', color: 'bg-rose-50 text-rose-700 border-rose-300', icon: RefreshCw },
};

export function InventoryLedgerPage() {
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['inventory-transactions', selectedWarehouse, selectedType],
    queryFn: async () => {
      const res = await apiClient.get('/inventory/transactions', {
        params: {
          warehouseId: selectedWarehouse || undefined,
          transactionType: selectedType || undefined,
        },
      });
      return res.data.data as InventoryTransactionItem[];
    },
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await apiClient.get('/warehouses');
      return res.data.data as { id: string; name: string }[];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sổ cái Biến động Tồn kho</h1>
        <p className="text-muted-foreground">
          Lịch sử biến động xuất / nhập / điều chỉnh kho bất biến (Append-only Ledger)
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
            <select
              className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
            >
              <option value="">Tất cả kho hàng</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <select
              className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">Tất cả loại giao dịch</option>
              <option value="PURCHASE_IN">Nhập hàng</option>
              <option value="SALE_OUT">Xuất bán</option>
              <option value="TRANSFER_IN">Nhận chuyển kho</option>
              <option value="TRANSFER_OUT">Xuất chuyển kho</option>
              <option value="MANUAL_ADJUSTMENT">Kiểm kê điều chỉnh</option>
              <option value="REVERSAL">Hoàn tác giao dịch</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải lịch sử sổ cái...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có giao dịch sổ kho nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Thời gian</th>
                    <th className="px-4 py-3">Kho hàng</th>
                    <th className="px-4 py-3">Loại giao dịch</th>
                    <th className="px-4 py-3">Sản phẩm / Quy cách</th>
                    <th className="px-4 py-3 text-right">SL Gốc</th>
                    <th className="px-4 py-3 text-right">Biến động cơ sở</th>
                    <th className="px-4 py-3 text-right">Giá vốn</th>
                    <th className="px-4 py-3">Diễn giải / Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((t) => {
                    const baseQtyNum = parseFloat(t.baseQuantity);
                    const isPositive = baseQtyNum > 0;
                    const typeConfig = TRANSACTION_TYPES[t.transactionType] || {
                      label: t.transactionType,
                      color: 'bg-muted text-foreground',
                      icon: History,
                    };

                    return (
                      <tr key={t.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">
                          {formatDateTime(t.createdAt)}
                        </td>

                        <td className="px-4 py-3 text-xs font-medium whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <Warehouse className="w-3.5 h-3.5 text-muted-foreground" />
                            {t.warehouse?.name}
                          </span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant="outline" className={typeConfig.color}>
                            {typeConfig.label}
                          </Badge>
                        </td>

                        <td className="px-4 py-3">
                          <span className="font-semibold text-primary block">{t.productVariant?.name}</span>
                          <span className="text-xs text-muted-foreground">{t.productVariant?.product?.name}</span>
                        </td>

                        <td className="px-4 py-3 text-right font-mono text-xs whitespace-nowrap">
                          {t.originalQuantity} {t.originalUnit?.code}
                        </td>

                        <td
                          className={`px-4 py-3 text-right font-mono font-bold whitespace-nowrap ${
                            isPositive ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isPositive ? `+${baseQtyNum}` : baseQtyNum} {t.baseUnit?.code}
                        </td>

                        <td className="px-4 py-3 text-right font-mono text-xs whitespace-nowrap">
                          {t.costPerBaseUnit ? (
                            <span>{formatVND(t.costPerBaseUnit)}</span>
                          ) : (
                            '—'
                          )}
                        </td>

                        <td className="px-4 py-3 text-xs text-muted-foreground">{t.notes || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
