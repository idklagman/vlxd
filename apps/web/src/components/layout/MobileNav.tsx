import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, FileText, Wallet, Menu, X, 
  ShoppingCart, Users, Building2, Layers, ArrowDownToLine, 
  SlidersHorizontal, Truck, ArrowRightLeft, ArrowDownRight, 
  ArrowUpRight, Banknote, Landmark, Receipt, BarChart3, 
  Settings, LogOut, ChevronRight, Box, Scale, Tag, Warehouse, 
  Truck as TruckIcon, UserSquare2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUiStore } from '../../stores/ui.store';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';

const tabs = [
  { title: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Tồn kho', href: '/ton-kho', icon: Package },
  { title: 'Đơn hàng', href: '/don-hang', icon: FileText },
  { title: 'Công nợ', href: '/cong-no/khach-hang', icon: Wallet },
];

const mobileNavGroups = [
  {
    title: 'Nghiệp vụ Bán hàng',
    items: [
      { title: 'Lên đơn bán nhanh (POS)', href: '/don-hang/tao-moi', icon: ShoppingCart, highlight: true },
      { title: 'Danh sách Đơn bán hàng', href: '/don-hang', icon: FileText },
      { title: 'Khách hàng / Thợ xây', href: '/khach-hang', icon: Users },
      { title: 'Công trình xây dựng', href: '/cong-trinh', icon: Building2 },
    ]
  },
  {
    title: 'Kho bãi & Mua hàng',
    items: [
      { title: 'Tồn kho (Cây / Kg / Bao / M3)', href: '/ton-kho', icon: Package },
      { title: 'Sổ cái Nhập - Xuất - Tồn', href: '/ton-kho/so-cai', icon: Layers },
      { title: 'Nhập hàng từ NCC', href: '/nhap-hang', icon: ArrowDownToLine },
      { title: 'Kiểm kê & Điều chỉnh kho', href: '/ton-kho/dieu-chinh', icon: SlidersHorizontal },
    ]
  },
  {
    title: 'Vận chuyển & Điều xe',
    items: [
      { title: 'Chuyến xe giao hàng', href: '/giao-hang', icon: Truck },
    ]
  },
  {
    title: 'Tiền tệ & Sổ nợ',
    items: [
      { title: 'Lập Phiếu Thu tiền', href: '/thu-tien', icon: ArrowDownRight },
      { title: 'Lập Phiếu Chi tiền', href: '/chi-tien', icon: ArrowUpRight },
      { title: 'Công nợ Khách hàng', href: '/cong-no/khach-hang', icon: Wallet },
      { title: 'Công nợ Nhà cung cấp', href: '/cong-no/nha-cung-cap', icon: ArrowRightLeft },
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
    title: 'Danh mục & Cài đặt',
    items: [
      { title: 'Sản phẩm & Giá vốn', href: '/danh-muc/san-pham', icon: Box },
      { title: 'Barem & Quy cách thép', href: '/danh-muc/quy-cach-thep', icon: Box },
      { title: 'Nhóm sản phẩm', href: '/danh-muc/danh-muc-san-pham', icon: Tag },
      { title: 'Đơn vị tính & Quy đổi', href: '/danh-muc/don-vi', icon: Scale },
      { title: 'Nhà cung cấp', href: '/danh-muc/nha-cung-cap', icon: Building2 },
      { title: 'Đội xe & Tài xế', href: '/danh-muc/xe', icon: TruckIcon },
      { title: 'Cài đặt hệ thống & In ấn', href: '/settings', icon: Settings },
    ]
  }
];

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobileMenuOpen, closeMobileMenu, toggleMobileMenu } = useUiStore();
  const { user, logout } = useAuth();

  const handleNavigate = (href: string) => {
    closeMobileMenu();
    navigate(href);
  };

  return (
    <>
      {/* Bottom Floating App Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-16 border-t border-border/80 bg-card/95 backdrop-blur flex items-center justify-around px-2 z-40 shadow-lg">
        {tabs.map((tab) => {
          const isActive = location.pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              to={tab.href}
              onClick={closeMobileMenu}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full py-1 space-y-1 touch-manipulation select-none active:scale-95 transition-transform",
                isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
              <span className="text-[10px] tracking-tight">{tab.title}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={toggleMobileMenu}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full py-1 space-y-1 touch-manipulation select-none active:scale-95 transition-transform cursor-pointer",
            isMobileMenuOpen ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
          )}
          aria-label="Menu chức năng"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Menu</span>
        </button>
      </div>

      {/* Slide-out Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex print:hidden">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={closeMobileMenu}
          />

          {/* Drawer Content */}
          <div className="relative w-[85vw] max-w-sm bg-card border-r border-border h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-250">
            {/* Drawer Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-extrabold shadow-xs">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-foreground flex items-center gap-1">
                    VLXD PRO
                    <Badge variant="outline" className="text-[9px] px-1 py-0 bg-amber-50 text-amber-800 border-amber-300">
                      Mobile
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium">Toàn bộ chức năng hệ thống</p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-muted touch-manipulation"
                onClick={closeMobileMenu}
                aria-label="Đóng menu"
              >
                <X className="w-4 h-4 text-foreground" />
              </Button>
            </div>

            {/* Drawer Menu Links */}
            <ScrollArea className="flex-1 px-3 py-3 overflow-y-auto">
              <div className="space-y-4 pb-6">
                {mobileNavGroups.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-1">
                    <h3 className="px-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      {group.title}
                    </h3>
                    <div className="space-y-0.5">
                      {group.items.map((item, iIdx) => {
                        const isActive = location.pathname === item.href;
                        return (
                          <button
                            key={iIdx}
                            type="button"
                            onClick={() => handleNavigate(item.href)}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left touch-manipulation active:scale-[0.98] cursor-pointer",
                              isActive
                                ? "bg-primary text-primary-foreground font-bold shadow-xs"
                                : item.highlight
                                ? "bg-primary/10 text-primary hover:bg-primary/15 font-semibold"
                                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                            )}
                          >
                            <div className="flex items-center gap-3 truncate">
                              <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary-foreground" : item.highlight ? "text-primary" : "text-muted-foreground")} />
                              <span className="truncate">{item.title}</span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Drawer User Profile & Logout Footer */}
            <div className="p-3 border-t border-border bg-muted/20">
              <div className="flex items-center justify-between p-2 rounded-xl border border-border bg-card">
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
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 touch-manipulation"
                  onClick={() => {
                    closeMobileMenu();
                    logout();
                  }}
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}