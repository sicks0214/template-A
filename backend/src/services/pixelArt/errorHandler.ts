/**
 * 错误处理工具
 * 提供统一的错误处理和日志记录
 */

import { Response } from 'express';

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}

export class PixelArtErrorHandler {
  /**
   * 发送错误响应
   */
  sendError(
    res: Response,
    statusCode: number,
    code: string,
    message: string,
    details?: any
  ): void {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code,
        message,
        timestamp: new Date().toISOString()
      }
    };

    if (details) {
      errorResponse.error.details = details;
    }

    console.error(`[ErrorHandler] ${code}: ${message}`, details || '');
    res.status(statusCode).json(errorResponse);
  }

  /**
   * 处理验证错误
   */
  handleValidationError(res: Response, message: string, details?: any): void {
    this.sendError(res, 400, 'VALIDATION_ERROR', message, details);
  }

  /**
   * 处理处理错误
   */
  handleProcessingError(res: Response, message: string, details?: any): void {
    this.sendError(res, 500, 'PROCESSING_ERROR', message, details);
  }

  /**
   * 处理未找到错误
   */
  handleNotFoundError(res: Response, message: string): void {
    this.sendError(res, 404, 'NOT_FOUND', message);
  }

  /**
   * 处理未授权错误
   */
  handleUnauthorizedError(res: Response, message: string): void {
    this.sendError(res, 401, 'UNAUTHORIZED', message);
  }

  /**
   * 记录错误日志
   */
  logError(context: string, error: Error | any): void {
    console.error(`[${context}] Error:`, {
      message: error.message || error,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
}

// 导出单例实例
export const pixelArtErrorHandler = new PixelArtErrorHandler();

