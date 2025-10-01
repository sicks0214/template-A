/**
 * 最小化示例模块配置
 * 
 * 这是一个最简单的功能模块示例，展示：
 * 1. 如何创建模块配置
 * 2. 如何定义路由和导航
 * 3. 如何集成数据库表
 * 4. 如何配置API端点
 */

import { ModuleConfig } from '../../template-config/module.registry'

export const simpleModuleConfig: ModuleConfig = {
  // 基础信息
  id: 'example-simple',
  name: 'Simple Example',
  displayName: '简单示例',
  description: '一个最小化的功能模块示例，展示如何创建新模块',
  version: '1.0.0',
  author: 'Template Team',
  
  // 前端路由配置
  routes: [
    {
      path: '/simple',
      component: 'SimplePage',
      exact: true,
      protected: false  // 不需要登录即可访问
    },
    {
      path: '/simple/demo',
      component: 'SimpleDemoPage',
      exact: true,
      protected: false
    },
  ],
  
  // 导航菜单配置
  navItems: [
    {
      label: 'nav.simple',        // 国际化键名
      path: '/simple',
      icon: 'sparkles',            // 图标名称
      order: 1,                    // 显示顺序
      protected: false             // 不需要登录
    },
  ],
  
  // 数据库表（会自动添加项目表前缀）
  // 例如：myproject_simple_data
  databaseTables: [
    'simple_data',
    'simple_settings',
  ],
  
  // API路由前缀
  apiPrefix: '/api/simple',
  
  // i18n命名空间
  i18nNamespaces: ['simple'],
  
  // 依赖的核心系统
  dependencies: ['i18n'],
}

export default simpleModuleConfig

