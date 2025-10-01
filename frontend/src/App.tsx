/**
 * Main Application Component - renk kodu bulma Design
 */

import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import HomePage from '@/pages/HomePage'
import ContactPage from '@/pages/ContactPage'
import TermsOfServicePage from '@/pages/TermsOfServicePage'
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage'
import DisclaimerPage from '@/pages/DisclaimerPage'
import NotFoundPage from '@/pages/NotFoundPage'
import AuthTestPage from '@/pages/AuthTestPage'
import SimpleTestPage from '@/pages/SimpleTestPage'

// ⚠️ 模块页面将在这里导入
// 示例：import SimplePage from '../../../modules/example-simple/frontend/pages/SimplePage'
import FloatingFeedback from '@/components/common/FloatingFeedback'
import { AuthProvider } from '@/hooks/useAuth'
import { AuthModalProvider } from '@/components/Auth/AuthModals'
import { GoogleAnalyticsProvider } from '@/components/Analytics/GoogleAnalyticsProvider'

// Language initialization component
const LanguageInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation()
  
  useEffect(() => {
    // Load user's preferred language or detect browser language
    const preferredLanguage = localStorage.getItem('preferredLanguage')
    if (preferredLanguage && i18n.language !== preferredLanguage) {
      i18n.changeLanguage(preferredLanguage)
    }
  }, [i18n])

  return <>{children}</>
}

const App: React.FC = () => {
  console.log('🎨 renk kodu bulma App Starting')
  
  return (
    <BrowserRouter>
      <GoogleAnalyticsProvider enabled={true}>
        <AuthProvider>
          <AuthModalProvider>
            <LanguageInitializer>
              <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/disclaimer" element={<DisclaimerPage />} />
            <Route path="/simple-test" element={<SimpleTestPage />} />
            <Route path="/auth-test" element={<AuthTestPage />} />
            
            {/* ⚠️ 模块路由将在这里注册 */}
            {/* 示例：<Route path="/simple" element={<SimplePage />} /> */}
            
            <Route path="*" element={<NotFoundPage />} />
            </Routes>
            
              {/* Global floating feedback */}
              <FloatingFeedback />
            </LanguageInitializer>
          </AuthModalProvider>
        </AuthProvider>
      </GoogleAnalyticsProvider>
    </BrowserRouter>
  )
}

export default App 