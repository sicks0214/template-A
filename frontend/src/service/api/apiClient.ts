export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface ApiConfig {
  baseURL: string
  timeout: number
  headers: Record<string, string>
}

export class ApiClient {
  private config: ApiConfig
  
  constructor(config: Partial<ApiConfig> = {}) {
    this.config = {
      baseURL: config.baseURL || '/api',
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      }
    }
  }
  
  // 通用请求方法
  async request<T>(
    method: string,
    url: string,
    data?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const fullUrl = `${this.config.baseURL}${url}`
      const requestOptions: RequestInit = {
        method,
        headers: {
          ...this.config.headers,
          ...options?.headers
        },
        ...options
      }
      
      if (data && method !== 'GET') {
        requestOptions.body = JSON.stringify(data)
      }
      
      const response = await fetch(fullUrl, requestOptions)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}`)
      }
      
      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '请求失败'
      }
    }
  }
  
  // GET请求
  async get<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>('GET', url, undefined, options)
  }
  
  // POST请求
  async post<T>(url: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>('POST', url, data, options)
  }
  
  // PUT请求
  async put<T>(url: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', url, data, options)
  }
  
  // DELETE请求
  async delete<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', url, undefined, options)
  }
  
  // 设置认证token
  setAuthToken(token: string): void {
    this.config.headers['Authorization'] = `Bearer ${token}`
  }
  
  // 清除认证token
  clearAuthToken(): void {
    delete this.config.headers['Authorization']
  }
}

// 创建默认API客户端实例
export const apiClient = new ApiClient() 