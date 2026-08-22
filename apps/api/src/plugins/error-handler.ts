import { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';

const FIELD_NAMES: Record<string, string> = {
  customerId: 'Khách hàng',
  supplierId: 'Nhà cung cấp',
  warehouseId: 'Kho hàng',
  fromWarehouseId: 'Kho chuyển đi',
  toWarehouseId: 'Kho nhận',
  projectId: 'Công trình',
  productVariantId: 'Mặt hàng / Quy cách',
  productId: 'Sản phẩm',
  brandId: 'Thương hiệu',
  categoryId: 'Danh mục',
  baseUnitId: 'Đơn vị cơ sở',
  fromUnitId: 'Đơn vị nguồn',
  toUnitId: 'Đơn vị đích',
  purchaseUnitId: 'Đơn vị nhập',
  saleUnitId: 'Đơn vị bán',
  unitId: 'Đơn vị tính',
  inputUnitId: 'Đơn vị tính',
  inputQuantity: 'Số lượng',
  quantity: 'Số lượng',
  unitPrice: 'Đơn giá',
  discountAmount: 'Chiết khấu',
  shippingFee: 'Phí vận chuyển',
  paidAmount: 'Số tiền trả',
  amount: 'Số tiền',
  driverCost: 'Công lái xe',
  orderDate: 'Ngày đặt hàng',
  paymentDate: 'Ngày giao dịch',
  deliveryDate: 'Ngày giao hàng',
  startDate: 'Ngày bắt đầu',
  endDate: 'Ngày kết thúc',
  adjustmentDate: 'Ngày kiểm kê',
  transferDate: 'Ngày điều chuyển',
  deliveryAddress: 'Địa chỉ giao hàng',
  deliveryContactName: 'Người nhận hàng',
  deliveryContactPhone: 'SĐT người nhận',
  payerReceiverName: 'Người nộp / nhận tiền',
  name: 'Tên',
  phone: 'Số điện thoại',
  email: 'Email',
  password: 'Mật khẩu',
  username: 'Tên đăng nhập',
  address: 'Địa chỉ',
  code: 'Mã',
  items: 'Danh sách mặt hàng',
  status: 'Trạng thái',
  paymentMethod: 'Phương thức thanh toán',
  category: 'Khoản mục chi',
  plateNumber: 'Biển số xe',
  driverId: 'Tài xế / Lái xe',
  vehicleId: 'Xe vận chuyển',
  diameter: 'Đường kính thép',
  weightPerMeter: 'Đơn trọng (kg/m)',
  weightPerBar: 'Trọng lượng cây (kg)',
  conversionRate: 'Tỷ lệ quy đổi',
  notes: 'Ghi chú',
};

function formatZodPath(path: (string | number)[]): string {
  if (!path || path.length === 0) return 'Dữ liệu';
  return path
    .map((p) => {
      if (typeof p === 'number') {
        return `dòng ${p + 1}`;
      }
      return FIELD_NAMES[p] || String(p);
    })
    .join(' > ');
}

function formatZodMessage(issue: any): string {
  let msg = issue.message;
  if (issue.code === 'invalid_type') {
    if (issue.received === 'undefined' || issue.received === 'null') {
      msg = 'Không được để trống';
    } else {
      msg = `Định dạng không hợp lệ (nhận được ${issue.received})`;
    }
  } else if (msg === 'Required') {
    msg = 'Bắt buộc nhập / chọn';
  }
  return msg;
}

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);

    // Zod validation errors
    if (error instanceof ZodError) {
      const details: Record<string, string[]> = {};
      const errorSummaries: string[] = [];

      for (const issue of error.issues) {
        const pathStr = issue.path.join('.');
        const label = formatZodPath(issue.path);
        const msg = formatZodMessage(issue);

        if (!details[pathStr]) details[pathStr] = [];
        details[pathStr].push(`${label}: ${msg}`);
        errorSummaries.push(`${label}: ${msg}`);
      }

      const fullMessage = errorSummaries.length > 0
        ? errorSummaries.join('; ')
        : 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';

      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: fullMessage,
          details,
        },
      });
    }

    // Custom app errors
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
    }

    // Fastify JWT errors or errors with statusCode
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (statusCode === 401) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Phiên đăng nhập hết hạn hoặc tài khoản chưa xác thực. Vui lòng đăng nhập lại.',
        },
      });
    }

    if (statusCode === 404) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Dữ liệu yêu cầu không tồn tại hoặc đã bị xóa.',
        },
      });
    }

    // Unknown errors
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Đã xảy ra lỗi hệ thống trên máy chủ. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.',
      },
    });
  });
}
