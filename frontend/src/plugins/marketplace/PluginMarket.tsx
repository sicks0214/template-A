import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { pluginRegistry } from '../core/PluginRegistry'
import { pluginManager } from '../core/PluginManager'
import { PluginMetadata } from '../core/PluginRegistry'
import PluginCard from './PluginCard'
import PluginSearch from './PluginSearch'
import PluginCategories from './PluginCategories'

const PluginMarket: React.FC = () => {
  const { t } = useTranslation()
  const [plugins, setPlugins] = useState<PluginMetadata[]>([])
  const [filteredPlugins, setFilteredPlugins] = useState<PluginMetadata[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'downloads' | 'updated'>('rating')
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    loadPlugins()
  }, [])

  useEffect(() => {
    filterAndSortPlugins()
  }, [plugins, selectedCategory, searchQuery, sortBy])

  const loadPlugins = async () => {
    try {
      setLoading(true)
      // 这里应该从API加载插件数据
      const allPlugins = pluginRegistry.getAllPlugins()
      setPlugins(allPlugins)
    } catch (error) {
      console.error('加载插件失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortPlugins = () => {
    let filtered = [...plugins]

    // 按分类过滤
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(plugin => plugin.category === selectedCategory)
    }

    // 按搜索查询过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(plugin =>
        plugin.name.toLowerCase().includes(query) ||
        plugin.description.toLowerCase().includes(query) ||
        plugin.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'rating':
          return b.rating - a.rating
        case 'downloads':
          return b.downloads - a.downloads
        case 'updated':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        default:
          return 0
      }
    })

    setFilteredPlugins(filtered)
  }

  const handleInstallPlugin = async (pluginId: string) => {
    try {
      // 这里应该调用插件管理器安装插件
      await pluginManager.installPlugin(pluginId, {
        id: pluginId,
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test plugin description',
        author: 'Test Author',
        category: 'utilities',
        tags: ['test'],
        license: 'MIT',
        dependencies: [],
        permissions: []
      })
      
      // 刷新插件列表
      await loadPlugins()
    } catch (error) {
      console.error('安装插件失败:', error)
    }
  }

  const handleUninstallPlugin = async (pluginId: string) => {
    try {
      await pluginManager.uninstallPlugin(pluginId)
      await loadPlugins()
    } catch (error) {
      console.error('卸载插件失败:', error)
    }
  }

  const handleEnablePlugin = async (pluginId: string) => {
    try {
      await pluginManager.enablePlugin(pluginId)
      await loadPlugins()
    } catch (error) {
      console.error('启用插件失败:', error)
    }
  }

  const handleDisablePlugin = async (pluginId: string) => {
    try {
      await pluginManager.disablePlugin(pluginId)
      await loadPlugins()
    } catch (error) {
      console.error('禁用插件失败:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('plugins.market.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('plugins.market.title')}
          </h1>
          <p className="text-gray-600">
            {t('plugins.market.subtitle')}
          </p>
        </div>

        {/* 搜索和过滤 */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <PluginSearch
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={t('plugins.market.search.placeholder')}
              />
            </div>
            <div className="flex gap-4">
              <PluginCategories
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                categories={pluginRegistry.getCategories()}
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="rating">{t('plugins.market.sort.rating')}</option>
                <option value="downloads">{t('plugins.market.sort.downloads')}</option>
                <option value="updated">{t('plugins.market.sort.updated')}</option>
                <option value="name">{t('plugins.market.sort.name')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-blue-600">
                {filteredPlugins.length}
              </div>
              <div className="text-sm text-gray-600">
                {t('plugins.market.stats.total')}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-green-600">
                {pluginManager.getInstalledPlugins().length}
              </div>
              <div className="text-sm text-gray-600">
                {t('plugins.market.stats.installed')}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-purple-600">
                {pluginManager.getEnabledPlugins().length}
              </div>
              <div className="text-sm text-gray-600">
                {t('plugins.market.stats.enabled')}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-orange-600">
                {pluginRegistry.getCategories().length}
              </div>
              <div className="text-sm text-gray-600">
                {t('plugins.market.stats.categories')}
              </div>
            </div>
          </div>
        </div>

        {/* 插件列表 */}
        {filteredPlugins.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('plugins.market.noResults.title')}
            </h3>
            <p className="text-gray-600">
              {t('plugins.market.noResults.description')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPlugins.map((plugin) => (
              <PluginCard
                key={plugin.id}
                plugin={plugin}
                isInstalled={pluginManager.getInstalledPlugins().some(p => p.id === plugin.id)}
                isEnabled={pluginManager.getEnabledPlugins().some(p => p.id === plugin.id)}
                onInstall={() => handleInstallPlugin(plugin.id)}
                onUninstall={() => handleUninstallPlugin(plugin.id)}
                onEnable={() => handleEnablePlugin(plugin.id)}
                onDisable={() => handleDisablePlugin(plugin.id)}
              />
            ))}
          </div>
        )}

        {/* 分页 */}
        {filteredPlugins.length > 0 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                {t('plugins.market.pagination.previous')}
              </button>
              <span className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md">
                1
              </span>
              <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                {t('plugins.market.pagination.next')}
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  )
}

export default PluginMarket 