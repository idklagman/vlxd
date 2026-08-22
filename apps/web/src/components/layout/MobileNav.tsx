import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, FileText, Wallet, Menu } from 'lucide-react';
import { cn } from '../../lib/utils';
import { vi } from '../../locales/vi';

const tabs = [
  { title: vi.nav.dashboard, href: '/dashboard', icon: LayoutDashboard },
  { title: vi.nav.warehouse, href: '/ton-kho', icon: Package },
  { title: vi.nav.orders, href: '/don-hang', icon: FileText },
  { title: vi.nav.debt, href: '/cong-no/khach-hang', icon: Wallet },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 border-t bg-card flex items-center justify-around px-2 z-50">
      {tabs.map((tab) => {
        const isActive = location.pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            to={tab.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{tab.title}</span>
          </Link>
        );
      })}
      <button className="flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground">
        <Menu className="w-5 h-5" />
        <span className="text-[10px] font-medium">Menu</span>
      </button>
    </div>
  );
}