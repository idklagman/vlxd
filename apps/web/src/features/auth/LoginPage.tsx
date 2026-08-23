import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../lib/api-client';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../components/ui/use-toast';
import { getErrorMessage } from '../../lib/error-utils';
import { 
  Building2, Lock, User, Eye, EyeOff, ShieldCheck, 
  Sparkles, CheckCircle2, ArrowRight, Compass,
  MapPin, Phone, Check
} from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(1, 'Vui lòng nhập tên đăng nhập'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  // Fetch dynamic store information from public settings endpoint
  const { data: settings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: async () => {
      const res = await apiClient.get('/settings/public');
      return res.data.data;
    },
  });

  const storeName = settings?.storeName || 'Cửa hàng VLXD Ton Thủy';
  const storeAddress = settings?.storeAddress || 'Yên Vỹ, Tam Giang, Bắc Ninh';
  const storePhone = settings?.storePhone || '0987593703';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: 'admin',
      password: 'admin123',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      toast({
        title: 'Đăng nhập thành công',
        description: `Chào mừng bạn đến với hệ thống quản lý ${storeName}.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Đăng nhập không thành công',
        description: getErrorMessage(error, 'Tên đăng nhập hoặc mật khẩu không chính xác.'),
      });
    }
  };

  const handleQuickFill = () => {
    setValue('username', 'admin');
    setValue('password', 'admin123');
    toast({
      title: 'Đã điền tài khoản',
      description: 'admin / admin123 (Chủ cửa hàng & Quản trị)',
    });
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950 font-sans">
      {/* LEFT COLUMN: Vivid Construction & Architecture Visual Showcase (Hidden on Mobile, Visible on LG screens) */}
      <div className="hidden lg:flex lg:w-7/12 relative flex-col justify-between p-10 xl:p-12 overflow-hidden bg-slate-900 border-r border-slate-800/80">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Blueprint subtle grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(90deg, #f59e0b 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Top Header: Dynamic Store Name & Address */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/25 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl xl:text-2xl tracking-tight text-white uppercase">
                  {storeName}
                </span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-400/40 text-amber-400 bg-amber-500/10 font-mono font-bold">
                  PRO
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                <MapPin className="w-3 h-3 text-amber-400/80 shrink-0" />
                <span className="truncate max-w-md">{storeAddress}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Hệ thống trực tuyến</span>
          </div>
        </div>

        {/* Center: Vivid Architectural & Construction Visual Gallery */}
        <div className="relative z-10 my-auto py-6 space-y-4 max-w-2xl">
          {/* Main Big Architectural Hero Card */}
          <div className="relative h-64 xl:h-72 rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl group">
            <img
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1400&auto=format&fit=crop"
              alt="Thiết kế nhà phố & Biệt thự hiện đại"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />
            
            {/* Overlay badge & details */}
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/90 text-slate-950 text-[11px] font-extrabold shadow-sm">
                  <span>Thiết kế & Thi công Nhà phố, Biệt thự</span>
                </div>
                <p className="text-sm font-semibold text-white drop-shadow-md">
                  Vật liệu xây dựng cao cấp • Sắt thép, Xi măng, Gạch đá cát sỏi
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700 text-xs font-mono text-emerald-400 font-bold">
                <Check className="w-3.5 h-3.5" />
                <span>Kho bãi sẵn sàng</span>
              </div>
            </div>
          </div>

          {/* 3 Secondary Image Cards Grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Card 1: Steel & Heavy Materials */}
            <div className="relative h-32 rounded-xl overflow-hidden border border-slate-800 shadow-md group">
              <img
                src="https://images.unsplash.com/photo-1541888946425-d0fbb186156a?q=80&w=600&auto=format&fit=crop"
                alt="Công trình xây dựng & Kết cấu thép"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
              <div className="absolute bottom-2 left-2.5 right-2.5">
                <span className="text-[11px] font-bold text-white block truncate">
                  Sắt thép & Kết cấu
                </span>
                <span className="text-[10px] text-amber-300 font-medium block truncate">
                  Hòa Phát • Barem chuẩn
                </span>
              </div>
            </div>

            {/* Card 2: Logistics & Trucks */}
            <div className="relative h-32 rounded-xl overflow-hidden border border-slate-800 shadow-md group">
              <img
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=600&auto=format&fit=crop"
                alt="Đội xe tải giao hàng tận nơi"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
              <div className="absolute bottom-2 left-2.5 right-2.5">
                <span className="text-[11px] font-bold text-white block truncate">
                  Đội xe tải & Xe ben
                </span>
                <span className="text-[10px] text-emerald-300 font-medium block truncate">
                  Giao tận chân công trình
                </span>
              </div>
            </div>

            {/* Card 3: Architecture & Blueprints */}
            <div className="relative h-32 rounded-xl overflow-hidden border border-slate-800 shadow-md group">
              <img
                src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=600&auto=format&fit=crop"
                alt="Bản vẽ thiết kế & Dự toán công trình"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
              <div className="absolute bottom-2 left-2.5 right-2.5">
                <span className="text-[11px] font-bold text-white block truncate">
                  Bản vẽ & Dự toán
                </span>
                <span className="text-[10px] text-blue-300 font-medium block truncate">
                  Nhà thầu & Thợ xây
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Hotline & Security */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-5 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Hệ thống Quản lý Bán hàng & Tồn kho Bất biến</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-amber-400 font-bold">
            <Phone className="w-3.5 h-3.5" />
            <span>Hotline: {storePhone}</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Modern Floating Login Form (Full width on Mobile) */}
      <div className="w-full lg:w-5/12 flex flex-col justify-between p-6 sm:p-10 lg:p-12 bg-slate-950 relative overflow-y-auto">
        {/* Mobile Header Brand (Visible on mobile only, dynamic store name) */}
        <div className="lg:hidden flex items-center justify-between pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 truncate">
              <div className="font-extrabold text-base text-white flex items-center gap-1.5 truncate">
                <span className="truncate uppercase">{storeName}</span>
                <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-400/40 text-amber-400 bg-amber-500/10 shrink-0">
                  PRO
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400 truncate">{storeAddress}</p>
            </div>
          </div>
        </div>

        {/* Center Form Card */}
        <div className="my-auto py-8 sm:py-12 max-w-md w-full mx-auto space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-400/10 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5" />
              <span>Cổng đăng nhập hệ thống</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Đăng nhập Quản trị
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Vui lòng nhập tài khoản quản lý cửa hàng để tiếp tục
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Username Field */}
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span>Tên đăng nhập</span>
                <span className="text-[11px] text-slate-500 font-normal">Mặc định: admin</span>
              </Label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <Input
                  id="username"
                  {...register('username')}
                  placeholder="admin"
                  autoComplete="username"
                  className="h-11 pl-10 bg-slate-900/90 border-slate-800 text-white placeholder:text-slate-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-sm"
                />
              </div>
              {errors.username && (
                <p className="text-xs text-rose-400 font-medium">{errors.username.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold text-slate-200">
                  Mật khẩu
                </Label>
                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  Điền nhanh mẫu
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="admin123"
                  autoComplete="current-password"
                  className="h-11 pl-10 pr-10 bg-slate-900/90 border-slate-800 text-white placeholder:text-slate-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 p-0.5 rounded touch-manipulation cursor-pointer"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-rose-400 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 text-sm font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 rounded-xl transition-all gap-2 touch-manipulation active:scale-[0.98] mt-2 cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Đang xác thực hệ thống...</span>
                </>
              ) : (
                <>
                  <span>Đăng Nhập Quản Trị</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>

            {/* Fast Preset Box */}
            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs text-slate-400 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Tài khoản Quản trị:
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleQuickFill}
                  className="h-6 text-[11px] px-2 text-amber-400 hover:bg-amber-400/10"
                >
                  Tự động điền
                </Button>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px] bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                <span>User: <strong className="text-white">admin</strong></span>
                <span>Pass: <strong className="text-white">admin123</strong></span>
              </div>
            </div>
          </form>
        </div>

        {/* Footer info (Dynamic store name) */}
        <div className="pt-6 border-t border-slate-800/80 text-center text-xs text-slate-500 space-y-1">
          <p>© 2026 {storeName}. Bản quyền hệ thống VLXD PRO.</p>
          <p className="text-[11px] text-slate-600">Được tối ưu cho cả máy tính POS bán lẻ và điện thoại thông minh</p>
        </div>
      </div>
    </div>
  );
}