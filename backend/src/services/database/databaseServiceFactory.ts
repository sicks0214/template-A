/**
 * 数据库服务工厂 - 第二阶段
 * 根据环境变量自动选择Mock服务或真实PostgreSQL服务
 */

import { mockDataService } from '../mockData/mockDataService';
import { postgresService, PostgreSQLService } from './postgresService';

export type DatabaseService = typeof mockDataService | PostgreSQLService;

/**
 * 创建数据库服务实例
 * 根据环境变量USE_DATABASE决定使用Mock还是真实数据库
 */
export function createDatabaseService(): DatabaseService {
  const useDatabase = process.env.USE_DATABASE === 'true';
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  if (useDatabase) {
    console.log('🗄️ 使用PostgreSQL数据库服务');
    console.log('📊 数据库配置:', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'colormagic_user',
      ssl: process.env.DB_SSL === 'true'
    });
    
    return postgresService;
  } else {
    console.log('🎭 使用Mock数据服务');
    console.log('📝 Mock模式特性:', [
      '✅ 无需数据库依赖',
      '✅ 快速开发测试',
      '✅ 丰富的模拟数据',
      '✅ 完整的API响应'
    ]);
    
    return mockDataService;
  }
}

/**
 * 获取数据库服务实例
 */
export function getDatabaseService(): DatabaseService {
  return createDatabaseService();
}

/**
 * 获取当前数据库服务类型
 */
export function getDatabaseServiceType(): 'mock' | 'postgresql' {
  return process.env.USE_DATABASE === 'true' ? 'postgresql' : 'mock';
}

/**
 * 检查是否使用真实数据库
 */
export function isUsingRealDatabase(): boolean {
  return process.env.USE_DATABASE === 'true';
}

/**
 * 获取数据库服务信息
 */
export function getDatabaseServiceInfo(): {
  type: 'mock' | 'postgresql';
  config: any;
  features: string[];
} {
  const type = getDatabaseServiceType();
  
  if (type === 'postgresql') {
    return {
      type: 'postgresql',
      config: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || '5432',
        database: process.env.DB_NAME || 'postgres',
        user: process.env.DB_USER || 'colormagic_user',
        ssl: process.env.DB_SSL === 'true',
        maxConnections: process.env.DB_MAX_CONNECTIONS || '20'
      },
      features: [
        '✅ 持久化数据存储',
        '✅ 事务支持',
        '✅ 复杂查询和统计',
        '✅ 数据完整性约束',
        '✅ 并发访问控制',
        '✅ 备份和恢复',
        '✅ 性能优化索引',
        '✅ 跨站点数据共享'
      ]
    };
  } else {
    return {
      type: 'mock',
      config: {
        memoryStorage: true,
        persistentSession: false,
        maxHistoryRecords: 50,
        maxFeedbackRecords: 100
      },
      features: [
        '✅ 零配置启动',
        '✅ 快速响应',
        '✅ 内存存储',
        '✅ 丰富测试数据',
        '✅ 完整API模拟',
        '✅ 开发友好',
        '⚠️ 数据不持久化',
        '⚠️ 重启后数据丢失'
      ]
    };
  }
}

// 导出全局数据库服务实例
export const databaseService = createDatabaseService();

// 初始化数据库服务
export async function initializeDatabaseService(): Promise<void> {
  const serviceInfo = getDatabaseServiceInfo();
  
  console.log('🚀 初始化数据库服务...');
  console.log(`📊 服务类型: ${serviceInfo.type.toUpperCase()}`);
  console.log('🎯 服务特性:', serviceInfo.features);
  
  if (isUsingRealDatabase()) {
    try {
      // 测试PostgreSQL连接
      const isConnected = await (databaseService as PostgreSQLService).testConnection();
      
      if (isConnected) {
        console.log('✅ PostgreSQL数据库服务初始化成功');
      } else {
        console.error('❌ PostgreSQL数据库连接失败，请检查配置');
        throw new Error('数据库连接失败');
      }
    } catch (error) {
      console.error('❌ PostgreSQL服务初始化失败:', error);
      throw error;
    }
  } else {
    console.log('✅ Mock数据服务初始化成功');
  }
}

// 优雅关闭数据库服务
export async function closeDatabaseService(): Promise<void> {
  if (isUsingRealDatabase()) {
    console.log('🔄 正在关闭PostgreSQL连接...');
    await (databaseService as PostgreSQLService).close();
  } else {
    console.log('🔄 Mock服务无需关闭连接');
  }
  
  console.log('✅ 数据库服务已关闭');
}
