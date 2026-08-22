import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
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
import { Plus, UserCheck, Phone, Edit2 } from 'lucide-react';

interface Driver {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
}

export function DriverListPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const res = await apiClient.get('/drivers');
      return res.data.data as Driver[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        phone: phone || undefined,
        notes: notes || undefined,
      };

      if (editingDriver) {
        return apiClient.put(`/drivers/${editingDriver.id}`, payload);
      }
      return apiClient.post('/drivers', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast({ title: 'Thành công', description: editingDriver ? 'Đã cập nhật tài xế' : 'Đã thêm tài xế mới' });
      handleCloseDialog();
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: err.response?.data?.error?.message || 'Không thể lưu tài xế',
      });
    },
  });

  const handleOpenCreate = () => {
    setEditingDriver(null);
    setName('');
    setPhone('');
    setNotes('');
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (d: Driver) => {
    setEditingDriver(d);
    setName(d.name);
    setPhone(d.phone || '');
    setNotes(d.notes || '');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingDriver(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Danh sách Tài xế / Lái xe</h1>
          <p className="text-muted-foreground">Quản lý đội ngũ lái xe giao hàng và vận chuyển vật liệu</p>
        </div>
        <Button onClick={handleOpenCreate} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Thêm tài xế
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">Đang tải danh sách tài xế...</div>
        ) : (
          drivers.map((d) => (
            <Card key={d.id} className="relative hover:shadow-md transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base">{d.name}</h3>
                      {d.phone ? (
                        <p className="text-xs font-mono flex items-center gap-1 text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {d.phone}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Chưa có SĐT</p>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(d)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>

                {d.notes && (
                  <p className="text-xs text-muted-foreground bg-muted/40 p-2 rounded">
                    {d.notes}
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
            <DialogTitle>{editingDriver ? 'Sửa thông tin tài xế' : 'Thêm tài xế mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="d-name">Họ và tên tài xế *</Label>
              <Input
                id="d-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Nguyễn Văn Chủ, Trần Văn Lái..."
              />
            </div>
            <div>
              <Label htmlFor="d-phone">Số điện thoại</Label>
              <Input
                id="d-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0987654321"
              />
            </div>
            <div>
              <Label htmlFor="d-notes">Ghi chú</Label>
              <Input
                id="d-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Phụ trách xe ben, xe tải, chủ kiêm lái..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Hủy
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!name.trim() || saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Đang lưu...' : 'Lưu tài xế'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
