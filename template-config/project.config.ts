/**
 * 项目配置 - 创建新项目时修改这里
 * 
 * 使用说明：
 * 1. 修改项目基础信息
 * 2. 设置VPS站点ID（site1-site20）
 * 3. 配置数据库连接（对应站点用户）
 * 4. 设置域名（主域名和www等）
 * 5. 不要修改核心系统配置（除非必要）
 */

export const ProjectConfig = {
  // ========================================
  // 项目基础信息（必须修改）
  // ========================================
  project: {
    name: 'Universal Web Template',        // 修改：项目名称
    displayName: 'My Application',         // 修改：显示名称
    description: 'Universal web application template', // 修改：项目描述
    version: '1.0.0',
    author: 'Your Name',
  },
  
  // ========================================
  // VPS部署配置（必须修改）
  // ========================================
  deployment: {
    // 站点配置
    siteId: 'siteN',                       // 修改：站点ID（site1, site2, ..., site20）
    siteName: 'siteN',                     // 修改：容器名称（通常与siteId相同）
    containerPort: 3000,                   // 固定：容器端口
    
    // 时区配置（标准IANA格式）
    timezone: 'America/New_York',          // 修改：时区（如：Asia/Shanghai）
    
    // 环境（实际环境从后端.env读取）
    environment: 'production',
  },
  
  // ========================================
  // PostgreSQL总系统配置（部分需修改）
  // ========================================
  database: {
    // 连接配置
    host: 'postgres_master',               // 固定：使用Docker网络别名
    port: 5432,                            // 固定：PostgreSQL端口
    name: 'postgres',                      // 固定：使用主数据库
    ssl: false,                            // 固定：VPS环境不使用SSL
    
    // 认证配置（必须修改）
    user: 'siteN_user',                    // 修改：对应站点用户（site1_user, site2_user等）
    password: 'siteN_pass',                // 修改：对应站点密码
    
    // 表命名（必须修改）
    tablePrefix: 'myproject_',             // 修改：项目表前缀（项目唯一标识）
    
    // 连接池配置
    pool: {
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    },
  },
  
  // ========================================
  // 反馈系统配置（接入unified_feedback表）
  // ========================================
  feedback: {
    enabled: true,                         // 固定：启用反馈系统
    siteId: 'siteN',                       // 修改：unified_feedback表的site_id标识
    tableName: 'unified_feedback',         // 固定：使用总系统统一表
  },
  
  // ========================================
  // 网络配置（双网络架构）
  // ========================================
  networks: {
    external: 'webproxy',                  // 固定：对外访问网络
    internal: 'shared_net',                // 固定：数据库通信网络
  },
  
  // ========================================
  // 域名配置（必须修改）
  // ========================================
  domains: {
    primary: 'example.com',                // 修改：主域名
    additional: ['www.example.com'],       // 修改：额外域名（www子域名等）
    protocol: 'https',                     // 固定：生产环境使用HTTPS
  },
  
  // ========================================
  // 核心系统配置（标配，一般不修改）
  // ========================================
  coreSystems: {
    // 用户认证系统
    auth: {
      enabled: true,
      jwtSecret: 'change-this-secret-key',  // 注意：实际密钥从backend/.env的JWT_SECRET读取
      jwtExpiresIn: '15m',
      jwtRefreshExpiresIn: '7d',
    },
    
    // 国际化系统（8种语言）
    i18n: {
      enabled: true,
      defaultLanguage: 'tr',               // 可修改：默认语言（tr/zh/en/ja/ko/fr/de/ru）
      languages: [
        { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
        { code: 'zh', name: '中文', flag: '🇨🇳' },
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'ja', name: '日本語', flag: '🇯🇵' },
        { code: 'ko', name: '한국어', flag: '🇰🇷' },
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
        { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
        { code: 'ru', name: 'Русский', flag: '🇷🇺' },
      ],
    },
    
    // 反馈系统（接入PostgreSQL总系统）
    feedbackSystem: {
      enabled: true,
    },
  },
  
  // ========================================
  // 主页配置
  // ========================================
  homepage: {
    title: 'Welcome to Universal Template',
    subtitle: 'Build your next project faster',
    showModuleCards: true,                 // 显示模块卡片
  },
  
  // ========================================
  // 辅助函数
  // ========================================
  
  /**
   * 获取完整域名列表（用于CORS配置）
   */
  getAllDomains(): string[] {
    const domains: string[] = []
    
    // 主域名
    domains.push(`${this.domains.protocol}://${this.domains.primary}`)
    
    // 额外域名
    this.domains.additional.forEach(domain => {
      domains.push(`${this.domains.protocol}://${domain}`)
    })
    
    return domains
  },
  
  /**
   * 获取数据库连接字符串
   */
  getDatabaseUrl(): string {
    const { host, port, name, user, password } = this.database
    return `postgres://${user}:${password}@${host}:${port}/${name}`
  },
  
  /**
   * 获取完整表名（自动添加前缀）
   */
  getTableName(tableName: string): string {
    return `${this.database.tablePrefix}${tableName}`
  },
}

// 导出类型定义
export type ProjectConfigType = typeof ProjectConfig

// 默认导出
export default ProjectConfig

