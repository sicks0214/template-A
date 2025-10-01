/**
 * Google Analytics 4 集成服务
 * 提供页面浏览量追踪和自定义事件追踪功能
 */

// 扩展 Window 接口以包含 gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

// GA配置
const GA_TRACKING_ID = 'G-ZE6RT53HG3';

// 检查 gtag 是否可用
const isGtagAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

/**
 * 追踪页面浏览量
 * @param url 页面URL
 * @param title 页面标题
 */
export const trackPageView = (url: string, title?: string): void => {
  if (!isGtagAvailable()) {
    console.warn('Google Analytics not loaded');
    return;
  }

  try {
    window.gtag!('config', GA_TRACKING_ID, {
      page_location: url,
      page_title: title,
    });

    console.log('📊 GA Page View:', { url, title });
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
};

/**
 * 追踪自定义事件
 * @param eventName 事件名称
 * @param parameters 事件参数
 */
export const trackEvent = (
  eventName: string, 
  parameters?: Record<string, any>
): void => {
  if (!isGtagAvailable()) {
    console.warn('Google Analytics not loaded');
    return;
  }

  try {
    window.gtag!('event', eventName, {
      event_category: 'engagement',
      event_label: eventName,
      ...parameters,
    });

    console.log('📊 GA Event:', { eventName, parameters });
  } catch (error) {
    console.error('Error tracking event:', error);
  }
};

/**
 * 追踪颜色分析相关事件
 */
export const trackColorAnalysisEvent = (
  action: 'image_upload' | 'color_extract' | 'palette_export' | 'manual_pick',
  details?: Record<string, any>
): void => {
  trackEvent('color_analysis', {
    action,
    event_category: 'color_analysis',
    ...details,
  });
};

/**
 * 追踪用户认证事件
 */
export const trackAuthEvent = (
  action: 'login' | 'register' | 'logout',
  method?: string
): void => {
  trackEvent('auth', {
    action,
    event_category: 'authentication',
    method,
  });
};

/**
 * 追踪语言切换事件
 */
export const trackLanguageChange = (
  fromLanguage: string,
  toLanguage: string
): void => {
  trackEvent('language_change', {
    event_category: 'ui_interaction',
    from_language: fromLanguage,
    to_language: toLanguage,
  });
};

/**
 * 追踪错误事件
 */
export const trackError = (
  errorType: string,
  errorMessage: string,
  errorLocation?: string
): void => {
  trackEvent('error', {
    event_category: 'error',
    error_type: errorType,
    error_message: errorMessage,
    error_location: errorLocation,
  });
};

/**
 * 追踪反馈提交事件
 */
export const trackFeedbackSubmit = (
  feedbackType: string,
  rating?: number
): void => {
  trackEvent('feedback_submit', {
    event_category: 'feedback',
    feedback_type: feedbackType,
    rating,
  });
};

/**
 * 追踪导出事件
 */
export const trackExportEvent = (
  exportType: 'css' | 'json' | 'ase' | 'sketch',
  colorCount: number
): void => {
  trackEvent('export_palette', {
    event_category: 'export',
    export_type: exportType,
    color_count: colorCount,
  });
};

/**
 * 设置用户属性
 */
export const setUserProperties = (properties: Record<string, any>): void => {
  if (!isGtagAvailable()) {
    console.warn('Google Analytics not loaded');
    return;
  }

  try {
    window.gtag!('config', GA_TRACKING_ID, {
      custom_map: properties,
    });

    console.log('📊 GA User Properties:', properties);
  } catch (error) {
    console.error('Error setting user properties:', error);
  }
};

/**
 * 获取客户端ID
 */
export const getClientId = (): Promise<string | null> => {
  return new Promise((resolve) => {
    if (!isGtagAvailable()) {
      resolve(null);
      return;
    }

    try {
      window.gtag!('get', GA_TRACKING_ID, 'client_id', (clientId: string) => {
        resolve(clientId);
      });
    } catch (error) {
      console.error('Error getting client ID:', error);
      resolve(null);
    }
  });
};

// Google Analytics 4 事件名称常量
export const GA_EVENTS = {
  // 页面浏览
  PAGE_VIEW: 'page_view',
  
  // 用户交互
  CLICK: 'click',
  SEARCH: 'search',
  SHARE: 'share',
  
  // 颜色分析
  IMAGE_UPLOAD: 'image_upload',
  COLOR_EXTRACT: 'color_extract',
  MANUAL_COLOR_PICK: 'manual_color_pick',
  PALETTE_EXPORT: 'palette_export',
  
  // 用户认证
  LOGIN: 'login',
  REGISTER: 'sign_up',
  LOGOUT: 'logout',
  
  // 语言和设置
  LANGUAGE_CHANGE: 'language_change',
  SETTINGS_CHANGE: 'settings_change',
  
  // 错误和反馈
  ERROR: 'exception',
  FEEDBACK: 'feedback',
  
  // 转换事件
  CONVERSION: 'conversion',
} as const;

export default {
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
  GA_EVENTS,
};
