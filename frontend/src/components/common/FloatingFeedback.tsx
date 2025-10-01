/**
 * 浮动反馈组件 - 右下角反馈框
 * 收集用户反馈并提交到统一的PostgreSQL系统
 */

import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { feedbackApi, FeedbackData } from '@/services/api/feedbackApiService'
import { useToast } from '@/hooks/useToast'
import { useTranslation } from 'react-i18next'

interface FloatingFeedbackProps {
  className?: string
}

const FloatingFeedback: React.FC<FloatingFeedbackProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    content: '',
    contact: ''
  })

  const { showToast } = useToast()
  const { t } = useTranslation()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 自动调整文本框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [formData.content])

  // 重置表单
  const resetForm = () => {
    setFormData({ content: '', contact: '' })
    setIsSubmitted(false)
    setIsSubmitting(false)
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.content.trim() || formData.content.trim().length < 5) {
      showToast(t('feedback.contentTooShort'), 'error')
      return
    }

    setIsSubmitting(true)

    try {
      const feedbackData: FeedbackData = {
        content: formData.content.trim(),
        contact: formData.contact.trim() || undefined,
        category: 'general'
      }

      await feedbackApi.submitFeedback(feedbackData)
      
      setIsSubmitted(true)
      showToast(t('feedback.submitSuccess'), 'success')
      
      // 3秒后自动关闭
      setTimeout(() => {
        setIsOpen(false)
        resetForm()
      }, 3000)

    } catch (error) {
      console.error('反馈提交失败:', error)
      showToast(error instanceof Error ? error.message : t('feedback.submitError'), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // 切换反馈框显示状态
  const toggleFeedback = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      resetForm()
    }
  }

  if (isSubmitted) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <div className="bg-green-500 text-white p-4 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="font-medium">{t('feedback.successTitle')}</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-green-100"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-sm text-green-100 mt-2">{t('feedback.successMessage')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      {/* 反馈按钮 */}
      {!isOpen && (
        <button
          onClick={toggleFeedback}
          className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 group"
          title={t('feedback.buttonTitle')}
        >
          <MessageCircle size={24} className="group-hover:animate-pulse" />
        </button>
      )}

      {/* 反馈框 */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-80 overflow-hidden">
          {/* 头部 */}
          <div className="bg-purple-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center">
              <MessageCircle size={20} className="mr-2" />
              <h3 className="font-semibold">{t('feedback.title')}</h3>
            </div>
            <button
              onClick={toggleFeedback}
              className="text-purple-200 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* 表单内容 */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* 反馈内容 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('feedback.contentLabel')} <span className="text-red-500">*</span>
              </label>
              <textarea
                ref={textareaRef}
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder={t('feedback.contentPlaceholder')}
                required
                minLength={5}
                maxLength={1000}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {formData.content.length}/1000
              </div>
            </div>

            {/* 邮箱 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('feedback.emailLabel')}
              </label>
              <input
                type="email"
                name="contact"
                value={formData.contact}
                onChange={handleInputChange}
                placeholder={t('feedback.emailPlaceholder')}
                maxLength={255}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* 提交按钮 */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !formData.content.trim() || formData.content.trim().length < 5}
                className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    {t('feedback.submitting')}
                  </>
                ) : (
                  <>
                    <Send size={16} className="mr-2" />
                    {t('feedback.submitButton')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default FloatingFeedback
