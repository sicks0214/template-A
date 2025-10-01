/**
 * 用户认证系统类型定义
 */

import { Request } from 'express';

// 用户基础信息接口
export interface User {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  status: 'active' | 'suspended' | 'deleted';
  email_verified: boolean;
  subscription_type: 'free' | 'premium' | 'vip';
  subscription_expires_at?: Date;
  preferences: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
  login_count: number;
}

// 用户创建请求接口
export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  display_name?: string;
  avatar_url?: string;
}

// 用户登录请求接口
export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

// 用户注册请求接口
export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  confirm_password: string;
  display_name?: string;
  agree_to_terms: boolean;
}

// 密码重置请求接口
export interface PasswordResetRequest {
  email: string;
}

// 密码重置确认接口
export interface PasswordResetConfirmRequest {
  token: string;
  new_password: string;
  confirm_password: string;
}

// 用户更新请求接口
export interface UpdateUserRequest {
  display_name?: string;
  avatar_url?: string;
  preferences?: Record<string, any>;
}

// 修改密码请求接口
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// JWT载荷接口
export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
  subscription_type: string;
  iat?: number;
  exp?: number;
}

// 认证后的请求接口
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    subscription_type: string;
  };
}

// 用户会话接口
export interface UserSession {
  id: string;
  user_id: string;
  token_hash: string;
  refresh_token_hash?: string;
  expires_at: Date;
  refresh_expires_at: Date;
  ip_address?: string;
  user_agent?: string;
  device_info?: Record<string, any>;
  is_active: boolean;
  created_at: Date;
  last_used_at: Date;
}

// 用户分析历史接口
export interface UserAnalysisHistory {
  id: string;
  user_id: string;
  image_url?: string;
  image_hash?: string;
  analysis_result: Record<string, any>;
  analysis_type: 'basic' | 'advanced' | 'ai_powered';
  processing_time_ms?: number;
  is_public: boolean;
  tags: string[];
  created_at: Date;
}

// 用户收藏调色板接口
export interface UserFavoritePalette {
  id: string;
  user_id: string;
  palette_name: string;
  colors: Array<{
    hex: string;
    name?: string;
    rgb?: { r: number; g: number; b: number };
    hsl?: { h: number; s: number; l: number };
  }>;
  source_type: 'manual' | 'extracted' | 'ai_generated';
  source_image_url?: string;
  tags: string[];
  is_public: boolean;
  likes_count: number;
  created_at: Date;
  updated_at: Date;
}

// 用户使用统计接口
export interface UserUsageStats {
  id: string;
  user_id: string;
  date: Date;
  analyses_count: number;
  ai_analyses_count: number;
  palettes_created: number;
  palettes_shared: number;
  created_at: Date;
}

// API响应基础接口
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// 登录响应接口
export interface LoginResponse {
  user: Omit<User, 'password_hash'>;
  token: string;
  refresh_token?: string;
  expires_in: number;
}

// 分页参数接口
export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// 分页响应接口
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// 权限级别枚举
export enum PermissionLevel {
  GUEST = 'guest',
  AUTHENTICATED = 'authenticated', 
  PREMIUM = 'premium',
  VIP = 'vip',
  ADMIN = 'admin'
}

// 功能权限配置接口
export interface FeaturePermissions {
  basic_analysis: boolean;
  ai_analysis: boolean;
  save_history: boolean;
  create_palettes: boolean;
  share_palettes: boolean;
  unlimited_analysis: boolean;
  priority_support: boolean;
  api_access: boolean;
}

// 订阅计划接口
export interface SubscriptionPlan {
  type: 'free' | 'premium' | 'vip';
  name: string;
  price: number;
  duration: number; // 天数
  features: FeaturePermissions;
  limits: {
    daily_analyses: number;
    daily_ai_analyses: number;
    saved_palettes: number;
    history_retention_days: number;
  };
}

// 验证错误接口
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// 批量操作请求接口
export interface BatchOperationRequest {
  action: 'delete' | 'update' | 'export';
  ids: string[];
  data?: Record<string, any>;
}

// OAuth提供商配置接口
export interface OAuthProvider {
  name: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  scope: string[];
  authorize_url: string;
  token_url: string;
  user_info_url: string;
}

// OAuth用户信息接口
export interface OAuthUserInfo {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  provider: string;
}

// 安全日志接口
export interface SecurityLog {
  id: string;
  user_id?: string;
  action: string;
  ip_address?: string;
  user_agent?: string;
  details: Record<string, any>;
  risk_level: 'low' | 'medium' | 'high';
  created_at: Date;
}
