/**
 * 用户认证控制器
 */

import { Response } from 'express';
import { AuthenticatedRequest, RegisterRequest, LoginRequest, ChangePasswordRequest, UpdateUserRequest } from '../types/auth';
import { AuthService } from '../services/auth/authService';
import { getClientInfo } from '../middleware/auth';
import { getDatabaseService } from '../services/database/databaseServiceFactory';

export class AuthController {
  private authService: AuthService;

  constructor() {
    const dbService = getDatabaseService();
    this.authService = new AuthService(dbService as any);
  }

  /**
   * 用户注册
   */
  register = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const registerData: RegisterRequest = req.body;

      // 基础验证
      if (!registerData.email || !registerData.username || !registerData.password) {
        return res.status(400).json({
          success: false,
          error: '邮箱、用户名和密码不能为空',
          code: 'MISSING_REQUIRED_FIELDS'
        });
      }

      const result = await this.authService.register(registerData);

      res.status(201).json({
        success: true,
        message: '注册成功',
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('注册失败:', error);
      
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '注册失败',
        code: 'REGISTRATION_FAILED',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 用户登录
   */
  login = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const loginData: LoginRequest = req.body;

      // 基础验证
      if (!loginData.email || !loginData.password) {
        return res.status(400).json({
          success: false,
          error: '邮箱和密码不能为空',
          code: 'MISSING_CREDENTIALS'
        });
      }

      const clientInfo = getClientInfo(req);
      const result = await this.authService.login(loginData, clientInfo);

      res.json({
        success: true,
        message: '登录成功',
        data: {
          user: result.user,
          token: result.token,
          expires_in: 15 * 60, // 15分钟（秒）
          ...(result.refresh_token && { refresh_token: result.refresh_token })
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('登录失败:', error);
      
      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : '登录失败',
        code: 'LOGIN_FAILED',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 获取当前用户信息
   */
  getProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          error: '用户未登录',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const user = await this.authService.getUserById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: '用户不存在',
          code: 'USER_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: { user },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('获取用户信息失败:', error);
      
      res.status(500).json({
        success: false,
        error: '获取用户信息失败',
        code: 'PROFILE_FETCH_FAILED',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 更新用户信息
   */
  updateProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          error: '用户未登录',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const updateData: UpdateUserRequest = req.body;
      const user = await this.authService.updateUser(req.user.id, updateData);

      res.json({
        success: true,
        message: '用户信息更新成功',
        data: { user },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('更新用户信息失败:', error);
      
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '更新用户信息失败',
        code: 'PROFILE_UPDATE_FAILED',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 修改密码
   */
  changePassword = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          error: '用户未登录',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const passwordData: ChangePasswordRequest = req.body;

      // 基础验证
      if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
        return res.status(400).json({
          success: false,
          error: '当前密码、新密码和确认密码不能为空',
          code: 'MISSING_PASSWORD_FIELDS'
        });
      }

      await this.authService.changePassword(req.user.id, passwordData);

      res.json({
        success: true,
        message: '密码修改成功，请重新登录',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('修改密码失败:', error);
      
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '修改密码失败',
        code: 'PASSWORD_CHANGE_FAILED',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 用户登出
   */
  logout = async (req: AuthenticatedRequest, res: Response) => {
    try {
      // TODO: 实现token黑名单或会话失效逻辑
      // 目前客户端删除token即可实现登出

      res.json({
        success: true,
        message: '登出成功',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('登出失败:', error);
      
      res.status(500).json({
        success: false,
        error: '登出失败',
        code: 'LOGOUT_FAILED',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 刷新token
   */
  refreshToken = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          error: '刷新令牌不能为空',
          code: 'MISSING_REFRESH_TOKEN'
        });
      }

      // TODO: 实现refresh token验证和新token生成逻辑

      res.json({
        success: true,
        message: '令牌刷新成功',
        data: {
          token: 'new_access_token',
          expires_in: 15 * 60
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('刷新token失败:', error);
      
      res.status(401).json({
        success: false,
        error: '刷新令牌无效',
        code: 'REFRESH_TOKEN_INVALID',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 获取分析历史
   */
  getAnalysisHistory = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          error: '用户未登录',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

      const result = await this.authService.getAnalysisHistory(req.user.id, { page, limit });

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('获取分析历史失败:', error);
      
      res.status(500).json({
        success: false,
        error: '获取分析历史失败',
        code: 'HISTORY_FETCH_FAILED',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 保存分析结果
   */
  saveAnalysisResult = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          error: '用户未登录',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const analysisData = req.body;

      // 基础验证
      if (!analysisData.analysis_result || !analysisData.analysis_type) {
        return res.status(400).json({
          success: false,
          error: '分析结果和分析类型不能为空',
          code: 'MISSING_ANALYSIS_DATA'
        });
      }

      const result = await this.authService.saveAnalysisHistory(req.user.id, analysisData);

      res.status(201).json({
        success: true,
        message: '分析结果保存成功',
        data: { analysis: result },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('保存分析结果失败:', error);
      
      res.status(500).json({
        success: false,
        error: '保存分析结果失败',
        code: 'SAVE_ANALYSIS_FAILED',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 获取收藏调色板
   */
  getFavoritePalettes = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          error: '用户未登录',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

      const result = await this.authService.getFavoritePalettes(req.user.id, { page, limit });

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('获取收藏调色板失败:', error);
      
      res.status(500).json({
        success: false,
        error: '获取收藏调色板失败',
        code: 'FAVORITES_FETCH_FAILED',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 保存收藏调色板
   */
  saveFavoritePalette = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          error: '用户未登录',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const paletteData = req.body;

      // 基础验证
      if (!paletteData.palette_name || !paletteData.colors || !Array.isArray(paletteData.colors)) {
        return res.status(400).json({
          success: false,
          error: '调色板名称和颜色数组不能为空',
          code: 'MISSING_PALETTE_DATA'
        });
      }

      const result = await this.authService.saveFavoritePalette(req.user.id, paletteData);

      res.status(201).json({
        success: true,
        message: '调色板保存成功',
        data: { palette: result },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('保存调色板失败:', error);
      
      res.status(500).json({
        success: false,
        error: '保存调色板失败',
        code: 'SAVE_PALETTE_FAILED',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 验证邮箱
   */
  verifyEmail = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: '验证令牌不能为空',
          code: 'MISSING_VERIFICATION_TOKEN'
        });
      }

      // TODO: 实现邮箱验证逻辑

      res.json({
        success: true,
        message: '邮箱验证成功',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('邮箱验证失败:', error);
      
      res.status(400).json({
        success: false,
        error: '邮箱验证失败',
        code: 'EMAIL_VERIFICATION_FAILED',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 发送密码重置邮件
   */
  forgotPassword = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: '邮箱地址不能为空',
          code: 'MISSING_EMAIL'
        });
      }

      // TODO: 实现密码重置邮件发送逻辑

      res.json({
        success: true,
        message: '密码重置邮件已发送，请查收',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('发送密码重置邮件失败:', error);
      
      res.status(500).json({
        success: false,
        error: '发送密码重置邮件失败',
        code: 'PASSWORD_RESET_EMAIL_FAILED',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * 重置密码
   */
  resetPassword = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { token, new_password, confirm_password } = req.body;

      if (!token || !new_password || !confirm_password) {
        return res.status(400).json({
          success: false,
          error: '重置令牌、新密码和确认密码不能为空',
          code: 'MISSING_RESET_DATA'
        });
      }

      if (new_password !== confirm_password) {
        return res.status(400).json({
          success: false,
          error: '两次输入的密码不一致',
          code: 'PASSWORD_MISMATCH'
        });
      }

      // TODO: 实现密码重置逻辑

      res.json({
        success: true,
        message: '密码重置成功，请使用新密码登录',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('密码重置失败:', error);
      
      res.status(400).json({
        success: false,
        error: '密码重置失败',
        code: 'PASSWORD_RESET_FAILED',
        timestamp: new Date().toISOString()
      });
    }
  };
}
