import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { getErrorMessage } from '../../lib/error-utils';
import { useToast } from '../../components/ui/use-toast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { QrCode, Building, CreditCard, Store } from 'lucide-react';

export function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      storeName: 'Cửa hàng VLXD',
      storePhone: '0987654321',
      storeAddress: 'Hương Sơn, Mỹ Đức, Hà Nội',
      bankName: 'VietinBank',
      bankAccount: '12283456',
      bankAccountName: 'NGUYEN VAN CHU',
    },
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await apiClient.get('/settings');
      const data = res.data.data || res.data;
      reset(data);
      return data;
    },
  });

  const bankAccount = watch('bankAccount') || '12283456';
  const bankName = watch('bankName') || 'VietinBank';
  const bankAccountName = watch('bankAccountName') || 'NGUYEN VAN CHU';

  const mutation = useMutation({
    mutationFn: (data: any) => apiClient.put('/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: 'Thành công',
        description: 'Đã lưu cài đặt cửa hàng và tài khoản ngân hàng VietinBank.',
      });
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Lỗi lưu cài đặt',
        description: getErrorMessage(err, 'Không thể lưu cài đặt cửa hàng. Vui lòng kiểm tra lại.'),
      });
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  const qrUrl = `https://img.vietqr.io/image/vietinbank-${bankAccount}-compact2.png?accountName=${encodeURIComponent(
    bankAccountName
  )}`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cài đặt Hệ thống & Tài khoản Ngân hàng</h1>
        <p className="text-muted-foreground text-sm">
          Thông tin cửa hàng, tài khoản nhận tiền chuyển khoản và mã QR VietQR tự động in trên phiếu giao hàng & phiếu thu.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Store className="w-4 h-4 text-primary" />
                  Thông tin Cửa hàng VLXD
                </CardTitle>
                <CardDescription>Xuất hiện trên tiêu đề hóa đơn, phiếu giao hàng và phiếu thu</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="s-name">Tên cửa hàng *</Label>
                    <Input id="s-name" {...register('storeName')} placeholder="VD: Cửa hàng VLXD Hùng Phát" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="s-phone">Số điện thoại Hotline *</Label>
                    <Input id="s-phone" {...register('storePhone')} placeholder="0987654321" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="s-addr">Địa chỉ cửa hàng / Bãi tập kết *</Label>
                    <Input id="s-addr" {...register('storeAddress')} placeholder="Hương Sơn, Mỹ Đức, Hà Nội" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  Tài khoản Ngân hàng Nhận tiền (VietQR)
                </CardTitle>
                <CardDescription>Dùng để tự động tạo mã QR trên phiếu giao hàng và phiếu thu</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="b-name">Tên ngân hàng</Label>
                    <Input id="b-name" {...register('bankName')} defaultValue="VietinBank" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="b-acc">Số tài khoản (STK) *</Label>
                    <Input
                      id="b-acc"
                      {...register('bankAccount')}
                      className="font-mono font-bold text-primary"
                      placeholder="12283456"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="b-acc-name">Chủ tài khoản (Không dấu) *</Label>
                    <Input
                      id="b-acc-name"
                      {...register('bankAccountName')}
                      className="font-semibold uppercase"
                      placeholder="NGUYEN VAN CHU"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Live VietQR Preview */}
          <div className="space-y-4">
            <Card className="border-primary/30 shadow-md">
              <CardHeader className="pb-2 text-center bg-muted/20">
                <CardTitle className="text-sm font-bold flex items-center justify-center gap-1.5 text-primary">
                  <QrCode className="w-4 h-4" />
                  Mã VietQR Thanh Toán
                </CardTitle>
                <CardDescription className="text-xs">Mã QR VietinBank in trên phiếu giao hàng</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col items-center text-center space-y-3">
                <div className="p-2 bg-white rounded-xl border border-border shadow-xs">
                  <img
                    src={qrUrl}
                    alt="VietinBank VietQR"
                    className="w-48 h-48 object-contain rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-sm text-foreground">{bankName}</p>
                  <p className="font-mono font-extrabold text-base text-primary">{bankAccount}</p>
                  <p className="text-muted-foreground uppercase font-medium">{bankAccountName}</p>
                </div>
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-800 text-left">
                  💡 Mã QR này sẽ tự động đính kèm số tiền còn nợ và mã đơn hàng khi in Phiếu giao hàng / Phiếu thu.
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" className="w-full h-10 font-bold" disabled={mutation.isPending}>
                {mutation.isPending ? 'Đang lưu...' : 'Lưu tất cả Cài đặt'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}