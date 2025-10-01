/**
 * 认证系统测试页面
 */

import React from 'react';
import { useAuth, usePermission } from '@/hooks/useAuth';
import { useAuthModal } from '@/components/Auth/AuthModals';
import Button from '@/components/UI/Button';
import Header from '@/components/Layout/Header';

export default function AuthTestPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { hasPermission, userLevel } = usePermission();
  const { openLogin, openRegister } = useAuthModal();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">认证系统测试</h1>
          
          {/* 认证状态显示 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">认证状态</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">认证状态:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isAuthenticated ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {isAuthenticated ? '已登录' : '未登录'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">加载状态:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isLoading ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {isLoading ? '加载中' : '已就绪'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">用户级别:</span>
                  <span className="text-gray-700 capitalize">{userLevel}</span>
                </div>
              </div>
              
              {user && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">用户ID:</span>
                    <span className="text-gray-700 text-sm font-mono">{user.id.slice(0, 8)}...</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-medium">邮箱:</span>
                    <span className="text-gray-700 text-sm">{user.email}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-medium">用户名:</span>
                    <span className="text-gray-700 text-sm">{user.username}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-medium">会员类型:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                      user.subscription_type === 'vip' ? 'bg-yellow-100 text-yellow-700' :
                      user.subscription_type === 'premium' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {user.subscription_type}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {/* 操作按钮 */}
            <div className="flex gap-4">
              {isAuthenticated ? (
                <Button
                  variant="danger"
                  onClick={logout}
                  disabled={isLoading}
                >
                  退出登录
                </Button>
              ) : (
                <>
                  <Button
                    variant="primary"
                    onClick={openLogin}
                    disabled={isLoading}
                  >
                    登录
                  </Button>
                  <Button
                    variant="outline"
                    onClick={openRegister}
                    disabled={isLoading}
                  >
                    注册
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {/* 权限测试 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">权限测试</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="font-medium text-gray-700">权限检查结果</h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>游客权限:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      hasPermission('guest') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {hasPermission('guest') ? '✓ 有权限' : '✗ 无权限'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>认证用户权限:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      hasPermission('authenticated') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {hasPermission('authenticated') ? '✓ 有权限' : '✗ 无权限'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>高级会员权限:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      hasPermission('premium') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {hasPermission('premium') ? '✓ 有权限' : '✗ 无权限'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>VIP会员权限:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      hasPermission('vip') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {hasPermission('vip') ? '✓ 有权限' : '✗ 无权限'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-medium text-gray-700">功能权限示例</h3>
                
                <div className="space-y-2">
                  <Button
                    variant={hasPermission('guest') ? 'success' : 'outline'}
                    size="sm"
                    disabled={!hasPermission('guest')}
                    className="w-full justify-start"
                  >
                    基础颜色分析 (游客可用)
                  </Button>
                  
                  <Button
                    variant={hasPermission('authenticated') ? 'success' : 'outline'}
                    size="sm"
                    disabled={!hasPermission('authenticated')}
                    className="w-full justify-start"
                  >
                    保存分析历史 (需登录)
                  </Button>
                  
                  <Button
                    variant={hasPermission('premium') ? 'success' : 'outline'}
                    size="sm"
                    disabled={!hasPermission('premium')}
                    className="w-full justify-start"
                  >
                    AI智能分析 (需高级会员)
                  </Button>
                  
                  <Button
                    variant={hasPermission('vip') ? 'success' : 'outline'}
                    size="sm"
                    disabled={!hasPermission('vip')}
                    className="w-full justify-start"
                  >
                    无限制使用 (需VIP会员)
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* API测试 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">API连接测试</h2>
            
            <div className="space-y-4">
              <Button
                variant="outline"
                onClick={() => {
                  // TODO: 测试API连接
                  console.log('测试API连接');
                }}
              >
                测试后端连接
              </Button>
              
              <div className="text-sm text-gray-600">
                <p>• 检查后端API是否正常响应</p>
                <p>• 验证认证token是否有效</p>
                <p>• 测试权限验证是否正确</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
