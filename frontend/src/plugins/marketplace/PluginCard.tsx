import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PluginMetadata } from '../core/PluginRegistry'

interface PluginCardProps {
  plugin: PluginMetadata
  isInstalled: boolean
  isEnabled: boolean
  onInstall: () => void
  onUninstall: () => void
  onEnable: () => void
  onDisable: () => void
}

const PluginCard: React.FC<PluginCardProps> = ({
  plugin,
  isInstalled,
  isEnabled,
  onInstall,
  onUninstall,
  onEnable,
  onDisable
}) => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  const handleAction = async (action: () => void) => {
    setLoading(true)
    try {
      await action()
    } catch (error) {
      console.error('插件操作失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )
    }

    if (hasHalfStar) {
      stars.push(
        <svg key="half" className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="halfStar">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#e5e7eb" />
            </linearGradient>
          </defs>
          <path fill="url(#halfStar)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )
    }

    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg key={`empty-${i}`} className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )
    }

    return stars
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* 插件图标和基本信息 */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              {plugin.icon ? (
                <img src={plugin.icon} alt={plugin.name} className="w-8 h-8" />
              ) : (
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{plugin.name}</h3>
              <p className="text-sm text-gray-500">v{plugin.version}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {renderStars(plugin.rating)}
            <span className="text-sm text-gray-500 ml-1">({plugin.reviews})</span>
          </div>
        </div>

        {/* 插件描述 */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {plugin.description}
        </p>

        {/* 标签 */}
        <div className="flex flex-wrap gap-1 mb-4">
          {plugin.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
            >
              {tag}
            </span>
          ))}
          {plugin.tags.length > 3 && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
              +{plugin.tags.length - 3}
            </span>
          )}
        </div>

        {/* 统计信息 */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>{plugin.downloads.toLocaleString()} {t('plugins.card.downloads')}</span>
          <span>{plugin.author}</span>
        </div>

        {/* 许可证 */}
        <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
          <span>{plugin.license}</span>
          <span>{new Date(plugin.lastUpdated).toLocaleDateString()}</span>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="px-6 pb-6">
        {isInstalled ? (
          <div className="space-y-2">
            {isEnabled ? (
              <button
                onClick={() => handleAction(onDisable)}
                disabled={loading}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              >
                {loading ? t('plugins.card.disabling') : t('plugins.card.disable')}
              </button>
            ) : (
              <button
                onClick={() => handleAction(onEnable)}
                disabled={loading}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading ? t('plugins.card.enabling') : t('plugins.card.enable')}
              </button>
            )}
            <button
              onClick={() => handleAction(onUninstall)}
              disabled={loading}
              className="w-full px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            >
              {loading ? t('plugins.card.uninstalling') : t('plugins.card.uninstall')}
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleAction(onInstall)}
            disabled={loading}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? t('plugins.card.installing') : t('plugins.card.install')}
          </button>
        )}
      </div>

      {/* 状态指示器 */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between text-xs">
          {isInstalled && (
            <span className="flex items-center text-green-600">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {isEnabled ? t('plugins.card.status.enabled') : t('plugins.card.status.disabled')}
            </span>
          )}
          <span className="text-gray-400 capitalize">{plugin.category}</span>
        </div>
      </div>
    </div>
  )
}

export default PluginCard 