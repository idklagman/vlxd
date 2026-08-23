import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { getErrorMessage } from '../../lib/error-utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { useToast } from '../../components/ui/use-toast';
import { Plus, Warehouse, Edit2, Trash2 } from 'lucide-react';

interface WarehouseItem {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  isActive: boolean;
}

export function WarehouseListPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWh, setEditingWh] = useState<WarehouseItem | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: warehouses = [], isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await apiClient.get('/warehouses');
      return res.data.data as WarehouseItem[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        address: address || undefined,
        description: description || undefined,
      };

      if (editingWh) {
        return apiClient.put(`/warehouses/${editingWh.id}`, payload);
      }
      return apiClient.post('/warehouses', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast({ title: 'Thành công', description: editingWh ? 'Đã cập nhật kho' : 'Đã thêm kho mới' });
      handleCloseDialog();
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi lưu kho hàng',
        description: getErrorMessage(err, 'Không thể lưu kho hàng. Vui lòng kiểm tra lại.'),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/warehouses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast({ title: 'Thành công', description: 'Đã xóa kho hàng' });
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi xóa kho hàng',
        description: getErrorMessage(err, 'Không thể xóa kho hàng.'),
      });
    },
  });

  const handleOpenCreate = () => {
    setEditingWh(null);
    setName('');
    setAddress('');
    setDescription('');
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (wh: WarehouseItem) => {
    setEditingWh(wh);
    setName(wh.name);
    setAddress(wh.address || '');
    setDescription(wh.description || '');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingWh(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thông tin Kho hàng</h1>
          <p className="text-muted-foreground">Quản lý thông tin địa điểm kho hàng tổng của cửa hàng VLXD</p>
        </div>
        <Button onClick={handleOpenCreate} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Thêm kho bãi
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">Đang tải kho hàng...</div>
        ) : (
          warehouses.map((wh) => (
            <Card key={wh.id} className="relative hover:shadow-md transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Warehouse className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base">{wh.name}</h3>
                      <p className="text-xs text-muted-foreground">{wh.address || 'Chưa cập nhật địa chỉ'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(wh)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm(`Xác nhận xóa kho "${wh.name}"?`)) {
                          deleteMutation.mutate(wh.id);
                        }
                      }}
                      title="Xóa kho hàng"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {wh.description && (
                  <p className="text-xs text-muted-foreground bg-muted/50 p-2.5 rounded">
                    {wh.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWh ? 'Sửa thông tin kho bãi' : 'Thêm kho bãi mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="wh-name">Tên kho / bãi *</Label>
              <Input
                id="wh-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Kho Xi Sắt, Bãi Cát Sỏi Gạch..."
              />
            </div>
            <div>
              <Label htmlFor="wh-address">Địa chỉ / Vị trí</Label>
              <Input
                id="wh-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="VD: Khu A - Cửa hàng chính..."
              />
            </div>
            <div>
              <Label htmlFor="wh-desc">Mô tả loại hàng chứa</Label>
              <Input
                id="wh-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="VD: Chứa xi măng, sắt thép thanh và cuộn..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Hủy
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!name.trim() || saveMutation.isPending}>
              {saveMutation.isPending ? 'Đang lưu...' : 'Lưu kho hàng'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
