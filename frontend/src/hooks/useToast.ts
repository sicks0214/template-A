/**
 * Toast 通知 Hook - 简化版本
 */

import { useState, useCallback } from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

interface ToastOptions {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

// 全局toast状态（简化实现）
let toastId = 0;
const toasts: ToastMessage[] = [];
const listeners: ((toasts: ToastMessage[]) => void)[] = [];

function notifyListeners() {
  listeners.forEach(listener => listener([...toasts]));
}

function addToast(options: ToastOptions) {
  const toast: ToastMessage = {
    id: `toast-${++toastId}`,
    duration: 5000,
    ...options
  };
  
  toasts.push(toast);
  notifyListeners();
  
  // 自动移除
  setTimeout(() => {
    const index = toasts.findIndex(t => t.id === toast.id);
    if (index > -1) {
      toasts.splice(index, 1);
      notifyListeners();
    }
  }, toast.duration);
  
  // 控制台日志
  const emoji = {
    success: '✅',
    error: '❌', 
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  console.log(`${emoji[options.type]} ${options.title}: ${options.message}`);
}

export function useToast() {
  const [toastList, setToastList] = useState<ToastMessage[]>([]);
  
  // 订阅toast变化
  useState(() => {
    const listener = (newToasts: ToastMessage[]) => {
      setToastList(newToasts);
    };
    
    listeners.push(listener);
    
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  });
  
  const showToast = useCallback((options: ToastOptions) => {
    addToast(options);
  }, []);
  
  const removeToast = useCallback((id: string) => {
    const index = toasts.findIndex(t => t.id === id);
    if (index > -1) {
      toasts.splice(index, 1);
      notifyListeners();
    }
  }, []);
  
  return {
    toasts: toastList,
    showToast,
    removeToast
  };
}

export default useToast;