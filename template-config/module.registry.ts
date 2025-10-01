/**
 * 模块注册表 - 管理功能模块
 * 
 * 使用说明：
 * 1. 在 availableModules 中定义所有可用模块
 * 2. 在 activeModules 中列出要激活的模块
 * 3. 创建新模块后，在这里注册
 */

// 模块配置类型定义
export interface ModuleConfig {
  // 基础信息
  id: string
  name: string
  displayName: string
  description: string
  version: string
  author?: string
  
  // 前端路由配置
  routes: Array<{
    path: string
    component: string
    exact?: boolean
    protected?: boolean
  }>
  
  // 导航菜单配置
  navItems: Array<{
    label: string
    path: string
    icon: string
    order: number
    protected?: boolean
  }>
  
  // 数据库表（自动添加项目前缀）
  databaseTables: string[]
  
  // API路由前缀
  apiPrefix: string
  
  // i18n命名空间
  i18nNamespaces: string[]
  
  // 依赖的核心系统
  dependencies?: Array<'auth' | 'i18n' | 'feedback'>
}

/**
 * 模块注册表
 */
export class ModuleRegistry {
  // ========================================
  // 当前激活的模块（修改这里来启用/禁用模块）
  // ========================================
  static activeModules: string[] = [
    'example-simple',  // 最小化示例模块
  ]
  
  // ========================================
  // 可用模块定义
  // ========================================
  static availableModules = new Map<string, ModuleConfig>([
    // 示例模块：最小化示例
    ['example-simple', {
      id: 'example-simple',
      name: 'Simple Example',
      displayName: '简单示例',
      description: '一个最小化的功能模块示例，展示如何创建新模块',
      version: '1.0.0',
      author: 'Template Team',
      
      // 前端路由
      routes: [
        { 
          path: '/simple', 
          component: 'SimplePage', 
          exact: true,
          protected: false  // 不需要登录
        },
      ],
      
      // 导航菜单
      navItems: [
        { 
          label: 'nav.simple', 
          path: '/simple', 
          icon: 'sparkles',
          order: 1,
          protected: false
        },
      ],
      
      // 数据库表（会自动添加项目前缀）
      databaseTables: [
        'simple_data',      // 实际表名：${tablePrefix}simple_data
      ],
      
      // API路由前缀
      apiPrefix: '/api/simple',
      
      // i18n命名空间
      i18nNamespaces: ['simple'],
      
      // 依赖的核心系统
      dependencies: ['i18n'],
    }],
    
    // ========================================
    // 新模块在这里添加
    // ========================================
    // ['your-module', {
    //   id: 'your-module',
    //   name: 'Your Module',
    //   displayName: '你的模块',
    //   description: '模块描述',
    //   version: '1.0.0',
    //   routes: [...],
    //   navItems: [...],
    //   databaseTables: [...],
    //   apiPrefix: '/api/your-module',
    //   i18nNamespaces: ['yourmodule'],
    // }],
  ])
  
  // ========================================
  // 模块管理方法
  // ========================================
  
  /**
   * 获取所有激活的模块配置
   */
  static getActiveModules(): ModuleConfig[] {
    return this.activeModules
      .map(id => this.availableModules.get(id))
      .filter(Boolean) as ModuleConfig[]
  }
  
  /**
   * 获取单个模块配置
   */
  static getModule(id: string): ModuleConfig | undefined {
    return this.availableModules.get(id)
  }
  
  /**
   * 检查模块是否激活
   */
  static isModuleActive(id: string): boolean {
    return this.activeModules.includes(id)
  }
  
  /**
   * 注册新模块
   */
  static registerModule(config: ModuleConfig): void {
    if (this.availableModules.has(config.id)) {
      console.warn(`⚠️ 模块 ${config.id} 已存在，将被覆盖`)
    }
    this.availableModules.set(config.id, config)
    console.log(`✅ 模块已注册: ${config.name} (${config.id})`)
  }
  
  /**
   * 激活模块
   */
  static activateModule(id: string): boolean {
    if (!this.availableModules.has(id)) {
      console.error(`❌ 模块 ${id} 不存在`)
      return false
    }
    
    if (this.activeModules.includes(id)) {
      console.warn(`⚠️ 模块 ${id} 已经激活`)
      return false
    }
    
    this.activeModules.push(id)
    console.log(`✅ 模块已激活: ${id}`)
    return true
  }
  
  /**
   * 停用模块
   */
  static deactivateModule(id: string): boolean {
    const index = this.activeModules.indexOf(id)
    if (index === -1) {
      console.warn(`⚠️ 模块 ${id} 未激活`)
      return false
    }
    
    this.activeModules.splice(index, 1)
    console.log(`✅ 模块已停用: ${id}`)
    return true
  }
  
  /**
   * 获取所有可用模块
   */
  static getAllModules(): ModuleConfig[] {
    return Array.from(this.availableModules.values())
  }
  
  /**
   * 获取模块统计信息
   */
  static getStats() {
    return {
      total: this.availableModules.size,
      active: this.activeModules.length,
      inactive: this.availableModules.size - this.activeModules.length,
    }
  }
  
  /**
   * 验证模块配置
   */
  static validateModule(config: ModuleConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (!config.id) errors.push('模块ID不能为空')
    if (!config.name) errors.push('模块名称不能为空')
    if (!config.apiPrefix) errors.push('API前缀不能为空')
    if (!config.routes || config.routes.length === 0) errors.push('至少需要一个路由')
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// 默认导出
export default ModuleRegistry

