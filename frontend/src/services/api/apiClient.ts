/**
 * 统一API客户端 - 第一阶段
 * 提供统一的HTTP请求接口，包含错误处理、重试机制等
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    timestamp?: string;
  };
  timestamp?: string;
}

export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class ApiClient {
  public readonly baseURL: string;
  private readonly defaultTimeout = 30000; // 30秒
  private readonly defaultRetries = 2;
  private readonly defaultRetryDelay = 1000; // 1秒

  constructor(baseURL: string = '') {
    // 确定API基础URL
    if (baseURL.startsWith('/')) {
      // 相对路径，使用当前域名
      const protocol = window.location.protocol;
      const host = window.location.host;
      this.baseURL = `${protocol}//${host}${baseURL}`;
    } else {
      this.baseURL = baseURL;
    }

    console.log(`🌐 API客户端初始化: ${this.baseURL}`);
  }

  /**
   * GET请求
   */
  async get<T = any>(
    endpoint: string, 
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.request('GET', endpoint, undefined, config);
  }

  /**
   * POST请求
   */
  async post<T = any>(
    endpoint: string, 
    data?: any, 
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.request('POST', endpoint, data, config);
  }

  /**
   * PUT请求
   */
  async put<T = any>(
    endpoint: string, 
    data?: any, 
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.request('PUT', endpoint, data, config);
  }

  /**
   * DELETE请求
   */
  async delete<T = any>(
    endpoint: string, 
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.request('DELETE', endpoint, undefined, config);
  }

  /**
   * 核心请求方法
   */
  private async request<T = any>(
    method: string,
    endpoint: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      headers = {},
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      retryDelay = this.defaultRetryDelay
    } = config;

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    
    let lastError: Error | null = null;

    // 重试逻辑
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`🚀 API请求 [${attempt + 1}/${retries + 1}]: ${method} ${url}`);

        const response = await this.executeRequest(method, url, data, headers, timeout);
        
        console.log(`✅ API请求成功: ${method} ${url}`);
        return response;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('未知错误');
        
        console.warn(`⚠️ API请求失败 [${attempt + 1}/${retries + 1}]: ${lastError.message}`);

        // 如果不是最后一次尝试，等待后重试
        if (attempt < retries) {
          console.log(`⏳ ${retryDelay}ms后重试...`);
          await this.delay(retryDelay);
          continue;
        }
      }
    }

    // 所有重试都失败了
    console.error(`❌ API请求彻底失败: ${method} ${url}`, lastError);
    
    return {
      success: false,
      error: {
        code: 'REQUEST_FAILED',
        message: lastError?.message || '网络请求失败',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * 执行单次请求
   */
  private async executeRequest<T = any>(
    method: string,
    url: string,
    data: any,
    headers: Record<string, string>,
    timeout: number
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // 构建请求配置
      const requestConfig: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        signal: controller.signal
      };

      // 添加请求体（除了GET和DELETE）
      if (data && !['GET', 'DELETE'].includes(method)) {
        if (data instanceof FormData) {
          // FormData自动设置Content-Type
          delete requestConfig.headers!['Content-Type'];
          requestConfig.body = data;
        } else {
          requestConfig.body = JSON.stringify(data);
        }
      }

      // 发送请求
      const response = await fetch(url, requestConfig);
      clearTimeout(timeoutId);

      // 解析响应
      const responseData = await this.parseResponse(response);

      return responseData;

    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`请求超时 (${timeout}ms)`);
      }

      throw error;
    }
  }

  /**
   * 解析响应数据
   */
  private async parseResponse<T = any>(response: Response): Promise<ApiResponse<T>> {
    try {
      // 检查响应状态
      if (!response.ok) {
        const errorText = await response.text();
        let errorData: any;

        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || `HTTP ${response.status}` };
        }

        return {
          success: false,
          error: {
            code: errorData.error?.code || `HTTP_${response.status}`,
            message: errorData.error?.message || errorData.message || `请求失败: ${response.status}`,
            details: errorData.error?.details,
            timestamp: new Date().toISOString()
          }
        };
      }

      // 解析JSON响应
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const jsonData = await response.json();
        return jsonData;
      }

      // 非JSON响应
      const textData = await response.text();
      return {
        success: true,
        data: textData as T,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PARSE_ERROR',
          message: '响应解析失败',
          details: error instanceof Error ? error.message : '未知错误',
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 设置全局请求头
   */
  setGlobalHeader(key: string, value: string): void {
    // 这里可以实现全局请求头设置
    console.log(`🔧 设置全局请求头: ${key}=${value}`);
  }

  /**
   * 清除全局请求头
   */
  clearGlobalHeader(key: string): void {
    // 这里可以实现全局请求头清除
    console.log(`🧹 清除全局请求头: ${key}`);
  }

  /**
   * 获取完整URL
   */
  getFullUrl(endpoint: string): string {
    return endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
  }
}

// 创建带认证支持的API客户端
class AuthenticatedApiClient extends ApiClient {
  private authToken: string | null = null;

  /**
   * 设置认证token
   */
  setAuthToken(token: string | null): void {
    this.authToken = token;
    if (token) {
      console.log('🔐 设置认证token');
    } else {
      console.log('🔓 清除认证token');
    }
  }

  /**
   * 获取认证token
   */
  getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * 重写请求方法，自动添加认证头
   */
  protected async executeRequest<T = any>(
    method: string,
    url: string,
    data: any,
    headers: Record<string, string>,
    timeout: number
  ): Promise<ApiResponse<T>> {
    // 自动添加认证头
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return super['executeRequest'](method, url, data, headers, timeout);
  }
}

// 导出默认API客户端实例
export const defaultApiClient = new ApiClient();

// 导出认证API客户端实例
export const apiClient = new AuthenticatedApiClient('/api');

// 初始化时从localStorage获取token
const storedToken = localStorage.getItem('colormagic_token');
if (storedToken) {
  apiClient.setAuthToken(storedToken);
}
