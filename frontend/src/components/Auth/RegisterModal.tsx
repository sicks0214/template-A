/**
 * 注册模态框组件
 */

import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, UserPlus, X, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RegisterRequest } from '@/types/auth';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/UI/Button';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function RegisterModal({ 
  isOpen, 
  onClose, 
  onSwitchToLogin 
}: RegisterModalProps) {
  const { t } = useTranslation();
  const { register, isLoading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState<RegisterRequest>({
    email: '',
    username: '',
    password: '',
    confirm_password: '',
    display_name: '',
    agree_to_terms: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // 处理输入变化
  const handleInputChange = (field: keyof RegisterRequest) => (
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

  // 密码强度检查（简化版：只需数字和字母）
  const getPasswordStrength = (password: string) => {
    const checks = {
      length: password.length >= 6,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /\d/.test(password)
    };
    
    const strength = Object.values(checks).filter(Boolean).length;
    
    return { strength, checks };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // 表单验证
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // 邮箱验证
    if (!formData.email) {
      errors.email = t('auth.messages.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('auth.messages.invalidEmail');
    }
    
    // 用户名验证
    if (!formData.username) {
      errors.username = t('auth.messages.usernameRequired');
    } else if (formData.username.length < 3) {
      errors.username = t('auth.messages.usernameTooShort');
    } else if (formData.username.length > 30) {
      errors.username = t('auth.messages.usernameTooLong');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      errors.username = t('auth.messages.usernameInvalidChars');
    }
    
    // 密码验证（简化：只需6位以上，包含数字和字母）
    if (!formData.password) {
      errors.password = t('auth.messages.passwordRequired');
    } else if (formData.password.length < 6) {
      errors.password = '密码至少需要6个字符';
    } else if (!/[a-zA-Z]/.test(formData.password)) {
      errors.password = '密码必须包含字母';
    } else if (!/\d/.test(formData.password)) {
      errors.password = '密码必须包含数字';
    }
    
    // 确认密码验证
    if (!formData.confirm_password) {
      errors.confirm_password = t('auth.messages.confirmPasswordRequired');
    } else if (formData.password !== formData.confirm_password) {
      errors.confirm_password = t('auth.messages.passwordMismatch');
    }
    
    // 服务条款验证
    if (!formData.agree_to_terms) {
      errors.agree_to_terms = t('auth.messages.agreeToTermsRequired');
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 处理注册提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await register(formData);
      onClose();
      // 重置表单
      setFormData({
        email: '',
        username: '',
        password: '',
        confirm_password: '',
        display_name: '',
        agree_to_terms: false
      });
      setFieldErrors({});
    } catch (error) {
      // 错误已在useAuth中处理
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          {/* 标题 */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('auth.register.title')}</h2>
            <p className="text-gray-600">{t('auth.register.subtitle')}</p>
          </div>

          {/* 全局错误提示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* 注册表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 邮箱输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.register.email')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  className={`
                    w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors
                    ${fieldErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                  `}
                  placeholder={t('auth.register.emailPlaceholder')}
                  disabled={isLoading}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            {/* 用户名输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.register.username')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange('username')}
                  className={`
                    w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors
                    ${fieldErrors.username ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                  `}
                  placeholder={t('auth.register.usernamePlaceholder')}
                  disabled={isLoading}
                />
              </div>
              {fieldErrors.username && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.username}</p>
              )}
            </div>

            {/* 显示名称输入（可选） */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.register.displayName')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={handleInputChange('display_name')}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                  placeholder={t('auth.register.displayNamePlaceholder')}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* 密码输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.register.password')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  className={`
                    w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors
                    ${fieldErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                  `}
                  placeholder={t('auth.register.passwordPlaceholder')}
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
              
              {/* 密码强度指示器（简化版） */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full ${
                          passwordStrength.strength >= level
                            ? passwordStrength.strength === 1
                              ? 'bg-red-400'
                              : passwordStrength.strength === 2
                              ? 'bg-yellow-400'
                              : 'bg-emerald-400'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <Check size={12} className={passwordStrength.checks.length ? 'text-emerald-500' : 'text-gray-300'} />
                      <span>至少6个字符</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={12} className={passwordStrength.checks.hasLetter ? 'text-emerald-500' : 'text-gray-300'} />
                      <span>包含字母</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={12} className={passwordStrength.checks.hasNumber ? 'text-emerald-500' : 'text-gray-300'} />
                      <span>包含数字</span>
                    </div>
                  </div>
                </div>
              )}
              
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            {/* 确认密码输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.register.confirmPassword')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirm_password}
                  onChange={handleInputChange('confirm_password')}
                  className={`
                    w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors
                    ${fieldErrors.confirm_password ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                  `}
                  placeholder={t('auth.register.confirmPasswordPlaceholder')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {fieldErrors.confirm_password && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.confirm_password}</p>
              )}
            </div>

            {/* 服务条款同意 */}
            <div>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.agree_to_terms}
                  onChange={handleInputChange('agree_to_terms')}
                  className={`
                    mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded
                    ${fieldErrors.agree_to_terms ? 'border-red-300' : ''}
                  `}
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-600">
                  {t('auth.register.agreeTerms')}
                  <a href="/terms" className="text-emerald-600 hover:text-emerald-500 hover:underline ml-1" target="_blank" rel="noopener noreferrer">
                    {t('auth.register.termsOfService')}
                  </a>
                  {t('auth.register.and')}
                  <a href="/privacy" className="text-emerald-600 hover:text-emerald-500 hover:underline ml-1" target="_blank" rel="noopener noreferrer">
                    {t('auth.register.privacyPolicy')}
                  </a>
                </span>
              </label>
              {fieldErrors.agree_to_terms && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.agree_to_terms}</p>
              )}
            </div>

            {/* 注册按钮 */}
            <Button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
              disabled={isLoading}
              loading={isLoading}
            >
              {isLoading ? t('common.loading') : t('auth.register.registerButton')}
            </Button>
          </form>

          {/* 登录链接 */}
          <div className="text-center mt-8">
            <p className="text-gray-600">
              {t('auth.register.hasAccount')}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="ml-1 text-emerald-600 hover:text-emerald-500 hover:underline font-medium"
                disabled={isLoading}
              >
                {t('auth.register.loginLink')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
