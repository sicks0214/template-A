import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import LanguageSwitcher from '@/components/Layout/LanguageSwitcher'
import { useAuth } from '@/hooks/useAuth'
import { useAuthModal } from '@/components/Auth/AuthModals'
import UserDropdown from '@/components/Auth/UserDropdown'
import Button from '@/components/UI/Button'
import { LogIn, UserPlus } from 'lucide-react'

const HomePage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading } = useAuth()
  const { openLogin, openRegister } = useAuthModal()
  
  const handleGetStarted = () => {
    navigate('/analysis')
  }

  return (
    <div className="bg-gradient-to-r from-pink-300 via-purple-300 to-teal-300 min-h-screen">
      <header className="absolute inset-x-0 top-0 z-50">
        <nav aria-label="Global" className="flex items-center justify-between p-6 lg:px-8">
          <div className="flex lg:flex-1">
            <a href="#" className="-m-1.5 p-1.5">
              <span className="sr-only">renk kodu bulma</span>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">RK</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">renk kodu bulma</span>
              </div>
            </a>
          </div>
          <div className="flex lg:hidden">
            <button 
              type="button" 
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-500 dark:text-gray-400"
              onClick={() => document.getElementById('mobile-menu')?.showModal()}
            >
              <span className="sr-only">Open main menu</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="size-6">
                <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <div className="hidden lg:flex lg:gap-x-12">
            <a href="#features" className="text-sm/6 font-semibold text-gray-900 dark:text-white">{t('homepage.navigation.features')}</a>
            <a href="#how-it-works" className="text-sm/6 font-semibold text-gray-900 dark:text-white">{t('homepage.navigation.howItWorks')}</a>
            <a href="#examples" className="text-sm/6 font-semibold text-gray-900 dark:text-white">{t('homepage.navigation.examples')}</a>
            <a href="#about" className="text-sm/6 font-semibold text-gray-900 dark:text-white">{t('homepage.navigation.about')}</a>
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:space-x-4">
            <LanguageSwitcher />
            
            {/* 用户认证区域 */}
            {isLoading ? (
              /* 加载状态 */
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : isAuthenticated && user ? (
              /* 已登录状态 - 显示用户下拉菜单 */
              <UserDropdown user={user} />
            ) : (
              /* 未登录状态 - 显示登录注册按钮 */
              <div className="flex items-center gap-2">
                <button
                  onClick={openLogin}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors duration-200"
                >
                  <LogIn size={16} />
                  <span>{t('nav.login')}</span>
                </button>
                <button
                  onClick={openRegister}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors duration-200 shadow-sm"
                >
                  <UserPlus size={16} />
                  <span>{t('nav.register')}</span>
                </button>
              </div>
            )}
          </div>
        </nav>
        
        {/* Mobile Menu Dialog */}
        <dialog id="mobile-menu" className="backdrop:bg-transparent lg:hidden">
          <div tabIndex={0} className="fixed inset-0 focus:outline-none">
            <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white p-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10 dark:bg-gray-900 dark:sm:ring-gray-100/10">
              <div className="flex items-center justify-between">
                <a href="#" className="-m-1.5 p-1.5">
                  <span className="sr-only">renk kodu bulma</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">RK</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">renk kodu bulma</span>
                  </div>
                </a>
                <button 
                  type="button" 
                  className="-m-2.5 rounded-md p-2.5 text-gray-700 dark:text-gray-400"
                  onClick={() => document.getElementById('mobile-menu')?.close()}
                >
                  <span className="sr-only">Close menu</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="size-6">
                    <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <div className="mt-6 flow-root">
                <div className="-my-6 divide-y divide-gray-500/10 dark:divide-gray-500/25">
                  <div className="space-y-2 py-6">
                  <a href="#features" className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5">{t('homepage.navigation.features')}</a>
                  <a href="#how-it-works" className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5">{t('homepage.navigation.howItWorks')}</a>
                  <a href="#examples" className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5">{t('homepage.navigation.examples')}</a>
                  <a href="#about" className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5">{t('homepage.navigation.about')}</a>
                  </div>
                <div className="py-6 space-y-4">
                  <div className="px-3">
                    <LanguageSwitcher />
                  </div>
                  
                  {/* 移动端用户认证区域 */}
                  <div className="px-3">
                    {isLoading ? (
                      /* 加载状态 */
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    ) : isAuthenticated && user ? (
                      /* 已登录状态 - 显示用户信息 */
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
                          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {user.display_name?.[0] || user.username?.[0] || user.email?.[0] || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.display_name || user.username}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* 未登录状态 - 显示登录注册按钮 */
                      <div className="space-y-3">
                        <button
                          onClick={() => {
                            document.getElementById('mobile-menu')?.close()
                            openLogin()
                          }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg transition-colors duration-200"
                        >
                          <LogIn size={18} />
                          <span>{t('nav.login')}</span>
                        </button>
                        <button
                          onClick={() => {
                            document.getElementById('mobile-menu')?.close()
                            openRegister()
                          }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors duration-200 shadow-sm"
                        >
                          <UserPlus size={18} />
                          <span>{t('nav.register')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                </div>
              </div>
            </div>
          </div>
        </dialog>
      </header>

      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div aria-hidden="true" className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div 
            style={{clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"}} 
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          ></div>
        </div>
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="hidden sm:mb-8 sm:flex sm:justify-center">
            <div className="relative rounded-full px-3 py-1 text-sm/6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20 dark:text-gray-400 dark:ring-white/10 dark:hover:ring-white/20">
              {t('homepage.hero.announcement')} 
              <a href="#features" className="font-semibold text-emerald-600 dark:text-emerald-400">
                <span aria-hidden="true" className="absolute inset-0"></span>
                {t('homepage.hero.learnMore')} <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-7xl dark:text-white">
              {t('homepage.hero.title')}
            </h1>
            <p className="mt-8 text-lg font-medium text-pretty text-gray-500 sm:text-xl/8 dark:text-gray-400">
              {t('homepage.hero.subtitle')}
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <button 
                onClick={handleGetStarted}
                className="rounded-md bg-emerald-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:focus-visible:outline-emerald-500"
              >
                {t('homepage.hero.startColorAnalysis')}
              </button>
              <a href="#how-it-works" className="text-sm/6 font-semibold text-gray-900 dark:text-white">
                {t('homepage.hero.howItWorks')} <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
        <div aria-hidden="true" className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
          <div 
            style={{clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"}} 
            className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
          ></div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 sm:py-32 bg-gray-50 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
              {t('homepage.features.title')}
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
              {t('homepage.features.subtitle')}
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-emerald-600">
                    <span className="text-white font-bold">🖼️</span>
                  </div>
                  {t('homepage.features.smartImageUpload.title')}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-400">
                  <p className="flex-auto">
                    {t('homepage.features.smartImageUpload.description')}
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-emerald-600">
                    <span className="text-white font-bold">🎨</span>
                  </div>
                  {t('homepage.features.aiColorExtraction.title')}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-400">
                  <p className="flex-auto">
                    {t('homepage.features.aiColorExtraction.description')}
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-emerald-600">
                    <span className="text-white font-bold">🎯</span>
                  </div>
                  {t('homepage.features.manualColorPicker.title')}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-400">
                  <p className="flex-auto">
                    {t('homepage.features.manualColorPicker.description')}
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-emerald-600">
                    <span className="text-white font-bold">📋</span>
                  </div>
                  {t('homepage.features.colorPaletteManagement.title')}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-400">
                  <p className="flex-auto">
                    {t('homepage.features.colorPaletteManagement.description')}
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-emerald-600">
                    <span className="text-white font-bold">💾</span>
                  </div>
                  {t('homepage.features.multipleExportFormats.title')}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-400">
                  <p className="flex-auto">
                    {t('homepage.features.multipleExportFormats.description')}
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                  <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-emerald-600">
                    <span className="text-white font-bold">⚡</span>
                  </div>
                  {t('homepage.features.realtimeAnalysis.title')}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-400">
                  <p className="flex-auto">
                    {t('homepage.features.realtimeAnalysis.description')}
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* How it Works Section */}
      <div id="how-it-works" className="py-24 sm:py-32 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
              {t('homepage.howItWorks.title')}
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
              {t('homepage.howItWorks.subtitle')}
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                  <span className="text-3xl">📤</span>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">{t('homepage.howItWorks.uploadImage.title')}</h3>
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  {t('homepage.howItWorks.uploadImage.description')}
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                  <span className="text-3xl">🔍</span>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">{t('homepage.howItWorks.analyzePickColors.title')}</h3>
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  {t('homepage.howItWorks.analyzePickColors.description')}
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                  <span className="text-3xl">💾</span>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">{t('homepage.howItWorks.exportPalette.title')}</h3>
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  {t('homepage.howItWorks.exportPalette.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Examples Section */}
      <div id="examples" className="py-24 sm:py-32 bg-gray-50 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
              {t('homepage.examples.title')}
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
              {t('homepage.examples.subtitle')}
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden">
              <div className="h-48 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500"></div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('homepage.examples.sunsetLandscape.title')}</h3>
                <div className="flex space-x-2 mb-4">
                  <div className="w-8 h-8 rounded" style={{backgroundColor: '#FF6B35'}}></div>
                  <div className="w-8 h-8 rounded" style={{backgroundColor: '#F7931E'}}></div>
                  <div className="w-8 h-8 rounded" style={{backgroundColor: '#FFD23F'}}></div>
                  <div className="w-8 h-8 rounded" style={{backgroundColor: '#C9184A'}}></div>
                  <div className="w-8 h-8 rounded" style={{backgroundColor: '#800E13'}}></div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('homepage.examples.sunsetLandscape.description')}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden">
              <div className="h-48 bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600"></div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('homepage.examples.oceanWaves.title')}</h3>
                <div className="flex space-x-2 mb-4">
                  <div className="w-8 h-8 rounded" style={{backgroundColor: '#0077BE'}}></div>
                  <div className="w-8 h-8 rounded" style={{backgroundColor: '#4A90E2'}}></div>
                  <div className="w-8 h-8 rounded" style={{backgroundColor: '#7BB3F0'}}></div>
                  <div className="w-8 h-8 rounded" style={{backgroundColor: '#B3D9FF'}}></div>
                  <div className="w-8 h-8 rounded" style={{backgroundColor: '#E6F3FF'}}></div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('homepage.examples.oceanWaves.description')}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden">
              <div className="h-48 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600"></div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('homepage.examples.forestNature.title')}</h3>
                <div className="flex space-x-2 mb-4">
                  <div className="w-8 h-8 rounded" style={{backgroundColor: '#2D5016'}}></div>
                  <div className="w-8 h-8 rounded" style={{backgroundColor: '#4F7942'}}></div>
                  <div className="w-8 h-8 rounded" style={{backgroundColor: '#87A96B'}}></div>
                  <div className="w-8 h-8 rounded" style={{backgroundColor: '#A7C957'}}></div>
                  <div className="w-8 h-8 rounded" style={{backgroundColor: '#DDA15E'}}></div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('homepage.examples.forestNature.description')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header Section - About renk kodu bulma */}
      <div className="relative isolate overflow-hidden bg-white py-24 sm:py-32 dark:bg-gray-900">
        <div aria-hidden="true" className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div 
            style={{clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"}} 
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#10b981] to-[#059669] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          ></div>
        </div>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <h2 className="text-5xl font-semibold tracking-tight text-gray-900 sm:text-7xl dark:text-white">
              {t('homepage.header.title')}
            </h2>
            <p className="mt-8 text-lg font-medium text-pretty text-gray-700 sm:text-xl/8 dark:text-gray-300">
              {t('homepage.header.subtitle')}
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-2xl lg:mx-0 lg:max-w-none">
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 text-base/7 font-semibold text-gray-900 sm:grid-cols-2 md:flex lg:gap-x-10 dark:text-white">
              <button onClick={handleGetStarted} className="text-left hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                {t('homepage.header.startFreeAnalysis')} <span aria-hidden="true">&rarr;</span>
              </button>
              <a href="#examples" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                {t('homepage.header.viewExamples')} <span aria-hidden="true">&rarr;</span>
              </a>
              <a href="#features" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                {t('homepage.header.exploreFeatures')} <span aria-hidden="true">&rarr;</span>
              </a>
              <a href="#how-it-works" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                {t('homepage.howItWorks.title')} <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
            <dl className="mt-16 grid grid-cols-1 gap-8 sm:mt-20 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col-reverse gap-1">
                <dt className="text-base/7 text-gray-700 dark:text-gray-300">{t('homepage.header.stats.imagesAnalyzed')}</dt>
                <dd className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">50K+</dd>
              </div>
              <div className="flex flex-col-reverse gap-1">
                <dt className="text-base/7 text-gray-700 dark:text-gray-300">{t('homepage.header.stats.activeUsers')}</dt>
                <dd className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">5,000+</dd>
              </div>
              <div className="flex flex-col-reverse gap-1">
                <dt className="text-base/7 text-gray-700 dark:text-gray-300">{t('homepage.header.stats.colorPalettesCreated')}</dt>
                <dd className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">25K+</dd>
              </div>
              <div className="flex flex-col-reverse gap-1">
                <dt className="text-base/7 text-gray-700 dark:text-gray-300">{t('homepage.header.stats.accuracyRate')}</dt>
                <dd className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">99.9%</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-emerald-600 dark:bg-emerald-700">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {t('homepage.cta.title')}
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-emerald-100">
              {t('homepage.cta.subtitle')}
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <button 
                onClick={handleGetStarted}
                className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-emerald-600 shadow-sm hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {t('homepage.cta.getStartedForFree')}
              </button>
              <a href="#about" className="text-sm font-semibold leading-6 text-white">
                {t('homepage.cta.learnMore')} <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900" id="about">
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-8 sm:pt-24 lg:px-8 lg:pt-32">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="space-y-8">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CM</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{t('homepage.footer.brandName')}</span>
              </div>
              <p className="text-sm/6 text-balance text-gray-600 dark:text-gray-400">
                {t('homepage.footer.description')}
              </p>
              <div className="flex gap-x-6">
                <a href="#" className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300">
                  <span className="sr-only">Facebook</span>
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-6">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" fillRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300">
                  <span className="sr-only">Instagram</span>
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-6">
                    <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" fillRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300">
                  <span className="sr-only">X</span>
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-6">
                    <path d="M13.6823 10.6218L20.2391 3H18.6854L12.9921 9.61788L8.44486 3H3.2002L10.0765 13.0074L3.2002 21H4.75404L10.7663 14.0113L15.5685 21H20.8131L13.6819 10.6218H13.6823ZM11.5541 13.0956L10.8574 12.0991L5.31391 4.16971H7.70053L12.1742 10.5689L12.8709 11.5655L18.6861 19.8835H16.2995L11.5541 13.096V13.0956Z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300">
                  <span className="sr-only">GitHub</span>
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-6">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" fillRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300">
                  <span className="sr-only">YouTube</span>
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-6">
                    <path d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" fillRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm/6 font-semibold text-gray-900 dark:text-white">{t('homepage.footer.solutions.title')}</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li>
                      <a href="#features" className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">{t('homepage.footer.solutions.colorAnalysis')}</a>
                    </li>
                    <li>
                      <a href="#examples" className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">{t('homepage.footer.solutions.paletteExtraction')}</a>
                    </li>
                    <li>
                      <a href="#how-it-works" className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">{t('homepage.footer.solutions.aiTechnology')}</a>
                    </li>
                    <li>
                      <a href="#features" className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">{t('homepage.footer.solutions.exportTools')}</a>
                    </li>
                    <li>
                      <a href="#examples" className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">{t('homepage.footer.solutions.designInsights')}</a>
                    </li>
                  </ul>
                </div>
                <div className="mt-10 md:mt-0">
                  <h3 className="text-sm/6 font-semibold text-gray-900 dark:text-white">{t('homepage.footer.support.title')}</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li>
                      <a href="/contact" className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">{t('homepage.footer.support.contact')}</a>
                    </li>
                    <li>
                      <a href="#how-it-works" className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">{t('homepage.footer.support.documentation')}</a>
                    </li>
                    <li>
                      <a href="#features" className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">{t('homepage.footer.support.userGuide')}</a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm/6 font-semibold text-gray-900 dark:text-white">{t('homepage.footer.company.title')}</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li>
                      <a href="#about" className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">{t('homepage.footer.company.about')}</a>
                    </li>
                    <li>
                      <a href="#examples" className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">{t('homepage.footer.company.blog')}</a>
                    </li>
                    <li>
                      <a href="/contact" className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">{t('homepage.footer.company.careers')}</a>
                    </li>
                    <li>
                      <a href="#examples" className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">{t('homepage.footer.company.press')}</a>
                    </li>
                  </ul>
                </div>
                <div className="mt-10 md:mt-0">
                  <h3 className="text-sm/6 font-semibold text-gray-900 dark:text-white">{t('homepage.footer.legal.title')}</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li>
                      <a href="/terms" className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">{t('homepage.footer.legal.terms')}</a>
                    </li>
                    <li>
                      <a href="/privacy" className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">{t('homepage.footer.legal.privacy')}</a>
                    </li>
                    <li>
                      <a href="/disclaimer" className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">{t('homepage.footer.legal.license')}</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-16 border-t border-gray-900/10 pt-8 sm:mt-20 lg:mt-24 dark:border-white/10">
            <p className="text-sm/6 text-gray-600 dark:text-gray-400">{t('homepage.footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
