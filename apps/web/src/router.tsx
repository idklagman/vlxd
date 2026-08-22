import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth.store';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './features/auth/LoginPage';
import { SettingsPage } from './features/settings/SettingsPage';

// Phase 7: Dashboard & Reports Feature Pages
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ReportHubPage } from './features/reports/ReportHubPage';

// Master Data Feature Pages
import { CategoryListPage } from './features/categories/CategoryListPage';
import { BrandListPage } from './features/brands/BrandListPage';
import { UnitListPage } from './features/units/UnitListPage';
import { ProductListPage } from './features/products/ProductListPage';
import { SteelSpecListPage } from './features/steel-specs/SteelSpecListPage';
import { WarehouseListPage } from './features/warehouses/WarehouseListPage';
import { CustomerListPage } from './features/customers/CustomerListPage';
import { ProjectListPage } from './features/projects/ProjectListPage';
import { SupplierListPage } from './features/suppliers/SupplierListPage';
import { VehicleListPage } from './features/vehicles/VehicleListPage';
import { DriverListPage } from './features/drivers/DriverListPage';

// Phase 2: Purchase & Inventory Feature Pages
import { PurchaseListPage } from './features/purchases/PurchaseListPage';
import { InventoryBalancePage } from './features/inventory/InventoryBalancePage';
import { InventoryLedgerPage } from './features/inventory/InventoryLedgerPage';
import { InventoryAdjustmentPage } from './features/inventory/InventoryAdjustmentPage';
import { WarehouseTransferPage } from './features/inventory/WarehouseTransferPage';

// Phase 3: Sales Feature Pages
import { SalesOrderListPage } from './features/sales/SalesOrderListPage';
import { SalesOrderCreatePage } from './features/sales/SalesOrderCreatePage';
import { SalesOrderDetailPage } from './features/sales/SalesOrderDetailPage';

// Phase 4: Debt & Payment Feature Pages
import { CustomerDebtPage } from './features/debt/CustomerDebtPage';
import { SupplierDebtPage } from './features/debt/SupplierDebtPage';
import { PaymentCollectPage } from './features/payments/PaymentCollectPage';
import { PaymentSpendPage } from './features/payments/PaymentSpendPage';
import { CashFundPage } from './features/finance/CashFundPage';
import { BankFundPage } from './features/finance/BankFundPage';

// Phase 5: Delivery Feature Pages
import { DeliveryListPage } from './features/delivery/DeliveryListPage';
import { DeliveryCreatePage } from './features/delivery/DeliveryCreatePage';
import { DeliveryDetailPage } from './features/delivery/DeliveryDetailPage';

// Phase 6: Expense Feature Pages
import { ExpenseListPage } from './features/expenses/ExpenseListPage';
import { ExpenseCategoryListPage } from './features/expenses/ExpenseCategoryListPage';

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'don-hang',
        element: <SalesOrderListPage />,
      },
      {
        path: 'don-hang/tao-moi',
        element: <SalesOrderCreatePage />,
      },
      {
        path: 'don-hang/:id',
        element: <SalesOrderDetailPage />,
      },
      {
        path: 'khach-hang',
        element: <CustomerListPage />,
      },
      {
        path: 'cong-trinh',
        element: <ProjectListPage />,
      },
      {
        path: 'ton-kho',
        element: <InventoryBalancePage />,
      },
      {
        path: 'ton-kho/so-cai',
        element: <InventoryLedgerPage />,
      },
      {
        path: 'ton-kho/dieu-chinh',
        element: <InventoryAdjustmentPage />,
      },
      {
        path: 'ton-kho/chuyen-kho',
        element: <WarehouseTransferPage />,
      },
      {
        path: 'nhap-hang',
        element: <PurchaseListPage />,
      },
      {
        path: 'dieu-chinh-kho',
        element: <InventoryAdjustmentPage />,
      },
      {
        path: 'giao-hang',
        element: <DeliveryListPage />,
      },
      {
        path: 'giao-hang/tao-chuyen',
        element: <DeliveryCreatePage />,
      },
      {
        path: 'giao-hang/:id',
        element: <DeliveryDetailPage />,
      },
      {
        path: 'chi-phi',
        element: <ExpenseListPage />,
      },
      {
        path: 'cong-no/khach-hang',
        element: <CustomerDebtPage />,
      },
      {
        path: 'cong-no/nha-cung-cap',
        element: <SupplierDebtPage />,
      },
      {
        path: 'thu-tien',
        element: <PaymentCollectPage />,
      },
      {
        path: 'chi-tien',
        element: <PaymentSpendPage />,
      },
      {
        path: 'tien-mat',
        element: <CashFundPage />,
      },
      {
        path: 'ngan-hang',
        element: <BankFundPage />,
      },
      {
        path: 'bao-cao',
        element: <ReportHubPage />,
      },
      {
        path: 'danh-muc/danh-muc-san-pham',
        element: <CategoryListPage />,
      },
      {
        path: 'danh-muc/san-pham',
        element: <ProductListPage />,
      },
      {
        path: 'danh-muc/thuong-hieu',
        element: <BrandListPage />,
      },
      {
        path: 'danh-muc/quy-cach-thep',
        element: <SteelSpecListPage />,
      },
      {
        path: 'danh-muc/don-vi',
        element: <UnitListPage />,
      },
      {
        path: 'danh-muc/kho',
        element: <WarehouseListPage />,
      },
      {
        path: 'danh-muc/nha-cung-cap',
        element: <SupplierListPage />,
      },
      {
        path: 'danh-muc/xe',
        element: <VehicleListPage />,
      },
      {
        path: 'danh-muc/tai-xe',
        element: <DriverListPage />,
      },
      {
        path: 'danh-muc/loai-chi-phi',
        element: <ExpenseCategoryListPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
]);