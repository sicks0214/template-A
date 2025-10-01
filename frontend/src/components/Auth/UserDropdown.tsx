/**
 * 用户下拉菜单组件
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Settings, 
  History, 
  Heart, 
  Crown, 
  LogOut, 
  ChevronDown,
  Shield,
  Star,
  Palette
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { User as UserType } from '@/types/auth';
import { useAuth } from '@/hooks/useAuth';

interface UserDropdownProps {
  user: UserType;
}

export default function UserDropdown({ user }: UserDropdownProps) {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 处理登出
  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  // 获取用户头像
  const getAvatarUrl = () => {
    if (user.avatar_url) {
      return user.avatar_url;
    }
    // 使用用户名首字母作为默认头像
    const initial = (user.display_name || user.username).charAt(0).toUpperCase();
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="20" fill="#6366f1"/>
        <text x="20" y="28" font-family="Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="white">${initial}</text>
      </svg>
    `)}`;
  };

  // 获取会员徽章
  const getMembershipBadge = () => {
    switch (user.subscription_type) {
      case 'vip':
        return { icon: Crown, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'VIP' };
      case 'premium':
        return { icon: Star, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Premium' };
      default:
        return null;
    }
  };

  const membershipBadge = getMembershipBadge();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 用户头像按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors group"
      >
        {/* 头像 */}
        <div className="relative">
          <img
            src={getAvatarUrl()}
            alt={user.display_name || user.username}
            className="w-8 h-8 rounded-full border-2 border-gray-200 group-hover:border-gray-300 transition-colors"
          />
          {/* 在线状态指示器 */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full"></div>
        </div>

        {/* 用户信息 */}
        <div className="hidden md:block text-left">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 text-sm">
              {user.display_name || user.username}
            </span>
            {membershipBadge && (
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${membershipBadge.bg} ${membershipBadge.color}`}>
                <membershipBadge.icon size={12} />
                <span>{membershipBadge.label}</span>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {user.email}
          </div>
        </div>

        {/* 下拉箭头 */}
        <ChevronDown 
          size={16} 
          className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* 用户信息头部 */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <img
                src={getAvatarUrl()}
                alt={user.display_name || user.username}
                className="w-12 h-12 rounded-full border-2 border-gray-200"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {user.display_name || user.username}
                  </h3>
                  {membershipBadge && (
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${membershipBadge.bg} ${membershipBadge.color}`}>
                      <membershipBadge.icon size={12} />
                      <span>{membershipBadge.label}</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 truncate">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Shield size={12} />
                    <span>{t('auth.user.verified', '已验证')}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Palette size={12} />
                    <span>{user.login_count} {t('auth.user.logins', '次登录')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 菜单项 */}
          <div className="py-1">
            {/* 个人资料 */}
            <MenuItem
              icon={User}
              label={t('auth.user.profile')}
              description={t('auth.user.profileDesc', '管理您的账户信息')}
              onClick={() => {
                setIsOpen(false);
                // TODO: 跳转到个人资料页面
                console.log('跳转到个人资料');
              }}
            />

            {/* 分析历史 */}
            <MenuItem
              icon={History}
              label={t('auth.user.history')}
              description={t('auth.user.historyDesc', '查看您的颜色分析记录')}
              onClick={() => {
                setIsOpen(false);
                // TODO: 跳转到分析历史页面
                console.log('跳转到分析历史');
              }}
            />

            {/* 我的收藏 */}
            <MenuItem
              icon={Heart}
              label={t('auth.user.favorites')}
              description={t('auth.user.favoritesDesc', '管理收藏的调色板')}
              onClick={() => {
                setIsOpen(false);
                // TODO: 跳转到收藏页面
                console.log('跳转到我的收藏');
              }}
            />

            {/* 会员中心 */}
            {user.subscription_type === 'free' ? (
              <MenuItem
                icon={Crown}
                label={t('auth.user.upgrade', '升级会员')}
                description={t('auth.user.upgradeDesc', '解锁更多高级功能')}
                onClick={() => {
                  setIsOpen(false);
                  // TODO: 跳转到会员升级页面
                  console.log('跳转到会员升级');
                }}
                highlight
              />
            ) : (
              <MenuItem
                icon={Crown}
                label={t('auth.user.memberCenter', '会员中心')}
                description={t('auth.user.memberDesc', '管理您的会员权益')}
                onClick={() => {
                  setIsOpen(false);
                  // TODO: 跳转到会员中心
                  console.log('跳转到会员中心');
                }}
              />
            )}

            {/* 设置 */}
            <MenuItem
              icon={Settings}
              label={t('auth.user.settings')}
              description={t('auth.user.settingsDesc', '偏好设置和隐私控制')}
              onClick={() => {
                setIsOpen(false);
                // TODO: 跳转到设置页面
                console.log('跳转到设置');
              }}
            />
          </div>

          {/* 分割线 */}
          <div className="border-t border-gray-100 my-1"></div>

          {/* 登出 */}
          <MenuItem
            icon={LogOut}
            label={t('auth.user.logout')}
            description={t('auth.user.logoutDesc', '安全退出您的账户')}
            onClick={handleLogout}
            danger
          />
        </div>
      )}
    </div>
  );
}

// 菜单项组件
interface MenuItemProps {
  icon: React.ElementType;
  label: string;
  description: string;
  onClick: () => void;
  highlight?: boolean;
  danger?: boolean;
}

function MenuItem({ 
  icon: Icon, 
  label, 
  description, 
  onClick, 
  highlight = false,
  danger = false 
}: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left
        ${highlight ? 'bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100' : ''}
        ${danger ? 'hover:bg-red-50' : ''}
      `}
    >
      <div className={`
        w-8 h-8 rounded-lg flex items-center justify-center
        ${highlight ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 
          danger ? 'bg-red-100 text-red-600' : 
          'bg-gray-100 text-gray-600'}
      `}>
        <Icon size={16} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className={`font-medium text-sm ${danger ? 'text-red-700' : 'text-gray-900'}`}>
          {label}
        </div>
        <div className={`text-xs ${danger ? 'text-red-500' : 'text-gray-500'}`}>
          {description}
        </div>
      </div>
    </button>
  );
}
