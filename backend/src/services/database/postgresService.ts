/**
 * PostgreSQL数据库服务 - 第二阶段真实数据库实现
 * 替换Mock服务，提供真实的数据库操作
 */

import { Pool, PoolClient } from 'pg';
import { ColorAnalysisResult, FeedbackData } from '../mockData/mockDataService';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export interface ColorAnalysisRecord {
  id: number;
  analysis_id: string;
  image_name: string;
  image_size_bytes: number;
  original_width: number;
  original_height: number;
  processed_width: number;
  processed_height: number;
  extracted_colors: any;
  dominant_colors: any;
  palette: any;
  metadata: any;
  processing_time_ms: number;
  algorithm: string;
  user_ip?: string;
  created_at: Date;
}

export interface FeedbackRecord extends FeedbackData {
  id: number;
  site_id: string;
  timestamp: Date;
  processed: boolean;
  priority: number;
}

export class PostgreSQLService {
  public pool: Pool;
  private isConnected = false;

  constructor(config?: DatabaseConfig) {
    const dbConfig: DatabaseConfig = config || {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'colormagic_user',
      password: process.env.DB_PASSWORD || 'colormagic_pass',
      ssl: process.env.DB_SSL === 'true',
      max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000')
    };

    this.pool = new Pool(dbConfig);

    // 连接池事件监听
    this.pool.on('connect', (client) => {
      console.log('🗄️ PostgreSQL客户端连接成功');
      this.isConnected = true;
    });

    this.pool.on('error', (err) => {
      console.error('❌ PostgreSQL连接池错误:', err);
      this.isConnected = false;
    });

    this.pool.on('remove', () => {
      console.log('🗄️ PostgreSQL客户端连接移除');
    });
  }

  /**
   * 测试数据库连接
   */
  async testConnection(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
      client.release();
      
      console.log('✅ PostgreSQL连接测试成功:', {
        time: result.rows[0].current_time,
        version: result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1]
      });
      
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('❌ PostgreSQL连接测试失败:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * 保存颜色分析结果
   */
  async saveColorAnalysis(analysis: ColorAnalysisResult, userIp?: string): Promise<{ id: number; analysis_id: string }> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO colormagic_analysis_history (
          analysis_id, image_name, image_size_bytes, 
          original_width, original_height, processed_width, processed_height,
          extracted_colors, dominant_colors, palette, metadata,
          processing_time_ms, algorithm, user_ip
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id, analysis_id
      `;

      const values = [
        analysis.id,
        'uploaded_image.jpg', // 临时文件名，实际应用中应该传入真实文件名
        0, // 临时文件大小，实际应用中应该传入真实大小
        analysis.metadata.imageSize.width,
        analysis.metadata.imageSize.height,
        analysis.metadata.imageSize.width,
        analysis.metadata.imageSize.height,
        JSON.stringify(analysis.extractedColors),
        JSON.stringify(analysis.dominantColors),
        JSON.stringify(analysis.palette),
        JSON.stringify(analysis.metadata),
        analysis.metadata.processingTime * 1000, // 转换为毫秒
        analysis.metadata.algorithm,
        userIp
      ];

      const result = await client.query(query, values);
      await client.query('COMMIT');

      console.log('✅ 颜色分析结果已保存:', result.rows[0]);
      return result.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ 保存颜色分析失败:', error);
      throw new Error(`保存颜色分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      client.release();
    }
  }

  /**
   * 保存用户反馈到统一反馈表
   */
  async saveFeedback(feedback: FeedbackData, userIp?: string, userAgent?: string): Promise<{ success: boolean; id: number }> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        INSERT INTO unified_feedback (
          site_id, content, contact, rating, category, user_ip, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;

      const values = [
        'colormagic',  // 根据PostgreSQL操作指南，这是我们应用的site_id
        feedback.content,
        feedback.contact || null,
        feedback.rating || null,
        feedback.category || 'general',
        userIp || null,
        userAgent || null
      ];

      const result = await client.query(query, values);

      console.log('✅ 用户反馈已保存:', result.rows[0]);
      return {
        success: true,
        id: result.rows[0].id
      };

    } catch (error) {
      console.error('❌ 保存用户反馈失败:', error);
      throw new Error(`保存用户反馈失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      client.release();
    }
  }

  /**
   * 保存调色板导出记录
   */
  async saveExportRecord(analysisId: string, format: string, colorCount: number, fileSize: number, userIp?: string): Promise<{ id: number }> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        INSERT INTO colormagic_export_history (
          analysis_id, export_format, color_count, file_size_bytes, user_ip
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;

      const values = [analysisId, format, colorCount, fileSize, userIp];
      const result = await client.query(query, values);

      console.log('✅ 导出记录已保存:', result.rows[0]);
      return result.rows[0];

    } catch (error) {
      console.error('❌ 保存导出记录失败:', error);
      throw new Error(`保存导出记录失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      client.release();
    }
  }

  /**
   * 获取分析历史
   */
  async getAnalysisHistory(limit: number = 10, offset: number = 0): Promise<ColorAnalysisRecord[]> {
    try {
      const query = `
        SELECT * FROM colormagic_analysis_history 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `;

      const result = await this.pool.query(query, [limit, offset]);
      console.log(`✅ 获取分析历史: ${result.rows.length}条记录`);
      
      return result.rows;

    } catch (error) {
      console.error('❌ 获取分析历史失败:', error);
      throw new Error(`获取分析历史失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取反馈历史
   */
  async getFeedbackHistory(limit: number = 10, category?: string): Promise<FeedbackRecord[]> {
    try {
      let query = `
        SELECT id, site_id, content, contact, rating, category, 
               user_ip, user_agent, created_at as timestamp, processed, priority
        FROM unified_feedback 
        WHERE site_id = 'colormagic'
      `;
      const values: any[] = [];

      if (category) {
        query += ' AND category = $1';
        values.push(category);
      }

      query += ' ORDER BY created_at DESC LIMIT $' + (values.length + 1);
      values.push(limit);

      const result = await this.pool.query(query, values);
      console.log(`✅ 获取反馈历史: ${result.rows.length}条记录`);
      
      return result.rows;

    } catch (error) {
      console.error('❌ 获取反馈历史失败:', error);
      throw new Error(`获取反馈历史失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取热门颜色
   */
  async getPopularColors(limit: number = 10): Promise<Array<{ hex: string; name: string; count: number }>> {
    try {
      const query = 'SELECT * FROM get_colormagic_popular_colors($1)';
      const result = await this.pool.query(query, [limit]);
      
      console.log(`✅ 获取热门颜色: ${result.rows.length}个颜色`);
      return result.rows.map(row => ({
        hex: row.hex_color,
        name: row.color_name,
        count: parseInt(row.usage_count)
      }));

    } catch (error) {
      console.error('❌ 获取热门颜色失败:', error);
      throw new Error(`获取热门颜色失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取系统统计信息
   */
  async getSystemStats(): Promise<{
    totalAnalyses: number;
    totalFeedbacks: number;
    avgProcessingTime: number;
    popularColors: Array<{ hex: string; name: string; count: number }>;
    lastAnalysis: string | null;
  }> {
    try {
      // 获取总分析数
      const analysisCountResult = await this.pool.query(
        'SELECT COUNT(*) as count FROM colormagic_analysis_history'
      );
      const totalAnalyses = parseInt(analysisCountResult.rows[0].count);

      // 获取总反馈数
      const feedbackCountResult = await this.pool.query(
        'SELECT COUNT(*) as count FROM unified_feedback WHERE site_id = $1',
        ['colormagic']
      );
      const totalFeedbacks = parseInt(feedbackCountResult.rows[0].count);

      // 获取平均处理时间
      const avgTimeResult = await this.pool.query(
        'SELECT AVG(processing_time_ms) as avg_time FROM colormagic_analysis_history'
      );
      const avgProcessingTime = parseFloat(avgTimeResult.rows[0].avg_time || '0') / 1000; // 转换为秒

      // 获取热门颜色
      const popularColors = await this.getPopularColors(3);

      // 获取最后分析时间
      const lastAnalysisResult = await this.pool.query(
        'SELECT created_at FROM colormagic_analysis_history ORDER BY created_at DESC LIMIT 1'
      );
      const lastAnalysis = lastAnalysisResult.rows[0]?.created_at?.toISOString() || null;

      const stats = {
        totalAnalyses,
        totalFeedbacks,
        avgProcessingTime,
        popularColors,
        lastAnalysis
      };

      console.log('✅ 获取系统统计完成:', stats);
      return stats;

    } catch (error) {
      console.error('❌ 获取系统统计失败:', error);
      throw new Error(`获取系统统计失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{
    status: string;
    connected: boolean;
    poolStats: {
      total: number;
      idle: number;
      waiting: number;
    };
  }> {
    try {
      const isHealthy = await this.testConnection();
      
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        connected: this.isConnected,
        poolStats: {
          total: this.pool.totalCount,
          idle: this.pool.idleCount,
          waiting: this.pool.waitingCount
        }
      };

    } catch (error) {
      console.error('❌ 数据库健康检查失败:', error);
      return {
        status: 'unhealthy',
        connected: false,
        poolStats: {
          total: 0,
          idle: 0,
          waiting: 0
        }
      };
    }
  }

  /**
   * 关闭数据库连接池
   */
  async close(): Promise<void> {
    try {
      await this.pool.end();
      console.log('✅ PostgreSQL连接池已关闭');
      this.isConnected = false;
    } catch (error) {
      console.error('❌ 关闭PostgreSQL连接池失败:', error);
    }
  }

  /**
   * 获取连接状态
   */
  isConnectionHealthy(): boolean {
    return this.isConnected;
  }
}

// 导出单例实例
export const postgresService = new PostgreSQLService();
