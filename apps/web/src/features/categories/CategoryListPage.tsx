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
import { Plus, Search, Edit2, Trash2, FolderTree } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

export function CategoryListPage() {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('0');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', search],
    queryFn: async () => {
      const res = await apiClient.get('/categories', { params: { search } });
      return res.data.data as Category[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        description: description || undefined,
        sortOrder: parseInt(sortOrder, 10) || 0,
      };

      if (editingCategory) {
        return apiClient.put(`/categories/${editingCategory.id}`, payload);
      }
      return apiClient.post('/categories', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'Thành công', description: editingCategory ? 'Đã cập nhật danh mục' : 'Đã thêm danh mục mới' });
      handleCloseDialog();
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi lưu danh mục',
        description: getErrorMessage(err, 'Không thể lưu danh mục. Vui lòng kiểm tra lại.'),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'Thành công', description: 'Đã xóa danh mục' });
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi xóa danh mục',
        description: getErrorMessage(err, 'Không thể xóa danh mục.'),
      });
    },
  });

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setSortOrder('0');
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setSortOrder(String(cat.sortOrder));
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Danh mục sản phẩm</h1>
          <p className="text-muted-foreground">Quản lý các nhóm phân loại hàng hóa (Xi măng, Cát, Sắt thép, Gạch...)</p>
        </div>
        <Button onClick={handleOpenCreate} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Thêm danh mục
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 max-w-sm">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm danh mục..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải danh mục...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderTree className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có danh mục sản phẩm nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Thứ tự</th>
                    <th className="px-4 py-3">Tên danh mục</th>
                    <th className="px-4 py-3">Mô tả</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{cat.sortOrder}</td>
                      <td className="px-4 py-3 font-semibold text-primary">{cat.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{cat.description || '—'}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(cat)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm(`Xác nhận xóa danh mục "${cat.name}"?`)) {
                              deleteMutation.mutate(cat.id);
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
            <DialogTitle>{editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="cat-name">Tên danh mục *</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Sắt thép, Xi măng, Cát xây..."
              />
            </div>
            <div>
              <Label htmlFor="cat-order">Thứ tự hiển thị</Label>
              <Input
                id="cat-order"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="cat-desc">Mô tả</Label>
              <Input
                id="cat-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ghi chú thêm về nhóm hàng..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Hủy
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!name.trim() || saveMutation.isPending}>
              {saveMutation.isPending ? 'Đang lưu...' : 'Lưu danh mục'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
