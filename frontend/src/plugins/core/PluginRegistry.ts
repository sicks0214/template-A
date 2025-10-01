import { Plugin, PluginManifest } from '../../data/models/Plugin'

export interface PluginMetadata {
  id: string
  name: string
  version: string
  description: string
  author: string
  category: string
  tags: string[]
  license: string
  dependencies: string[]
  permissions: string[]
  homepage?: string
  repository?: string
  icon?: string
  screenshots?: string[]
  readme?: string
  changelog?: string
  downloads: number
  rating: number
  reviews: number
  lastUpdated: string
  compatibility: {
    framework: string
    minVersion: string
    maxVersion?: string
  }
}

export interface PluginDependency {
  id: string
  version: string
  optional: boolean
}

export class PluginRegistry {
  private plugins: Map<string, PluginMetadata> = new Map()
  private categories: Map<string, string[]> = new Map()
  private dependencies: Map<string, PluginDependency[]> = new Map()
  private conflicts: Map<string, string[]> = new Map()

  constructor() {
    this.initializeCategories()
  }

  // 注册插件
  registerPlugin(metadata: PluginMetadata): void {
    // 验证插件元数据
    this.validateMetadata(metadata)

    // 检查ID冲突
    if (this.plugins.has(metadata.id)) {
      throw new Error(`插件ID已存在: ${metadata.id}`)
    }

    // 注册插件
    this.plugins.set(metadata.id, metadata)

    // 添加到分类
    this.addToCategory(metadata.category, metadata.id)

    // 注册依赖关系
    this.registerDependencies(metadata.id, metadata.dependencies)

    console.log(`插件注册成功: ${metadata.id} v${metadata.version}`)
  }

  // 注销插件
  unregisterPlugin(pluginId: string): void {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`插件不存在: ${pluginId}`)
    }

    // 从分类中移除
    this.removeFromCategory(plugin.category, pluginId)

    // 清理依赖关系
    this.dependencies.delete(pluginId)
    this.conflicts.delete(pluginId)

    // 移除插件
    this.plugins.delete(pluginId)

    console.log(`插件注销成功: ${pluginId}`)
  }

  // 获取插件元数据
  getPlugin(pluginId: string): PluginMetadata | undefined {
    return this.plugins.get(pluginId)
  }

  // 获取所有插件
  getAllPlugins(): PluginMetadata[] {
    return Array.from(this.plugins.values())
  }

  // 按分类获取插件
  getPluginsByCategory(category: string): PluginMetadata[] {
    const pluginIds = this.categories.get(category) || []
    return pluginIds.map(id => this.plugins.get(id)!).filter(Boolean)
  }

  // 搜索插件
  searchPlugins(query: string): PluginMetadata[] {
    const searchTerm = query.toLowerCase()
    return this.getAllPlugins().filter(plugin => 
      plugin.name.toLowerCase().includes(searchTerm) ||
      plugin.description.toLowerCase().includes(searchTerm) ||
      plugin.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    )
  }

  // 获取插件依赖
  getDependencies(pluginId: string): PluginDependency[] {
    return this.dependencies.get(pluginId) || []
  }

  // 检查依赖冲突
  checkConflicts(pluginId: string, installedPlugins: string[]): string[] {
    const conflicts: string[] = []
    const plugin = this.plugins.get(pluginId)
    
    if (!plugin) {
      return conflicts
    }

    // 检查版本冲突
    for (const installedId of installedPlugins) {
      const installedPlugin = this.plugins.get(installedId)
      if (installedPlugin && this.hasVersionConflict(plugin, installedPlugin)) {
        conflicts.push(installedId)
      }
    }

    // 检查权限冲突
    const permissionConflicts = this.checkPermissionConflicts(pluginId, installedPlugins)
    conflicts.push(...permissionConflicts)

    return conflicts
  }

  // 获取推荐插件
  getRecommendedPlugins(pluginId: string, limit: number = 5): PluginMetadata[] {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      return []
    }

    // 基于分类和标签推荐
    const recommendations = this.getAllPlugins()
      .filter(p => p.id !== pluginId)
      .filter(p => p.category === plugin.category || 
                   p.tags.some(tag => plugin.tags.includes(tag)))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit)

    return recommendations
  }

  // 获取热门插件
  getPopularPlugins(limit: number = 10): PluginMetadata[] {
    return this.getAllPlugins()
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, limit)
  }

  // 获取最新插件
  getLatestPlugins(limit: number = 10): PluginMetadata[] {
    return this.getAllPlugins()
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, limit)
  }

  // 获取所有分类
  getCategories(): string[] {
    return Array.from(this.categories.keys())
  }

  // 获取分类统计
  getCategoryStats(): Record<string, number> {
    const stats: Record<string, number> = {}
    for (const [category, pluginIds] of this.categories) {
      stats[category] = pluginIds.length
    }
    return stats
  }

  // 验证元数据
  private validateMetadata(metadata: PluginMetadata): void {
    const requiredFields = ['id', 'name', 'version', 'description', 'author', 'category', 'license']
    
    for (const field of requiredFields) {
      if (!metadata[field as keyof PluginMetadata]) {
        throw new Error(`插件元数据缺少必需字段: ${field}`)
      }
    }

    // 验证版本格式
    if (!/^\d+\.\d+\.\d+$/.test(metadata.version)) {
      throw new Error('插件版本格式无效，应为 x.y.z 格式')
    }

    // 验证ID格式
    if (!/^[a-z0-9-]+$/.test(metadata.id)) {
      throw new Error('插件ID格式无效，只能包含小写字母、数字和连字符')
    }

    // 验证邮箱格式（如果提供）
    if (metadata.author.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(metadata.author)) {
      throw new Error('作者邮箱格式无效')
    }
  }

  // 添加到分类
  private addToCategory(category: string, pluginId: string): void {
    if (!this.categories.has(category)) {
      this.categories.set(category, [])
    }
    this.categories.get(category)!.push(pluginId)
  }

  // 从分类中移除
  private removeFromCategory(category: string, pluginId: string): void {
    const pluginIds = this.categories.get(category)
    if (pluginIds) {
      const index = pluginIds.indexOf(pluginId)
      if (index > -1) {
        pluginIds.splice(index, 1)
      }
    }
  }

  // 注册依赖关系
  private registerDependencies(pluginId: string, dependencies: string[]): void {
    const deps: PluginDependency[] = dependencies.map(dep => {
      const [id, version] = dep.split('@')
      return {
        id,
        version: version || '*',
        optional: false
      }
    })
    this.dependencies.set(pluginId, deps)
  }

  // 检查版本冲突
  private hasVersionConflict(plugin1: PluginMetadata, plugin2: PluginMetadata): boolean {
    // 这里可以实现更复杂的版本冲突检测逻辑
    return plugin1.id === plugin2.id && plugin1.version !== plugin2.version
  }

  // 检查权限冲突
  private checkPermissionConflicts(pluginId: string, installedPlugins: string[]): string[] {
    const conflicts: string[] = []
    const plugin = this.plugins.get(pluginId)
    
    if (!plugin) {
      return conflicts
    }

    // 检查权限冲突的逻辑
    // 这里可以根据具体的权限系统实现冲突检测
    for (const installedId of installedPlugins) {
      const installedPlugin = this.plugins.get(installedId)
      if (installedPlugin && this.hasPermissionConflict(plugin, installedPlugin)) {
        conflicts.push(installedId)
      }
    }

    return conflicts
  }

  // 检查权限冲突
  private hasPermissionConflict(plugin1: PluginMetadata, plugin2: PluginMetadata): boolean {
    // 简单的权限冲突检测
    const permissions1 = new Set(plugin1.permissions)
    const permissions2 = new Set(plugin2.permissions)
    
    // 检查是否有互斥的权限
    const conflictingPermissions = ['admin', 'system']
    return conflictingPermissions.some(perm => 
      permissions1.has(perm) && permissions2.has(perm)
    )
  }

  // 初始化分类
  private initializeCategories(): void {
    const defaultCategories = [
      'ui-components',
      'data-visualization',
      'productivity',
      'communication',
      'entertainment',
      'utilities',
      'development',
      'business',
      'education',
      'other'
    ]

    for (const category of defaultCategories) {
      this.categories.set(category, [])
    }
  }

  // 更新插件统计信息
  updatePluginStats(pluginId: string, stats: Partial<Pick<PluginMetadata, 'downloads' | 'rating' | 'reviews'>>): void {
    const plugin = this.plugins.get(pluginId)
    if (plugin) {
      Object.assign(plugin, stats)
      plugin.lastUpdated = new Date().toISOString()
    }
  }

  // 批量注册插件
  registerPlugins(plugins: PluginMetadata[]): void {
    for (const plugin of plugins) {
      try {
        this.registerPlugin(plugin)
      } catch (error) {
        console.error(`注册插件失败: ${plugin.id}`, error)
      }
    }
  }

  // 导出插件数据
  exportPlugins(): PluginMetadata[] {
    return this.getAllPlugins()
  }

  // 导入插件数据
  importPlugins(plugins: PluginMetadata[]): void {
    // 清空现有数据
    this.plugins.clear()
    this.categories.clear()
    this.dependencies.clear()
    this.conflicts.clear()

    // 重新初始化
    this.initializeCategories()

    // 注册插件
    this.registerPlugins(plugins)
  }
}

// 创建全局插件注册表实例
export const pluginRegistry = new PluginRegistry() 