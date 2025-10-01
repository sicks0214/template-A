/**
 * 登录模态框组件
 */

import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Github, LogIn, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LoginRequest } from '@/types/auth';
import { useAuth } from '@/hooks/useAuth';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';
import Button from '@/components/UI/Button';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
}

export default function LoginModal({ 
  isOpen, 
  onClose, 
  onSwitchToRegister,
  onSwitchToForgotPassword 
}: LoginModalProps) {
  const { t } = useTranslation();
  const { login, isLoading, error, clearError } = useAuth();
  const { trackAuth, trackError } = useGoogleAnalytics();
  
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
    remember_me: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // 处理输入变化
  const handleInputChange = (field: keyof LoginRequest) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 清除字段错误
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
    
    // 清除全局错误
    if (error) {
      clearError();
    }
  };

  // 表单验证
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.email) {
      errors.email = t('auth.messages.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('auth.messages.invalidEmail');
    }
    
    if (!formData.password) {
      errors.password = t('auth.messages.passwordRequired');
    } else if (formData.password.length < 6) {
      errors.password = t('auth.messages.passwordTooShort');
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 处理登录提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await login(formData);
      
      // 追踪成功登录
      trackAuth('login', 'email');
      
      onClose();
      // 重置表单
      setFormData({
        email: '',
        password: '',
        remember_me: false
      });
      setFieldErrors({});
    } catch (error) {
      // 追踪登录错误
      trackError('login_failed', error instanceof Error ? error.message : '登录失败', 'LoginModal');
      // 错误已在useAuth中处理
    }
  };

  // 处理第三方登录
  const handleOAuthLogin = (provider: string) => {
    // TODO: 实现OAuth登录
    console.log(`OAuth登录: ${provider}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative animate-in fade-in duration-200">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          {/* 标题 */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('auth.login.title')}</h2>
            <p className="text-gray-600">{t('auth.login.subtitle')}</p>
          </div>

          {/* 全局错误提示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* 登录表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 邮箱输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.login.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  className={`
                    w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors
                    ${fieldErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                  `}
                  placeholder={t('auth.login.emailPlaceholder')}
                  disabled={isLoading}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            {/* 密码输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.login.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  className={`
                    w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors
                    ${fieldErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                  `}
                  placeholder={t('auth.login.passwordPlaceholder')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            {/* 记住我和忘记密码 */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.remember_me}
                  onChange={handleInputChange('remember_me')}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-600">{t('auth.login.rememberMe')}</span>
              </label>
              
              <button
                type="button"
                onClick={onSwitchToForgotPassword}
                className="text-sm text-purple-600 hover:text-purple-500 hover:underline"
                disabled={isLoading}
              >
{t('auth.login.forgotPassword')}
              </button>
            </div>

            {/* 登录按钮 */}
            <Button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={isLoading}
              loading={isLoading}
            >
              {isLoading ? t('common.loading') : t('auth.login.loginButton')}
            </Button>
          </form>

          {/* 分割线 */}
          <div className="mt-8 mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">{t('auth.login.orLoginWith')}</span>
              </div>
            </div>
          </div>

          {/* 第三方登录按钮 */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <Button
              variant="outline"
              onClick={() => handleOAuthLogin('github')}
              className="flex items-center justify-center gap-2 py-3"
              disabled={isLoading}
            >
              <Github size={18} />
              <span className="text-sm">{t('auth.login.github')}</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleOAuthLogin('google')}
              className="flex items-center justify-center gap-2 py-3"
              disabled={isLoading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm">{t('auth.login.google')}</span>
            </Button>
          </div>

          {/* 注册链接 */}
          <div className="text-center">
            <p className="text-gray-600">
              {t('auth.login.noAccount')}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="ml-1 text-purple-600 hover:text-purple-500 hover:underline font-medium"
                disabled={isLoading}
              >
                {t('auth.login.registerLink')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
