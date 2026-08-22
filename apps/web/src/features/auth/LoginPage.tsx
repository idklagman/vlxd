import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useToast } from '../../components/ui/use-toast';
import { vi } from '../../locales/vi';
import { Building2 } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(1, 'Tên đăng nhập không được để trống'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
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
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Đăng nhập thất bại',
        description:
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          'Tên đăng nhập hoặc mật khẩu không chính xác',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="space-y-2 text-center pb-4">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-1">
            <Building2 className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Hệ Thống Quản Lý VLXD</CardTitle>
          <CardDescription>Đăng nhập tài khoản quản trị cửa hàng</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{vi.auth.username}</Label>
              <Input
                id="username"
                {...register('username')}
                placeholder="admin"
                autoComplete="username"
              />
              {errors.username && (
                <p className="text-xs text-destructive">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{vi.auth.password}</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder="admin123"
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full font-bold h-10 text-sm mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang xác thực...' : 'Đăng nhập hệ thống'}
            </Button>

            <div className="pt-2 text-center text-xs text-muted-foreground">
              Tài khoản mặc định: <span className="font-mono font-bold text-foreground">admin</span> / Mật khẩu: <span className="font-mono font-bold text-foreground">admin123</span>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}