export interface PluginTemplate {
  id: string
  name: string
  description: string
  category: string
  template: {
    manifest: any
    frontend: {
      components: string[]
      hooks: string[]
      services: string[]
      stores: string[]
    }
    backend: {
      controllers: string[]
      services: string[]
      models: string[]
      routes: string[]
    }
  }
}

export const pluginTemplates: PluginTemplate[] = [
  {
    id: 'basic-ui-plugin',
    name: 'Basic UI Plugin',
    description: 'A simple UI plugin template with basic components',
    category: 'ui-components',
    template: {
      manifest: {
        id: '{{pluginId}}',
        name: '{{pluginName}}',
        version: '1.0.0',
        description: '{{pluginDescription}}',
        author: '{{author}}',
        category: 'ui-components',
        tags: ['ui', 'component'],
        license: 'MIT',
        dependencies: [],
        permissions: ['ui-write']
      },
      frontend: {
        components: [
          'components/{{pluginName}}Component.tsx',
          'components/{{pluginName}}Config.tsx'
        ],
        hooks: [
          'hooks/use{{pluginName}}.ts'
        ],
        services: [
          'services/{{pluginName}}Service.ts'
        ],
        stores: [
          'stores/{{pluginName}}Store.ts'
        ]
      },
      backend: {
        controllers: [
          'controllers/{{pluginName}}Controller.ts'
        ],
        services: [
          'services/{{pluginName}}Service.ts'
        ],
        models: [
          'models/{{pluginName}}.ts'
        ],
        routes: [
          'routes/{{pluginName}}Routes.ts'
        ]
      }
    }
  },
  {
    id: 'data-visualization-plugin',
    name: 'Data Visualization Plugin',
    description: 'A plugin template for creating data visualization components',
    category: 'data-visualization',
    template: {
      manifest: {
        id: '{{pluginId}}',
        name: '{{pluginName}}',
        version: '1.0.0',
        description: '{{pluginDescription}}',
        author: '{{author}}',
        category: 'data-visualization',
        tags: ['chart', 'visualization', 'data'],
        license: 'MIT',
        dependencies: [],
        permissions: ['data-read', 'ui-write']
      },
      frontend: {
        components: [
          'components/{{pluginName}}Chart.tsx',
          'components/{{pluginName}}Config.tsx',
          'components/{{pluginName}}Toolbar.tsx'
        ],
        hooks: [
          'hooks/use{{pluginName}}Data.ts',
          'hooks/use{{pluginName}}Config.ts'
        ],
        services: [
          'services/{{pluginName}}Service.ts',
          'services/dataService.ts'
        ],
        stores: [
          'stores/{{pluginName}}Store.ts',
          'stores/dataStore.ts'
        ]
      },
      backend: {
        controllers: [
          'controllers/{{pluginName}}Controller.ts'
        ],
        services: [
          'services/{{pluginName}}Service.ts',
          'services/DataService.ts'
        ],
        models: [
          'models/{{pluginName}}.ts',
          'models/ChartData.ts'
        ],
        routes: [
          'routes/{{pluginName}}Routes.ts'
        ]
      }
    }
  },
  {
    id: 'form-plugin',
    name: 'Form Plugin',
    description: 'A plugin template for creating form components',
    category: 'ui-components',
    template: {
      manifest: {
        id: '{{pluginId}}',
        name: '{{pluginName}}',
        version: '1.0.0',
        description: '{{pluginDescription}}',
        author: '{{author}}',
        category: 'ui-components',
        tags: ['form', 'input', 'validation'],
        license: 'MIT',
        dependencies: [],
        permissions: ['ui-write', 'data-write']
      },
      frontend: {
        components: [
          'components/{{pluginName}}Form.tsx',
          'components/{{pluginName}}Field.tsx',
          'components/{{pluginName}}Validation.tsx'
        ],
        hooks: [
          'hooks/use{{pluginName}}Form.ts',
          'hooks/use{{pluginName}}Validation.ts'
        ],
        services: [
          'services/{{pluginName}}Service.ts',
          'services/validationService.ts'
        ],
        stores: [
          'stores/{{pluginName}}Store.ts'
        ]
      },
      backend: {
        controllers: [
          'controllers/{{pluginName}}Controller.ts'
        ],
        services: [
          'services/{{pluginName}}Service.ts',
          'services/ValidationService.ts'
        ],
        models: [
          'models/{{pluginName}}.ts'
        ],
        routes: [
          'routes/{{pluginName}}Routes.ts'
        ]
      }
    }
  },
  {
    id: 'api-integration-plugin',
    name: 'API Integration Plugin',
    description: 'A plugin template for integrating external APIs',
    category: 'utilities',
    template: {
      manifest: {
        id: '{{pluginId}}',
        name: '{{pluginName}}',
        version: '1.0.0',
        description: '{{pluginDescription}}',
        author: '{{author}}',
        category: 'utilities',
        tags: ['api', 'integration', 'external'],
        license: 'MIT',
        dependencies: [],
        permissions: ['network-access', 'data-read']
      },
      frontend: {
        components: [
          'components/{{pluginName}}Widget.tsx',
          'components/{{pluginName}}Config.tsx'
        ],
        hooks: [
          'hooks/use{{pluginName}}Api.ts',
          'hooks/use{{pluginName}}Data.ts'
        ],
        services: [
          'services/{{pluginName}}Service.ts',
          'services/apiService.ts'
        ],
        stores: [
          'stores/{{pluginName}}Store.ts'
        ]
      },
      backend: {
        controllers: [
          'controllers/{{pluginName}}Controller.ts'
        ],
        services: [
          'services/{{pluginName}}Service.ts',
          'services/ExternalApiService.ts'
        ],
        models: [
          'models/{{pluginName}}.ts',
          'models/ApiResponse.ts'
        ],
        routes: [
          'routes/{{pluginName}}Routes.ts'
        ]
      }
    }
  }
]

export class PluginTemplateManager {
  // 获取所有模板
  getAllTemplates(): PluginTemplate[] {
    return pluginTemplates
  }

  // 按分类获取模板
  getTemplatesByCategory(category: string): PluginTemplate[] {
    return pluginTemplates.filter(template => template.category === category)
  }

  // 获取模板
  getTemplate(templateId: string): PluginTemplate | undefined {
    return pluginTemplates.find(template => template.id === templateId)
  }

  // 生成插件代码
  generatePluginCode(templateId: string, variables: Record<string, string>): any {
    const template = this.getTemplate(templateId)
    if (!template) {
      throw new Error(`模板不存在: ${templateId}`)
    }

    return this.replaceVariables(template.template, variables)
  }

  // 替换变量
  private replaceVariables(obj: any, variables: Record<string, string>): any {
    if (typeof obj === 'string') {
      return this.replaceStringVariables(obj, variables)
    } else if (Array.isArray(obj)) {
      return obj.map(item => this.replaceVariables(item, variables))
    } else if (typeof obj === 'object' && obj !== null) {
      const result: any = {}
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.replaceVariables(value, variables)
      }
      return result
    }
    return obj
  }

  // 替换字符串变量
  private replaceStringVariables(str: string, variables: Record<string, string>): string {
    let result = str
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`
      result = result.replace(new RegExp(placeholder, 'g'), value)
    }
    return result
  }

  // 验证变量
  validateVariables(variables: Record<string, string>): string[] {
    const errors: string[] = []
    const requiredVariables = ['pluginId', 'pluginName', 'pluginDescription', 'author']

    for (const variable of requiredVariables) {
      if (!variables[variable]) {
        errors.push(`缺少必需变量: ${variable}`)
      }
    }

    // 验证插件ID格式
    if (variables.pluginId && !/^[a-z0-9-]+$/.test(variables.pluginId)) {
      errors.push('插件ID格式无效，只能包含小写字母、数字和连字符')
    }

    return errors
  }
}

// 创建全局插件模板管理器实例
export const pluginTemplateManager = new PluginTemplateManager() 