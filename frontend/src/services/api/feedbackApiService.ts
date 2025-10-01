/**
 * 反馈API服务 - 第一阶段统一接口管理
 * 处理用户反馈相关的所有API调用
 */

import { ApiClient } from './apiClient';

export interface FeedbackData {
  content: string;
  contact?: string;
  rating?: number;
  category?: string;
}

export interface FeedbackRecord extends FeedbackData {
  id: string;
  timestamp: string;
  userIp?: string;
  userAgent?: string;
}

export interface FeedbackStats {
  total: number;
  categories: Record<string, number>;
  ratings: Record<string, number>;
  recentCount: number;
  avgRating: number;
  topKeywords: Array<{
    keyword: string;
    count: number;
  }>;
}

export class FeedbackApiService {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient('/api/feedback');
  }

  /**
   * 提交用户反馈
   */
  async submitFeedback(feedbackData: FeedbackData): Promise<{
    id: string;
    message: string;
  }> {
    try {
      console.log('💬 提交用户反馈');

      // 验证数据
      this.validateFeedbackData(feedbackData);

      const response = await this.apiClient.post('/submit', feedbackData);

      if (!response.success) {
        throw new Error(response.error?.message || '反馈提交失败');
      }

      console.log('✅ 反馈提交成功:', response.data.id);
      return response.data;

    } catch (error) {
      console.error('❌ 反馈提交失败:', error);
      throw new Error(error instanceof Error ? error.message : '反馈提交失败');
    }
  }

  /**
   * 获取反馈历史（管理员功能）
   */
  async getFeedbackHistory(
    limit: number = 10, 
    category?: string
  ): Promise<{
    history: FeedbackRecord[];
    total: number;
    limit: number;
    category: string;
  }> {
    try {
      console.log('📚 获取反馈历史');

      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      if (category) {
        params.append('category', category);
      }

      const response = await this.apiClient.get(`/history?${params.toString()}`);

      if (!response.success) {
        throw new Error(response.error?.message || '获取反馈历史失败');
      }

      console.log(`✅ 获取反馈历史成功: ${response.data.history.length}条记录`);
      return response.data;

    } catch (error) {
      console.error('❌ 获取反馈历史失败:', error);
      throw new Error(error instanceof Error ? error.message : '获取反馈历史失败');
    }
  }

  /**
   * 获取反馈统计信息
   */
  async getFeedbackStats(): Promise<FeedbackStats> {
    try {
      console.log('📊 获取反馈统计');

      const response = await this.apiClient.get('/stats');

      if (!response.success) {
        throw new Error(response.error?.message || '获取反馈统计失败');
      }

      console.log('✅ 获取反馈统计成功');
      return response.data.stats;

    } catch (error) {
      console.error('❌ 获取反馈统计失败:', error);
      throw new Error(error instanceof Error ? error.message : '获取反馈统计失败');
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{
    service: string;
    status: string;
    totalFeedbacks: number;
    capabilities: string[];
  }> {
    try {
      const response = await this.apiClient.get('/health');
      
      if (!response.success) {
        throw new Error('反馈服务不健康');
      }

      return response.data;

    } catch (error) {
      console.error('❌ 反馈服务健康检查失败:', error);
      throw new Error(error instanceof Error ? error.message : '反馈服务健康检查失败');
    }
  }

  /**
   * 提交快速反馈（简化版）
   */
  async submitQuickFeedback(
    content: string, 
    rating?: number
  ): Promise<{ id: string; message: string }> {
    return this.submitFeedback({
      content,
      rating,
      category: 'quick'
    });
  }

  /**
   * 提交错误报告
   */
  async submitErrorReport(
    errorMessage: string, 
    context?: any, 
    contact?: string
  ): Promise<{ id: string; message: string }> {
    const content = `错误报告: ${errorMessage}${
      context ? `\n\n上下文信息:\n${JSON.stringify(context, null, 2)}` : ''
    }`;

    return this.submitFeedback({
      content,
      contact,
      category: 'error'
    });
  }

  /**
   * 提交功能建议
   */
  async submitFeatureSuggestion(
    suggestion: string, 
    contact?: string
  ): Promise<{ id: string; message: string }> {
    return this.submitFeedback({
      content: suggestion,
      contact,
      category: 'feature'
    });
  }

  // 私有辅助方法

  private validateFeedbackData(data: FeedbackData): void {
    if (!data.content || typeof data.content !== 'string') {
      throw new Error('反馈内容不能为空');
    }

    if (data.content.trim().length < 5) {
      throw new Error('反馈内容至少需要5个字符');
    }

    if (data.content.length > 1000) {
      throw new Error('反馈内容不能超过1000个字符');
    }

    if (data.rating !== undefined) {
      if (typeof data.rating !== 'number' || data.rating < 1 || data.rating > 5) {
        throw new Error('评分必须是1-5之间的数字');
      }
    }

    if (data.contact && data.contact.length > 255) {
      throw new Error('联系方式不能超过255个字符');
    }
  }
}

// 导出单例实例
export const feedbackApi = new FeedbackApiService();
