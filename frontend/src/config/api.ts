/**
 * API配置 - VPS部署方案 (site4)
 */

// 获取API基础URL - VPS部署配置
export const getApiBaseUrl = (): string => {
  // 优先使用环境变量
  if (import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // 开发环境默认值
  if (import.meta.env?.DEV) {
    return 'http://localhost:3001';
  }
  
  // 生产环境 - 使用相对路径（前后端同域名部署）
  return '/api';
};

// API配置
export const API_CONFIG = {
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// API端点 - 确保与后端路由匹配
export const API_ENDPOINTS = {
  colorAnalysis: '/api/color-analysis',           // COLOR02
  image: '/api/images',                           // 通用图像处理
  // palette: '/api/palettes', // 已删除 - COLOR01功能已移除
  export: '/api/export',                          // 导出功能
  ai: '/api/ai',                                  // AI服务
  
  // COLOR03 像素画转换端点已删除 - COLOR03功能已移除
};

// PIXEL_ART_CONFIG 已删除 - COLOR03功能已移除

// 是否启用Mock模式
export const isMockMode = (): boolean => {
  return import.meta.env?.VITE_ENABLE_MOCK_MODE === 'true';
};

// 是否为调试模式
export const isDebugMode = (): boolean => {
  return import.meta.env?.VITE_ENABLE_DEBUG === 'true' || import.meta.env?.DEV === true;
}; 