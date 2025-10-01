/**
 * 前端认证相关类型定义
 */

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
  subscription_expires_at?: string;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  login_count: number;
}

// 登录请求接口
export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

// 注册请求接口
export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  confirm_password: string;
  display_name?: string;
  agree_to_terms: boolean;
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

// 认证状态接口
export interface AuthState {
  user: User | null;
  token: string | null;
  refresh_token?: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// 登录响应接口
export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    refresh_token?: string;
    expires_in: number;
  };
  timestamp: string;
}

// 注册响应接口
export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
  timestamp: string;
}

// API响应基础接口
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  timestamp: string;
}

// 分析历史接口
export interface AnalysisHistory {
  id: string;
  user_id: string;
  image_url?: string;
  image_hash?: string;
  analysis_result: Record<string, any>;
  analysis_type: 'basic' | 'advanced' | 'ai_powered';
  processing_time_ms?: number;
  is_public: boolean;
  tags: string[];
  created_at: string;
}

// 收藏调色板接口
export interface FavoritePalette {
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
  created_at: string;
  updated_at: string;
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

// 表单验证错误接口
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// 模态框状态接口
export interface ModalState {
  isLoginOpen: boolean;
  isRegisterOpen: boolean;
  isProfileOpen: boolean;
  isForgotPasswordOpen: boolean;
}

// OAuth提供商接口
export interface OAuthProvider {
  name: string;
  displayName: string;
  icon: string;
  color: string;
}

// 用户统计接口
export interface UserStats {
  total_analyses: number;
  ai_analyses: number;
  saved_palettes: number;
  public_palettes: number;
  account_age_days: number;
  last_activity: string;
}

// 通知接口
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

// 会员功能提示接口
export interface PremiumPrompt {
  feature: string;
  title: string;
  description: string;
  benefits: string[];
  cta: string;
}

// 用户偏好设置接口
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: {
    email: boolean;
    browser: boolean;
    marketing: boolean;
  };
  privacy: {
    public_profile: boolean;
    public_palettes: boolean;
    analytics: boolean;
  };
  ui: {
    sidebar_collapsed: boolean;
    grid_view: boolean;
    animation_enabled: boolean;
  };
}

// 安全设置接口
export interface SecuritySettings {
  two_factor_enabled: boolean;
  login_notifications: boolean;
  session_timeout: number;
  trusted_devices: Array<{
    id: string;
    name: string;
    last_used: string;
    is_current: boolean;
  }>;
}

// 账户活动接口
export interface AccountActivity {
  id: string;
  action: string;
  description: string;
  ip_address?: string;
  user_agent?: string;
  location?: string;
  created_at: string;
  risk_level: 'low' | 'medium' | 'high';
}

// 导出工具类型
export type AuthAction = 
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string; refresh_token?: string } }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'REGISTER_START' }
  | { type: 'REGISTER_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'REGISTER_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' };

// 表单字段类型
export type FormField = 'email' | 'username' | 'password' | 'confirm_password' | 'display_name';

// 验证规则类型
export type ValidationRule = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
};

// 表单配置类型
export type FormConfig = {
  [K in FormField]?: ValidationRule;
};
