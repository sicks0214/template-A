import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'

interface NavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const navItems = [
    // COLOR01 已删除 - Dark Color Palettes功能已移除
    // COLOR03 已删除 - Pixel Art Converter功能已移除
    { id: 'COLOR02', label: t('colorcraft.navigation.color02'), icon: '🖼️', description: t('colorcraft.navigation.color02') },
    // 暂时隐藏以下功能，后续开发时再显示
    // { id: 'COLOR04', label: t('colorcraft.navigation.color04'), icon: '📊', description: t('colorcraft.navigation.color04') },
    // { id: 'COLOR05', label: t('colorcraft.navigation.color05'), icon: '⚙️', description: t('colorcraft.navigation.color05') }
  ]

  // 过滤显示的导航项目（暂时隐藏COLOR04、COLOR05，已删除COLOR01、COLOR03）
  const visibleNavItems = navItems.filter(item => !['COLOR01', 'COLOR03', 'COLOR04', 'COLOR05'].includes(item.id))

  // 处理导航点击
  const handleNavClick = (itemId: string) => {
    // 所有标签页都使用标签切换
    onTabChange(itemId)
  }

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* 左侧品牌 */}
          <div className="flex items-center space-x-8">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">RK</span>
              </div>
              <span className="text-xl font-bold text-gray-900">{t('colorcraft.title')}</span>
            </button>
            
            {/* 导航按钮 */}
            <div className="hidden md:flex items-center space-x-1">
              {visibleNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                    flex items-center space-x-1.5 group relative max-w-fit whitespace-nowrap
                    ${activeTab === item.id 
                      ? 'bg-emerald-50 text-emerald-700 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                  title={item.description}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-xs leading-tight">{item.label}</span>
                  
                  {/* 活动指示器 */}
                  {activeTab === item.id && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-emerald-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 右侧操作 */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder={t('common.search') || 'Search'}
                className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <LanguageSwitcher />
            
            <button 
              onClick={() => navigate('/')}
              className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m0 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Home</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* 移动端导航 */}
      <div className="md:hidden border-t">
        <div className="flex overflow-x-auto px-4 py-2 space-x-1">
          {visibleNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`
                flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium
                ${activeTab === item.id 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'text-gray-600'
                }
              `}
            >
              <div className="flex flex-col items-center space-y-1">
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default Navigation 