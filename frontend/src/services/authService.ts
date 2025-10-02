/**
 * 前端认证服务
 */

import { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  UpdateUserRequest,
  ChangePasswordRequest,
  LoginResponse,
  RegisterResponse,
  ApiResponse,
  AnalysisHistory,
  FavoritePalette,
  PaginationParams,
  PaginatedResponse
} from '@/types/auth';
import { apiClient } from '@/services/api/apiClient';

class AuthService {
  private readonly TOKEN_KEY = 'colormagic_token';
  private readonly REFRESH_TOKEN_KEY = 'colormagic_refresh_token';
  private readonly USER_KEY = 'colormagic_user';

  /**
   * 用户注册
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await apiClient.post<any>('/auth/register', data);
      
      if (!response.success) {
        throw new Error(response.error?.message || '注册失败');
      }
      
      if (response.data) {
        this.setTokens(response.data.token);
        this.setUser(response.data.user);
      }
      
      return {
        success: true,
        data: response.data,
        message: '注册成功',
        timestamp: response.timestamp || new Date().toISOString()
      };
    } catch (error) {
      console.error('注册失败:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * 用户登录
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<any>('/auth/login', data);
      
      if (!response.success) {
        throw new Error(response.error?.message || '登录失败');
      }
      
      if (response.data) {
        this.setTokens(response.data.token, response.data.refresh_token);
        this.setUser(response.data.user);
      }
      
      return {
        success: true,
        data: response.data,
        message: '登录成功',
        timestamp: response.timestamp || new Date().toISOString()
      };
    } catch (error) {
      console.error('登录失败:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    try {
      // 调用后端登出接口
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.warn('后端登出失败:', error);
    } finally {
      // 无论后端是否成功，都清除本地存储
      this.clearAuthData();
    }
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<any>('/auth/profile');
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || '获取用户信息失败');
      }
      
      this.setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * 更新用户信息
   */
  async updateUser(data: UpdateUserRequest): Promise<User> {
    try {
      const response = await apiClient.put<any>('/auth/profile', data);
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || '更新用户信息失败');
      }
      
      this.setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error('更新用户信息失败:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * 修改密码
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    try {
      const response = await apiClient.post<any>('/auth/change-password', data);
      
      if (!response.success) {
        throw new Error(response.error?.message || '修改密码失败');
      }
      
      // 密码修改成功后需要重新登录
      this.clearAuthData();
    } catch (error) {
      console.error('修改密码失败:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * 刷新访问令牌
   */
  async refreshToken(): Promise<string> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('没有刷新令牌');
      }

      const response = await apiClient.post<any>('/auth/refresh', {
        refresh_token: refreshToken
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || '刷新令牌失败');
      }

      this.setTokens(response.data.token);
      return response.data.token;
    } catch (error) {
      console.error('刷新令牌失败:', error);
      this.clearAuthData();
      throw this.handleAuthError(error);
    }
  }

  /**
   * 获取分析历史
   */
  async getAnalysisHistory(params: PaginationParams): Promise<PaginatedResponse<AnalysisHistory>> {
    try {
      const response = await apiClient.get<any>(
        '/auth/analysis-history',
        { params }
      );

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || '获取分析历史失败');
      }

      return response.data;
    } catch (error) {
      console.error('获取分析历史失败:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * 保存分析结果
   */
  async saveAnalysisResult(analysisData: {
    image_url?: string;
    image_hash?: string;
    analysis_result: any;
    analysis_type: 'basic' | 'advanced' | 'ai_powered';
    processing_time_ms?: number;
    tags?: string[];
  }): Promise<AnalysisHistory> {
    try {
      const response = await apiClient.post<any>(
        '/auth/analysis-history',
        analysisData
      );

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || '保存分析结果失败');
      }

      return response.data.analysis;
    } catch (error) {
      console.error('保存分析结果失败:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * 获取收藏调色板
   */
  async getFavoritePalettes(params: PaginationParams): Promise<PaginatedResponse<FavoritePalette>> {
    try {
      const response = await apiClient.get<any>(
        '/auth/favorite-palettes',
        { params }
      );

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || '获取收藏调色板失败');
      }

      return response.data;
    } catch (error) {
      console.error('获取收藏调色板失败:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * 保存收藏调色板
   */
  async saveFavoritePalette(paletteData: {
    palette_name: string;
    colors: any[];
    source_type?: 'manual' | 'extracted' | 'ai_generated';
    source_image_url?: string;
    tags?: string[];
    is_public?: boolean;
  }): Promise<FavoritePalette> {
    try {
      const response = await apiClient.post<any>(
        '/auth/favorite-palettes',
        paletteData
      );

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || '保存调色板失败');
      }

      return response.data.palette;
    } catch (error) {
      console.error('保存调色板失败:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * 验证邮箱
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      const response = await apiClient.get<any>(`/auth/verify-email?token=${token}`);
      
      if (!response.success) {
        throw new Error(response.error?.message || '邮箱验证失败');
      }
    } catch (error) {
      console.error('邮箱验证失败:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * 发送密码重置邮件
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      const response = await apiClient.post<any>('/auth/forgot-password', { email });
      
      if (!response.success) {
        throw new Error(response.error?.message || '发送密码重置邮件失败');
      }
    } catch (error) {
      console.error('发送密码重置邮件失败:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * 重置密码
   */
  async resetPassword(token: string, newPassword: string, confirmPassword: string): Promise<void> {
    try {
      const response = await apiClient.post<any>('/auth/reset-password', {
        token,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      
      if (!response.success) {
        throw new Error(response.error?.message || '密码重置失败');
      }
    } catch (error) {
      console.error('密码重置失败:', error);
      throw this.handleAuthError(error);
    }
  }

  // ==================== Token管理方法 ====================

  /**
   * 获取访问令牌
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * 获取刷新令牌
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * 设置令牌
   */
  setTokens(token: string, refreshToken?: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    if (refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  /**
   * 获取存储的用户信息
   */
  getStoredUser(): User | null {
    try {
      const userStr = localStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('解析存储的用户信息失败:', error);
      return null;
    }
  }

  /**
   * 设置用户信息
   */
  setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * 检查是否已认证
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * 清除认证数据
   */
  clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * 检查令牌是否即将过期
   */
  isTokenExpiringSoon(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // 转换为毫秒
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      
      return exp - now < fiveMinutes;
    } catch (error) {
      console.error('解析token失败:', error);
      return true;
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 处理认证错误
   */
  private handleAuthError(error: any): Error {
    if (error?.response?.data?.error) {
      return new Error(error.response.data.error);
    }
    
    if (error?.response?.status === 401) {
      this.clearAuthData();
      return new Error('登录已过期，请重新登录');
    }
    
    if (error?.response?.status === 403) {
      return new Error('权限不足，无法执行此操作');
    }
    
    if (error?.response?.status >= 500) {
      return new Error('服务器错误，请稍后重试');
    }
    
    return error instanceof Error ? error : new Error('未知错误');
  }
}

// 导出单例实例
export const authService = new AuthService();
export default authService;
