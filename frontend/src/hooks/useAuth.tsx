/**
 * 用户认证 Hook
 */

import { useState, useEffect, useCallback, useContext, createContext, ReactNode, useReducer } from 'react';
import { 
  User, 
  AuthState, 
  LoginRequest, 
  RegisterRequest, 
  UpdateUserRequest,
  ChangePasswordRequest,
  AuthAction
} from '@/types/auth';
import { authService } from '@/services/authService';
import { useToast } from '@/hooks/useToast';

// 认证上下文
interface AuthContextType extends AuthState {
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: UpdateUserRequest) => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证状态 Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
    case 'REGISTER_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        refresh_token: action.payload.refresh_token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

    case 'REGISTER_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

    case 'LOGIN_ERROR':
    case 'REGISTER_ERROR':
      return {
        ...state,
        user: null,
        token: null,
        refresh_token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };

    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        refresh_token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
        error: null
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
}

// 认证提供者组件
export function AuthProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  
  // 初始化认证状态
  const [state, dispatch] = useReducer(authReducer, {
    user: authService.getStoredUser(),
    token: authService.getToken(),
    refresh_token: authService.getRefreshToken(),
    isAuthenticated: !!authService.getToken() && !!authService.getStoredUser(),
    isLoading: false,
    error: null
  });

  // 用户登录
  const login = useCallback(async (data: LoginRequest) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const response = await authService.login(data);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.data.user,
          token: response.data.token,
          refresh_token: response.data.refresh_token
        }
      });
      
      showToast({
        type: 'success',
        title: '登录成功',
        message: `欢迎回来，${response.data.user.display_name || response.data.user.username}！`
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '登录失败';
      dispatch({ type: 'LOGIN_ERROR', payload: errorMessage });
      
      showToast({
        type: 'error',
        title: '登录失败',
        message: errorMessage
      });
      
      throw error;
    }
  }, [showToast]);

  // 用户注册
  const register = useCallback(async (data: RegisterRequest) => {
    try {
      dispatch({ type: 'REGISTER_START' });
      
      const response = await authService.register(data);
      
      dispatch({
        type: 'REGISTER_SUCCESS',
        payload: {
          user: response.data.user,
          token: response.data.token
        }
      });
      
      showToast({
        type: 'success',
        title: '注册成功',
        message: `欢迎加入renk kodu bulma，${response.data.user.display_name || response.data.user.username}！`
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '注册失败';
      dispatch({ type: 'REGISTER_ERROR', payload: errorMessage });
      
      showToast({
        type: 'error',
        title: '注册失败',
        message: errorMessage
      });
      
      throw error;
    }
  }, [showToast]);

  // 用户登出
  const logout = useCallback(async () => {
    try {
      await authService.logout();
      dispatch({ type: 'LOGOUT' });
      
      showToast({
        type: 'info',
        title: '已登出',
        message: '您已成功登出账户'
      });
      
    } catch (error) {
      console.error('登出失败:', error);
      // 即使后端登出失败，也要清除本地状态
      dispatch({ type: 'LOGOUT' });
    }
  }, [showToast]);

  // 更新用户信息
  const updateUser = useCallback(async (data: UpdateUserRequest) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const updatedUser = await authService.updateUser(data);
      
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      showToast({
        type: 'success',
        title: '更新成功',
        message: '用户信息已更新'
      });
      
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      
      const errorMessage = error instanceof Error ? error.message : '更新失败';
      showToast({
        type: 'error',
        title: '更新失败',
        message: errorMessage
      });
      
      throw error;
    }
  }, [showToast]);

  // 修改密码
  const changePassword = useCallback(async (data: ChangePasswordRequest) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      await authService.changePassword(data);
      
      // 密码修改成功后需要重新登录
      dispatch({ type: 'LOGOUT' });
      
      showToast({
        type: 'success',
        title: '密码修改成功',
        message: '请使用新密码重新登录'
      });
      
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      
      const errorMessage = error instanceof Error ? error.message : '密码修改失败';
      showToast({
        type: 'error',
        title: '密码修改失败',
        message: errorMessage
      });
      
      throw error;
    }
  }, [showToast]);

  // 刷新令牌
  const refreshToken = useCallback(async () => {
    try {
      const newToken = await authService.refreshToken();
      
      // 更新状态中的token
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: state.user!,
          token: newToken
        }
      });
      
    } catch (error) {
      console.error('刷新令牌失败:', error);
      // 刷新失败，清除认证状态
      dispatch({ type: 'LOGOUT' });
      
      showToast({
        type: 'warning',
        title: '登录已过期',
        message: '请重新登录'
      });
    }
  }, [state.user, showToast]);

  // 清除错误
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // 自动刷新令牌
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const checkTokenExpiration = () => {
      if (authService.isTokenExpiringSoon()) {
        refreshToken();
      }
    };

    // 立即检查一次
    checkTokenExpiration();

    // 每5分钟检查一次
    const interval = setInterval(checkTokenExpiration, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [state.isAuthenticated, refreshToken]);

  // 页面加载时尝试获取用户信息
  useEffect(() => {
    const initializeAuth = async () => {
      if (state.isAuthenticated && state.token && !state.user) {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          const user = await authService.getCurrentUser();
          dispatch({ type: 'UPDATE_USER', payload: user });
        } catch (error) {
          console.error('获取用户信息失败:', error);
          dispatch({ type: 'LOGOUT' });
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    };

    initializeAuth();
  }, []);

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    changePassword,
    refreshToken,
    clearError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// 使用认证 Hook
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// 权限检查 Hook
export function usePermission() {
  const { user, isAuthenticated } = useAuth();
  
  const hasPermission = useCallback((requiredLevel: 'guest' | 'authenticated' | 'premium' | 'vip') => {
    if (requiredLevel === 'guest') return true;
    if (requiredLevel === 'authenticated') return isAuthenticated;
    if (!isAuthenticated || !user) return false;
    
    const userLevel = user.subscription_type;
    
    switch (requiredLevel) {
      case 'premium':
        return userLevel === 'premium' || userLevel === 'vip';
      case 'vip':
        return userLevel === 'vip';
      default:
        return false;
    }
  }, [user, isAuthenticated]);

  const requirePermission = useCallback((requiredLevel: 'guest' | 'authenticated' | 'premium' | 'vip') => {
    if (!hasPermission(requiredLevel)) {
      throw new Error(`此功能需要${requiredLevel}权限`);
    }
  }, [hasPermission]);

  return {
    hasPermission,
    requirePermission,
    userLevel: user?.subscription_type || 'guest',
    isGuest: !isAuthenticated,
    isAuthenticated,
    isPremium: user?.subscription_type === 'premium' || user?.subscription_type === 'vip',
    isVip: user?.subscription_type === 'vip'
  };
}

export default useAuth;
