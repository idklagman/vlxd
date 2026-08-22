import { useNavigate, Link } from 'react-router-dom';
import { 
  Menu, LogOut, ShoppingCart, ArrowDownRight, ArrowUpRight, 
  Truck, Building2, Calendar, UserCheck
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { formatDate } from '@vlxd/shared';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <header className="h-16 border-b border-border/80 bg-card/95 backdrop-blur flex items-center justify-between px-4 md:px-6 sticky top-0 z-20 shadow-sm">
      {/* Left section */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-5 h-5" />
        </Button>
        
        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border/40">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <span>Hôm nay: <strong className="text-foreground">{formatDate(today)}</strong></span>
        </div>
      </div>

      {/* Right section: Quick actions + User profile */}
      <div className="flex items-center gap-2.5">
        {/* Fast Action Buttons */}
        <Button
          size="sm"
          onClick={() => navigate('/don-hang/tao-moi')}
          className="bg-primary text-primary-foreground font-bold shadow-sm hover:brightness-105 transition-all text-xs h-9 px-3 gap-1.5"
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="hidden sm:inline">Lên đơn bán</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/thu-tien')}
          className="border-emerald-600/50 text-emerald-700 hover:bg-emerald-50 text-xs h-9 px-2.5 gap-1 hidden sm:flex"
        >
          <ArrowDownRight className="w-3.5 h-3.5" />
          <span>Thu tiền</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/chi-tien')}
          className="border-amber-600/50 text-amber-800 hover:bg-amber-50 text-xs h-9 px-2.5 gap-1 hidden sm:flex"
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>Chi tiền</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/giao-hang/tao-chuyen')}
          className="text-xs h-9 px-2.5 gap-1 hidden lg:flex"
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Điều xe</span>
        </Button>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 h-9 px-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20">
                {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'A'}
              </div>
              <div className="text-left hidden md:block">
                <span className="text-xs font-semibold text-foreground block leading-tight">
                  {user?.fullName || user?.username || 'Chủ Cửa Hàng'}
                </span>
                <span className="text-[10px] text-muted-foreground block leading-tight">
                  {user?.role === 'OWNER' ? 'Chủ Cửa Hàng' : user?.role || 'Quản lý'}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer text-xs">
              Cài đặt cửa hàng
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer text-xs">
              <LogOut className="w-3.5 h-3.5 mr-2" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}