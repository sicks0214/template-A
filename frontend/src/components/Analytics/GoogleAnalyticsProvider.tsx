/**
 * Google Analytics 提供者组件
 * 统一管理GA初始化和全局追踪
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { usePageTracking, useGoogleAnalytics, useErrorTracking } from '@/hooks/useGoogleAnalytics';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface GoogleAnalyticsContextType {
  isEnabled: boolean;
  trackEvent: (eventName: string, parameters?: Record<string, any>) => void;
  trackColorAnalysis: (action: 'image_upload' | 'color_extract' | 'palette_export' | 'manual_pick', details?: Record<string, any>) => void;
  trackAuth: (action: 'login' | 'register' | 'logout', method?: string) => void;
  trackLanguage: (fromLanguage: string, toLanguage: string) => void;
  trackError: (errorType: string, errorMessage: string, errorLocation?: string) => void;
  trackFeedback: (feedbackType: string, rating?: number) => void;
  trackExport: (exportType: 'css' | 'json' | 'ase' | 'sketch', colorCount: number) => void;
}

const GoogleAnalyticsContext = createContext<GoogleAnalyticsContextType | null>(null);

interface GoogleAnalyticsProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

export const GoogleAnalyticsProvider: React.FC<GoogleAnalyticsProviderProps> = ({
  children,
  enabled = true
}) => {
  const { i18n } = useTranslation();
  const location = useLocation();
  
  // 初始化GA Hooks
  const ga = useGoogleAnalytics();
  const { trackComponentError } = useErrorTracking();
  
  // 自动页面追踪
  usePageTracking();

  // 设置用户属性
  useEffect(() => {
    if (enabled) {
      ga.setUser({
        language: i18n.language,
        page_path: location.pathname,
        app_version: '2.0.0',
      });
    }
  }, [enabled, ga, i18n.language, location.pathname]);

  // 监听语言变化
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      if (enabled && lng !== i18n.language) {
        ga.trackLanguage(i18n.language, lng);
      }
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [enabled, ga, i18n]);

  // 全局错误处理
  useEffect(() => {
    if (!enabled) return;

    const handleError = (event: ErrorEvent) => {
      ga.trackError(
        'javascript_error',
        event.message,
        `${event.filename}:${event.lineno}:${event.colno}`
      );
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      ga.trackError(
        'unhandled_promise_rejection',
        String(event.reason),
        'global'
      );
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [enabled, ga]);

  const contextValue: GoogleAnalyticsContextType = {
    isEnabled: enabled,
    trackEvent: ga.track,
    trackColorAnalysis: ga.trackColorAnalysis,
    trackAuth: ga.trackAuth,
    trackLanguage: ga.trackLanguage,
    trackError: ga.trackError,
    trackFeedback: ga.trackFeedback,
    trackExport: ga.trackExport,
  };

  return (
    <GoogleAnalyticsContext.Provider value={contextValue}>
      {children}
    </GoogleAnalyticsContext.Provider>
  );
};

/**
 * 使用Google Analytics上下文的Hook
 */
export const useGAContext = (): GoogleAnalyticsContextType => {
  const context = useContext(GoogleAnalyticsContext);
  
  if (!context) {
    throw new Error('useGAContext must be used within a GoogleAnalyticsProvider');
  }
  
  return context;
};

/**
 * 高阶组件：为组件添加GA追踪能力
 */
export const withGoogleAnalytics = <P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> => {
  const WrappedComponent = (props: P) => {
    const ga = useGAContext();
    
    return <Component {...props} ga={ga} />;
  };
  
  WrappedComponent.displayName = `withGoogleAnalytics(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default GoogleAnalyticsProvider;
