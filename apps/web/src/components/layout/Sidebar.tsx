import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Users, Building2, Package, 
  ArrowDownToLine, SlidersHorizontal, Truck, Wallet, 
  ArrowRightLeft, ArrowDownRight, ArrowUpRight, Banknote, 
  Landmark, BarChart3, Database, Box, Tag, Ruler, Scale, 
  Warehouse, Truck as TruckIcon, UserSquare2, Settings,
  Receipt, Plus, Layers, LogOut, ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface NavItem {
  title: string;
  href: string;
  icon: any;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'Tổng quan',
    items: [
      { title: 'Dashboard Giám đốc', href: '/dashboard', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Bán hàng & Khách hàng',
    items: [
      { title: 'Đơn bán hàng', href: '/don-hang', icon: ShoppingCart },
      { title: 'Khách hàng / Thợ', href: '/khach-hang', icon: Users },
      { title: 'Công trình xây dựng', href: '/cong-trinh', icon: Building2 },
    ]
  },
  {
    title: 'Kho bãi & Mua hàng',
    items: [
      { title: 'Tồn kho (Cây / Kg)', href: '/ton-kho', icon: Package },
      { title: 'Sổ cái Nhập - Xuất - Tồn', href: '/ton-kho/so-cai', icon: Layers },
      { title: 'Nhập hàng từ NCC', href: '/nhap-hang', icon: ArrowDownToLine },
      { title: 'Điều chỉnh kiểm kê', href: '/ton-kho/dieu-chinh', icon: SlidersHorizontal },
    ]
  },
  {
    title: 'Vận chuyển & Đội xe',
    items: [
      { title: 'Chuyến xe giao hàng', href: '/giao-hang', icon: Truck },
    ]
  },
  {
    title: 'Công nợ & Dòng tiền',
    items: [
      { title: 'Công nợ Khách hàng', href: '/cong-no/khach-hang', icon: Wallet },
      { title: 'Công nợ Nhà cung cấp', href: '/cong-no/nha-cung-cap', icon: ArrowRightLeft },
      { title: 'Lập Phiếu Thu tiền', href: '/thu-tien', icon: ArrowDownRight },
      { title: 'Lập Phiếu Chi tiền', href: '/chi-tien', icon: ArrowUpRight },
      { title: 'Sổ quỹ Tiền mặt (Két)', href: '/tien-mat', icon: Banknote },
      { title: 'Sổ phụ Ngân hàng', href: '/ngan-hang', icon: Landmark },
      { title: 'Chi phí Cửa hàng & Xe', href: '/chi-phi', icon: Receipt },
    ]
  },
  {
    title: 'Báo cáo & Phân tích',
    items: [
      { title: 'Trung tâm Báo cáo (P&L)', href: '/bao-cao', icon: BarChart3 },
    ]
  },
  {
    title: 'Danh mục Master Data',
    items: [
      { title: 'Sản phẩm / Quy cách', href: '/danh-muc/san-pham', icon: Box },
      { title: 'Barem & Quy cách thép', href: '/danh-muc/quy-cach-thep', icon: Ruler },
      { title: 'Nhóm sản phẩm', href: '/danh-muc/danh-muc-san-pham', icon: Database },
      { title: 'Đơn vị tính & Quy đổi', href: '/danh-muc/don-vi', icon: Scale },
      { title: 'Thương hiệu / Hãng', href: '/danh-muc/thuong-hieu', icon: Tag },
      { title: 'Thông tin Kho hàng', href: '/danh-muc/kho', icon: Warehouse },
      { title: 'Nhà cung cấp', href: '/danh-muc/nha-cung-cap', icon: Building2 },
      { title: 'Đội xe tải & Xe ben', href: '/danh-muc/xe', icon: TruckIcon },
      { title: 'Danh sách Tài xế', href: '/danh-muc/tai-xe', icon: UserSquare2 },
      { title: 'Loại chi phí', href: '/danh-muc/loai-chi-phi', icon: Tag },
      { title: 'Cài đặt hệ thống', href: '/settings', icon: Settings },
    ]
  }
];

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 border-r border-border/80 bg-card flex flex-col h-full select-none shadow-sm">
      {/* Brand Header */}
      <div className="p-4 border-b border-border/70 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black shadow-sm group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight text-foreground flex items-center gap-1.5">
              VLXD PRO
              <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-400 bg-amber-50 text-amber-800 font-mono">
                v2.0
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">Quản lý Cửa Hàng Vật Liệu</p>
          </div>
        </Link>
      </div>

      {/* Navigation Scroll */}
      <ScrollArea className="flex-1 px-3 py-3">
        <div className="space-y-5">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <h2 className="px-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                {group.title}
              </h2>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.href || (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all group",
                        isActive 
                          ? "bg-primary text-primary-foreground font-semibold shadow-sm" 
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <item.icon className={cn("w-4 h-4 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                        <span className="truncate">{item.title}</span>
                      </div>
                      {isActive && (
                        <ChevronRight className="w-3.5 h-3.5 opacity-70 shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-border/70 bg-muted/20">
        <div className="flex items-center justify-between p-2 rounded-lg border border-border/50 bg-card">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
              {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'A'}
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-foreground block truncate">
                {user?.fullName || user?.username || 'Chủ Cửa Hàng'}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold block uppercase">
                {user?.role === 'OWNER' ? 'Chủ Cửa Hàng' : user?.role || 'Quản lý'}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={logout}
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}