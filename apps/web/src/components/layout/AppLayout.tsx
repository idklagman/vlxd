import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { useIsMobile } from '../../hooks/useMediaQuery';

export function AppLayout() {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen bg-background print:h-auto print:bg-white print:block">
      {!isMobile && (
        <div className="print:hidden">
          <Sidebar />
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible print:block">
        <div className="print:hidden">
          <Header />
        </div>
        <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6 print:p-0 print:overflow-visible print:block">
          <Outlet />
        </main>
        {isMobile && (
          <div className="print:hidden">
            <MobileNav />
          </div>
        )}
      </div>
    </div>
  );
}