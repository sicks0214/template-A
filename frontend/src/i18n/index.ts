import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import tr from './locales/tr.json';
import zh from './locales/zh.json';
import en from './locales/en.json';
import ko from './locales/ko.json';
import ja from './locales/ja.json';
import fr from './locales/fr.json';
import ru from './locales/ru.json';
import de from './locales/de.json';

const resources = {
  tr: {
    translation: tr
  },
  zh: {
    translation: zh
  },
  en: {
    translation: en
  },
  ko: {
    translation: ko
  },
  ja: {
    translation: ja
  },
  fr: {
    translation: fr
  },
  ru: {
    translation: ru
  },
  de: {
    translation: de
  }
};

// 初始化语言设置
const initializeLanguage = () => {
  if (typeof window !== 'undefined') {
    // 优先使用保存的语言偏好
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) {
      return savedLanguage;
    }
    
    // 检测浏览器语言
    const browserLanguage = navigator.language.toLowerCase();
    if (browserLanguage.startsWith('tr')) {
      return 'tr';
    } else if (browserLanguage.startsWith('zh')) {
      return 'zh';
    } else if (browserLanguage.startsWith('en')) {
      return 'en';
    } else if (browserLanguage.startsWith('ja')) {
      return 'ja';
    } else if (browserLanguage.startsWith('ko')) {
      return 'ko';
    } else if (browserLanguage.startsWith('fr')) {
      return 'fr';
    } else if (browserLanguage.startsWith('de')) {
      return 'de';
    } else if (browserLanguage.startsWith('ru')) {
      return 'ru';
    }
    
    // 默认回退到土耳其语
    return 'tr';
  }
  return 'tr';
};

const savedLanguage = initializeLanguage();

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage, // 使用保存的语言偏好，默认中文
    fallbackLng: 'en', // 回退语言改为英文，避免显示键名
    debug: process.env.NODE_ENV === 'development', // 开发模式下启用调试

    // 语言检测选项
    detection: {
      order: ['localStorage', 'htmlTag', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'preferredLanguage'
    },

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // 确保键值缺失时的处理
    parseMissingKeyHandler: (key) => {
      console.warn(`Missing translation key: ${key}`);
      return key;
    }
  });

export default i18n; 