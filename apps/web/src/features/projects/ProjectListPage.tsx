import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { formatDate } from '@vlxd/shared';
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
import { Plus, Building, User, Phone, MapPin, Edit2 } from 'lucide-react';

interface Project {
  id: string;
  customerId: string;
  name: string;
  address: string | null;
  contactName: string | null;
  contactPhone: string | null;
  startDate: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  notes: string | null;
  customer: { id: string; name: string; phone: string | null };
}

const PROJECT_STATUSES = {
  ACTIVE: { label: 'Đang thi công', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  COMPLETED: { label: 'Đã hoàn thành', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  ON_HOLD: { label: 'Tạm dừng', color: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export function ProjectListPage() {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [customerId, setCustomerId] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [startDate, setStartDate] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'COMPLETED' | 'ON_HOLD'>('ACTIVE');
  const [notes, setNotes] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', selectedStatus],
    queryFn: async () => {
      const res = await apiClient.get('/projects', {
        params: { status: selectedStatus || undefined },
      });
      return res.data.data as Project[];
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await apiClient.get('/customers');
      return res.data.data as { id: string; name: string }[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        customerId,
        name,
        address: address || undefined,
        contactName: contactName || undefined,
        contactPhone: contactPhone || undefined,
        startDate: startDate || undefined,
        status,
        notes: notes || undefined,
      };

      if (editingProject) {
        return apiClient.put(`/projects/${editingProject.id}`, payload);
      }
      return apiClient.post('/projects', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: 'Thành công', description: editingProject ? 'Đã cập nhật công trình' : 'Đã tạo công trình mới' });
      handleCloseDialog();
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: err.response?.data?.error?.message || 'Không thể lưu công trình',
      });
    },
  });

  const handleOpenCreate = () => {
    setEditingProject(null);
    setCustomerId('');
    setName('');
    setAddress('');
    setContactName('');
    setContactPhone('');
    setStartDate('');
    setStatus('ACTIVE');
    setNotes('');
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (p: Project) => {
    setEditingProject(p);
    setCustomerId(p.customerId);
    setName(p.name);
    setAddress(p.address || '');
    setContactName(p.contactName || '');
    setContactPhone(p.contactPhone || '');
    setStartDate(p.startDate || '');
    setStatus(p.status);
    setNotes(p.notes || '');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProject(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Danh sách Công trình</h1>
          <p className="text-muted-foreground">Theo dõi công trình xây dựng theo từng chủ nhà/nhà thầu để tính công nợ & lợi nhuận</p>
        </div>
        <Button onClick={handleOpenCreate} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Tạo công trình
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <select
              className="w-full sm:w-56 h-10 px-3 border border-input rounded-md bg-background text-sm"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang thi công</option>
              <option value="COMPLETED">Đã hoàn thành</option>
              <option value="ON_HOLD">Tạm dừng</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải danh sách công trình...</div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có công trình nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="border border-border rounded-lg p-4 bg-card hover:shadow-md transition-shadow space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-base text-primary">{p.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <User className="w-3 h-3" />
                        <span>Chủ đầu tư: <strong>{p.customer?.name}</strong></span>
                      </div>
                    </div>
                    <Badge variant="outline" className={PROJECT_STATUSES[p.status]?.color}>
                      {PROJECT_STATUSES[p.status]?.label || p.status}
                    </Badge>
                  </div>

                  {p.address && (
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{p.address}</span>
                    </div>
                  )}

                  {(p.contactName || p.contactPhone) && (
                    <div className="flex items-center gap-2 text-xs bg-muted/40 p-2 rounded">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      <span>Liên hệ nhận hàng: {p.contactName || ''} {p.contactPhone ? `(${p.contactPhone})` : ''}</span>
                    </div>
                  )}

                  {p.startDate && (
                    <div className="text-xs text-muted-foreground">
                      Ngày khởi công: {formatDate(p.startDate)}
                    </div>
                  )}

                  <div className="pt-2 border-t border-border flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(p)}>
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      Sửa thông tin
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProject ? 'Sửa công trình' : 'Tạo công trình mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="proj-cust">Chủ đầu tư / Khách hàng *</Label>
              <select
                id="proj-cust"
                className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">-- Chọn khách hàng --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="p-name">Tên công trình *</Label>
              <Input
                id="p-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Nhà 3 tầng Yên Vỹ..."
              />
            </div>
            <div>
              <Label htmlFor="p-address">Địa chỉ công trình (giao hàng)</Label>
              <Input
                id="p-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="VD: Thôn Yên Vỹ, Hương Sơn..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="p-contact-name">Người nhận hàng</Label>
                <Input
                  id="p-contact-name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Anh A, Cai thầu B..."
                />
              </div>
              <div>
                <Label htmlFor="p-contact-phone">SĐT người nhận</Label>
                <Input
                  id="p-contact-phone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="0912345678"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="p-start-date">Ngày bắt đầu (YYYY-MM-DD)</Label>
                <Input
                  id="p-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="p-status">Trạng thái</Label>
                <select
                  id="p-status"
                  className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="ACTIVE">Đang thi công</option>
                  <option value="COMPLETED">Đã hoàn thành</option>
                  <option value="ON_HOLD">Tạm dừng</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="p-notes">Ghi chú</Label>
              <Input
                id="p-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú thêm về thiết kế, dự toán..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Hủy
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!customerId || !name.trim() || saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Đang lưu...' : 'Lưu công trình'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
