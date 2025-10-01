/**
 * 简单测试页面 - 不依赖认证系统
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

export default function SimpleTestPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          🎨 {t('test.title')}
        </h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h2 className="font-semibold text-green-800 mb-2">✅ {t('test.frontend.title')}</h2>
            <p className="text-green-700 text-sm">
              {t('test.frontend.description')}
            </p>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="font-semibold text-blue-800 mb-2">🔧 {t('test.system.title')}</h2>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• {t('test.system.frontendPort')}</li>
              <li>• {t('test.system.backendPort')}</li>
              <li>• {t('test.system.currentTime')}: {new Date().toLocaleString()}</li>
              <li>• {t('test.system.browser')}: {navigator.userAgent.split(' ')[0]}</li>
            </ul>
          </div>
          
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h2 className="font-semibold text-yellow-800 mb-2">🚀 {t('test.nextSteps.title')}</h2>
            <p className="text-yellow-700 text-sm mb-2">
              {t('test.nextSteps.description')}
            </p>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• <a href="/" className="underline hover:text-yellow-900">{t('test.nextSteps.home')}</a></li>
              <li>• <a href="/app" className="underline hover:text-yellow-900">{t('test.nextSteps.app')}</a></li>
              <li>• <a href="/auth-test" className="underline hover:text-yellow-900">{t('test.nextSteps.authTest')}</a></li>
            </ul>
          </div>
          
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            {t('test.refresh')}
          </button>
        </div>
      </div>
    </div>
  );
}
