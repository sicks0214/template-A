// 共享国际化配置

import { I18N_CONSTANTS } from '../constants'

// 支持的语言配置
export const SUPPORTED_LANGUAGES = [
  {
    code: 'zh',
    name: '中文',
    nativeName: '中文',
    flag: '🇨🇳',
    isDefault: true
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    isDefault: false
  },
  {
    code: 'ko',
    name: '한국어',
    nativeName: '한국어',
    flag: '🇰🇷',
    isDefault: false
  },
  {
    code: 'ja',
    name: '日本語',
    nativeName: '日本語',
    flag: '🇯🇵',
    isDefault: false
  },
  {
    code: 'fr',
    name: 'Français',
    nativeName: 'Français',
    flag: '🇫🇷',
    isDefault: false
  },
  {
    code: 'ru',
    name: 'Русский',
    nativeName: 'Русский',
    flag: '🇷🇺',
    isDefault: false
  },
  {
    code: 'de',
    name: 'Deutsch',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    isDefault: false
  }
] as const

// 语言代码类型
export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code']

// 国际化配置
export const I18N_CONFIG = {
  defaultLocale: I18N_CONSTANTS.DEFAULT_LOCALE,
  fallbackLocale: I18N_CONSTANTS.FALLBACK_LOCALE,
  supportedLocales: I18N_CONSTANTS.SUPPORTED_LOCALES,
  namespaceSeparator: I18N_CONSTANTS.NAMESPACE_SEPARATOR,
  missingKeyPrefix: I18N_CONSTANTS.MISSING_KEY_PREFIX
} as const

// 翻译键类型定义
export interface TranslationKeys {
  // 导航
  nav: {
    home: string
    about: string
    contact: string
    settings: string
    backToHome: string
    title: string
  }
  
  // 通用
  common: {
    loading: string
    error: string
    success: string
    cancel: string
    confirm: string
    save: string
    delete: string
    edit: string
    create: string
    upload: string
    download: string
    free: string
    paid: string
    comingSoon: string
    underDevelopment: string
    language: string
  }
  
  // 主页
  home: {
    title: string
    description: string
    hero: {
      title: string
      subtitle: string
      learnMore: string
      contactUs: string
    }
    features: {
      title: string
      subtitle: string
      modular: {
        title: string
        description: string
      }
      international: {
        title: string
        description: string
      }
      layered: {
        title: string
        description: string
      }
      fast: {
        title: string
        description: string
      }
      configurable: {
        title: string
        description: string
      }
      secure: {
        title: string
        description: string
      }
    }
    tech: {
      title: string
      subtitle: string
      frontend: string
      backend: string
      build: string
      i18n: string
    }
    cta: {
      title: string
      subtitle: string
      getStarted: string
      learnMore: string
    }
  }
  
  // 关于页面
  about: {
    title: string
    description: string
    subtitle: string
    features: {
      title: string
      responsive: string
      modular: string
      international: string
      plugin: string
    }
    tech: {
      title: string
    }
    contact: {
      title: string
      description: string
      link: string
    }
  }
  
  // 联系页面
  contact: {
    title: string
    description: string
    subtitle: string
    form: {
      name: string
      email: string
      message: string
      submit: string
      success: string
      error: string
    }
    info: {
      title: string
      address: string
      phone: string
      email: string
    }
  }
  
  // 插件
  plugin: {
    title: string
    description: string
    install: string
    uninstall: string
    enable: string
    disable: string
    update: string
    marketplace: string
    categories: {
      all: string
      ui: string
      dataVisualization: string
      form: string
      chart: string
      utility: string
      integration: string
    }
  }
  
  // 用户
  user: {
    profile: string
    settings: string
    logout: string
    login: string
    register: string
    forgotPassword: string
    resetPassword: string
  }
  
  // 错误
  error: {
    notFound: string
    unauthorized: string
    forbidden: string
    internalServer: string
    networkError: string
    timeout: string
  }
}

// 获取语言信息
export const getLanguageInfo = (code: LanguageCode) => {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code)
}

// 获取默认语言
export const getDefaultLanguage = () => {
  return SUPPORTED_LANGUAGES.find(lang => lang.isDefault) || SUPPORTED_LANGUAGES[0]
}

// 检查语言是否支持
export const isLanguageSupported = (code: string): code is LanguageCode => {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === code)
}

// 获取浏览器语言
export const getBrowserLanguage = (): LanguageCode => {
  const browserLang = navigator.language.split('-')[0]
  return isLanguageSupported(browserLang) ? browserLang : I18N_CONFIG.defaultLocale
}

// 导出默认配置
export default {
  SUPPORTED_LANGUAGES,
  I18N_CONFIG,
  getLanguageInfo,
  getDefaultLanguage,
  isLanguageSupported,
  getBrowserLanguage
} 