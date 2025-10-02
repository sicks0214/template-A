/**
 * 初始化新认证系统
 * 
 * 这个文件负责初始化所有认证相关的组件
 */

import { Pool } from 'pg';
import { AuthService } from './services/auth/authService';
import { AuthController } from './controllers/authController';
import { createAuthRouter } from './routes/auth';

export function initAuthSystem(pool: Pool) {
  console.log('🔐 初始化认证系统...');

  // 1. 创建认证服务
  const authService = new AuthService(pool);

  // 2. 创建认证控制器
  const authController = new AuthController(authService);

  // 3. 创建认证路由
  const authRouter = createAuthRouter(authController);

  console.log('✅ 认证系统初始化完成');

  return {
    authService,
    authController,
    authRouter
  };
}

