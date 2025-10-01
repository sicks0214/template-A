/**
 * AI权限拦截Hook - 第三阶段外围权限控制
 */

import { useCallback } from 'react'
import { usePremiumStore } from '@store/premiumStore'

// AI功能映射
const AI_FEATURE_MAP = {
  'cartoonify': 'cartoonify',
  'AI卡通化': 'cartoonify',
  '智能卡通化': 'cartoonify',
  'backgroundRemoval': 'backgroundRemoval',
  'AI背景移除': 'backgroundRemoval',
  '背景移除': 'backgroundRemoval',
  'styleTransfer': 'styleTransfer',
  'AI风格迁移': 'styleTransfer',
  '风格迁移': 'styleTransfer',
  'textRecognition': 'textRecognition',
  'AI文字识别': 'textRecognition',
  '文字识别': 'textRecognition'
}

export interface AIPermissionResult {
  allowed: boolean
  reason?: string
  remainingTrials?: number
  isPremium?: boolean
}

/**
 * AI权限拦截Hook
 * 用于在调用AI功能前进行权限检查和试用计数
 */
export const useAIPermission = () => {
  const { 
    useAITrial, 
    checkTrialAvailable, 
    getRemainingTrials, 
    premiumStatus,
    getFeatureDescription 
  } = usePremiumStore()

  /**
   * 检查AI功能权限
   * @param feature AI功能名称
   * @returns 权限检查结果
   */
  const checkPermission = useCallback((feature: string): AIPermissionResult => {
    const normalizedFeature = AI_FEATURE_MAP[feature as keyof typeof AI_FEATURE_MAP] || feature
    
    // 会员用户直接允许
    if (premiumStatus.isPremium) {
      return {
        allowed: true,
        isPremium: true,
        reason: '会员用户，无限制使用'
      }
    }

    // 检查试用次数
    const hasTrials = checkTrialAvailable(normalizedFeature)
    const remainingTrials = getRemainingTrials(normalizedFeature)
    
    if (!hasTrials) {
      return {
        allowed: false,
        reason: '免费试用次数已用完',
        remainingTrials: 0,
        isPremium: false
      }
    }

    return {
      allowed: true,
      reason: '试用次数充足',
      remainingTrials,
      isPremium: false
    }
  }, [premiumStatus.isPremium, checkTrialAvailable, getRemainingTrials])

  /**
   * 尝试使用AI功能
   * @param feature AI功能名称
   * @returns 是否允许使用
   */
  const requestPermission = useCallback((feature: string): boolean => {
    const normalizedFeature = AI_FEATURE_MAP[feature as keyof typeof AI_FEATURE_MAP] || feature
    
    console.log(`🔐 AI权限检查: ${feature} -> ${normalizedFeature}`)
    
    return useAITrial(normalizedFeature)
  }, [useAITrial])

  /**
   * 创建AI功能的权限包装器
   * @param feature AI功能名称
   * @param originalFunction 原始AI功能函数
   * @returns 包装后的函数
   */
  const wrapAIFunction = useCallback(<T extends (...args: any[]) => any>(
    feature: string,
    originalFunction: T
  ): T => {
    const wrappedFunction = (async (...args: Parameters<T>) => {
      console.log(`🛡️ AI权限拦截: ${feature}`)
      
      // 检查权限
      const hasPermission = requestPermission(feature)
      
      if (!hasPermission) {
        console.log(`❌ AI权限被拒绝: ${feature}`)
        throw new Error(`AI功能使用权限不足: ${getFeatureDescription(feature)}`)
      }
      
      console.log(`✅ AI权限通过: ${feature}`)
      
      // 调用原始函数
      return await originalFunction(...args)
    }) as T
    
    return wrappedFunction
  }, [requestPermission, getFeatureDescription])

  /**
   * 显示权限状态信息
   * @param feature AI功能名称
   * @returns 权限状态描述
   */
  const getPermissionStatus = useCallback((feature: string): string => {
    const permission = checkPermission(feature)
    
    if (permission.isPremium) {
      return '👑 会员无限制使用'
    }
    
    if (permission.allowed) {
      return `🆓 还可免费试用 ${permission.remainingTrials} 次`
    }
    
    return '⚠️ 试用次数已用完，升级会员解锁'
  }, [checkPermission])

  /**
   * 获取功能使用按钮的样式状态
   */
  const getButtonState = useCallback((feature: string) => {
    const permission = checkPermission(feature)
    
    if (permission.isPremium) {
      return {
        disabled: false,
        className: 'bg-gradient-to-r from-purple-500 to-blue-500 text-white',
        text: '立即使用 (会员)'
      }
    }
    
    if (permission.allowed) {
      return {
        disabled: false,
        className: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
        text: `免费试用 (${permission.remainingTrials}次)`
      }
    }
    
    return {
      disabled: true,
      className: 'bg-gray-300 text-gray-500 cursor-not-allowed',
      text: '试用已用完'
    }
  }, [checkPermission])

  return {
    checkPermission,
    requestPermission,
    wrapAIFunction,
    getPermissionStatus,
    getButtonState,
    isPremium: premiumStatus.isPremium,
    membershipType: premiumStatus.membershipType
  }
}

/**
 * 便捷的AI功能权限检查Hook
 */
export const useAIFeatureAccess = (feature: string) => {
  const { checkPermission, getPermissionStatus, getButtonState } = useAIPermission()
  
  const permission = checkPermission(feature)
  const statusText = getPermissionStatus(feature)
  const buttonState = getButtonState(feature)
  
  return {
    ...permission,
    statusText,
    buttonState
  }
}

export default useAIPermission 