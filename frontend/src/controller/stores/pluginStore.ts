import { create } from 'zustand'

interface Plugin {
  id: string
  name: string
  version: string
  description: string
  author: string
  category: string
  isEnabled: boolean
  isInstalled: boolean
}

interface PluginState {
  // 插件状态
  plugins: Plugin[]
  installedPlugins: string[]
  enabledPlugins: string[]
  isLoading: boolean
  
  // 插件操作
  setPlugins: (plugins: Plugin[]) => void
  installPlugin: (pluginId: string) => void
  uninstallPlugin: (pluginId: string) => void
  enablePlugin: (pluginId: string) => void
  disablePlugin: (pluginId: string) => void
  setLoading: (loading: boolean) => void
}

export const usePluginStore = create<PluginState>((set, get) => ({
  // 初始状态
  plugins: [],
  installedPlugins: [],
  enabledPlugins: [],
  isLoading: false,
  
  // 状态更新方法
  setPlugins: (plugins) => set({ plugins }),
  installPlugin: (pluginId) => {
    const { installedPlugins } = get()
    if (!installedPlugins.includes(pluginId)) {
      set({ installedPlugins: [...installedPlugins, pluginId] })
    }
  },
  uninstallPlugin: (pluginId) => {
    const { installedPlugins, enabledPlugins } = get()
    set({
      installedPlugins: installedPlugins.filter(id => id !== pluginId),
      enabledPlugins: enabledPlugins.filter(id => id !== pluginId)
    })
  },
  enablePlugin: (pluginId) => {
    const { enabledPlugins } = get()
    if (!enabledPlugins.includes(pluginId)) {
      set({ enabledPlugins: [...enabledPlugins, pluginId] })
    }
  },
  disablePlugin: (pluginId) => {
    const { enabledPlugins } = get()
    set({ enabledPlugins: enabledPlugins.filter(id => id !== pluginId) })
  },
  setLoading: (loading) => set({ isLoading: loading })
})) 