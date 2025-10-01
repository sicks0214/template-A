// 共享常量定义

// 应用常量
export const APP_CONSTANTS = {
  NAME: '通用Web应用框架',
  VERSION: '2.0.0',
  DESCRIPTION: '现代化Web应用开发框架',
  AUTHOR: 'Framework Team'
} as const

// API常量
export const API_CONSTANTS = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001',
  TIMEOUT: 10000,
  RETRY_TIMES: 3,
  RETRY_DELAY: 1000
} as const

// 认证常量
export const AUTH_CONSTANTS = {
  TOKEN_KEY: 'access_token',
  REFRESH_TOKEN_KEY: 'refresh_token',
  TOKEN_EXPIRY: 3600, // 1小时
  REFRESH_TOKEN_EXPIRY: 604800 // 7天
} as const

// 插件常量
export const PLUGIN_CONSTANTS = {
  MARKETPLACE_URL: 'https://plugins.framework.com',
  MAX_PLUGIN_SIZE: 50 * 1024 * 1024, // 50MB
  SUPPORTED_CATEGORIES: [
    'ui',
    'data-visualization',
    'form',
    'chart',
    'utility',
    'integration'
  ] as const
} as const

// 国际化常量
export const I18N_CONSTANTS = {
  DEFAULT_LOCALE: 'zh',
  SUPPORTED_LOCALES: ['zh', 'en', 'ko', 'ja', 'fr', 'ru', 'de'] as const,
  FALLBACK_LOCALE: 'en',
  NAMESPACE_SEPARATOR: '.',
  MISSING_KEY_PREFIX: 'MISSING_'
} as const

// 文件上传常量
export const FILE_CONSTANTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  UPLOAD_PATH: '/uploads'
} as const

// 分页常量
export const PAGINATION_CONSTANTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100] as const
} as const

// 缓存常量
export const CACHE_CONSTANTS = {
  DEFAULT_TTL: 300, // 5分钟
  MAX_CACHE_SIZE: 100,
  CACHE_PREFIX: 'app_cache_'
} as const

// 错误代码常量
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR'
} as const

// 用户角色常量
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator'
} as const

// 主题常量
export const THEME_CONSTANTS = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
} as const

// 状态常量
export const STATUS_CONSTANTS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  SUSPENDED: 'suspended'
} as const

// 导出所有常量
export default {
  APP_CONSTANTS,
  API_CONSTANTS,
  AUTH_CONSTANTS,
  PLUGIN_CONSTANTS,
  I18N_CONSTANTS,
  FILE_CONSTANTS,
  PAGINATION_CONSTANTS,
  CACHE_CONSTANTS,
  ERROR_CODES,
  USER_ROLES,
  THEME_CONSTANTS,
  STATUS_CONSTANTS
} 