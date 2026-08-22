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
import { Plus, Search, Layers, ChevronDown, ChevronRight, PackagePlus, Trash2, Edit2 } from 'lucide-react';

interface Product {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  description: string | null;
  isActive: boolean;
  category: { name: string };
  variants: {
    id: string;
    name: string;
    sku: string | null;
    specification: string | null;
    minimumStock: string | null;
    brand?: { name: string } | null;
    baseUnit: { code: string; name: string };
    steelSpecification?: {
      diameter: string;
      weightPerMeter: string;
      weightPerBar: string | null;
      lengthPerBar: string | null;
    } | null;
  }[];
}

export function ProductListPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});

  // Product Dialog
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [productCode, setProductCode] = useState('');
  const [productName, setProductName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [productDescription, setProductDescription] = useState('');

  // Variant Dialog
  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
  const [targetProductId, setTargetProductId] = useState('');
  const [variantName, setVariantName] = useState('');
  const [variantSku, setVariantSku] = useState('');
  const [variantSpec, setVariantSpec] = useState('');
  const [variantBrandId, setVariantBrandId] = useState('');
  const [variantBaseUnitId, setVariantBaseUnitId] = useState('');
  const [variantMinStock, setVariantMinStock] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', search, selectedCategory],
    queryFn: async () => {
      const res = await apiClient.get('/products', {
        params: { search, categoryId: selectedCategory || undefined },
      });
      return res.data.data as Product[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get('/categories');
      return res.data.data as { id: string; name: string }[];
    },
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const res = await apiClient.get('/brands');
      return res.data.data as { id: string; name: string }[];
    },
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const res = await apiClient.get('/units');
      return res.data.data as { id: string; code: string; name: string }[];
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/products', {
        code: productCode,
        name: productName,
        categoryId,
        description: productDescription || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Thành công', description: 'Đã tạo sản phẩm mới' });
      setIsProductDialogOpen(false);
      setProductCode('');
      setProductName('');
      setCategoryId('');
      setProductDescription('');
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: err.response?.data?.error?.message || 'Không thể tạo sản phẩm',
      });
    },
  });

  const createVariantMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post(`/products/${targetProductId}/variants`, {
        name: variantName,
        sku: variantSku || undefined,
        specification: variantSpec || undefined,
        brandId: variantBrandId || undefined,
        baseUnitId: variantBaseUnitId,
        minimumStock: variantMinStock ? parseFloat(variantMinStock) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Thành công', description: 'Đã thêm quy cách / biến thể mới' });
      setIsVariantDialogOpen(false);
      setVariantName('');
      setVariantSku('');
      setVariantSpec('');
      setVariantBrandId('');
      setVariantBaseUnitId('');
      setVariantMinStock('');
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: err.response?.data?.error?.message || 'Không thể thêm quy cách',
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Thành công', description: 'Đã xóa sản phẩm' });
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: err.response?.data?.error?.message || 'Không thể xóa sản phẩm',
      });
    },
  });

  const deleteVariantMutation = useMutation({
    mutationFn: async (variantId: string) => {
      return apiClient.delete(`/products/variants/${variantId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Thành công', description: 'Đã xóa quy cách / biến thể' });
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: err.response?.data?.error?.message || 'Không thể xóa quy cách',
      });
    },
  });

  const toggleExpand = (productId: string) => {
    setExpandedProducts((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const handleOpenAddVariant = (productId: string) => {
    setTargetProductId(productId);
    setIsVariantDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Danh mục Sản phẩm</h1>
          <p className="text-muted-foreground">Quản lý các sản phẩm vật liệu và từng quy cách, thương hiệu, đơn vị cơ sở</p>
        </div>
        <Button onClick={() => setIsProductDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Thêm sản phẩm
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm tên, mã sản phẩm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              className="w-full sm:w-56 h-10 px-3 border border-input rounded-md bg-background text-sm"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải sản phẩm...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có sản phẩm nào phù hợp</p>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((p) => {
                const isExpanded = expandedProducts[p.id] ?? true;
                return (
                  <div key={p.id} className="border border-border rounded-lg overflow-hidden bg-card">
                    <div
                      className="p-4 bg-muted/40 flex items-center justify-between cursor-pointer hover:bg-muted/60 transition-colors"
                      onClick={() => toggleExpand(p.id)}
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-background border rounded">
                              {p.code}
                            </span>
                            <span className="font-bold text-base text-foreground">{p.name}</span>
                            <Badge variant="outline">{p.category?.name}</Badge>
                          </div>
                          {p.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAddVariant(p.id);
                          }}
                        >
                          <PackagePlus className="w-4 h-4 mr-1.5" />
                          Thêm quy cách
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Xác nhận xóa sản phẩm "${p.name}" cùng tất cả quy cách của nó?`)) {
                              deleteProductMutation.mutate(p.id);
                            }
                          }}
                          title="Xóa sản phẩm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 pt-2">
                        {p.variants.length === 0 ? (
                          <div className="py-4 text-center text-xs text-muted-foreground">
                            Chưa có quy cách/biến thể nào. Bấm "Thêm quy cách" để thiết lập đơn vị bán.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                              <thead className="text-muted-foreground border-b uppercase">
                                <tr>
                                  <th className="py-2 px-3">Tên quy cách / Biến thể</th>
                                  <th className="py-2 px-3">Thương hiệu</th>
                                  <th className="py-2 px-3">Mã SKU</th>
                                  <th className="py-2 px-3">Đơn vị cơ sở</th>
                                  <th className="py-2 px-3">Thông số kỹ thuật</th>
                                  <th className="py-2 px-3">Tồn tối thiểu</th>
                                  <th className="py-2 px-3 text-right">Xóa</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/60">
                                {p.variants.map((v) => (
                                  <tr key={v.id} className="hover:bg-muted/30">
                                    <td className="py-2.5 px-3 font-semibold text-primary">{v.name}</td>
                                    <td className="py-2.5 px-3">{v.brand?.name || '—'}</td>
                                    <td className="py-2.5 px-3 font-mono">{v.sku || '—'}</td>
                                    <td className="py-2.5 px-3 font-bold text-amber-700">
                                      {v.baseUnit?.code} ({v.baseUnit?.name})
                                    </td>
                                    <td className="py-2.5 px-3 text-muted-foreground">
                                      {v.steelSpecification ? (
                                        <span>
                                          D{v.steelSpecification.diameter} (
                                          {v.steelSpecification.weightPerBar
                                            ? `${v.steelSpecification.weightPerBar} kg/cây`
                                            : `${v.steelSpecification.weightPerMeter} kg/m`}
                                          )
                                        </span>
                                      ) : (
                                        v.specification || '—'
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3">
                                      {v.minimumStock ? `${v.minimumStock} ${v.baseUnit?.code}` : '—'}
                                    </td>
                                    <td className="py-2.5 px-3 text-right">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => {
                                          if (confirm(`Xác nhận xóa quy cách "${v.name}"?`)) {
                                            deleteVariantMutation.mutate(v.id);
                                          }
                                        }}
                                        title="Xóa quy cách"
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
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Product Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm sản phẩm mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="p-code">Mã sản phẩm *</Label>
              <Input
                id="p-code"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value.toUpperCase())}
                placeholder="VD: THEP-HOA-PHAT, XI-MANG, CAT-VANG..."
              />
            </div>
            <div>
              <Label htmlFor="p-name">Tên sản phẩm *</Label>
              <Input
                id="p-name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="VD: Thép xây dựng Hòa Phát, Xi măng đóng bao..."
              />
            </div>
            <div>
              <Label htmlFor="p-cat">Danh mục *</Label>
              <select
                id="p-cat"
                className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="p-desc">Mô tả sản phẩm</Label>
              <Input
                id="p-desc"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Ghi chú thêm về chủng loại hàng..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={() => createProductMutation.mutate()}
              disabled={!productCode.trim() || !productName.trim() || !categoryId || createProductMutation.isPending}
            >
              {createProductMutation.isPending ? 'Đang tạo...' : 'Tạo sản phẩm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Variant Dialog */}
      <Dialog open={isVariantDialogOpen} onOpenChange={setIsVariantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm quy cách / biến thể sản phẩm</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="v-name">Tên quy cách / biến thể *</Label>
              <Input
                id="v-name"
                value={variantName}
                onChange={(e) => setVariantName(e.target.value)}
                placeholder="VD: Xi măng Nghi Sơn PCB40, Thép D16 Hòa Phát..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="v-brand">Thương hiệu</Label>
                <select
                  id="v-brand"
                  className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                  value={variantBrandId}
                  onChange={(e) => setVariantBrandId(e.target.value)}
                >
                  <option value="">-- Chọn thương hiệu --</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="v-base-unit">Đơn vị cơ sở tồn kho *</Label>
                <select
                  id="v-base-unit"
                  className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                  value={variantBaseUnitId}
                  onChange={(e) => setVariantBaseUnitId(e.target.value)}
                >
                  <option value="">-- Chọn đơn vị --</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.code} ({u.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="v-sku">Mã SKU</Label>
                <Input
                  id="v-sku"
                  value={variantSku}
                  onChange={(e) => setVariantSku(e.target.value)}
                  placeholder="VD: XM-NS-PCB40"
                />
              </div>
              <div>
                <Label htmlFor="v-spec">Quy cách đóng gói</Label>
                <Input
                  id="v-spec"
                  value={variantSpec}
                  onChange={(e) => setVariantSpec(e.target.value)}
                  placeholder="VD: Bao 50kg, 11.7m, m³..."
                />
              </div>
            </div>
            <div>
              <Label htmlFor="v-min-stock">Cảnh báo tồn kho tối thiểu</Label>
              <Input
                id="v-min-stock"
                type="number"
                value={variantMinStock}
                onChange={(e) => setVariantMinStock(e.target.value)}
                placeholder="Số lượng tồn tối thiểu trước khi báo đỏ..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVariantDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={() => createVariantMutation.mutate()}
              disabled={!variantName.trim() || !variantBaseUnitId || createVariantMutation.isPending}
            >
              {createVariantMutation.isPending ? 'Đang thêm...' : 'Thêm quy cách'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
