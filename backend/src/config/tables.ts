/**
 * 数据库表名配置
 * 
 * 使用 TABLE_PREFIX 环境变量支持 PostgreSQL 总系统的多站点架构
 * 
 * 示例：
 * - TABLE_PREFIX=site3__ → site3__users, site3__refresh_tokens
 * - TABLE_PREFIX=colormagic_ → colormagic_users, colormagic_refresh_tokens
 */

// 获取表前缀（从环境变量）
const TABLE_PREFIX = process.env.TABLE_PREFIX || '';

// 验证表前缀
if (!TABLE_PREFIX) {
  console.warn('⚠️ TABLE_PREFIX 未设置，将使用无前缀的表名（不推荐）');
}

console.log(`📊 数据库表前缀: "${TABLE_PREFIX}"`);

/**
 * 认证相关表名
 */
export const AUTH_TABLES = {
  USERS: `${TABLE_PREFIX}users`,
  REFRESH_TOKENS: `${TABLE_PREFIX}refresh_tokens`,
} as const;

/**
 * 其他表名（根据需要添加）
 */
export const TABLES = {
  ...AUTH_TABLES,
  // 未来可以添加更多表
} as const;

/**
 * 获取表名的辅助函数
 */
export function getTableName(baseName: string): string {
  return `${TABLE_PREFIX}${baseName}`;
}

/**
 * 打印当前表名配置（用于调试）
 */
export function printTableConfig(): void {
  console.log('📋 当前数据库表配置:');
  console.log(`  - 用户表: ${AUTH_TABLES.USERS}`);
  console.log(`  - 刷新令牌表: ${AUTH_TABLES.REFRESH_TOKENS}`);
}

// 在模块加载时打印配置
printTableConfig();

