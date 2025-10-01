/**
 * 简单示例页面
 * 
 * 这是一个最小化的示例页面，展示：
 * 1. 基本的React组件结构
 * 2. 如何使用国际化(i18n)
 * 3. 如何调用模块API
 * 4. 如何使用TailwindCSS样式
 */

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const SimplePage: React.FC = () => {
  const { t } = useTranslation('simple')
  const [message, setMessage] = useState<string>('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // 调用模块API示例
  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/simple/hello')
      const result = await response.json()
      setData(result)
      setMessage(result.message || '')
    } catch (error) {
      console.error('Error fetching data:', error)
      setMessage('Error loading data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Title Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              {t('title', '简单示例模块')}
            </h1>
            <p className="text-lg text-gray-600">
              {t('subtitle', '这是一个最小化的功能模块示例')}
            </p>
          </div>

          {/* Welcome Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">
                {t('welcome', '欢迎使用')}
              </h2>
            </div>
            
            <p className="text-gray-600 leading-relaxed mb-6">
              {t('description', '这个示例展示了如何创建一个新的功能模块。您可以基于这个模板快速开发自己的功能。')}
            </p>

            {/* API Demo */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {t('apiDemo', 'API调用示例')}
              </h3>
              
              {loading ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <p className="mt-2 text-gray-600">{t('loading', '加载中...')}</p>
                </div>
              ) : data ? (
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">消息:</p>
                    <p className="text-gray-800 font-medium">{message}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">时间戳:</p>
                    <p className="text-gray-800 font-mono text-sm">{data.timestamp}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">{t('noData', '暂无数据')}</p>
              )}

              <button
                onClick={fetchData}
                disabled={loading}
                className="mt-4 w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? t('loading', '加载中...') : t('refresh', '刷新数据')}
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {t('feature1Title', '快速开发')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('feature1Desc', '基于通用模板，快速创建新功能模块')}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {t('feature2Title', '规范部署')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('feature2Desc', '符合VPS部署规范和PostgreSQL总系统架构')}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {t('feature3Title', '模块化设计')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('feature3Desc', '核心系统与业务模块分离，易于扩展')}
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  {t('infoTitle', '开发提示')}
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>{t('infoText', '您可以在 modules/example-simple/ 目录中查看此模块的完整源代码，作为开发新模块的参考。')}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default SimplePage

