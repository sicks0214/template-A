import { PluginManifest } from '../../data/models/Plugin'
import { pluginManager } from './PluginManager'

export interface PluginLoaderOptions {
  baseUrl?: string
  timeout?: number
  retryCount?: number
}

export class PluginLoader {
  private baseUrl: string
  private timeout: number
  private retryCount: number
  private loadedPlugins: Set<string> = new Set()

  constructor(options: PluginLoaderOptions = {}) {
    this.baseUrl = options.baseUrl || '/plugins'
    this.timeout = options.timeout || 10000
    this.retryCount = options.retryCount || 3
  }

  // 加载插件
  async loadPlugin(pluginId: string): Promise<void> {
    try {
      // 检查是否已加载
      if (this.loadedPlugins.has(pluginId)) {
        return
      }

      // 加载插件清单
      const manifest = await this.loadManifest(pluginId)
      
      // 验证插件清单
      this.validateManifest(manifest)

      // 加载插件资源
      await this.loadPluginResources(pluginId, manifest)

      // 注册插件
      await pluginManager.installPlugin(pluginId, manifest)

      // 标记为已加载
      this.loadedPlugins.add(pluginId)

      console.log(`插件加载成功: ${pluginId}`)
    } catch (error) {
      console.error(`插件加载失败: ${pluginId}`, error)
      throw error
    }
  }

  // 加载插件清单
  private async loadManifest(pluginId: string): Promise<PluginManifest> {
    const manifestUrl = `${this.baseUrl}/${pluginId}/manifest.json`
    
    try {
      const response = await this.fetchWithRetry(manifestUrl)
      if (!response.ok) {
        throw new Error(`加载插件清单失败: ${response.status}`)
      }
      
      const manifest = await response.json()
      return manifest
    } catch (error) {
      throw new Error(`加载插件清单失败: ${error}`)
    }
  }

  // 加载插件资源
  private async loadPluginResources(pluginId: string, manifest: PluginManifest): Promise<void> {
    const promises: Promise<void>[] = []

    // 加载前端组件
    if (manifest.frontend?.components) {
      for (const [componentName, componentPath] of Object.entries(manifest.frontend.components)) {
        promises.push(this.loadComponent(pluginId, componentName, componentPath))
      }
    }

    // 加载Hook
    if (manifest.frontend?.hooks) {
      for (const [hookName, hookPath] of Object.entries(manifest.frontend.hooks)) {
        promises.push(this.loadHook(pluginId, hookName, hookPath))
      }
    }

    // 加载服务
    if (manifest.frontend?.services) {
      for (const [serviceName, servicePath] of Object.entries(manifest.frontend.services)) {
        promises.push(this.loadService(pluginId, serviceName, servicePath))
      }
    }

    // 加载Store
    if (manifest.frontend?.stores) {
      for (const [storeName, storePath] of Object.entries(manifest.frontend.stores)) {
        promises.push(this.loadStore(pluginId, storeName, storePath))
      }
    }

    // 等待所有资源加载完成
    await Promise.all(promises)
  }

  // 加载组件
  private async loadComponent(pluginId: string, componentName: string, componentPath: string): Promise<void> {
    try {
      const componentUrl = `${this.baseUrl}/${pluginId}/${componentPath}`
      const component = await this.loadModule(componentUrl)
      pluginManager.registerComponent(pluginId, componentName, component.default || component)
    } catch (error) {
      console.error(`加载组件失败: ${pluginId}/${componentName}`, error)
    }
  }

  // 加载Hook
  private async loadHook(pluginId: string, hookName: string, hookPath: string): Promise<void> {
    try {
      const hookUrl = `${this.baseUrl}/${pluginId}/${hookPath}`
      const hook = await this.loadModule(hookUrl)
      pluginManager.registerHook(pluginId, hookName, hook.default || hook)
    } catch (error) {
      console.error(`加载Hook失败: ${pluginId}/${hookName}`, error)
    }
  }

  // 加载服务
  private async loadService(pluginId: string, serviceName: string, servicePath: string): Promise<void> {
    try {
      const serviceUrl = `${this.baseUrl}/${pluginId}/${servicePath}`
      const service = await this.loadModule(serviceUrl)
      pluginManager.registerService(pluginId, serviceName, service.default || service)
    } catch (error) {
      console.error(`加载服务失败: ${pluginId}/${serviceName}`, error)
    }
  }

  // 加载Store
  private async loadStore(pluginId: string, storeName: string, storePath: string): Promise<void> {
    try {
      const storeUrl = `${this.baseUrl}/${pluginId}/${storePath}`
      const store = await this.loadModule(storeUrl)
      pluginManager.registerStore(pluginId, storeName, store.default || store)
    } catch (error) {
      console.error(`加载Store失败: ${pluginId}/${storeName}`, error)
    }
  }

  // 动态加载模块
  private async loadModule(url: string): Promise<any> {
    try {
      // 使用动态import加载模块
      const module = await import(/* webpackIgnore: true */ url)
      return module
    } catch (error) {
      // 如果动态import失败，尝试fetch加载
      const response = await this.fetchWithRetry(url)
      if (!response.ok) {
        throw new Error(`加载模块失败: ${response.status}`)
      }
      
      const code = await response.text()
      // 这里需要根据实际情况处理代码执行
      // 可以使用Function构造函数或eval（不推荐）
      return eval(`(${code})`)
    }
  }

  // 带重试的fetch
  private async fetchWithRetry(url: string): Promise<Response> {
    let lastError: Error | null = null
    
    for (let i = 0; i < this.retryCount; i++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.timeout)
        
        const response = await fetch(url, {
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        return response
      } catch (error) {
        lastError = error as Error
        if (i < this.retryCount - 1) {
          // 等待一段时间后重试
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
        }
      }
    }
    
    throw lastError || new Error('请求失败')
  }

  // 验证插件清单
  private validateManifest(manifest: PluginManifest): void {
    const requiredFields = ['id', 'name', 'version', 'description', 'author', 'category', 'license']
    
    for (const field of requiredFields) {
      if (!manifest[field as keyof PluginManifest]) {
        throw new Error(`插件清单缺少必需字段: ${field}`)
      }
    }

    // 验证版本格式
    if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      throw new Error('插件版本格式无效，应为 x.y.z 格式')
    }

    // 验证ID格式
    if (!/^[a-z0-9-]+$/.test(manifest.id)) {
      throw new Error('插件ID格式无效，只能包含小写字母、数字和连字符')
    }
  }

  // 卸载插件
  async unloadPlugin(pluginId: string): Promise<void> {
    try {
      await pluginManager.uninstallPlugin(pluginId)
      this.loadedPlugins.delete(pluginId)
      console.log(`插件卸载成功: ${pluginId}`)
    } catch (error) {
      console.error(`插件卸载失败: ${pluginId}`, error)
      throw error
    }
  }

  // 获取已加载的插件列表
  getLoadedPlugins(): string[] {
    return Array.from(this.loadedPlugins)
  }

  // 检查插件是否已加载
  isPluginLoaded(pluginId: string): boolean {
    return this.loadedPlugins.has(pluginId)
  }
}

// 创建全局插件加载器实例
export const pluginLoader = new PluginLoader() 