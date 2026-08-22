/**
 * Utility to extract clean, precise, human-readable error messages from API responses
 */
export function getErrorMessage(err: any, fallbackMessage: string = 'Đã có lỗi xảy ra'): string {
  if (!err) return fallbackMessage;

  // 1. Check structured backend AppError or ZodError response
  const apiError = err.response?.data?.error;
  if (apiError) {
    if (apiError.message && typeof apiError.message === 'string') {
      return apiError.message;
    }
    if (apiError.details && typeof apiError.details === 'object') {
      const messages: string[] = [];
      for (const key of Object.keys(apiError.details)) {
        const val = apiError.details[key];
        if (Array.isArray(val)) {
          messages.push(...val);
        } else if (typeof val === 'string') {
          messages.push(val);
        }
      }
      if (messages.length > 0) {
        return messages.join(' • ');
      }
    }
  }

  // 2. Check standard Fastify / Axios message
  if (err.response?.data?.message && typeof err.response.data.message === 'string') {
    return err.response.data.message;
  }

  // 3. Check HTTP status code fallback
  const status = err.response?.status;
  if (status === 400) return 'Dữ liệu gửi lên chưa đầy đủ hoặc không hợp lệ. Vui lòng kiểm tra các trường đã nhập.';
  if (status === 401) return 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.';
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
  if (status === 404) return 'Không tìm thấy dữ liệu yêu cầu.';
  if (status === 409) return 'Dữ liệu bị trùng lặp hoặc xung đột với dữ liệu đã có.';
  if (status === 500) return 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.';

  // 4. Check network errors
  if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
  }

  if (err.message && typeof err.message === 'string') {
    return err.message;
  }

  return fallbackMessage;
}
