import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../components/ui/use-toast';
import { getErrorMessage } from '../../lib/error-utils';
import { 
  Building2, Lock, User, Eye, EyeOff, ShieldCheck, 
  Truck, Layers, Sparkles, CheckCircle2, ArrowRight,
  HardHat, Ruler, Wallet, Compass
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
        description: 'Chào mừng bạn đến với hệ thống quản lý VLXD PRO.',
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
      {/* LEFT COLUMN: Construction & Architecture Hero Showcase (Hidden on Mobile, Visible on LG screens) */}
      <div className="hidden lg:flex lg:w-7/12 relative flex-col justify-between p-12 overflow-hidden bg-slate-900 border-r border-slate-800/80">
        {/* Background Architectural Overlay Image & Gradient Glows */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity scale-105 transition-transform duration-1000"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1541888946425-d0fbb186156a?q=80&w=1600&auto=format&fit=crop')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/80 to-amber-950/30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Blueprint decorative grid */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(90deg, #f59e0b 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Top Branding */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">VLXD TON THỦY</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-400/40 text-amber-400 bg-amber-500/10 font-mono font-bold">
                  PRO v2.0
                </Badge>
              </div>
              <p className="text-xs text-slate-400 font-medium">Hệ Thống Quản Trị Cửa Hàng Vật Liệu Xây Dựng</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-full backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Tam Giang, Bắc Ninh</span>
          </div>
        </div>

        {/* Center Slogan & Value Propositions */}
        <div className="relative z-10 my-auto py-12 max-w-xl space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              <HardHat className="w-3.5 h-3.5" />
              <span>Chuyên biệt cho Cửa hàng Vật liệu & Nhà thầu</span>
            </div>
            
            <h1 className="text-4xl xl:text-5xl font-black tracking-tight text-white leading-[1.15]">
              Vững Bền <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">Nền Móng</span>,
              <br />
              Vươn Tầm <span className="text-amber-400">Công Trình</span>.
            </h1>
            
            <p className="text-sm xl:text-base text-slate-300 leading-relaxed font-normal">
              Giải pháp số hóa toàn diện từ quản lý barem sắt thép, cát đá xi măng, xuất nhập tồn kho thực tế đến sổ nợ thợ xây và dòng tiền công trình minh bạch.
            </p>
          </div>

          {/* 4 Feature Highlights */}
          <div className="grid grid-cols-2 gap-3.5 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md space-y-1.5 hover:border-amber-500/40 transition-colors">
              <div className="flex items-center gap-2 text-amber-400">
                <Ruler className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Barem Thép Tự Động</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Quy đổi linh hoạt Cây $\leftrightarrow$ Kg, tính nhanh công bẻ đai dầm móng.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md space-y-1.5 hover:border-amber-500/40 transition-colors">
              <div className="flex items-center gap-2 text-blue-400">
                <Layers className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Sổ Cái Kho Bất Biến</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Kiểm soát tồn khả dụng thời gian thực, chặn bán khi hết hàng.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md space-y-1.5 hover:border-amber-500/40 transition-colors">
              <div className="flex items-center gap-2 text-emerald-400">
                <Wallet className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Sổ Nợ Thợ & VietQR</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                In phiếu giao hàng, hóa đơn tự động kèm mã QR VietinBank 12283456.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md space-y-1.5 hover:border-amber-500/40 transition-colors">
              <div className="flex items-center gap-2 text-purple-400">
                <Truck className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Điều Phối Đội Xe</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Phân bổ xe tải, xe ben, quản lý tài xế và chi phí xăng dầu công trình.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Trust & Security Banner */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-6 border-t border-slate-800/60">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Bảo mật dữ liệu sổ sách & Snapshot giá vốn tức thời</span>
          </div>
          <span className="font-mono text-slate-500">Hotline: 0987.593.703</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Modern Floating Login Form (Full width on Mobile) */}
      <div className="w-full lg:w-5/12 flex flex-col justify-between p-6 sm:p-10 lg:p-12 bg-slate-950 relative overflow-y-auto">
        {/* Mobile Header Brand (Visible on mobile only) */}
        <div className="lg:hidden flex items-center justify-between pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-base text-white flex items-center gap-1.5">
                VLXD TON THỦY
                <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-400/40 text-amber-400 bg-amber-500/10">
                  PRO
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400">Yên Vỹ, Tam Giang, Bắc Ninh</p>
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

        {/* Footer info */}
        <div className="pt-6 border-t border-slate-800/80 text-center text-xs text-slate-500 space-y-1">
          <p>© 2026 Cửa Hàng VLXD Ton Thủy. Bản quyền hệ thống VLXD PRO.</p>
          <p className="text-[11px] text-slate-600">Được tối ưu cho cả máy tính POS bán lẻ và điện thoại thông minh</p>
        </div>
      </div>
    </div>
  );
}