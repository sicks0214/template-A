/**
 * 认证模态框管理组件
 */

import React, { useState, createContext, useContext, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import LoginModal from '@/components/Auth/LoginModal';
import RegisterModal from '@/components/Auth/RegisterModal';

// 模态框状态接口
interface ModalState {
  isLoginOpen: boolean;
  isRegisterOpen: boolean;
  isForgotPasswordOpen: boolean;
}

// 模态框上下文接口
interface AuthModalContextType {
  modalState: ModalState;
  openLogin: () => void;
  openRegister: () => void;
  openForgotPassword: () => void;
  closeAll: () => void;
}

// 创建上下文
const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

// AuthModal提供者组件
export function AuthModalProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [modalState, setModalState] = useState<ModalState>({
    isLoginOpen: false,
    isRegisterOpen: false,
    isForgotPasswordOpen: false
  });

  // 打开登录模态框
  const openLogin = () => {
    setModalState({
      isLoginOpen: true,
      isRegisterOpen: false,
      isForgotPasswordOpen: false
    });
  };

  // 打开注册模态框
  const openRegister = () => {
    setModalState({
      isLoginOpen: false,
      isRegisterOpen: true,
      isForgotPasswordOpen: false
    });
  };

  // 打开忘记密码模态框
  const openForgotPassword = () => {
    setModalState({
      isLoginOpen: false,
      isRegisterOpen: false,
      isForgotPasswordOpen: true
    });
  };

  // 关闭所有模态框
  const closeAll = () => {
    setModalState({
      isLoginOpen: false,
      isRegisterOpen: false,
      isForgotPasswordOpen: false
    });
  };

  return (
    <AuthModalContext.Provider value={{
      modalState,
      openLogin,
      openRegister,
      openForgotPassword,
      closeAll
    }}>
      {children}
      
      {/* 渲染模态框 */}
      <LoginModal
        isOpen={modalState.isLoginOpen}
        onClose={closeAll}
        onSwitchToRegister={openRegister}
        onSwitchToForgotPassword={openForgotPassword}
      />
      
      <RegisterModal
        isOpen={modalState.isRegisterOpen}
        onClose={closeAll}
        onSwitchToLogin={openLogin}
      />

      {/* TODO: 添加忘记密码模态框 */}
      {modalState.isForgotPasswordOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('auth.forgotPassword.title')}</h2>
            <p className="text-gray-600 mb-6">{t('auth.forgotPassword.comingSoon')}</p>
            <button
              onClick={closeAll}
              className="w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}
    </AuthModalContext.Provider>
  );
}

// 使用AuthModal的Hook
export function useAuthModal() {
  const context = useContext(AuthModalContext);
  
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  
  return context;
}

export default AuthModalProvider;
