import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
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
import { Plus, Search, Users, Phone, MapPin, Building, Edit2, Trash2 } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  customerType: 'RETAIL' | 'BUILDER' | 'CONTRACTOR_TEAM' | 'OTHER';
  notes: string | null;
  projects: { id: string; name: string; status: string }[];
}

const CUSTOMER_TYPES = {
  RETAIL: { label: 'Khách lẻ', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  BUILDER: { label: 'Thợ xây', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  CONTRACTOR_TEAM: { label: 'Đội thầu XD', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  OTHER: { label: 'Khác', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

export function CustomerListPage() {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Customer Dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [customerType, setCustomerType] = useState<'RETAIL' | 'BUILDER' | 'CONTRACTOR_TEAM' | 'OTHER'>('RETAIL');
  const [notes, setNotes] = useState('');

  // Project Quick Add Dialog
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectAddress, setProjectAddress] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', search, selectedType],
    queryFn: async () => {
      const res = await apiClient.get('/customers', {
        params: { search, customerType: selectedType || undefined },
      });
      return res.data.data as Customer[];
    },
  });

  const saveCustomerMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        phone: phone || undefined,
        address: address || undefined,
        customerType,
        notes: notes || undefined,
      };

      if (editingCustomer) {
        return apiClient.put(`/customers/${editingCustomer.id}`, payload);
      }
      return apiClient.post('/customers', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: 'Thành công', description: editingCustomer ? 'Đã cập nhật khách hàng' : 'Đã thêm khách hàng mới' });
      handleCloseDialog();
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: err.response?.data?.error?.message || 'Không thể lưu khách hàng',
      });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: 'Thành công', description: 'Đã xóa khách hàng' });
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/projects', {
        customerId: selectedCustomerId,
        name: projectName,
        address: projectAddress || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: 'Thành công', description: 'Đã thêm công trình mới cho khách hàng' });
      setIsProjectDialogOpen(false);
      setProjectName('');
      setProjectAddress('');
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: err.response?.data?.error?.message || 'Không thể tạo công trình',
      });
    },
  });

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setAddress('');
    setCustomerType('RETAIL');
    setNotes('');
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone || '');
    setAddress(c.address || '');
    setCustomerType(c.customerType);
    setNotes(c.notes || '');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCustomer(null);
  };

  const handleOpenAddProject = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setProjectName('');
    setProjectAddress('');
    setIsProjectDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Danh sách Khách hàng</h1>
          <p className="text-muted-foreground">Quản lý hồ sơ khách hàng, thợ xây, đội thầu và các công trình liên kết</p>
        </div>
        <Button onClick={handleOpenCreate} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Thêm khách hàng
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm tên hoặc số điện thoại..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              className="w-full sm:w-52 h-10 px-3 border border-input rounded-md bg-background text-sm"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">Tất cả loại khách</option>
              <option value="RETAIL">Khách lẻ</option>
              <option value="BUILDER">Thợ xây</option>
              <option value="CONTRACTOR_TEAM">Đội thầu XD</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải khách hàng...</div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có khách hàng nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Khách hàng</th>
                    <th className="px-4 py-3">Loại khách</th>
                    <th className="px-4 py-3">Điện thoại</th>
                    <th className="px-4 py-3">Địa chỉ</th>
                    <th className="px-4 py-3">Công trình đang thi công</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <span className="font-bold text-primary block">{c.name}</span>
                        {c.notes && <span className="text-xs text-muted-foreground">{c.notes}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={CUSTOMER_TYPES[c.customerType]?.color}>
                          {CUSTOMER_TYPES[c.customerType]?.label || c.customerType}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {c.phone ? (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                            {c.phone}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {c.address ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            {c.address}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {c.projects.length === 0 ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 text-primary hover:bg-primary/10"
                            onClick={() => handleOpenAddProject(c.id)}
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Tạo công trình
                          </Button>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {c.projects.map((p) => (
                              <span
                                key={p.id}
                                className="inline-flex items-center text-xs bg-muted px-2 py-0.5 rounded text-foreground font-medium"
                              >
                                <Building className="w-3 h-3 mr-1 text-muted-foreground" />
                                {p.name}
                              </span>
                            ))}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6 w-6 p-0"
                              onClick={() => handleOpenAddProject(c.id)}
                              title="Thêm công trình khác"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(c)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm(`Xác nhận xóa khách hàng "${c.name}"?`)) {
                              deleteCustomerMutation.mutate(c.id);
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

      {/* Customer Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'Sửa thông tin khách hàng' : 'Thêm khách hàng mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="cust-name">Tên khách hàng / Nhà thầu *</Label>
              <Input
                id="cust-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Nguyễn Văn A, Thợ Tuấn, Đội XD Hưng Phát..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cust-phone">Số điện thoại</Label>
                <Input
                  id="cust-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912345678"
                />
              </div>
              <div>
                <Label htmlFor="cust-type">Phân loại khách</Label>
                <select
                  id="cust-type"
                  className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                  value={customerType}
                  onChange={(e) => setCustomerType(e.target.value as any)}
                >
                  <option value="RETAIL">Khách lẻ xây nhà</option>
                  <option value="BUILDER">Thợ xây nhận khoán</option>
                  <option value="CONTRACTOR_TEAM">Đội thi công lớn</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="cust-address">Địa chỉ thường trú / Công ty</Label>
              <Input
                id="cust-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="VD: Thôn Yên Vỹ, Xã Hương Sơn, Mỹ Đức..."
              />
            </div>
            <div>
              <Label htmlFor="cust-notes">Ghi chú thêm</Label>
              <Input
                id="cust-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Kênh liên hệ (Zalo, Facebook, quen giới thiệu)..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Hủy
            </Button>
            <Button
              onClick={() => saveCustomerMutation.mutate()}
              disabled={!name.trim() || saveCustomerMutation.isPending}
            >
              {saveCustomerMutation.isPending ? 'Đang lưu...' : 'Lưu khách hàng'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Project Dialog */}
      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm công trình xây dựng cho khách hàng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="proj-name">Tên công trình *</Label>
              <Input
                id="proj-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="VD: Nhà 3 tầng Yên Vỹ, Biệt thự mái Thái..."
              />
            </div>
            <div>
              <Label htmlFor="proj-address">Địa chỉ công trình (Địa điểm giao vật liệu)</Label>
              <Input
                id="proj-address"
                value={projectAddress}
                onChange={(e) => setProjectAddress(e.target.value)}
                placeholder="VD: Số 12 ngõ 3 đường Yên Vỹ..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProjectDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={() => createProjectMutation.mutate()}
              disabled={!projectName.trim() || createProjectMutation.isPending}
            >
              {createProjectMutation.isPending ? 'Đang tạo...' : 'Tạo công trình'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
