/**
 * Mock数据服务
 * 用于开发和测试环境的模拟数据
 */

export interface FeedbackData {
  id?: number;
  site_id: string;
  type: string;
  content: string;
  contact?: string;
  contact_info?: string;
  user_agent?: string;
  userAgent?: string;
  userIp?: string;
  url?: string;
  rating?: number;
  category?: string;
  metadata?: Record<string, any>;
  status?: string;
  created_at?: Date;
  timestamp?: Date;
}

// ColorMagic特定的分析结果类型
export interface ColorAnalysisResult {
  id?: number;
  colors: Array<{
    hex: string;
    rgb: { r: number; g: number; b: number };
    percentage: number;
  }>;
  extractedColors?: any[];
  dominantColors?: any[];
  palette?: any[];
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface MockDataService {
  saveFeedback(data: FeedbackData): Promise<FeedbackData>;
  getFeedbackById(id: number): Promise<FeedbackData | null>;
  getAllFeedback(): Promise<FeedbackData[]>;
  updateFeedbackStatus(id: number, status: string): Promise<boolean>;
  getFeedbackHistory(limit: number): Promise<FeedbackData[]>;
  getSystemStats(): Promise<{ totalFeedbacks: number }>;
}

class InMemoryMockDataService implements MockDataService {
  private feedbackStore: Map<number, FeedbackData> = new Map();
  private nextId = 1;

  async saveFeedback(data: FeedbackData): Promise<FeedbackData> {
    const id = this.nextId++;
    const feedback: FeedbackData = {
      ...data,
      id,
      created_at: new Date(),
      status: data.status || 'pending'
    };
    
    this.feedbackStore.set(id, feedback);
    console.log(`[MockDataService] 保存反馈 ID: ${id}`);
    
    return feedback;
  }

  async getFeedbackById(id: number): Promise<FeedbackData | null> {
    return this.feedbackStore.get(id) || null;
  }

  async getAllFeedback(): Promise<FeedbackData[]> {
    return Array.from(this.feedbackStore.values());
  }

  async updateFeedbackStatus(id: number, status: string): Promise<boolean> {
    const feedback = this.feedbackStore.get(id);
    if (feedback) {
      feedback.status = status;
      this.feedbackStore.set(id, feedback);
      return true;
    }
    return false;
  }

  async getFeedbackHistory(limit: number): Promise<FeedbackData[]> {
    const allFeedback = Array.from(this.feedbackStore.values());
    // 按创建时间降序排序
    allFeedback.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
    return allFeedback.slice(0, limit);
  }

  async getSystemStats(): Promise<{ totalFeedbacks: number }> {
    return {
      totalFeedbacks: this.feedbackStore.size
    };
  }
}

// 导出单例实例
export const mockDataService = new InMemoryMockDataService();

