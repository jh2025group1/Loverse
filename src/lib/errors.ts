// Unified Error Code System
// Each code maps to a specific error message

export const ErrorCodes = {
  // Authentication errors (1000-1099)
  AUTH_REQUIRED: 1000,
  AUTH_INVALID_CREDENTIALS: 1001,
  AUTH_TOKEN_EXPIRED: 1002,
  AUTH_TOKEN_INVALID: 1003,
  AUTH_UNAUTHORIZED: 1004,

  // User errors (1100-1199)
  USER_NOT_FOUND: 1100,
  USER_ALREADY_EXISTS: 1101,
  USER_INVALID_USERNAME: 1102,
  USER_INVALID_PASSWORD: 1103,
  USER_INVALID_NICKNAME: 1104,

  // Post errors (1200-1299)
  POST_NOT_FOUND: 1200,
  POST_INVALID_CONTENT: 1201,
  POST_TOO_MANY_IMAGES: 1202,
  POST_FORBIDDEN: 1203,
  POST_ALREADY_EXISTS: 1204,

  // Comment errors (1300-1399)
  COMMENT_NOT_FOUND: 1300,
  COMMENT_INVALID_CONTENT: 1301,
  COMMENT_FORBIDDEN: 1302,

  // Image errors (1400-1499)
  IMAGE_NOT_FOUND: 1400,
  IMAGE_INVALID_FORMAT: 1401,
  IMAGE_TOO_LARGE: 1402,
  IMAGE_UPLOAD_FAILED: 1403,

  // Block errors (1500-1599)
  BLOCK_ALREADY_EXISTS: 1500,
  BLOCK_NOT_FOUND: 1501,
  BLOCK_SELF_NOT_ALLOWED: 1502,

  // Validation errors (1600-1699)
  VALIDATION_FAILED: 1600,
  INVALID_INPUT: 1601,
  MISSING_REQUIRED_FIELD: 1602,

  // Server errors (1700-1799)
  INTERNAL_ERROR: 1700,
  DATABASE_ERROR: 1701,
  STORAGE_ERROR: 1702,

  // Rate limit errors (1800-1899)
  RATE_LIMIT_EXCEEDED: 1800,
} as const;

export const ErrorMessages: Record<number, string> = {
  // Authentication
  [ErrorCodes.AUTH_REQUIRED]: '需要登录',
  [ErrorCodes.AUTH_INVALID_CREDENTIALS]: '用户名或密码错误',
  [ErrorCodes.AUTH_TOKEN_EXPIRED]: '登录已过期，请重新登录',
  [ErrorCodes.AUTH_TOKEN_INVALID]: '登录凭证无效',
  [ErrorCodes.AUTH_UNAUTHORIZED]: '无权限访问',

  // User
  [ErrorCodes.USER_NOT_FOUND]: '用户不存在',
  [ErrorCodes.USER_ALREADY_EXISTS]: '用户名已被使用',
  [ErrorCodes.USER_INVALID_USERNAME]: '用户名格式不正确（3-20个字符，仅限字母数字下划线）',
  [ErrorCodes.USER_INVALID_PASSWORD]: '密码格式不正确（至少6个字符）',
  [ErrorCodes.USER_INVALID_NICKNAME]: '昵称格式不正确（1-50个字符）',

  // Post
  [ErrorCodes.POST_NOT_FOUND]: '表白不存在',
  [ErrorCodes.POST_INVALID_CONTENT]: '表白内容不能为空且不超过5000字',
  [ErrorCodes.POST_TOO_MANY_IMAGES]: '最多上传9张图片',
  [ErrorCodes.POST_FORBIDDEN]: '无权限操作此表白',
  [ErrorCodes.POST_ALREADY_EXISTS]: '表白已存在',

  // Comment
  [ErrorCodes.COMMENT_NOT_FOUND]: '评论不存在',
  [ErrorCodes.COMMENT_INVALID_CONTENT]: '评论内容不能为空且不超过1000字',
  [ErrorCodes.COMMENT_FORBIDDEN]: '无权限操作此评论',

  // Image
  [ErrorCodes.IMAGE_NOT_FOUND]: '图片不存在',
  [ErrorCodes.IMAGE_INVALID_FORMAT]: '图片格式不支持（仅支持 JPG, PNG, GIF, WEBP）',
  [ErrorCodes.IMAGE_TOO_LARGE]: '图片大小超过限制（最大10MB）',
  [ErrorCodes.IMAGE_UPLOAD_FAILED]: '图片上传失败',

  // Block
  [ErrorCodes.BLOCK_ALREADY_EXISTS]: '已拉黑该用户',
  [ErrorCodes.BLOCK_NOT_FOUND]: '未拉黑该用户',
  [ErrorCodes.BLOCK_SELF_NOT_ALLOWED]: '不能拉黑自己',

  // Validation
  [ErrorCodes.VALIDATION_FAILED]: '数据验证失败',
  [ErrorCodes.INVALID_INPUT]: '输入数据不正确',
  [ErrorCodes.MISSING_REQUIRED_FIELD]: '缺少必填字段',

  // Server
  [ErrorCodes.INTERNAL_ERROR]: '服务器内部错误',
  [ErrorCodes.DATABASE_ERROR]: '数据库错误',
  [ErrorCodes.STORAGE_ERROR]: '存储错误',

  // Rate limit
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: '请求过于频繁，请稍后再试',
};

export class AppError extends Error {
  constructor(
    public code: number,
    public message: string = ErrorMessages[code] || '未知错误',
    public httpStatus: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
    };
  }
}

export function createErrorResponse(code: number, httpStatus: number = 400) {
  const message = ErrorMessages[code] || '未知错误';
  return Response.json(
    { code, message },
    { status: httpStatus }
  );
}

// Helper for error responses
export function errorResponse(httpStatus: number, codeKey: string, message: string) {
  return Response.json(
    { code: httpStatus === 200 ? 0 : httpStatus, message },
    { status: httpStatus }
  );
}

// Helper for success responses
export function successResponse<T>(data: T) {
  return { code: 0, message: 'success', data };
}
