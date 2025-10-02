/**
 * JWT 认证中间件 - 新版本
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-this';

/**
 * JWT 认证中间件
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // 1. 从请求头获取 token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
      return;
    }

    const token = authHeader.substring(7); // 移除 "Bearer " 前缀

    // 2. 验证 token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // 3. 将用户信息注入到请求对象
    (req as any).user = {
      userId: decoded.userId,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role,
      subscriptionType: decoded.subscriptionType
    };

    // 4. 继续处理请求
    next();
  } catch (error: any) {
    console.error('❌ Token 验证失败:', error.message);

    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: '令牌已过期，请重新登录'
      });
      return;
    }

    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        message: '无效的令牌'
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: '认证失败'
    });
  }
};

/**
 * 可选认证中间件（token 可选）
 */
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      (req as any).user = {
        userId: decoded.userId,
        email: decoded.email,
        username: decoded.username,
        role: decoded.role,
        subscriptionType: decoded.subscriptionType
      };
    }

    next();
  } catch (error) {
    // 可选认证失败不影响请求继续
    next();
  }
};

/**
 * 角色验证中间件
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: '未授权'
      });
      return;
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({
        success: false,
        message: '权限不足'
      });
      return;
    }

    next();
  };
};

