import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { getErrorMessage } from '../../lib/error-utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { useToast } from '../../components/ui/use-toast';
import { Plus, Tags, CheckCircle, XCircle, Trash2 } from 'lucide-react';

interface ExpenseCategory {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export function ExpenseCategoryListPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const res = await apiClient.get('/expenses/categories');
      return res.data.data as ExpenseCategory[];
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/expenses/categories', {
        code,
        name,
        description: description || undefined,
        isActive: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
      toast({ title: 'Thêm loại chi phí thành công', description: 'Đã tạo nhóm chi phí mới.' });
      setIsAddOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi tạo loại chi phí',
        description: getErrorMessage(err, 'Không thể tạo loại chi phí. Vui lòng kiểm tra lại.'),
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/expenses/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
      toast({ title: 'Thành công', description: 'Đã xóa loại chi phí' });
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi xóa loại chi phí',
        description: getErrorMessage(err, 'Không thể xóa loại chi phí.'),
      });
    },
  });

  const resetForm = () => {
    setCode('');
    setName('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Danh mục Loại Chi phí</h1>
          <p className="text-muted-foreground">
            Phân loại chi phí vận hành: Xăng xe, Sửa chữa bảo dưỡng, Lương tài xế, Mặt bằng, Điện nước
          </p>
        </div>

        <Button onClick={() => setIsAddOpen(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Thêm loại chi phí
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải loại chi phí...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Tags className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có loại chi phí nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Mã loại</th>
                    <th className="px-4 py-3">Tên loại chi phí</th>
                    <th className="px-4 py-3">Mô tả / Mục đích</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {categories.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono font-bold text-primary">{c.code}</td>
                      <td className="px-4 py-3 font-semibold">{c.name}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{c.description || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={
                            c.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-muted text-muted-foreground'
                          }
                        >
                          {c.isActive ? 'Đang sử dụng' : 'Tạm ngưng'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm(`Xác nhận xóa loại chi phí "${c.name}"?`)) {
                              deleteCategoryMutation.mutate(c.id);
                            }
                          }}
                          title="Xóa loại chi phí"
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

      {/* Add Category Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm Loại Chi Phí Mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="cat-code">Mã loại (viết liền không dấu) *</Label>
              <Input
                id="cat-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="VD: XANG_DAU, TIEN_DIEN..."
                className="font-mono uppercase"
              />
            </div>

            <div>
              <Label htmlFor="cat-name">Tên loại chi phí *</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Chi phí xăng dầu xe tải"
              />
            </div>

            <div>
              <Label htmlFor="cat-desc">Mô tả chi tiết</Label>
              <Input
                id="cat-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Chi phí đổ dầu diesel hàng tuần cho xe ben, xe tải..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Hủy
            </Button>
            <Button
              className="font-bold"
              onClick={() => createCategoryMutation.mutate()}
              disabled={!code || !name || createCategoryMutation.isPending}
            >
              {createCategoryMutation.isPending ? 'Đang lưu...' : 'Lưu loại chi phí'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
