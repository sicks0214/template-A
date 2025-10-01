/**
 * 用户认证路由
 */

import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { 
  requireAuth, 
  optionalAuth, 
  requirePermission,
  loginRateLimit, 
  registerRateLimit,
  apiRateLimit
} from '../middleware/auth';
import { PermissionLevel } from '../types/auth';

const router = Router();
const authController = new AuthController();

// 应用速率限制到所有认证路由
router.use(apiRateLimit);

// ==================== 公开路由（无需认证） ====================

/**
 * POST /api/auth/register
 * 用户注册
 */
router.post('/register', registerRateLimit, authController.register);

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', loginRateLimit, authController.login);

/**
 * POST /api/auth/refresh
 * 刷新访问令牌
 */
router.post('/refresh', authController.refreshToken);

/**
 * GET /api/auth/verify-email
 * 验证邮箱地址
 */
router.get('/verify-email', authController.verifyEmail);

/**
 * POST /api/auth/forgot-password
 * 发送密码重置邮件
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * POST /api/auth/reset-password
 * 重置密码
 */
router.post('/reset-password', authController.resetPassword);

// ==================== 需要认证的路由 ====================

/**
 * GET /api/auth/profile
 * 获取当前用户信息
 */
router.get('/profile', requireAuth, authController.getProfile);

/**
 * PUT /api/auth/profile
 * 更新用户信息
 */
router.put('/profile', requireAuth, authController.updateProfile);

/**
 * POST /api/auth/change-password
 * 修改密码
 */
router.post('/change-password', requireAuth, authController.changePassword);

/**
 * POST /api/auth/logout
 * 用户登出
 */
router.post('/logout', requireAuth, authController.logout);

// ==================== 用户数据路由 ====================

/**
 * GET /api/auth/analysis-history
 * 获取分析历史记录
 */
router.get('/analysis-history', requireAuth, authController.getAnalysisHistory);

/**
 * POST /api/auth/analysis-history
 * 保存分析结果
 */
router.post('/analysis-history', requireAuth, authController.saveAnalysisResult);

/**
 * GET /api/auth/favorite-palettes
 * 获取收藏的调色板
 */
router.get('/favorite-palettes', requireAuth, authController.getFavoritePalettes);

/**
 * POST /api/auth/favorite-palettes
 * 保存收藏调色板
 */
router.post('/favorite-palettes', requireAuth, authController.saveFavoritePalette);

// ==================== 高级功能路由（需要会员权限） ====================

/**
 * GET /api/auth/premium-analysis-history
 * 获取高级分析历史（需要Premium权限）
 */
router.get('/premium-analysis-history', 
  requireAuth, 
  requirePermission(PermissionLevel.PREMIUM), 
  authController.getAnalysisHistory
);

/**
 * POST /api/auth/ai-analysis
 * AI分析功能（需要Premium权限）
 */
router.post('/ai-analysis', 
  requireAuth, 
  requirePermission(PermissionLevel.PREMIUM), 
  authController.saveAnalysisResult
);

// ==================== VIP专属路由 ====================

/**
 * GET /api/auth/vip-features
 * VIP专属功能（需要VIP权限）
 */
router.get('/vip-features', 
  requireAuth, 
  requirePermission(PermissionLevel.VIP), 
  (req, res) => {
    res.json({
      success: true,
      message: 'VIP功能访问成功',
      data: {
        features: [
          'unlimited_analysis',
          'priority_support', 
          'api_access',
          'custom_branding'
        ]
      }
    });
  }
);

// ==================== 路由错误处理 ====================

/**
 * 404处理 - 未找到的认证路由
 */
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: '认证API路由不存在',
    code: 'AUTH_ROUTE_NOT_FOUND',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

/**
 * 认证路由错误处理中间件
 */
router.use((err: any, req: any, res: any, next: any) => {
  console.error('认证路由错误:', err);

  // JWT相关错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: '无效的访问令牌',
      code: 'INVALID_JWT_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: '访问令牌已过期',
      code: 'JWT_TOKEN_EXPIRED'
    });
  }

  // 数据库相关错误
  if (err.code === '23505') { // PostgreSQL唯一约束错误
    return res.status(409).json({
      success: false,
      error: '邮箱或用户名已被使用',
      code: 'DUPLICATE_USER_DATA'
    });
  }

  if (err.code === '23503') { // PostgreSQL外键约束错误
    return res.status(400).json({
      success: false,
      error: '关联数据不存在',
      code: 'FOREIGN_KEY_VIOLATION'
    });
  }

  // 验证错误
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: err.message,
      code: 'VALIDATION_ERROR',
      details: err.details
    });
  }

  // 权限错误
  if (err.code === 'INSUFFICIENT_PERMISSIONS') {
    return res.status(403).json({
      success: false,
      error: err.message,
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }

  // 速率限制错误
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      error: '请求过于频繁，请稍后再试',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }

  // 默认错误响应
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? '认证服务内部错误' : err.message,
    code: 'AUTH_INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
});

export default router;
