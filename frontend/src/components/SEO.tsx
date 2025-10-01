/**
 * SEO优化组件
 */

import { useEffect } from 'react'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  image?: string
  url?: string
}

const SEO: React.FC<SEOProps> = ({
  title = 'AI Meme Maker - 智能表情包制作工具',
  description = '专业的AI驱动表情包制作工具，支持智能卡通化、文字编辑、批量处理等功能。让每个人都能轻松创造出有趣的内容。',
  keywords = 'AI表情包,meme制作,图片编辑,卡通化,表情包生成器',
  image = '/og-image.jpg',
  url = window.location.href,
}) => {
  useEffect(() => {
    // 设置页面标题
    document.title = title

    // 设置meta标签
    const metaTags = [
      { name: 'description', content: description },
      { name: 'keywords', content: keywords },
      { name: 'author', content: 'AI Meme Maker' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      
      // Open Graph / Facebook
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: url },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:site_name', content: 'AI Meme Maker' },
      
      // Twitter
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:url', content: url },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
      
      // 应用相关
      { name: 'application-name', content: 'AI Meme Maker' },
      { name: 'apple-mobile-web-app-title', content: 'AI Meme Maker' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      { name: 'theme-color', content: '#9333ea' }, // purple-600
    ]

    // 更新或创建meta标签
    metaTags.forEach(({ name, property, content }) => {
      const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`
      let meta = document.querySelector(selector) as HTMLMetaElement
      
      if (!meta) {
        meta = document.createElement('meta')
        if (name) meta.name = name
        if (property) meta.setAttribute('property', property)
        document.head.appendChild(meta)
      }
      
      meta.content = content
    })

    // 设置canonical链接
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = url

    // 设置语言
    document.documentElement.lang = 'zh-CN'

    // 清理函数
    return () => {
      // 在组件卸载时不需要清理，因为这些是页面级别的设置
    }
  }, [title, description, keywords, image, url])

  // 这个组件不渲染任何内容
  return null
}

export default SEO 