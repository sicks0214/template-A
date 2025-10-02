/**
 * 认证控制器 - 新版本
 */

import { Request, Response } from 'express';
import { AuthService } from '../services/auth/authService';

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
    console.log('🎮 认证控制器初始化完成');
  }

  /**
   * 用户注册
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, email, password, displayName } = req.body;

      // 验证必需字段
      if (!username || !email || !password) {
        res.status(400).json({
          success: false,
          message: '缺少必需字段：用户名、邮箱和密码'
        });
        return;
      }

      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          message: '邮箱格式不正确'
        });
        return;
      }

      // 验证密码长度
      if (password.length < 6) {
        res.status(400).json({
          success: false,
          message: '密码长度至少为6个字符'
        });
        return;
      }

      // 验证用户名长度
      if (username.length < 3 || username.length > 20) {
        res.status(400).json({
          success: false,
          message: '用户名长度应在3-20个字符之间'
        });
        return;
      }

      console.log(`📝 收到注册请求: ${email}`);

      // 调用服务层
      const result = await this.authService.register({
        username,
        email,
        password,
        displayName
      });

      console.log(`✅ 注册成功: ${email}`);

      res.status(201).json({
        success: true,
        message: '注册成功',
        data: {
          user: result.user,
          token: result.token,
          refreshToken: result.refreshToken
        }
      });
    } catch (error: any) {
      console.error('❌ 注册失败:', error.message);
      
      res.status(400).json({
        success: false,
        message: error.message || '注册失败，请稍后重试'
      });
    }
  };

  /**
   * 用户登录
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, rememberMe } = req.body;

      // 验证必需字段
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: '缺少必需字段：邮箱和密码'
        });
        return;
      }

      console.log(`🔑 收到登录请求: ${email}`);

      // 调用服务层
      const result = await this.authService.login({
        email,
        password,
        rememberMe: rememberMe || false
      });

      console.log(`✅ 登录成功: ${email}`);

      res.status(200).json({
        success: true,
        message: '登录成功',
        data: {
          user: result.user,
          token: result.token,
          refreshToken: result.refreshToken
        }
      });
    } catch (error: any) {
      console.error('❌ 登录失败:', error.message);
      
      res.status(401).json({
        success: false,
        message: error.message || '登录失败，请检查邮箱和密码'
      });
    }
  };

  /**
   * 获取当前用户信息
   */
  getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
      // 从中间件注入的用户信息
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: '未授权'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { user }
      });
    } catch (error: any) {
      console.error('❌ 获取用户信息失败:', error.message);
      
      res.status(500).json({
        success: false,
        message: '获取用户信息失败'
      });
    }
  };

  /**
   * 用户登出
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      // 这里可以将 token 加入黑名单（如果需要）
      
      res.status(200).json({
        success: true,
        message: '登出成功'
      });
    } catch (error: any) {
      console.error('❌ 登出失败:', error.message);
      
      res.status(500).json({
        success: false,
        message: '登出失败'
      });
    }
  };
}

