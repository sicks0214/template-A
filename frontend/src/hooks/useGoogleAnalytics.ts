/**
 * Google Analytics React Hook
 * 提供简化的GA追踪功能，集成到React组件中
 */

import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  trackPageView, 
  trackEvent, 
  trackColorAnalysisEvent,
  trackAuthEvent,
  trackLanguageChange,
  trackError,
  trackFeedbackSubmit,
  trackExportEvent,
  setUserProperties,
  getClientId,
  GA_EVENTS 
} from '@/services/googleAnalytics';

/**
 * 页面浏览追踪Hook
 * 自动追踪路由变化
 */
export const usePageTracking = (): void => {
  const location = useLocation();

  useEffect(() => {
    // 获取页面标题
    const pageTitle = document.title || 'renk kodu bulma';
    
    // 追踪页面浏览
    trackPageView(window.location.href, pageTitle);
  }, [location]);
};

/**
 * Google Analytics主Hook
 * 提供所有GA功能的统一接口
 */
export const useGoogleAnalytics = () => {
  // 追踪事件的回调函数
  const track = useCallback((eventName: string, parameters?: Record<string, any>) => {
    trackEvent(eventName, parameters);
  }, []);

  // 颜色分析事件追踪
  const trackColorAnalysis = useCallback((
    action: 'image_upload' | 'color_extract' | 'palette_export' | 'manual_pick',
    details?: Record<string, any>
  ) => {
    trackColorAnalysisEvent(action, details);
  }, []);

  // 用户认证事件追踪
  const trackAuth = useCallback((
    action: 'login' | 'register' | 'logout',
    method?: string
  ) => {
    trackAuthEvent(action, method);
  }, []);

  // 语言切换事件追踪
  const trackLanguage = useCallback((
    fromLanguage: string,
    toLanguage: string
  ) => {
    trackLanguageChange(fromLanguage, toLanguage);
  }, []);

  // 错误事件追踪
  const trackErrorEvent = useCallback((
    errorType: string,
    errorMessage: string,
    errorLocation?: string
  ) => {
    trackError(errorType, errorMessage, errorLocation);
  }, []);

  // 反馈事件追踪
  const trackFeedback = useCallback((
    feedbackType: string,
    rating?: number
  ) => {
    trackFeedbackSubmit(feedbackType, rating);
  }, []);

  // 导出事件追踪
  const trackExport = useCallback((
    exportType: 'css' | 'json' | 'ase' | 'sketch',
    colorCount: number
  ) => {
    trackExportEvent(exportType, colorCount);
  }, []);

  // 设置用户属性
  const setUser = useCallback((properties: Record<string, any>) => {
    setUserProperties(properties);
  }, []);

  // 获取客户端ID
  const getGA4ClientId = useCallback(async () => {
    return await getClientId();
  }, []);

  return {
    // 基础追踪
    track,
    
    // 特定事件追踪
    trackColorAnalysis,
    trackAuth,
    trackLanguage,
    trackError: trackErrorEvent,
    trackFeedback,
    trackExport,
    
    // 用户管理
    setUser,
    getClientId: getGA4ClientId,
    
    // 事件常量
    events: GA_EVENTS,
  };
};

/**
 * 错误边界追踪Hook
 * 用于自动追踪React错误边界捕获的错误
 */
export const useErrorTracking = () => {
  const trackComponentError = useCallback((
    error: Error,
    errorInfo: { componentStack: string }
  ) => {
    trackError(
      'react_error',
      error.message,
      errorInfo.componentStack
    );
  }, []);

  return { trackComponentError };
};

/**
 * 性能追踪Hook
 * 追踪页面加载和交互性能
 */
export const usePerformanceTracking = () => {
  const trackTiming = useCallback((
    name: string,
    value: number,
    category: string = 'performance'
  ) => {
    trackEvent('timing_complete', {
      event_category: category,
      name,
      value: Math.round(value),
    });
  }, []);

  const trackLoadTime = useCallback(() => {
    if (typeof window !== 'undefined' && window.performance) {
      const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
      if (loadTime > 0) {
        trackTiming('page_load_time', loadTime, 'page_performance');
      }
    }
  }, [trackTiming]);

  return {
    trackTiming,
    trackLoadTime,
  };
};

/**
 * 用户行为追踪Hook
 * 追踪用户在页面上的交互行为
 */
export const useUserBehaviorTracking = () => {
  const trackButtonClick = useCallback((buttonName: string, location?: string) => {
    trackEvent('button_click', {
      event_category: 'ui_interaction',
      button_name: buttonName,
      location,
    });
  }, []);

  const trackFormSubmit = useCallback((formName: string, success: boolean) => {
    trackEvent('form_submit', {
      event_category: 'form_interaction',
      form_name: formName,
      success,
    });
  }, []);

  const trackModalOpen = useCallback((modalName: string) => {
    trackEvent('modal_open', {
      event_category: 'ui_interaction',
      modal_name: modalName,
    });
  }, []);

  const trackFeatureUsage = useCallback((featureName: string, details?: Record<string, any>) => {
    trackEvent('feature_usage', {
      event_category: 'feature_interaction',
      feature_name: featureName,
      ...details,
    });
  }, []);

  return {
    trackButtonClick,
    trackFormSubmit,
    trackModalOpen,
    trackFeatureUsage,
  };
};

export default useGoogleAnalytics;
