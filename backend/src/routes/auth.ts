/**
 * 认证路由 - 新版本
 */

import express from 'express';
import { AuthController } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

export function createAuthRouter(authController: AuthController) {
  const router = express.Router();

  console.log('🛣️ 初始化认证路由');

  // 公开路由（无需认证）
  router.post('/register', authController.register);
  router.post('/login', authController.login);

  // 受保护路由（需要认证）
  router.get('/me', authMiddleware, authController.getCurrentUser);
  router.post('/logout', authMiddleware, authController.logout);

  console.log('✅ 认证路由注册完成:');
  console.log('  - POST /api/auth/register (公开)');
  console.log('  - POST /api/auth/login (公开)');
  console.log('  - GET  /api/auth/me (受保护)');
  console.log('  - POST /api/auth/logout (受保护)');

  return router;
}

