/**
 * 错误处理工具
 * 
 * 提供统一的错误处理和用户友好的错误消息
 */

/**
 * 错误类型
 */
export enum ErrorType {
  /** 数据加载错误 */
  DATA_LOAD = 'DATA_LOAD',
  /** 存储错误 */
  STORAGE = 'STORAGE',
  /** 验证错误 */
  VALIDATION = 'VALIDATION',
  /** 网络错误 */
  NETWORK = 'NETWORK',
  /** 未知错误 */
  UNKNOWN = 'UNKNOWN',
}

/**
 * 应用错误类
 */
export class AppError extends Error {
  type: ErrorType;
  userMessage: string;
  originalError?: Error;

  constructor(
    type: ErrorType,
    userMessage: string,
    originalError?: Error
  ) {
    super(userMessage);
    this.name = 'AppError';
    this.type = type;
    this.userMessage = userMessage;
    this.originalError = originalError;
  }
}

/**
 * 错误处理器类
 */
export class ErrorHandler {
  /**
   * 处理错误并返回用户友好的消息
   */
  static handleError(error: unknown): string {
    // 如果是 AppError，直接返回用户消息
    if (error instanceof AppError) {
      return error.userMessage;
    }

    // 如果是标准 Error
    if (error instanceof Error) {
      return this.getErrorMessage(error);
    }

    // 其他类型的错误
    return '发生了未知错误，请重试';
  }

  /**
   * 根据错误类型获取用户友好的消息
   */
  private static getErrorMessage(error: Error): string {
    const message = error.message.toLowerCase();

    // LocalStorage 错误
    if (message.includes('localstorage') || message.includes('quota')) {
      return '存储空间不足或浏览器不支持数据保存功能。请清理浏览器缓存或使用其他浏览器。';
    }

    // 网络错误
    if (message.includes('fetch') || message.includes('network')) {
      return '网络连接失败，请检查网络连接后重试。';
    }

    // 数据加载错误
    if (message.includes('load') || message.includes('parse')) {
      return '数据加载失败，请刷新页面重试。';
    }

    // 验证错误
    if (message.includes('invalid') || message.includes('validation')) {
      return '数据格式错误，请联系管理员。';
    }

    // 默认消息
    return `操作失败：${error.message}`;
  }

  /**
   * 记录错误到控制台
   */
  static logError(error: unknown, context?: string): void {
    const prefix = context ? `[${context}]` : '';
    
    if (error instanceof AppError) {
      console.error(`${prefix} AppError:`, {
        type: error.type,
        message: error.userMessage,
        original: error.originalError,
      });
    } else if (error instanceof Error) {
      console.error(`${prefix} Error:`, error.message, error.stack);
    } else {
      console.error(`${prefix} Unknown error:`, error);
    }
  }

  /**
   * 创建数据加载错误
   */
  static createDataLoadError(originalError?: Error): AppError {
    return new AppError(
      ErrorType.DATA_LOAD,
      '练习题数据加载失败，请刷新页面重试。',
      originalError
    );
  }

  /**
   * 创建存储错误
   */
  static createStorageError(originalError?: Error): AppError {
    return new AppError(
      ErrorType.STORAGE,
      '保存进度失败，您的进度可能无法保存。请检查浏览器设置。',
      originalError
    );
  }

  /**
   * 创建验证错误
   */
  static createValidationError(message: string, originalError?: Error): AppError {
    return new AppError(
      ErrorType.VALIDATION,
      message,
      originalError
    );
  }

  /**
   * 创建网络错误
   */
  static createNetworkError(originalError?: Error): AppError {
    return new AppError(
      ErrorType.NETWORK,
      '网络连接失败，请检查网络连接后重试。',
      originalError
    );
  }
}

/**
 * 安全执行异步操作
 * 
 * @param operation 要执行的操作
 * @param errorMessage 错误消息
 * @returns 操作结果或 null
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    ErrorHandler.logError(error, errorMessage);
    return null;
  }
}

/**
 * 安全执行同步操作
 * 
 * @param operation 要执行的操作
 * @param errorMessage 错误消息
 * @returns 操作结果或 null
 */
export function safeSync<T>(
  operation: () => T,
  errorMessage: string
): T | null {
  try {
    return operation();
  } catch (error) {
    ErrorHandler.logError(error, errorMessage);
    return null;
  }
}
