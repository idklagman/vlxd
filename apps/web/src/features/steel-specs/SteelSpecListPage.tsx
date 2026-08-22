import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { calculateWeightPerBar, DEFAULT_BAR_LENGTH } from '@vlxd/shared';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { useToast } from '../../components/ui/use-toast';
import { Edit2, ShieldAlert, Cpu } from 'lucide-react';

interface SteelSpec {
  id: string;
  productVariantId: string;
  brandId: string;
  steelType: 'BAR' | 'COIL';
  standard: string | null;
  diameter: string;
  lengthPerBar: string | null;
  weightPerMeter: string;
  weightPerBar: string | null;
  purchaseUnitId: string;
  saleUnitId: string;
  isActive: boolean;
  productVariant: {
    name: string;
    sku: string | null;
    product: { name: string };
  };
  brand: { name: string };
  purchaseUnit: { code: string; name: string };
  saleUnit: { code: string; name: string };
}

export function SteelSpecListPage() {
  const [editingSpec, setEditingSpec] = useState<SteelSpec | null>(null);
  const [diameter, setDiameter] = useState('');
  const [lengthPerBar, setLengthPerBar] = useState('11.7');
  const [weightPerMeter, setWeightPerMeter] = useState('');
  const [weightPerBar, setWeightPerBar] = useState('');
  const [standard, setStandard] = useState('TCVN 1651-2:2018');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: steelSpecs = [], isLoading } = useQuery({
    queryKey: ['steel-specs'],
    queryFn: async () => {
      const res = await apiClient.get('/steel-specs');
      return res.data.data as SteelSpec[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingSpec) return;
      return apiClient.put(`/steel-specs/${editingSpec.id}`, {
        productVariantId: editingSpec.productVariantId,
        brandId: editingSpec.brandId,
        steelType: editingSpec.steelType,
        standard,
        diameter: parseFloat(diameter),
        lengthPerBar: editingSpec.steelType === 'BAR' ? parseFloat(lengthPerBar) : undefined,
        weightPerMeter: parseFloat(weightPerMeter),
        weightPerBar: editingSpec.steelType === 'BAR' ? parseFloat(weightPerBar) : undefined,
        purchaseUnitId: editingSpec.purchaseUnitId,
        saleUnitId: editingSpec.saleUnitId,
        isActive: editingSpec.isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['steel-specs'] });
      toast({ title: 'Thành công', description: 'Đã cập nhật quy cách và barem thép' });
      handleCloseDialog();
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: err.response?.data?.error?.message || 'Không thể cập nhật quy cách thép',
      });
    },
  });

  const handleOpenEdit = (spec: SteelSpec) => {
    setEditingSpec(spec);
    setDiameter(spec.diameter);
    setLengthPerBar(spec.lengthPerBar || String(DEFAULT_BAR_LENGTH));
    setWeightPerMeter(spec.weightPerMeter);
    setWeightPerBar(spec.weightPerBar || '');
    setStandard(spec.standard || 'TCVN 1651-2:2018');
  };

  const handleCloseDialog = () => {
    setEditingSpec(null);
  };

  const handleWeightPerMeterChange = (val: string) => {
    setWeightPerMeter(val);
    const num = parseFloat(val);
    const len = parseFloat(lengthPerBar) || DEFAULT_BAR_LENGTH;
    if (!isNaN(num) && editingSpec?.steelType === 'BAR') {
      setWeightPerBar(String(calculateWeightPerBar(num, len)));
    }
  };

  const handleLengthChange = (val: string) => {
    setLengthPerBar(val);
    const len = parseFloat(val);
    const wpm = parseFloat(weightPerMeter);
    if (!isNaN(len) && !isNaN(wpm) && editingSpec?.steelType === 'BAR') {
      setWeightPerBar(String(calculateWeightPerBar(wpm, len)));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quy cách & Barem Thép</h1>
        <p className="text-muted-foreground">
          Bảng thông số trọng lượng danh nghĩa thép Hòa Phát (TCVN 1651-2:2018). Nhập theo KG, bán theo Cây, trừ kho theo KG.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900">
          <p className="font-semibold">Quy tắc nghiệp vụ Sắt thép:</p>
          <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs text-amber-800">
            <li>Tồn kho thực tế trong hệ thống luôn được tính bằng <strong>Kilôgam (KG)</strong>.</li>
            <li>Giao diện bán hàng cho phép chọn <strong>Cây</strong>, hệ thống tự động nhân với Barem (kg/cây) để trừ tồn kho KG.</li>
            <li>Chỉnh sửa Barem thép sẽ áp dụng cho các đơn hàng tương lai, <strong>không làm thay đổi lịch sử</strong> các giao dịch cũ.</li>
          </ul>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải barem thép...</div>
          ) : steelSpecs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Cpu className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có quy cách thép nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Quy cách thép</th>
                    <th className="px-4 py-3">Thương hiệu</th>
                    <th className="px-4 py-3">Loại thép</th>
                    <th className="px-4 py-3">Đường kính</th>
                    <th className="px-4 py-3">Chiều dài/cây</th>
                    <th className="px-4 py-3">Đơn trọng (kg/m)</th>
                    <th className="px-4 py-3">Trọng lượng/cây</th>
                    <th className="px-4 py-3">Nhập / Bán</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {steelSpecs.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-semibold text-primary">
                        {s.productVariant?.name}
                      </td>
                      <td className="px-4 py-3">{s.brand?.name}</td>
                      <td className="px-4 py-3">
                        {s.steelType === 'BAR' ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Thanh vằn
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            Thép cuộn
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold">D{s.diameter}</td>
                      <td className="px-4 py-3">{s.lengthPerBar ? `${s.lengthPerBar} m` : '—'}</td>
                      <td className="px-4 py-3 font-mono">{s.weightPerMeter} kg/m</td>
                      <td className="px-4 py-3 font-mono font-bold text-amber-700">
                        {s.weightPerBar ? `${s.weightPerBar} kg/cây` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="bg-muted px-1.5 py-0.5 rounded mr-1">Nhập: {s.purchaseUnit?.code}</span>
                        <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                          Bán: {s.saleUnit?.code}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="outline" size="sm" onClick={() => handleOpenEdit(s)}>
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Sửa Barem
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

      {/* Edit Steel Spec Dialog */}
      <Dialog open={!!editingSpec} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa Barem quy cách thép: {editingSpec?.productVariant?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Tiêu chuẩn sản xuất</Label>
              <Input
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
                placeholder="VD: TCVN 1651-2:2018"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Đường kính danh nghĩa (mm) *</Label>
                <Input
                  type="number"
                  step="any"
                  value={diameter}
                  onChange={(e) => setDiameter(e.target.value)}
                />
              </div>
              <div>
                <Label>Chiều dài thanh (m)</Label>
                <Input
                  type="number"
                  step="any"
                  disabled={editingSpec?.steelType === 'COIL'}
                  value={lengthPerBar}
                  onChange={(e) => handleLengthChange(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Đơn trọng (kg/m) *</Label>
                <Input
                  type="number"
                  step="any"
                  value={weightPerMeter}
                  onChange={(e) => handleWeightPerMeterChange(e.target.value)}
                />
              </div>
              <div>
                <Label>Trọng lượng lý thuyết/cây (kg)</Label>
                <Input
                  type="number"
                  step="any"
                  disabled={editingSpec?.steelType === 'COIL'}
                  value={weightPerBar}
                  onChange={(e) => setWeightPerBar(e.target.value)}
                />
              </div>
            </div>
            {editingSpec?.steelType === 'BAR' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                💡 Công thức tự động: <strong>{weightPerMeter || 0} kg/m × {lengthPerBar || 0} m = {weightPerBar || 0} kg/cây</strong>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Hủy
            </Button>
            <Button
              onClick={() => updateMutation.mutate()}
              disabled={!diameter || !weightPerMeter || updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Đang lưu...' : 'Lưu quy cách'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
