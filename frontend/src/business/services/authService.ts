import { User } from '../../data/models/User'
import { API_CONFIG } from '../../config/api'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export class AuthService {
  // 用户登录
  static async login(credentials: LoginCredentials): Promise<User> {
    try {
      // 这里应该调用API服务层的登录接口
      const response = await fetch(`${API_CONFIG.baseURL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })
      
      if (!response.ok) {
        throw new Error('登录失败')
      }
      
      const user = await response.json()
      return user
    } catch (error) {
      throw new Error(`登录失败: ${error}`)
    }
  }
  
  // 用户注册
  static async register(data: RegisterData): Promise<User> {
    try {
      // 验证密码确认
      if (data.password !== data.confirmPassword) {
        throw new Error('密码确认不匹配')
      }
      
      const response = await fetch(`${API_CONFIG.baseURL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        throw new Error('注册失败')
      }
      
      const user = await response.json()
      return user
    } catch (error) {
      throw new Error(`注册失败: ${error}`)
    }
  }
  
  // 用户登出
  static async logout(): Promise<void> {
    try {
      await fetch(`${API_CONFIG.baseURL}/api/auth/logout`, {
        method: 'POST'
      })
    } catch (error) {
      console.error('登出失败:', error)
    }
  }
  
  // 检查用户认证状态
  static async checkAuth(): Promise<User | null> {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/auth/me`)
      if (response.ok) {
        return await response.json()
      }
      return null
    } catch (error) {
      return null
    }
  }
} 