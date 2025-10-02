/**
 * 用户认证中间件
 */

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import { AuthenticatedRequest, JwtPayload, PermissionLevel } from '../types/auth';

// JWT密钥配置
const JWT_SECRET = process.env.JWT_SECRET || 'colormagic-default-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * 生成JWT token
 */
export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as string
  } as jwt.SignOptions);
}

/**
 * 生成刷新token
 */
export function generateRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN as string
  } as jwt.SignOptions);
}

/**
 * 验证JWT token
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    console.error('Token验证失败:', error);
    return null;
  }
}

/**
 * 密码哈希
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * 密码验证
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * 强制认证中间件 - 必须登录
 */
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: '需要登录才能访问此功能',
      code: 'AUTH_REQUIRED'
    });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({
      success: false,
      error: '无效的访问令牌',
      code: 'INVALID_TOKEN'
    });
  }

  // 将用户信息添加到请求对象
  req.user = {
    id: payload.userId,
    email: payload.email,
    username: payload.username,
    subscription_type: payload.subscription_type
  };

  next();
};

/**
 * 可选认证中间件 - 可以不登录，但如果有token会解析用户信息
 */
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = {
        id: payload.userId,
        email: payload.email,
        username: payload.username,
        subscription_type: payload.subscription_type
      };
    }
  }

  next();
};

/**
 * 权限检查中间件
 */
export const requirePermission = (requiredLevel: PermissionLevel) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '需要登录才能访问此功能',
        code: 'AUTH_REQUIRED'
      });
    }

    const userLevel = getUserPermissionLevel(req.user.subscription_type);
    
    if (!hasPermission(userLevel, requiredLevel)) {
      return res.status(403).json({
        success: false,
        error: `此功能需要${getPermissionLevelName(requiredLevel)}权限`,
        code: 'INSUFFICIENT_PERMISSIONS',
        required_level: requiredLevel,
        user_level: userLevel
      });
    }

    next();
  };
};

/**
 * 获取用户权限级别
 */
function getUserPermissionLevel(subscriptionType: string): PermissionLevel {
  switch (subscriptionType) {
    case 'vip':
      return PermissionLevel.VIP;
    case 'premium':
      return PermissionLevel.PREMIUM;
    case 'free':
      return PermissionLevel.AUTHENTICATED;
    default:
      return PermissionLevel.GUEST;
  }
}

/**
 * 检查是否有足够权限
 */
function hasPermission(userLevel: PermissionLevel, requiredLevel: PermissionLevel): boolean {
  const levels = {
    [PermissionLevel.GUEST]: 0,
    [PermissionLevel.AUTHENTICATED]: 1,
    [PermissionLevel.PREMIUM]: 2,
    [PermissionLevel.VIP]: 3,
    [PermissionLevel.ADMIN]: 4
  };

  return levels[userLevel] >= levels[requiredLevel];
}

/**
 * 获取权限级别中文名称
 */
function getPermissionLevelName(level: PermissionLevel): string {
  const names = {
    [PermissionLevel.GUEST]: '游客',
    [PermissionLevel.AUTHENTICATED]: '注册用户',
    [PermissionLevel.PREMIUM]: '高级会员',
    [PermissionLevel.VIP]: 'VIP会员',
    [PermissionLevel.ADMIN]: '管理员'
  };

  return names[level] || '未知';
}

/**
 * 登录速率限制
 */
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次尝试
  message: {
    success: false,
    error: '登录尝试次数过多，请15分钟后再试',
    code: 'TOO_MANY_LOGIN_ATTEMPTS'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // 根据IP和邮箱组合限制
  keyGenerator: (req) => {
    const email = req.body?.email || 'unknown';
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `login:${ip}:${email}`;
  }
});

/**
 * 注册速率限制
 */
export const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3, // 最多3次注册
  message: {
    success: false,
    error: '注册次数过多，请1小时后再试',
    code: 'TOO_MANY_REGISTER_ATTEMPTS'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * API调用速率限制
 */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: (req: AuthenticatedRequest) => {
    // 根据用户类型设置不同的限制
    if (!req.user) return 50; // 未登录用户
    
    switch (req.user.subscription_type) {
      case 'vip':
        return 1000; // VIP用户
      case 'premium':
        return 500; // 高级用户
      case 'free':
        return 200; // 免费用户
      default:
        return 50; // 默认限制
    }
  },
  message: {
    success: false,
    error: 'API调用频率过高，请稍后再试',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: AuthenticatedRequest) => {
    return req.user?.id || req.ip || 'anonymous';
  }
});

/**
 * 密码强度验证
 */
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 简化密码要求：至少6个字符，包含数字和字母即可
  if (password.length < 6) {
    errors.push('密码长度至少6个字符');
  }

  if (password.length > 128) {
    errors.push('密码长度不能超过128个字符');
  }

  if (!/[a-zA-Z]/.test(password)) {
    errors.push('密码必须包含字母');
  }

  if (!/\d/.test(password)) {
    errors.push('密码必须包含数字');
  }

  // 检查常见弱密码
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', '111111', '123123', 'admin', 'root'
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('不能使用常见的弱密码');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 邮箱格式验证
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 用户名格式验证
 */
export function validateUsername(username: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (username.length < 3) {
    errors.push('用户名长度至少3个字符');
  }

  if (username.length > 30) {
    errors.push('用户名长度不能超过30个字符');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('用户名只能包含字母、数字、下划线和连字符');
  }

  if (/^[0-9]+$/.test(username)) {
    errors.push('用户名不能全为数字');
  }

  // 检查保留用户名
  const reservedNames = [
    'admin', 'root', 'api', 'www', 'mail', 'ftp', 'localhost',
    'colormagic', 'system', 'support', 'help', 'info', 'contact'
  ];

  if (reservedNames.includes(username.toLowerCase())) {
    errors.push('该用户名已被保留，请选择其他用户名');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 获取客户端信息
 */
export function getClientInfo(req: AuthenticatedRequest) {
  return {
    ip_address: req.ip || req.connection.remoteAddress,
    user_agent: req.get('User-Agent'),
    device_info: {
      platform: req.get('sec-ch-ua-platform'),
      mobile: req.get('sec-ch-ua-mobile') === '?1',
      referer: req.get('referer')
    }
  };
}

/**
 * 生成安全的随机token
 */
export function generateSecureToken(length: number = 32): string {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Token哈希
 */
export function hashToken(token: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(token).digest('hex');
}
