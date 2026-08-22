# VLXD — Construction Material Store Management System
## Hệ Thống Quản Lý Cửa Hàng Vật Liệu Xây Dựng

Hệ thống phần mềm quản lý chuyên biệt cho cửa hàng vật liệu xây dựng (Xi măng, Cát đá, Sắt thép, Gạch ngói...) được xây dựng theo kiến trúc hiện đại, đáp ứng 100% quy tắc nghiệp vụ thực tế tại Việt Nam.

---

## 🏗️ Kiến Trúc Hệ Thống (Monorepo)

Hệ thống được tổ chức dưới dạng Monorepo với **Turborepo** và **pnpm workspaces**:

```
VLXD/
├── apps/
│   ├── api/          # Backend REST API (Fastify, TypeScript, Drizzle ORM, JWT, Vitest)
│   └── web/          # Frontend Web SPA (React 19, Vite, Tailwind CSS, TanStack Query, Lucide Icons)
└── packages/
    ├── db/           # Database layer (PostgreSQL, Drizzle ORM schemas, Migrations, Seed script)
    ├── shared/       # Shared business logic (Barem thép, Moving average cost, VND currency, Zod schemas)
    └── tsconfig/     # Base TypeScript configurations
```

---

## 🔑 Quy Tắc Nghiệp Vụ Cốt Lõi (Master Business Rules)

1. **Bán hàng & Đơn giá Snapshot**:
   - Giá bán không cố định mà linh hoạt theo từng khách hàng / nhà thầu.
   - Đơn giá được chụp ảnh (Snapshot) tại thời điểm bán vào từng dòng đơn `sales_order_items`, đảm bảo giá lịch sử không bị thay đổi khi giá thị trường biến động.
2. **Cấu trúc Khách hàng — Công trình (Customer & Project)**:
   - Một khách hàng/nhà thầu có thể xây dựng nhiều công trình cùng lúc.
   - Quản lý công nợ và giao hàng chi tiết theo từng công trình.
3. **Sổ Cái Bất Biến (Ledger-Derived Financials)**:
   - Công nợ khách hàng (`customer_debts`), công nợ nhà cung cấp (`supplier_debts`), tồn kho (`inventory_transactions`), và sổ quỹ tiền mặt/ngân hàng (`cash_flow_entries`) đều là **sổ cái ghi tăng/giảm tuần tự (Append-Only Ledger)**, không sửa tay số dư.
4. **Quản lý Thép Xây Dựng (Barem TCVN 1651-2:2018)**:
   - Thép thanh (D10, D12, D14, D16, D18, D20, D22): Mua theo kg/tấn, bán theo cây (11.7m).
   - Tồn kho cơ sở lưu bằng **kg**. Giao diện hiển thị: *Còn 100 cây (≈ 1.849 kg)* hoặc *Còn 100 cây + 12 kg dư*.
5. **Vật Liệu Rời (Cát, Sỏi, Đá)**:
   - Quản lý chính xác theo đơn vị khối lượng **m³**, không lấy chuyến xe làm đơn vị cơ sở.
6. **Điều Xe & Giao Hàng Nhiều Chuyến (Multi-Trip Delivery)**:
   - Hỗ trợ đơn hàng lớn (50 tấn xi măng, 100 khối cát) giao bằng nhiều chuyến xe tải/xe ben khác nhau.
   - Phiếu điều xe và Biên bản giao nhận vật tư chuẩn in ấn A4/A5.
7. **Báo cáo Lợi Nhuận Thực Tế (P&L Income Statement)**:
   - Doanh thu thuần $\rightarrow$ Giá vốn hàng bán (COGS tính theo Moving Average snapshot) $\rightarrow$ Lợi nhuận gộp $\rightarrow$ Chi phí vận hành đội xe & cửa hàng $\rightarrow$ **Lợi nhuận ròng (Net Profit)**.
8. **100% Giao Diện & Biểu Mẫu Tiếng Việt**.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### Yêu Cầu Môi Trường
- **Node.js**: $\ge 20.x$
- **pnpm**: $\ge 9.x$
- **PostgreSQL**: $\ge 15.x$

### 1. Cài đặt Dependencies
```bash
pnpm install
```

### 2. Thiết lập Biến Môi trường
Tạo file `.env` tại thư mục gốc hoặc `packages/db/.env` và `apps/api/.env`:
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/vlxd_db
JWT_SECRET=vlxd-super-secure-production-secret-key
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

### 3. Sinh Migrations & Khởi tạo Dữ liệu Mẫu (Seed)
```bash
# Sinh migration Drizzle ORM
pnpm db:generate

# Khởi tạo dữ liệu mẫu chuẩn ngành VLXD (Thép barem, Xi măng, Cát đá, Xe tải, Danh mục chi phí...)
pnpm db:seed
```

Tài khoản mặc định:
- **Tên đăng nhập**: `admin`
- **Mật khẩu**: `admin123`

### 4. Chạy Môi Trường Phát Triển (Development)
```bash
pnpm dev
```
- **Web App**: `http://localhost:5173`
- **Backend API**: `http://localhost:3001`
- **API Healthcheck**: `http://localhost:3001/api/health`

---

## 🧪 Kiểm Thử & Kiểm Tra Chất Lượng (Quality Assurance)

```bash
# 1. Kiểm tra TypeScript toàn bộ monorepo (0 errors)
pnpm typecheck

# 2. Chạy toàn bộ Test Suite (100% passed)
pnpm test

# 3. Build Production toàn bộ các gói
pnpm build
```

---

## 📊 Danh Sách Các Phân Hệ Đã Hoàn Thành

| Phân hệ | Tính năng chính | Đường dẫn UI |
|---|---|---|
| **Dashboard** | KPI Doanh thu, Lãi gộp, Lãi ròng, Công nợ, Tồn quỹ, Cảnh báo kho | `/dashboard` |
| **Bán hàng (Sales)** | POS bán hàng nhanh, Chọn công trình, Tính tiền thừa, In hóa đơn A4/A5 | `/don-hang`, `/don-hang/tao-moi` |
| **Kho hàng (Inventory)** | Tồn kho theo cây/kg, Sổ cái nhập xuất tồn, Điều chỉnh kho, Chuyển kho | `/ton-kho`, `/ton-kho/so-cai` |
| **Nhập hàng (Purchase)** | Mua hàng nhà máy, Tính giá vốn bình quân di động, Ghi nợ NCC | `/nhap-hang` |
| **Giao hàng (Delivery)** | Lập chuyến xe, Điều xe tải/ben, Giao nhiều chuyến, In biên bản bàn giao | `/giao-hang` |
| **Công nợ & Thu chi** | Sổ nợ khách hàng/công trình, Sổ nợ NCC, Phiếu thu, Phiếu chi | `/cong-no/khach-hang`, `/thu-tien`, `/chi-tien` |
| **Sổ quỹ dòng tiền** | Sổ quỹ Tiền mặt (két), Sổ phụ Ngân hàng (VietinBank) | `/tien-mat`, `/ngan-hang` |
| **Chi phí (Expense)** | Chi phí xăng dầu đội xe, Sửa chữa bảo dưỡng, Lương tài xế, Mặt bằng | `/chi-phi` |
| **Báo cáo (Reports)** | Báo cáo Lợi nhuận P&L, Doanh thu & Top bán chạy, Định giá tài sản tồn kho | `/bao-cao` |
| **Danh mục Master Data** | Sản phẩm, Quy cách thép, Đơn vị, Kho bãi, Xe tải, Tài xế, Khách hàng, NCC | `/danh-muc/...` |
