import { Plugin, PluginManifest, RouteConfig } from '../../data/models/Plugin'

export interface PluginLifecycle {
  onInstall?: () => Promise<void>
  onUninstall?: () => Promise<void>
  onEnable?: () => Promise<void>
  onDisable?: () => Promise<void>
  onUpdate?: (oldVersion: string, newVersion: string) => Promise<void>
}

export interface PluginContext {
  pluginId: string
  version: string
  config: Record<string, any>
  api: {
    get: (url: string) => Promise<any>
    post: (url: string, data: any) => Promise<any>
    put: (url: string, data: any) => Promise<any>
    delete: (url: string) => Promise<any>
  }
  store: {
    get: (key: string) => any
    set: (key: string, value: any) => void
    subscribe: (callback: (state: any) => void) => () => void
  }
}

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map()
  private installedPlugins: Set<string> = new Set()
  private enabledPlugins: Set<string> = new Set()
  private pluginRoutes: Map<string, RouteConfig[]> = new Map()
  private pluginComponents: Map<string, Map<string, any>> = new Map()
  private pluginHooks: Map<string, Map<string, any>> = new Map()
  private pluginServices: Map<string, Map<string, any>> = new Map()
  private pluginStores: Map<string, Map<string, any>> = new Map()
  private lifecycleHooks: Map<string, PluginLifecycle> = new Map()

  constructor() {
    this.loadInstalledPlugins()
  }

  // 获取所有插件
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values())
  }

  // 获取已安装的插件
  getInstalledPlugins(): Plugin[] {
    return this.getAllPlugins().filter(plugin => this.installedPlugins.has(plugin.id))
  }

  // 获取已启用的插件
  getEnabledPlugins(): Plugin[] {
    return this.getAllPlugins().filter(plugin => this.enabledPlugins.has(plugin.id))
  }

  // 安装插件
  async installPlugin(pluginId: string, manifest: PluginManifest): Promise<void> {
    try {
      // 检查依赖
      await this.checkDependencies(manifest)
      
      // 创建插件实例
      const plugin: Plugin = {
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        author: manifest.author,
        category: manifest.category,
        tags: manifest.tags || [],
        license: manifest.license,
        dependencies: manifest.dependencies || [],
        permissions: manifest.permissions || [],
        isInstalled: true,
        isEnabled: false,
        isCompatible: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        downloads: 0,
        rating: 0,
        reviews: 0
      }

      // 注册插件
      this.plugins.set(pluginId, plugin)
      this.installedPlugins.add(pluginId)

      // 注册路由
      if (manifest.frontend?.routes) {
        this.pluginRoutes.set(pluginId, manifest.frontend.routes)
      }

      // 执行安装生命周期
      const lifecycle = this.lifecycleHooks.get(pluginId)
      if (lifecycle?.onInstall) {
        await lifecycle.onInstall()
      }

      // 保存到本地存储
      this.savePluginState()
    } catch (error) {
      throw new Error(`插件安装失败: ${error}`)
    }
  }

  // 卸载插件
  async uninstallPlugin(pluginId: string): Promise<void> {
    try {
      // 先禁用插件
      await this.disablePlugin(pluginId)

      // 执行卸载生命周期
      const lifecycle = this.lifecycleHooks.get(pluginId)
      if (lifecycle?.onUninstall) {
        await lifecycle.onUninstall()
      }

      // 清理插件资源
      this.plugins.delete(pluginId)
      this.installedPlugins.delete(pluginId)
      this.enabledPlugins.delete(pluginId)
      this.pluginRoutes.delete(pluginId)
      this.pluginComponents.delete(pluginId)
      this.pluginHooks.delete(pluginId)
      this.pluginServices.delete(pluginId)
      this.pluginStores.delete(pluginId)
      this.lifecycleHooks.delete(pluginId)

      // 保存到本地存储
      this.savePluginState()
    } catch (error) {
      throw new Error(`插件卸载失败: ${error}`)
    }
  }

  // 启用插件
  async enablePlugin(pluginId: string): Promise<void> {
    try {
      const plugin = this.plugins.get(pluginId)
      if (!plugin) {
        throw new Error('插件不存在')
      }

      if (!plugin.isInstalled) {
        throw new Error('插件未安装')
      }

      // 执行启用生命周期
      const lifecycle = this.lifecycleHooks.get(pluginId)
      if (lifecycle?.onEnable) {
        await lifecycle.onEnable()
      }

      // 启用插件
      plugin.isEnabled = true
      this.enabledPlugins.add(pluginId)

      // 保存到本地存储
      this.savePluginState()
    } catch (error) {
      throw new Error(`插件启用失败: ${error}`)
    }
  }

  // 禁用插件
  async disablePlugin(pluginId: string): Promise<void> {
    try {
      const plugin = this.plugins.get(pluginId)
      if (!plugin) {
        throw new Error('插件不存在')
      }

      // 执行禁用生命周期
      const lifecycle = this.lifecycleHooks.get(pluginId)
      if (lifecycle?.onDisable) {
        await lifecycle.onDisable()
      }

      // 禁用插件
      plugin.isEnabled = false
      this.enabledPlugins.delete(pluginId)

      // 保存到本地存储
      this.savePluginState()
    } catch (error) {
      throw new Error(`插件禁用失败: ${error}`)
    }
  }

  // 更新插件
  async updatePlugin(pluginId: string, newVersion: string): Promise<void> {
    try {
      const plugin = this.plugins.get(pluginId)
      if (!plugin) {
        throw new Error('插件不存在')
      }

      const oldVersion = plugin.version

      // 执行更新生命周期
      const lifecycle = this.lifecycleHooks.get(pluginId)
      if (lifecycle?.onUpdate) {
        await lifecycle.onUpdate(oldVersion, newVersion)
      }

      // 更新插件版本
      plugin.version = newVersion
      plugin.updatedAt = new Date().toISOString()

      // 保存到本地存储
      this.savePluginState()
    } catch (error) {
      throw new Error(`插件更新失败: ${error}`)
    }
  }

  // 检查插件依赖
  private async checkDependencies(manifest: PluginManifest): Promise<void> {
    if (!manifest.dependencies) return

    for (const dependency of manifest.dependencies) {
      const [depId, depVersion] = dependency.split('@')
      const installedPlugin = this.plugins.get(depId)
      
      if (!installedPlugin) {
        throw new Error(`缺少依赖插件: ${depId}`)
      }

      if (depVersion && installedPlugin.version !== depVersion) {
        throw new Error(`依赖插件版本不匹配: ${depId}@${depVersion}`)
      }
    }
  }

  // 注册插件组件
  registerComponent(pluginId: string, componentName: string, component: any): void {
    if (!this.pluginComponents.has(pluginId)) {
      this.pluginComponents.set(pluginId, new Map())
    }
    this.pluginComponents.get(pluginId)!.set(componentName, component)
  }

  // 获取插件组件
  getComponent(pluginId: string, componentName: string): any {
    return this.pluginComponents.get(pluginId)?.get(componentName)
  }

  // 注册插件Hook
  registerHook(pluginId: string, hookName: string, hook: any): void {
    if (!this.pluginHooks.has(pluginId)) {
      this.pluginHooks.set(pluginId, new Map())
    }
    this.pluginHooks.get(pluginId)!.set(hookName, hook)
  }

  // 获取插件Hook
  getHook(pluginId: string, hookName: string): any {
    return this.pluginHooks.get(pluginId)?.get(hookName)
  }

  // 注册插件服务
  registerService(pluginId: string, serviceName: string, service: any): void {
    if (!this.pluginServices.has(pluginId)) {
      this.pluginServices.set(pluginId, new Map())
    }
    this.pluginServices.get(pluginId)!.set(serviceName, service)
  }

  // 获取插件服务
  getService(pluginId: string, serviceName: string): any {
    return this.pluginServices.get(pluginId)?.get(serviceName)
  }

  // 注册插件Store
  registerStore(pluginId: string, storeName: string, store: any): void {
    if (!this.pluginStores.has(pluginId)) {
      this.pluginStores.set(pluginId, new Map())
    }
    this.pluginStores.get(pluginId)!.set(storeName, store)
  }

  // 获取插件Store
  getStore(pluginId: string, storeName: string): any {
    return this.pluginStores.get(pluginId)?.get(storeName)
  }

  // 注册生命周期钩子
  registerLifecycle(pluginId: string, lifecycle: PluginLifecycle): void {
    this.lifecycleHooks.set(pluginId, lifecycle)
  }

  // 获取插件路由
  getPluginRoutes(): RouteConfig[] {
    const routes: RouteConfig[] = []
    for (const [pluginId, pluginRoutes] of this.pluginRoutes) {
      if (this.enabledPlugins.has(pluginId)) {
        routes.push(...pluginRoutes)
      }
    }
    return routes
  }

  // 加载已安装的插件
  private loadInstalledPlugins(): void {
    try {
      const savedPlugins = localStorage.getItem('installedPlugins')
      if (savedPlugins) {
        const plugins = JSON.parse(savedPlugins)
        this.installedPlugins = new Set(plugins.installed || [])
        this.enabledPlugins = new Set(plugins.enabled || [])
      }
    } catch (error) {
      console.error('加载插件状态失败:', error)
    }
  }

  // 保存插件状态
  private savePluginState(): void {
    try {
      const state = {
        installed: Array.from(this.installedPlugins),
        enabled: Array.from(this.enabledPlugins)
      }
      localStorage.setItem('installedPlugins', JSON.stringify(state))
    } catch (error) {
      console.error('保存插件状态失败:', error)
    }
  }
}

// 创建全局插件管理器实例
export const pluginManager = new PluginManager() 