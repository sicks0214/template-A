// API接口类型定义

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  timestamp: string
  path: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApiError {
  code: string
  message: string
  details?: any
  timestamp: string
}

// 认证相关类型
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
  expiresIn: number
}

// 用户相关类型
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'user' | 'admin'
  createdAt: string
  updatedAt: string
  preferences: UserPreferences
}

export interface UserPreferences {
  language: string
  theme: 'light' | 'dark'
  notifications: boolean
  timezone: string
}

export interface UpdateUserRequest {
  name?: string
  email?: string
  avatar?: string
  preferences?: Partial<UserPreferences>
}

// 插件相关类型
export interface Plugin {
  id: string
  name: string
  version: string
  description: string
  author: string
  category: string
  tags: string[]
  icon?: string
  homepage?: string
  repository?: string
  license: string
  dependencies?: string[]
  permissions?: string[]
  isInstalled: boolean
  isEnabled: boolean
  isCompatible: boolean
  createdAt: string
  updatedAt: string
  downloads: number
  rating: number
  reviews: number
}

export interface InstallPluginRequest {
  pluginId: string
  version?: string
}

export interface UpdatePluginRequest {
  pluginId: string
  version: string
}

// 文件上传类型
export interface FileUploadResponse {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  createdAt: string
}

// 通用查询参数
export interface QueryParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
  search?: string
  filter?: Record<string, any>
}

// WebSocket消息类型
export interface WebSocketMessage<T = any> {
  type: string
  data: T
  timestamp: string
  userId?: string
}

export interface WebSocketEvent {
  connect: void
  disconnect: void
  message: WebSocketMessage
  error: string
} 