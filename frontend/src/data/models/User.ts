export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'user' | 'admin'
  createdAt: string
  updatedAt: string
  preferences: UserPreferences
}

export interface UserPreferences {
  language: string
  theme: 'light' | 'dark'
  notifications: boolean
  timezone: string
}

export interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  bio?: string
  location?: string
  website?: string
  socialLinks?: {
    twitter?: string
    github?: string
    linkedin?: string
  }
}

export interface UserStats {
  totalLogins: number
  lastLoginAt: string
  pluginsInstalled: number
  pluginsEnabled: number
} 