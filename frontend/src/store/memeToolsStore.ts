/**
 * 表情包制作工具状态管理Store - 免费功能
 */

import { create } from 'zustand'

// 画布元素类型定义
export interface CanvasElement {
  id: string
  type: 'sticker' | 'bubble' | 'text' | 'image'
  x: number
  y: number
  width?: number
  height?: number
  rotation?: number
  zIndex: number
  selected?: boolean
  data: any // 元素具体数据
}

// 画布状态
export interface CanvasState {
  elements: CanvasElement[]
  selectedElementId: string | null
  canvasWidth: number
  canvasHeight: number
  backgroundColor: string
  backgroundImage: string | null
}

// Store状态接口
interface MemeToolsState {
  // 画布状态
  canvas: CanvasState
  
  // 历史记录
  history: CanvasState[]
  historyIndex: number
  
  // UI状态
  activeToolPanel: 'stickers' | 'bubbles' | 'text' | 'templates' | null
  
  // Actions
  addElement: (element: Omit<CanvasElement, 'id' | 'zIndex'>) => void
  updateElement: (id: string, updates: Partial<CanvasElement>) => void
  removeElement: (id: string) => void
  selectElement: (id: string | null) => void
  setActiveToolPanel: (panel: 'stickers' | 'bubbles' | 'text' | 'templates' | null) => void
  undo: () => void
  redo: () => void
  saveToHistory: () => void
  clearCanvas: () => void
}

// 默认画布状态
const defaultCanvasState: CanvasState = {
  elements: [],
  selectedElementId: null,
  canvasWidth: 600,
  canvasHeight: 600,
  backgroundColor: '#ffffff',
  backgroundImage: null
}

export const useMemeToolsStore = create<MemeToolsState>((set, get) => ({
  // 初始状态
  canvas: defaultCanvasState,
  history: [defaultCanvasState],
  historyIndex: 0,
  activeToolPanel: null,

  // Actions
  addElement: (elementData) => {
    const state = get()
    const newElement: CanvasElement = {
      ...elementData,
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      zIndex: state.canvas.elements.length
    }
    
    set({
      canvas: {
        ...state.canvas,
        elements: [...state.canvas.elements, newElement],
        selectedElementId: newElement.id
      }
    })
    
    get().saveToHistory()
    console.log('添加画布元素:', newElement)
  },

  updateElement: (id, updates) => {
    const state = get()
    const updatedElements = state.canvas.elements.map(element =>
      element.id === id ? { ...element, ...updates } : element
    )
    
    set({
      canvas: {
        ...state.canvas,
        elements: updatedElements
      }
    })
  },

  removeElement: (id) => {
    const state = get()
    const filteredElements = state.canvas.elements.filter(element => element.id !== id)
    
    set({
      canvas: {
        ...state.canvas,
        elements: filteredElements,
        selectedElementId: state.canvas.selectedElementId === id ? null : state.canvas.selectedElementId
      }
    })
    
    get().saveToHistory()
    console.log('删除画布元素:', id)
  },

  selectElement: (id) => {
    set(state => ({
      canvas: {
        ...state.canvas,
        selectedElementId: id
      }
    }))
  },

  setActiveToolPanel: (panel) => {
    set({ activeToolPanel: panel })
    console.log('切换工具面板:', panel)
  },

  saveToHistory: () => {
    const state = get()
    const newHistory = state.history.slice(0, state.historyIndex + 1)
    newHistory.push({ ...state.canvas })
    
    // 限制历史记录大小
    if (newHistory.length > 50) {
      newHistory.shift()
    } else {
      set({ historyIndex: state.historyIndex + 1 })
    }
    
    set({ history: newHistory })
  },

  undo: () => {
    const state = get()
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1
      set({
        canvas: { ...state.history[newIndex] },
        historyIndex: newIndex
      })
      console.log('撤销操作')
    }
  },

  redo: () => {
    const state = get()
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1
      set({
        canvas: { ...state.history[newIndex] },
        historyIndex: newIndex
      })
      console.log('重做操作')
    }
  },

  clearCanvas: () => {
    set({
      canvas: {
        ...defaultCanvasState,
        canvasWidth: get().canvas.canvasWidth,
        canvasHeight: get().canvas.canvasHeight
      }
    })
    get().saveToHistory()
    console.log('清空画布')
  }
}))

export default useMemeToolsStore 