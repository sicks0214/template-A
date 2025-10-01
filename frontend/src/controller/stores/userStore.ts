import { create } from 'zustand'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'user' | 'admin'
}

interface UserState {
  // 用户状态
  currentUser: User | null
  isAuthenticated: boolean
  userPreferences: {
    language: string
    theme: 'light' | 'dark'
    notifications: boolean
  }
  
  // 用户操作
  setUser: (user: User | null) => void
  setAuthenticated: (authenticated: boolean) => void
  updatePreferences: (preferences: Partial<UserState['userPreferences']>) => void
  logout: () => void
}

export const useUserStore = create<UserState>((set) => ({
  // 初始状态
  currentUser: null,
  isAuthenticated: false,
  userPreferences: {
    language: 'zh',
    theme: 'light',
    notifications: true
  },
  
  // 状态更新方法
  setUser: (user) => set({ currentUser: user }),
  setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
  updatePreferences: (preferences) => 
    set((state) => ({
      userPreferences: { ...state.userPreferences, ...preferences }
    })),
  logout: () => set({ currentUser: null, isAuthenticated: false })
})) 