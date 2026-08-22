import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { useToast } from '../../components/ui/use-toast';
import { Plus, Truck, Edit2, Trash2 } from 'lucide-react';

interface Vehicle {
  id: string;
  name: string;
  plateNumber: string;
  type: string | null;
  notes: string | null;
  isActive: boolean;
}

export function VehicleListPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [name, setName] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await apiClient.get('/vehicles');
      return res.data.data as Vehicle[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        plateNumber,
        type: type || undefined,
        notes: notes || undefined,
      };

      if (editingVehicle) {
        return apiClient.put(`/vehicles/${editingVehicle.id}`, payload);
      }
      return apiClient.post('/vehicles', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({ title: 'Thành công', description: editingVehicle ? 'Đã cập nhật phương tiện' : 'Đã thêm xe mới' });
      handleCloseDialog();
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: err.response?.data?.error?.message || 'Không thể lưu phương tiện',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/vehicles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({ title: 'Thành công', description: 'Đã xóa xe' });
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: err.response?.data?.error?.message || 'Không thể xóa xe',
      });
    },
  });

  const handleOpenCreate = () => {
    setEditingVehicle(null);
    setName('');
    setPlateNumber('');
    setType('');
    setNotes('');
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setName(v.name);
    setPlateNumber(v.plateNumber);
    setType(v.type || '');
    setNotes(v.notes || '');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingVehicle(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Danh sách Phương tiện / Xe</h1>
          <p className="text-muted-foreground">Quản lý đội xe tải, xe ben phục vụ vận chuyển vật liệu tới công trình</p>
        </div>
        <Button onClick={handleOpenCreate} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Thêm xe mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">Đang tải danh sách xe...</div>
        ) : (
          vehicles.map((v) => (
            <Card key={v.id} className="relative hover:shadow-md transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base">{v.name}</h3>
                      <Badge variant="outline" className="font-mono font-bold bg-amber-50 text-amber-900 border-amber-300">
                        {v.plateNumber}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(v)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm(`Xác nhận xóa xe "${v.name}" (${v.plateNumber})?`)) {
                          deleteMutation.mutate(v.id);
                        }
                      }}
                      title="Xóa xe"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {v.type && (
                  <p className="text-xs text-muted-foreground">
                    Loại xe: <strong>{v.type}</strong>
                  </p>
                )}

                {v.notes && (
                  <p className="text-xs text-muted-foreground bg-muted/40 p-2 rounded">
                    {v.notes}
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
            <DialogTitle>{editingVehicle ? 'Sửa thông tin xe' : 'Thêm xe mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="v-name">Tên xe / Định danh *</Label>
              <Input
                id="v-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Xe tải thùng 3.5T, Xe ben 7m³..."
              />
            </div>
            <div>
              <Label htmlFor="v-plate">Biển kiểm soát *</Label>
              <Input
                id="v-plate"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                placeholder="VD: 29C-123.45, 29H-678.90..."
              />
            </div>
            <div>
              <Label htmlFor="v-type">Chủng loại xe</Label>
              <Input
                id="v-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="VD: Xe chở sắt xi, Xe ben chở cát..."
              />
            </div>
            <div>
              <Label htmlFor="v-notes">Ghi chú</Label>
              <Input
                id="v-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Hạn đăng kiểm, định mức dầu..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Hủy
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!name.trim() || !plateNumber.trim() || saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Đang lưu...' : 'Lưu phương tiện'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
