import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

const Footer: React.FC = () => {
  const { t, i18n } = useTranslation()






  return (
    <>
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Logo和描述 */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded mr-3"></div>
              <h3 className="text-xl font-bold text-gray-900">renk kodu bulma</h3>
            </div>
            <p className="text-gray-600 text-sm max-w-md">
              renk kodu bulma AI Palette Tool - Generate stunning color palettes from text descriptions or analyze colors from uploaded images using advanced AI technology. Completely free and open source!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Core Features */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Core Features</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/" className="hover:text-gray-900 transition-colors">AI Palette Generator</Link></li>
                <li><Link to="/color-analysis" className="hover:text-gray-900 transition-colors">Image Color Analysis</Link></li>
              </ul>
            </div>



            {/* Help & Info */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Help & Info</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/contact" className="hover:text-gray-900 transition-colors">Contact & Support</Link></li>
                <li>
                  <Link to="/terms" className="hover:text-gray-900 transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-gray-900 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/disclaimer" className="hover:text-gray-900 transition-colors">
                    Disclaimer
                  </Link>
                </li>
              </ul>
            </div>

            {/* Choose Your Language */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Choose Your Language</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <button 
                  onClick={() => i18n.changeLanguage('zh')}
                  className={`flex items-center py-1 hover:text-gray-900 transition-colors text-left ${i18n.language === 'zh' ? 'text-gray-900 font-semibold' : ''}`}
                >
                  <span className="w-5 text-center mr-2">🇨🇳</span>
                  <span>中文</span>
                  {i18n.language === 'zh' && <span className="ml-auto text-blue-500">✓</span>}
                </button>
                <button 
                  onClick={() => i18n.changeLanguage('en')}
                  className={`flex items-center py-1 hover:text-gray-900 transition-colors text-left ${i18n.language === 'en' ? 'text-gray-900 font-semibold' : ''}`}
                >
                  <span className="w-5 text-center mr-2">🇺🇸</span>
                  <span>English</span>
                  {i18n.language === 'en' && <span className="ml-auto text-blue-500">✓</span>}
                </button>
                <button 
                  onClick={() => i18n.changeLanguage('ja')}
                  className={`flex items-center py-1 hover:text-gray-900 transition-colors text-left ${i18n.language === 'ja' ? 'text-gray-900 font-semibold' : ''}`}
                >
                  <span className="w-5 text-center mr-2">🇯🇵</span>
                  <span>Japanese</span>
                  {i18n.language === 'ja' && <span className="ml-auto text-blue-500">✓</span>}
                </button>
                <button 
                  onClick={() => i18n.changeLanguage('ko')}
                  className={`flex items-center py-1 hover:text-gray-900 transition-colors text-left ${i18n.language === 'ko' ? 'text-gray-900 font-semibold' : ''}`}
                >
                  <span className="w-5 text-center mr-2">🇰🇷</span>
                  <span>한국어</span>
                  {i18n.language === 'ko' && <span className="ml-auto text-blue-500">✓</span>}
                </button>
                <button 
                  onClick={() => i18n.changeLanguage('fr')}
                  className={`flex items-center py-1 hover:text-gray-900 transition-colors text-left ${i18n.language === 'fr' ? 'text-gray-900 font-semibold' : ''}`}
                >
                  <span className="w-5 text-center mr-2">🇫🇷</span>
                  <span>Français</span>
                  {i18n.language === 'fr' && <span className="ml-auto text-blue-500">✓</span>}
                </button>
                <button 
                  onClick={() => i18n.changeLanguage('de')}
                  className={`flex items-center py-1 hover:text-gray-900 transition-colors text-left ${i18n.language === 'de' ? 'text-gray-900 font-semibold' : ''}`}
                >
                  <span className="w-5 text-center mr-2">🇩🇪</span>
                  <span>Deutsch</span>
                  {i18n.language === 'de' && <span className="ml-auto text-blue-500">✓</span>}
                </button>
                <button 
                  onClick={() => i18n.changeLanguage('ru')}
                  className={`flex items-center py-1 hover:text-gray-900 transition-colors text-left ${i18n.language === 'ru' ? 'text-gray-900 font-semibold' : ''}`}
                >
                  <span className="w-5 text-center mr-2">🇷🇺</span>
                  <span>Русский</span>
                  {i18n.language === 'ru' && <span className="ml-auto text-blue-500">✓</span>}
                </button>
              </div>
            </div>
          </div>

          {/* 底部版权 */}
          <div className="pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              © 2025 renk kodu bulma AI Palette Tool. Open Source Project. All rights reserved.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Powered by DeepSeek AI • Built with React & TypeScript
            </p>
          </div>
        </div>
      </footer>




    </>
  )
}

export default Footer 