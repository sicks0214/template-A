import { create } from 'zustand'

interface AppState {
  // 应用状态
  isLoading: boolean
  currentLocale: string
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  
  // 应用操作
  setLoading: (loading: boolean) => void
  setLocale: (locale: string) => void
  setTheme: (theme: 'light' | 'dark') => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  // 初始状态
  isLoading: false,
  currentLocale: 'zh',
  theme: 'light',
  sidebarOpen: false,
  
  // 状态更新方法
  setLoading: (loading) => set({ isLoading: loading }),
  setLocale: (locale) => set({ currentLocale: locale }),
  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen }))
})) 