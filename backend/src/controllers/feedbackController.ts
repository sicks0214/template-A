/**
 * 反馈控制器 - 第一阶段Mock版本
 * 处理用户反馈提交，使用Mock数据服务
 */

import { Request, Response, NextFunction } from 'express';
import { mockDataService, FeedbackData } from '../services/mockData/mockDataService';
import { databaseService, getDatabaseServiceType, isUsingRealDatabase } from '../services/database/databaseServiceFactory';
import { PostgreSQLService } from '../services/database/postgresService';

export class FeedbackController {

  /**
   * 提交用户反馈
   */
  async submitFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('[FeedbackController] 收到反馈提交请求');

      const { content, contact, rating, category } = req.body;

      // 验证必填字段
      if (!content || typeof content !== 'string' || content.trim().length < 5) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CONTENT',
            message: '反馈内容至少需要5个字符',
            timestamp: new Date()
          }
        });
        return;
      }

      // 验证内容长度
      if (content.length > 1000) {
        res.status(400).json({
          success: false,
          error: {
            code: 'CONTENT_TOO_LONG',
            message: '反馈内容不能超过1000个字符',
            timestamp: new Date()
          }
        });
        return;
      }

      // 验证评分（如果提供）
      if (rating !== undefined && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_RATING',
            message: '评分必须是1-5之间的数字',
            timestamp: new Date()
          }
        });
        return;
      }

      // 构建反馈数据
      const feedbackData: FeedbackData = {
        site_id: process.env.SITE_ID || 'site3',
        type: 'feedback',
        content: content.trim(),
        contact: contact?.trim() || undefined,
        rating: rating || undefined,
        category: category?.trim() || 'general',
        userIp: this.getClientIP(req),
        userAgent: req.get('User-Agent') || undefined
      };

      // 保存反馈 - 支持Mock和PostgreSQL
      let result;
      if (isUsingRealDatabase()) {
        // 使用PostgreSQL
        const dbService = databaseService as PostgreSQLService;
        const saveResult = await dbService.saveFeedback(feedbackData, feedbackData.userIp, feedbackData.userAgent);
        result = { id: `feedback_${saveResult.id}` };
      } else {
        // 使用Mock数据
        result = await mockDataService.saveFeedback(feedbackData);
      }

      console.log(`[FeedbackController] 反馈提交成功: ${result.id}`);

      res.status(200).json({
        success: true,
        data: {
          id: result.id,
          message: '感谢您的反馈！我们会认真考虑您的建议。',
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error('[FeedbackController] 反馈提交失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '服务器内部错误，请稍后重试',
          timestamp: new Date()
        }
      });
    }
  }

  /**
   * 获取反馈历史（管理员功能）
   */
  async getFeedbackHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const category = req.query.category as string;

      if (limit < 1 || limit > 50) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_LIMIT',
            message: '历史记录数量限制在1-50之间',
            timestamp: new Date()
          }
        });
        return;
      }

      const history = await mockDataService.getFeedbackHistory(limit);

      // 如果指定了类别，进行过滤
      const filteredHistory = category 
        ? history.filter((item: any) => item.category === category)
        : history;

      res.status(200).json({
        success: true,
        data: {
          history: filteredHistory,
          total: filteredHistory.length,
          limit,
          category: category || 'all',
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error('[FeedbackController] 获取反馈历史失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '服务器内部错误',
          timestamp: new Date()
        }
      });
    }
  }

  /**
   * 获取反馈统计信息
   */
  async getFeedbackStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const history = await mockDataService.getFeedbackHistory(100); // 获取更多数据用于统计

      // 计算统计信息
      const stats = {
        total: history.length,
        categories: this.calculateCategoryStats(history),
        ratings: this.calculateRatingStats(history),
        recentCount: history.filter((item: any) => {
          const itemDate = item.created_at ? new Date(item.created_at) : new Date();
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return itemDate > oneDayAgo;
        }).length,
        avgRating: this.calculateAverageRating(history),
        topKeywords: this.extractTopKeywords(history)
      };

      res.status(200).json({
        success: true,
        data: {
          stats,
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error('[FeedbackController] 获取反馈统计失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '服务器内部错误',
          timestamp: new Date()
        }
      });
    }
  }

  /**
   * 反馈健康检查
   */
  async healthCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await mockDataService.getSystemStats();
      
      res.status(200).json({
        success: true,
        data: {
          service: 'Feedback Service (Mock)',
          status: 'healthy',
          totalFeedbacks: stats.totalFeedbacks,
          capabilities: [
            'submit_feedback',
            'get_feedback_history',
            'feedback_statistics'
          ],
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('[FeedbackController] 反馈服务健康检查失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: '反馈服务健康检查失败',
          timestamp: new Date()
        }
      });
    }
  }

  // 私有辅助方法

  private getClientIP(req: Request): string {
    const forwarded = req.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress;
    return ip || 'unknown';
  }

  private calculateCategoryStats(history: any[]): Record<string, number> {
    const categories: Record<string, number> = {};
    history.forEach(item => {
      const category = item.category || 'general';
      categories[category] = (categories[category] || 0) + 1;
    });
    return categories;
  }

  private calculateRatingStats(history: any[]): Record<string, number> {
    const ratings: Record<string, number> = {};
    history.forEach(item => {
      if (item.rating) {
        const rating = `${item.rating}星`;
        ratings[rating] = (ratings[rating] || 0) + 1;
      }
    });
    return ratings;
  }

  private calculateAverageRating(history: any[]): number {
    const ratingsWithValues = history.filter(item => item.rating);
    if (ratingsWithValues.length === 0) return 0;
    
    const sum = ratingsWithValues.reduce((acc, item) => acc + item.rating, 0);
    return Math.round((sum / ratingsWithValues.length) * 10) / 10;
  }

  private extractTopKeywords(history: any[]): Array<{ keyword: string; count: number }> {
    const keywords: Record<string, number> = {};
    
    history.forEach((item: any) => {
      // 简单的关键词提取（实际项目中可能需要更复杂的NLP处理）
      const words = item.content.toLowerCase()
        .replace(/[^\u4e00-\u9fa5a-zA-Z\s]/g, '') // 只保留中文、英文和空格
        .split(/\s+/)
        .filter((word: string) => word.length > 1);
      
      words.forEach((word: string) => {
        keywords[word] = (keywords[word] || 0) + 1;
      });
    });

    // 返回前10个最常见的关键词
    return Object.entries(keywords)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));
  }
}

// 导出控制器实例
export const feedbackController = new FeedbackController();
