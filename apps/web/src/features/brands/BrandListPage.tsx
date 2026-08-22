import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { getErrorMessage } from '../../lib/error-utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { useToast } from '../../components/ui/use-toast';
import { Plus, Search, Edit2, Trash2, Award } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
  description: string | null;
}

export function BrandListPage() {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ['brands', search],
    queryFn: async () => {
      const res = await apiClient.get('/brands', { params: { search } });
      return res.data.data as Brand[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        description: description || undefined,
      };

      if (editingBrand) {
        return apiClient.put(`/brands/${editingBrand.id}`, payload);
      }
      return apiClient.post('/brands', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast({ title: 'Thành công', description: editingBrand ? 'Đã cập nhật thương hiệu' : 'Đã thêm thương hiệu mới' });
      handleCloseDialog();
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi lưu thương hiệu',
        description: getErrorMessage(err, 'Không thể lưu thương hiệu. Vui lòng kiểm tra lại.'),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/brands/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast({ title: 'Thành công', description: 'Đã xóa thương hiệu' });
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi xóa thương hiệu',
        description: getErrorMessage(err, 'Không thể xóa thương hiệu.'),
      });
    },
  });

  const handleOpenCreate = () => {
    setEditingBrand(null);
    setName('');
    setDescription('');
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (b: Brand) => {
    setEditingBrand(b);
    setName(b.name);
    setDescription(b.description || '');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBrand(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thương hiệu sản phẩm</h1>
          <p className="text-muted-foreground">Quản lý các nhãn hiệu uy tín (Hòa Phát, Nghi Sơn, Hoàng Thạch, Viglacera...)</p>
        </div>
        <Button onClick={handleOpenCreate} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Thêm thương hiệu
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 max-w-sm">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm thương hiệu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải thương hiệu...</div>
          ) : brands.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có thương hiệu nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Tên thương hiệu</th>
                    <th className="px-4 py-3">Mô tả</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {brands.map((b) => (
                    <tr key={b.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-semibold text-primary">{b.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{b.description || '—'}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(b)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm(`Xác nhận xóa thương hiệu "${b.name}"?`)) {
                              deleteMutation.mutate(b.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBrand ? 'Sửa thương hiệu' : 'Thêm thương hiệu mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="brand-name">Tên thương hiệu *</Label>
              <Input
                id="brand-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Hòa Phát, Nghi Sơn, Hoàng Thạch..."
              />
            </div>
            <div>
              <Label htmlFor="brand-desc">Mô tả / Thông tin công ty</Label>
              <Input
                id="brand-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ghi chú thêm về nhà sản xuất..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Hủy
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!name.trim() || saveMutation.isPending}>
              {saveMutation.isPending ? 'Đang lưu...' : 'Lưu thương hiệu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
