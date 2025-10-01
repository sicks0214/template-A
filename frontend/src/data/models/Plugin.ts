export interface Plugin {
  id: string
  name: string
  version: string
  description: string
  author: string
  category: string
  tags: string[]
  icon?: string
  homepage?: string
  repository?: string
  license: string
  dependencies?: string[]
  permissions?: string[]
  isInstalled: boolean
  isEnabled: boolean
  isCompatible: boolean
  createdAt: string
  updatedAt: string
  downloads: number
  rating: number
  reviews: number
}

export interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  author: string
  category: string
  tags: string[]
  license: string
  dependencies?: string[]
  permissions?: string[]
  frontend?: {
    routes?: RouteConfig[]
    components?: Record<string, string>
    hooks?: Record<string, string>
    services?: Record<string, string>
    stores?: Record<string, string>
  }
  backend?: {
    routes?: APIRoute[]
    controllers?: Record<string, string>
    services?: Record<string, string>
    models?: Record<string, string>
  }
}

export interface RouteConfig {
  path: string
  component: string
  exact?: boolean
  protected?: boolean
}

export interface APIRoute {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  handler: string
  middleware?: string[]
}

export interface PluginCategory {
  id: string
  name: string
  description: string
  icon: string
  count: number
} 