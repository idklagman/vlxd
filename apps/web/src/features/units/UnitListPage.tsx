import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { getErrorMessage } from '../../lib/error-utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { useToast } from '../../components/ui/use-toast';
import { Plus, Scale, ArrowRightLeft, Trash2 } from 'lucide-react';

interface Unit {
  id: string;
  code: string;
  name: string;
}

interface UnitConversion {
  id: string;
  fromUnitId: string;
  toUnitId: string;
  conversionRate: string;
  productVariantId: string | null;
  fromUnit: Unit;
  toUnit: Unit;
  productVariant?: { name: string } | null;
}

export function UnitListPage() {
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
  const [isConvDialogOpen, setIsConvDialogOpen] = useState(false);

  // Unit form
  const [unitCode, setUnitCode] = useState('');
  const [unitName, setUnitName] = useState('');

  // Conversion form
  const [fromUnitId, setFromUnitId] = useState('');
  const [toUnitId, setToUnitId] = useState('');
  const [conversionRate, setConversionRate] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: units = [], isLoading: isLoadingUnits } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const res = await apiClient.get('/units');
      return res.data.data as Unit[];
    },
  });

  const { data: conversions = [], isLoading: isLoadingConvs } = useQuery({
    queryKey: ['unit-conversions'],
    queryFn: async () => {
      const res = await apiClient.get('/units/conversions');
      return res.data.data as UnitConversion[];
    },
  });

  const saveUnitMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/units', { code: unitCode, name: unitName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast({ title: 'Thành công', description: 'Đã thêm đơn vị tính mới' });
      setIsUnitDialogOpen(false);
      setUnitCode('');
      setUnitName('');
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi lưu đơn vị',
        description: getErrorMessage(err, 'Không thể lưu đơn vị tính. Vui lòng kiểm tra lại.'),
      });
    },
  });

  const saveConvMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/units/conversions', {
        fromUnitId,
        toUnitId,
        conversionRate: parseFloat(conversionRate),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-conversions'] });
      toast({ title: 'Thành công', description: 'Đã thêm quy đổi đơn vị' });
      setIsConvDialogOpen(false);
      setFromUnitId('');
      setToUnitId('');
      setConversionRate('');
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi lưu quy đổi',
        description: getErrorMessage(err, 'Không thể lưu quy đổi. Vui lòng kiểm tra lại.'),
      });
    },
  });

  const deleteConvMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/units/conversions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-conversions'] });
      toast({ title: 'Thành công', description: 'Đã xóa quy đổi đơn vị' });
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi xóa quy đổi',
        description: getErrorMessage(err, 'Không thể xóa quy đổi đơn vị.'),
      });
    },
  });

  const deleteUnitMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/units/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['unit-conversions'] });
      toast({ title: 'Thành công', description: 'Đã xóa đơn vị tính' });
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi xóa đơn vị',
        description: getErrorMessage(err, 'Không thể xóa đơn vị tính.'),
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Đơn vị tính & Quy đổi</h1>
          <p className="text-muted-foreground">Quản lý các đơn vị đo lường (KG, Tấn, Bao, m³, Viên, Cây) và tỷ lệ quy đổi</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsUnitDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm đơn vị
          </Button>
          <Button onClick={() => setIsConvDialogOpen(true)}>
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Thêm quy đổi
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Units List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
              Danh sách đơn vị tính
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingUnits ? (
              <div className="py-4 text-center text-muted-foreground">Đang tải...</div>
            ) : (
              <div className="divide-y divide-border">
                {units.map((u) => (
                  <div key={u.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm bg-primary/10 text-primary px-2 py-0.5 rounded mr-2">
                        {u.code}
                      </span>
                      <span className="text-sm font-medium">{u.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive h-7 w-7 p-0"
                      onClick={() => {
                        if (confirm(`Xác nhận xóa đơn vị tính "${u.code}"?`)) {
                          deleteUnitMutation.mutate(u.id);
                        }
                      }}
                      title="Xóa đơn vị"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversions Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-primary" />
              Bảng quy đổi đơn vị
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingConvs ? (
              <div className="py-4 text-center text-muted-foreground">Đang tải quy đổi...</div>
            ) : conversions.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">Chưa có công thức quy đổi nào</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2.5">Từ đơn vị</th>
                      <th className="px-3 py-2.5">Sang đơn vị</th>
                      <th className="px-3 py-2.5">Tỷ lệ quy đổi</th>
                      <th className="px-3 py-2.5">Phạm vi áp dụng</th>
                      <th className="px-3 py-2.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {conversions.map((conv) => (
                      <tr key={conv.id} className="hover:bg-muted/50">
                        <td className="px-3 py-2.5 font-semibold">1 {conv.fromUnit?.code}</td>
                        <td className="px-3 py-2.5 font-semibold">{conv.toUnit?.code}</td>
                        <td className="px-3 py-2.5 font-bold text-primary">= {conv.conversionRate}</td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">
                          {conv.productVariant ? (
                            <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                              {conv.productVariant.name}
                            </span>
                          ) : (
                            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Toàn cục</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive h-7 w-7 p-0"
                            onClick={() => {
                              if (confirm('Xác nhận xóa quy đổi này?')) {
                                deleteConvMutation.mutate(conv.id);
                              }
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add Unit Dialog */}
      <Dialog open={isUnitDialogOpen} onOpenChange={setIsUnitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm đơn vị tính mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="unit-code">Mã đơn vị *</Label>
              <Input
                id="unit-code"
                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value.toUpperCase())}
                placeholder="VD: KG, TON, BAG, M3..."
              />
            </div>
            <div>
              <Label htmlFor="unit-name">Tên tiếng Việt *</Label>
              <Input
                id="unit-name"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                placeholder="VD: Kilôgam, Tấn, Bao, Mét khối..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUnitDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={() => saveUnitMutation.mutate()}
              disabled={!unitCode.trim() || !unitName.trim() || saveUnitMutation.isPending}
            >
              {saveUnitMutation.isPending ? 'Đang lưu...' : 'Thêm đơn vị'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Conversion Dialog */}
      <Dialog open={isConvDialogOpen} onOpenChange={setIsConvDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm công thức quy đổi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="from-unit">Từ đơn vị *</Label>
              <select
                id="from-unit"
                className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                value={fromUnitId}
                onChange={(e) => setFromUnitId(e.target.value)}
              >
                <option value="">-- Chọn đơn vị nguồn --</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.code} ({u.name})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="to-unit">Sang đơn vị *</Label>
              <select
                id="to-unit"
                className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                value={toUnitId}
                onChange={(e) => setToUnitId(e.target.value)}
              >
                <option value="">-- Chọn đơn vị đích --</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.code} ({u.name})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="conv-rate">Tỷ lệ quy đổi * (1 đơn vị nguồn = ? đơn vị đích)</Label>
              <Input
                id="conv-rate"
                type="number"
                step="any"
                value={conversionRate}
                onChange={(e) => setConversionRate(e.target.value)}
                placeholder="VD: 1000 (1 Tấn = 1000 KG), 50 (1 Bao = 50 KG)..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConvDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={() => saveConvMutation.mutate()}
              disabled={!fromUnitId || !toUnitId || !conversionRate || saveConvMutation.isPending}
            >
              {saveConvMutation.isPending ? 'Đang lưu...' : 'Thêm quy đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
