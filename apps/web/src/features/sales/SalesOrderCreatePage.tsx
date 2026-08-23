import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/api-client';
import { getErrorMessage } from '../../lib/error-utils';
import { formatVND } from '@vlxd/shared';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../components/ui/use-toast';
import {
  Plus,
  Trash2,
  ArrowLeft,
  ShoppingCart,
  Building2,
  User,
  MapPin,
  Phone,
  Package,
  Search,
  CheckCircle2,
  Sparkles,
  Layers,
  Coins,
  AlertCircle
} from 'lucide-react';

export function SalesOrderCreatePage() {
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [projectId, setProjectId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryContactName, setDeliveryContactName] = useState('');
  const [deliveryContactPhone, setDeliveryContactPhone] = useState('');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [shippingFee, setShippingFee] = useState('0'); // Default = 0 per business rule
  const [paidAmount, setPaidAmount] = useState('0');
  const [tenderAmount, setTenderAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  const [items, setItems] = useState<
    Array<{
      productVariantId: string;
      inputQuantity: string;
      inputUnitId: string;
      unitPrice: string;
      discountAmount: string;
    }>
  >([
    {
      productVariantId: '',
      inputQuantity: '1',
      inputUnitId: '',
      unitPrice: '0',
      discountAmount: '0',
    },
  ]);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await apiClient.get('/customers');
      return res.data.data as any[];
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', customerId],
    queryFn: async () => {
      const res = await apiClient.get('/projects', {
        params: { customerId: customerId || undefined },
      });
      return res.data.data as any[];
    },
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await apiClient.get('/warehouses');
      const data = res.data.data as { id: string; name: string }[];
      if (data.length > 0 && !warehouseId) {
        setWarehouseId(data[0].id);
      }
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await apiClient.get('/products');
      return res.data.data as any[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get('/categories');
      return res.data.data as any[];
    },
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const res = await apiClient.get('/units');
      return res.data.data as { id: string; code: string; name: string }[];
    },
  });

  const { data: balances = [] } = useQuery({
    queryKey: ['inventory-balances', warehouseId],
    queryFn: async () => {
      const res = await apiClient.get('/inventory/balances', {
        params: { warehouseId: warehouseId || undefined },
      });
      return res.data.data as any[];
    },
  });

  const allVariants = products.flatMap((p) =>
    p.variants.map((v: any) => ({
      ...v,
      productName: p.name,
      categoryId: p.categoryId,
    }))
  );

  const filteredCatalogVariants = allVariants.filter((v) => {
    const matchCat = selectedCategoryFilter === 'ALL' || v.categoryId === selectedCategoryFilter;
    const matchSearch =
      !catalogSearch ||
      v.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      v.productName.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      (v.sku && v.sku.toLowerCase().includes(catalogSearch.toLowerCase()));
    return matchCat && matchSearch;
  });

  const getVariantBalance = (variantId: string) => {
    return balances.find((b) => b.productVariantId === variantId);
  };

  const handleCustomerChange = (cId: string) => {
    setCustomerId(cId);
    setProjectId('');
    const cust = customers.find((c) => c.id === cId);
    if (cust) {
      setDeliveryAddress(cust.address || '');
      setDeliveryContactName(cust.name);
      setDeliveryContactPhone(cust.phone || '');
    }
  };

  const handleProjectChange = (pId: string) => {
    setProjectId(pId);
    const proj = projects.find((p) => p.id === pId);
    if (proj) {
      if (proj.address) setDeliveryAddress(proj.address);
      if (proj.contactName) setDeliveryContactName(proj.contactName);
      if (proj.contactPhone) setDeliveryContactPhone(proj.contactPhone);
    }
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        productVariantId: '',
        inputQuantity: '1',
        inputUnitId: '',
        unitPrice: '0',
        discountAmount: '0',
      },
    ]);
  };

  const handleAddProductFromCatalog = async (variant: any) => {
    const bal = getVariantBalance(variant.id);
    const available = bal ? parseFloat(bal.availableStock || '0') : 0;
    if (variant.sku !== 'CONG-BE-DAI' && available <= 0) {
      toast({
        variant: 'destructive',
        title: 'Hết hàng trong kho',
        description: `Mặt hàng "${variant.name}" hiện có tồn khả dụng là 0. Vui lòng nhập hàng vào kho trước khi bán!`,
      });
      return;
    }

    // If empty first item, replace it; otherwise append
    const existingIndex = items.findIndex((it) => it.productVariantId === variant.id);
    if (existingIndex >= 0) {
      // Increment existing item quantity by 1 if not exceeding stock
      const currentQty = parseFloat(items[existingIndex].inputQuantity) || 0;
      if (variant.sku !== 'CONG-BE-DAI' && currentQty + 1 > available) {
        toast({
          variant: 'destructive',
          title: 'Không đủ tồn kho',
          description: `Mặt hàng "${variant.name}" chỉ còn ${available} ${bal?.baseUnitCode || ''} trong kho.`,
        });
        return;
      }
      setItems((prev) => {
        const updated = [...prev];
        updated[existingIndex].inputQuantity = String(currentQty + 1);
        return updated;
      });
      toast({ title: 'Đã tăng số lượng', description: `${variant.name} (+1)` });
      return;
    }

    const defaultUnitId = variant.steelSpecification?.saleUnitId || variant.baseUnitId;
    let initialPrice = '0';

    if (customerId) {
      try {
        const res = await apiClient.get('/sales/pricing/last-sold', {
          params: { customerId, productVariantId: variant.id },
        });
        if (res.data.data?.unitPrice) {
          initialPrice = String(res.data.data.unitPrice);
        }
      } catch {
        // ignore
      }
    }

    if (items.length === 1 && !items[0].productVariantId) {
      setItems([
        {
          productVariantId: variant.id,
          inputQuantity: '1',
          inputUnitId: defaultUnitId,
          unitPrice: initialPrice,
          discountAmount: '0',
        },
      ]);
    } else {
      setItems((prev) => [
        ...prev,
        {
          productVariantId: variant.id,
          inputQuantity: '1',
          inputUnitId: defaultUnitId,
          unitPrice: initialPrice,
          discountAmount: '0',
        },
      ]);
    }
    toast({ title: 'Đã thêm vào đơn', description: variant.name });
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, idx) => idx !== index));
    } else {
      setItems([
        {
          productVariantId: '',
          inputQuantity: '1',
          inputUnitId: '',
          unitPrice: '0',
          discountAmount: '0',
        },
      ]);
    }
  };

  const handleItemChange = async (index: number, field: string, value: string) => {
    let sanitizedValue = value;
    if (field === 'inputQuantity') {
      sanitizedValue = value.replace(/-/g, '');
      const num = parseFloat(sanitizedValue);
      if (!isNaN(num) && num < 0) sanitizedValue = '0';
    } else if (field === 'unitPrice' || field === 'discountAmount') {
      sanitizedValue = value.replace(/-/g, '');
      const num = parseInt(sanitizedValue, 10);
      if (!isNaN(num) && num < 0) sanitizedValue = '0';
    }

    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: sanitizedValue };

      if (field === 'productVariantId') {
        const variant = allVariants.find((v) => v.id === sanitizedValue);
        if (variant) {
          updated[index].inputUnitId = variant.steelSpecification?.saleUnitId || variant.baseUnitId;
        }
      }
      return updated;
    });

    if (field === 'productVariantId' && customerId && sanitizedValue) {
      try {
        const res = await apiClient.get('/sales/pricing/last-sold', {
          params: { customerId, productVariantId: sanitizedValue },
        });
        if (res.data.data?.unitPrice) {
          setItems((prev) => {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              unitPrice: String(res.data.data.unitPrice),
            };
            return updated;
          });
        }
      } catch {
        // ignore
      }
    }
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, it) => {
      const qty = parseFloat(it.inputQuantity) || 0;
      const price = parseInt(it.unitPrice, 10) || 0;
      const disc = parseInt(it.discountAmount, 10) || 0;
      return sum + Math.max(0, qty * price - disc);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const discTotal = parseInt(discountAmount, 10) || 0;
  const shipTotal = parseInt(shippingFee, 10) || 0;
  const grandTotal = Math.max(0, subtotal - discTotal + shipTotal);
  const paid = parseInt(paidAmount, 10) || 0;
  const debt = Math.max(0, grandTotal - paid);

  const handleAddBendingService = (kgAmount: number = 100) => {
    const bendingVariant = allVariants.find(
      (v) => v.sku === 'CONG-BE-DAI' || v.name.toLowerCase().includes('bẻ đai')
    );
    const kgUnit = units.find((u) => u.code === 'KG') || units[0];

    if (!bendingVariant) {
      toast({
        variant: 'destructive',
        title: 'Chưa có mục công bẻ đai',
        description: 'Vui lòng kiểm tra lại danh mục Sắt thép.',
      });
      return;
    }

    const unitId = kgUnit?.id || bendingVariant.baseUnitId;

    setItems((prev) => {
      // If single empty item
      if (prev.length === 1 && !prev[0].productVariantId) {
        return [
          {
            productVariantId: bendingVariant.id,
            inputQuantity: String(kgAmount),
            inputUnitId: unitId,
            unitPrice: '2000', // 2000d/kg
            discountAmount: '0',
          },
        ];
      }
      return [
        ...prev,
        {
          productVariantId: bendingVariant.id,
          inputQuantity: String(kgAmount),
          inputUnitId: unitId,
          unitPrice: '2000',
          discountAmount: '0',
        },
      ];
    });

    toast({
      title: 'Đã thêm công bẻ đai',
      description: `Công bẻ đai dầm/móng/cột (2.000đ/kg) - ${kgAmount} kg`,
    });
  };

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      // 1. Front-end validations with exact message
      if (!isNewCustomer && !customerId) {
        throw new Error('Vui lòng chọn khách hàng mua hàng (hoặc chọn + Khách mới).');
      }
      if (isNewCustomer && !newCustomerName.trim()) {
        throw new Error('Vui lòng nhập họ tên khách hàng mới.');
      }
      if (!warehouseId) {
        throw new Error('Vui lòng chọn kho xuất hàng.');
      }

      const validItems = items.filter((it) => it.productVariantId);
      if (validItems.length === 0) {
        throw new Error('Đơn hàng chưa có mặt hàng nào. Vui lòng chọn ít nhất 1 mặt hàng.');
      }

      for (let i = 0; i < validItems.length; i++) {
        const it = validItems[i];
        const qty = parseFloat(it.inputQuantity);
        if (isNaN(qty) || qty <= 0) {
          throw new Error(`Số lượng ở dòng ${i + 1} phải lớn hơn 0.`);
        }
        if (!it.inputUnitId) {
          throw new Error(`Chưa chọn đơn vị tính cho mặt hàng ở dòng ${i + 1}.`);
        }
        const price = parseInt(it.unitPrice, 10);
        if (isNaN(price) || price < 0) {
          throw new Error(`Đơn giá ở dòng ${i + 1} không được âm.`);
        }

        const variant = allVariants.find((v) => v.id === it.productVariantId);
        if (variant && variant.sku !== 'CONG-BE-DAI') {
          const bal = getVariantBalance(it.productVariantId);
          const avail = bal ? parseFloat(bal.availableStock || '0') : 0;
          if (avail <= 0) {
            throw new Error(`Mặt hàng "${variant.name}" ở dòng ${i + 1} hiện đã hết hàng trong kho (Tồn: 0). Không thể tạo đơn.`);
          }
          if (qty > avail) {
            throw new Error(`Mặt hàng "${variant.name}" ở dòng ${i + 1} không đủ tồn kho (Khả dụng: ${avail} ${bal?.baseUnitCode || ''}, Yêu cầu: ${qty}).`);
          }
        }
      }

      let finalCustomerId = customerId;
      if (isNewCustomer) {
        const custRes = await apiClient.post('/customers', {
          name: newCustomerName.trim(),
          phone: newCustomerPhone.trim() || undefined,
          address: newCustomerAddress.trim() || undefined,
          customerType: 'RETAIL',
        });
        finalCustomerId = custRes.data.data.id;
        queryClient.invalidateQueries({ queryKey: ['customers'] });
      }

      return apiClient.post('/sales/orders', {
        customerId: finalCustomerId,
        projectId: projectId || undefined,
        warehouseId,
        orderDate,
        deliveryAddress: (isNewCustomer ? newCustomerAddress : deliveryAddress) || undefined,
        deliveryContactName: (isNewCustomer ? newCustomerName : deliveryContactName) || undefined,
        deliveryContactPhone: (isNewCustomer ? newCustomerPhone : deliveryContactPhone) || undefined,
        discountAmount: discTotal,
        shippingFee: shipTotal,
        paidAmount: paid,
        notes: notes || undefined,
        items: validItems.map((it) => ({
          productVariantId: it.productVariantId,
          inputQuantity: parseFloat(it.inputQuantity),
          inputUnitId: it.inputUnitId,
          unitPrice: parseInt(it.unitPrice, 10),
          discountAmount: parseInt(it.discountAmount, 10) || 0,
        })),
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      toast({ title: 'Tạo đơn thành công', description: 'Đơn bán hàng đã được tạo ở trạng thái Nháp' });
      navigate(`/don-hang/${res.data.data.id}`);
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi tạo đơn hàng',
        description: getErrorMessage(err, 'Không thể tạo đơn hàng. Vui lòng kiểm tra lại dữ liệu.'),
      });
    },
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/don-hang')} className="h-9 px-3">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-primary" />
              Lên Đơn Bán Hàng & POS Nhanh
            </h1>
            <p className="text-xs text-muted-foreground">
              Bán buôn, bán lẻ, thợ xây & công trình — Tự động quy đổi thép (cây $\leftrightarrow$ kg), giá vốn snapshot
            </p>
          </div>
        </div>
      </div>

      {/* Main 2-Column POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Quick Catalog & Order Info */}
        <div className="lg:col-span-7 space-y-5">
          {/* Customer & Warehouse Header Card */}
          <Card className="rounded-xl border border-border/80 shadow-sm">
            <CardHeader className="py-3 px-4 border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="w-4 h-4 text-primary" /> Khách hàng & Công trình giao
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant={!isNewCustomer ? 'default' : 'outline'}
                  size="sm"
                  className="h-6 text-[11px] px-2.5"
                  onClick={() => setIsNewCustomer(false)}
                >
                  Khách có sẵn
                </Button>
                <Button
                  type="button"
                  variant={isNewCustomer ? 'default' : 'outline'}
                  size="sm"
                  className="h-6 text-[11px] px-2.5 text-primary"
                  onClick={() => setIsNewCustomer(true)}
                >
                  + Khách mới
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {!isNewCustomer ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="so-cust" className="text-xs font-bold">Khách hàng / Thợ xây *</Label>
                    <select
                      id="so-cust"
                      className="w-full h-9 px-3 border border-input rounded-lg bg-background text-xs font-medium mt-1 focus:ring-1 focus:ring-primary"
                      value={customerId}
                      onChange={(e) => handleCustomerChange(e.target.value)}
                    >
                      <option value="">-- Chọn khách hàng --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.phone ? `(${c.phone})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="so-proj" className="text-xs font-bold">Công trình xây dựng</Label>
                    <select
                      id="so-proj"
                      className="w-full h-9 px-3 border border-input rounded-lg bg-background text-xs mt-1"
                      value={projectId}
                      onChange={(e) => handleProjectChange(e.target.value)}
                      disabled={!customerId}
                    >
                      <option value="">-- Chọn công trình (nếu có) --</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-bold text-primary">Tên khách hàng mới *</Label>
                      <Input
                        placeholder="VD: Anh Hải (Thợ xây)"
                        className="h-8 text-xs bg-background mt-1"
                        value={newCustomerName}
                        onChange={(e) => {
                          setNewCustomerName(e.target.value);
                          setDeliveryContactName(e.target.value);
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold">Số điện thoại liên hệ</Label>
                      <Input
                        placeholder="098..."
                        className="h-8 text-xs bg-background mt-1"
                        value={newCustomerPhone}
                        onChange={(e) => {
                          setNewCustomerPhone(e.target.value);
                          setDeliveryContactPhone(e.target.value);
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground font-semibold">Địa chỉ giao hàng / Công trình</Label>
                    <Input
                      placeholder="Thôn, Xã, Huyện..."
                      className="h-8 text-xs bg-background mt-1"
                      value={newCustomerAddress}
                      onChange={(e) => {
                        setNewCustomerAddress(e.target.value);
                        setDeliveryAddress(e.target.value);
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <Label htmlFor="so-wh" className="text-xs font-bold">Kho xuất hàng</Label>
                  <Input
                    id="so-wh"
                    value={warehouses.find((w) => w.id === warehouseId)?.name || warehouses[0]?.name || 'Kho Tổng VLXD'}
                    disabled
                    className="h-9 text-xs mt-1 bg-muted font-medium text-foreground"
                  />
                </div>

                <div>
                  <Label htmlFor="so-date" className="text-xs font-bold">Ngày đặt hàng *</Label>
                  <Input
                    id="so-date"
                    type="date"
                    className="h-9 text-xs mt-1"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Product Catalog Selector */}
          <Card className="rounded-xl border border-border/80 shadow-sm overflow-hidden">
            <CardHeader className="py-3 px-4 border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Chọn nhanh mặt hàng (1-Click Add)
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 text-[11px] font-bold px-2 bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                  onClick={() => handleAddBendingService(100)}
                  title="Thêm công bẻ đai dầm/móng/cột sắt 6 & 8 (2.000đ/kg)"
                >
                  + Công bẻ đai (2.000đ/kg)
                </Button>
              </div>
              <div className="relative w-44">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-muted-foreground" />
                <Input
                  className="h-7 text-xs pl-8 pr-2"
                  placeholder="Tìm D10, Xi măng, Cát..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-3 space-y-3">
              {/* Category Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  size="sm"
                  variant={selectedCategoryFilter === 'ALL' ? 'default' : 'outline'}
                  className="h-7 text-[11px] px-2.5 rounded-full"
                  onClick={() => setSelectedCategoryFilter('ALL')}
                >
                  Tất cả ({allVariants.length})
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    size="sm"
                    variant={selectedCategoryFilter === cat.id ? 'default' : 'outline'}
                    className="h-7 text-[11px] px-2.5 rounded-full"
                    onClick={() => setSelectedCategoryFilter(cat.id)}
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>

              {/* Product Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                {filteredCatalogVariants.map((v) => {
                  const bal = getVariantBalance(v.id);
                  const available = bal ? parseFloat(bal.availableStock || '0') : 0;
                  const isService = v.sku === 'CONG-BE-DAI';
                  const isOutOfStock = !isService && available <= 0;

                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleAddProductFromCatalog(v)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between group shadow-2xs ${
                        isOutOfStock
                          ? 'border-rose-200 bg-rose-50/40 opacity-85 hover:border-rose-300'
                          : 'border-border/80 bg-card hover:bg-primary/5 hover:border-primary/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-foreground group-hover:text-primary block truncate">
                            {v.name}
                          </span>
                          {isOutOfStock && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-rose-100 text-rose-700 border-rose-300 font-bold shrink-0">
                              Hết hàng
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground block truncate">
                          {v.productName}
                        </span>
                      </div>
                      <div className="mt-2 pt-1 border-t border-border/40 flex items-center justify-between text-[10px]">
                        <span className={`font-semibold truncate font-mono ${isOutOfStock ? 'text-rose-600 font-bold' : 'text-blue-700'}`}>
                          {isService ? 'Dịch vụ' : bal?.steelCalculation ? bal.steelCalculation.formattedStock : `Tồn: ${available} ${bal?.baseUnitCode || ''}`}
                        </span>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isOutOfStock ? 'bg-rose-100 text-rose-600' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                        }`}>
                          +
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Line Items Table */}
          <Card className="rounded-xl border border-border/80 shadow-sm">
            <CardHeader className="py-3 px-4 border-b border-border/50 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-primary" /> Chi tiết đơn hàng ({items.filter(it => it.productVariantId).length} mục)
              </CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="h-7 text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" /> Thêm dòng
              </Button>
            </CardHeader>
            <CardContent className="p-3 space-y-3">
              {items.map((item, index) => {
                const bal = getVariantBalance(item.productVariantId);
                const qty = parseFloat(item.inputQuantity) || 0;
                const price = parseInt(item.unitPrice, 10) || 0;
                const disc = parseInt(item.discountAmount, 10) || 0;
                const lineTotal = Math.max(0, qty * price - disc);

                const variant = allVariants.find((v: any) => v.id === item.productVariantId);
                const isService = variant?.sku === 'CONG-BE-DAI';
                const availableStock = bal ? parseFloat(bal.availableStock || '0') : 0;
                const isOutOfStock = !isService && !!item.productVariantId && availableStock <= 0;
                const isInsufficient = !isService && !!item.productVariantId && availableStock > 0 && qty > availableStock;

                return (
                  <div
                    key={index}
                    className={`p-3 rounded-xl border space-y-2 transition-colors shadow-2xs ${
                      isOutOfStock || isInsufficient ? 'border-rose-300 bg-rose-50/20' : 'border-border/90 bg-card hover:border-primary/30'
                    }`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-5">
                        <Label className="text-[11px] text-muted-foreground">Mặt hàng *</Label>
                        <select
                          className="w-full h-8 px-2 border border-input rounded bg-background text-xs font-medium mt-0.5"
                          value={item.productVariantId}
                          onChange={(e) => handleItemChange(index, 'productVariantId', e.target.value)}
                        >
                          <option value="">-- Chọn mặt hàng --</option>
                          {allVariants.map((v: any) => (
                            <option key={v.id} value={v.id}>
                              {v.name} ({v.productName})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <Label className="text-[11px] text-muted-foreground">Số lượng</Label>
                        <Input
                          type="number"
                          min="0.0001"
                          step="any"
                          className={`h-8 text-xs font-bold text-center mt-0.5 ${isOutOfStock || isInsufficient ? 'border-rose-400 text-rose-700 bg-rose-50' : ''}`}
                          value={item.inputQuantity}
                          onChange={(e) => handleItemChange(index, 'inputQuantity', e.target.value)}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <Label className="text-[11px] text-muted-foreground">Đơn vị bán</Label>
                        <select
                          className="w-full h-8 px-2 border border-input rounded bg-background text-xs mt-0.5"
                          value={item.inputUnitId}
                          onChange={(e) => handleItemChange(index, 'inputUnitId', e.target.value)}
                        >
                          <option value="">-- Đơn vị --</option>
                          {units.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.code} ({u.name})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <Label className="text-[11px] text-muted-foreground">Đơn giá bán</Label>
                        <Input
                          type="number"
                          min="0"
                          className="h-8 text-xs font-mono font-bold text-primary text-right mt-0.5"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        />
                      </div>

                      <div className="sm:col-span-1 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive mt-3"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Stock warning notification banner if out of stock */}
                    {isOutOfStock && (
                      <div className="text-[11px] text-rose-700 font-bold bg-rose-100/70 border border-rose-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Mặt hàng này hiện đã hết hàng trong kho (Tồn: 0). Không thể tạo đơn bán!</span>
                      </div>
                    )}
                    {isInsufficient && (
                      <div className="text-[11px] text-amber-800 font-bold bg-amber-100/70 border border-amber-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>Kho không đủ hàng (Khả dụng: {bal?.steelCalculation ? bal.steelCalculation.formattedStock : `${availableStock} ${bal?.baseUnitCode || ''}`}, Yêu cầu: {qty}). Vui lòng nhập hàng trước!</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between text-xs pt-1.5 border-t border-border/50 text-muted-foreground">
                      <div>
                        {bal ? (
                          <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${
                            availableStock <= 0 ? 'text-rose-700 bg-rose-50 border-rose-200 font-bold' : 'text-blue-700 bg-blue-50 border-blue-100'
                          }`}>
                            {isService
                              ? 'Dịch vụ gia công'
                              : bal.steelCalculation
                              ? `Tồn kho: ${bal.steelCalculation.formattedStock}`
                              : `Tồn kho: ${bal.availableStock} ${bal.baseUnitCode}`}
                          </span>
                        ) : (
                          <span className="text-[10px] italic">Chưa chọn mặt hàng</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px]">Thành tiền:</span>
                        <span className="font-mono font-bold text-xs text-foreground">
                          {formatVND(lineTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right 5 Cols: Invoice Total & Fast POS Cash Tender */}
        <div className="lg:col-span-5 space-y-5">
          <Card className="rounded-xl border border-border/80 shadow-md sticky top-20 bg-card">
            <CardHeader className="py-3 px-5 border-b border-border/50 bg-gradient-to-r from-muted/50 to-muted/20">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>Tổng hợp Thanh toán</span>
                <Badge variant="outline" className="font-mono text-xs bg-primary/10 text-primary border-primary/20">
                  {items.filter(it => it.productVariantId).length} món
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Tiền hàng:</span>
                  <span className="font-mono font-bold text-sm text-foreground">{formatVND(subtotal)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Chiết khấu đơn:</span>
                  <Input
                    type="number"
                    min="0"
                    className="w-32 h-8 text-right font-mono text-xs font-semibold"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value.replace(/-/g, ''))}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Phí vận chuyển:</span>
                  <Input
                    type="number"
                    min="0"
                    className="w-32 h-8 text-right font-mono text-xs font-semibold"
                    value={shippingFee}
                    onChange={(e) => setShippingFee(e.target.value.replace(/-/g, ''))}
                  />
                </div>

                {/* Grand Total Highlight */}
                <div className="flex justify-between items-center pt-3 border-t border-border font-black text-base text-primary">
                  <span>Tổng thanh toán:</span>
                  <span className="font-mono text-lg text-primary">{formatVND(grandTotal)}</span>
                </div>

                {/* Customer Paid Input & Quick Cash Buttons */}
                <div className="pt-2 border-t border-border space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground">Khách thanh toán:</span>
                    <Input
                      type="number"
                      min="0"
                      className="w-36 h-9 text-right font-mono text-sm text-emerald-700 font-extrabold"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value.replace(/-/g, ''))}
                    />
                  </div>

                  {/* Fast Tender Preset Buttons */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] font-mono px-1 font-bold"
                      onClick={() => setPaidAmount(String(grandTotal))}
                    >
                      Trả đủ
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] font-mono px-1"
                      onClick={() => setPaidAmount(String((parseInt(paidAmount, 10) || 0) + 100000))}
                    >
                      +100k
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] font-mono px-1"
                      onClick={() => setPaidAmount(String((parseInt(paidAmount, 10) || 0) + 200000))}
                    >
                      +200k
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] font-mono px-1"
                      onClick={() => setPaidAmount(String((parseInt(paidAmount, 10) || 0) + 500000))}
                    >
                      +500k
                    </Button>
                  </div>

                  {/* Tender & Change Calculation */}
                  {parseInt(paidAmount, 10) > 0 && (
                    <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-900 font-semibold text-[11px] flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5 text-emerald-600" /> Tiền khách đưa:
                        </span>
                        <Input
                          type="number"
                          min="0"
                          placeholder="VD: 500000"
                          className="w-32 h-7 text-right font-mono text-xs font-bold"
                          value={tenderAmount}
                          onChange={(e) => setTenderAmount(e.target.value.replace(/-/g, ''))}
                        />
                      </div>
                      {parseInt(tenderAmount, 10) >= parseInt(paidAmount, 10) && (
                        <div className="flex justify-between items-center pt-1.5 border-t border-emerald-200 font-extrabold text-xs text-emerald-800">
                          <span>Tiền thừa thối khách:</span>
                          <span className="font-mono text-sm text-emerald-700">
                            {formatVND(parseInt(tenderAmount, 10) - parseInt(paidAmount, 10))}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Debt Summary */}
                  <div className="flex justify-between items-center pt-1 text-xs font-bold">
                    <span className="text-rose-600">Ghi nợ đơn hàng:</span>
                    <span className="font-mono text-rose-600 text-sm">{formatVND(debt)}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="so-notes" className="text-xs font-semibold">Ghi chú giao nhận</Label>
                <Input
                  id="so-notes"
                  className="h-8 text-xs mt-1"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Giao sáng sớm, gọi trước 15p..."
                />
              </div>

              {items.some((it) => {
                if (!it.productVariantId) return false;
                const v = allVariants.find((varItem: any) => varItem.id === it.productVariantId);
                if (v?.sku === 'CONG-BE-DAI') return false;
                const bal = getVariantBalance(it.productVariantId);
                const avail = bal ? parseFloat(bal.availableStock || '0') : 0;
                const qty = parseFloat(it.inputQuantity) || 0;
                return avail <= 0 || qty > avail || qty <= 0;
              }) && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Có mặt hàng không đủ tồn kho hoặc số lượng không hợp lệ. Vui lòng kiểm tra lại.</span>
                </div>
              )}

              <Button
                className="w-full h-11 text-sm font-extrabold bg-primary hover:brightness-105 shadow-md transition-all gap-2"
                onClick={() => createOrderMutation.mutate()}
                disabled={
                  (!isNewCustomer && !customerId) ||
                  (isNewCustomer && !newCustomerName.trim()) ||
                  !warehouseId ||
                  items.filter((it) => it.productVariantId).length === 0 ||
                  items.some((it) => {
                    if (!it.productVariantId) return false;
                    const v = allVariants.find((varItem: any) => varItem.id === it.productVariantId);
                    if (v?.sku === 'CONG-BE-DAI') return false;
                    const bal = getVariantBalance(it.productVariantId);
                    const avail = bal ? parseFloat(bal.availableStock || '0') : 0;
                    const qty = parseFloat(it.inputQuantity) || 0;
                    return avail <= 0 || qty > avail || qty <= 0;
                  }) ||
                  createOrderMutation.isPending
                }
              >
                <CheckCircle2 className="w-4 h-4" />
                {createOrderMutation.isPending ? 'Đang lưu đơn...' : 'Lưu Đơn Bán Hàng'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
