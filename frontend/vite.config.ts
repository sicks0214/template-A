import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // 添加自定义中间件处理SPA路由
    {
      name: 'spa-fallback',
      configureServer(server) {
        server.middlewares.use('/', (req, res, next) => {
          if (req.url === '/' && req.method === 'GET') {
            req.url = '/index.html'
          }
          next()
        })
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@store': path.resolve(__dirname, './src/store'),
      '@services': path.resolve(__dirname, './src/services'),
      '@types': path.resolve(__dirname, './src/types'),
      '@i18n': path.resolve(__dirname, './src/i18n'),
      '@plugins': path.resolve(__dirname, './src/plugins'),
      '@business': path.resolve(__dirname, './src/business'),
      '@controller': path.resolve(__dirname, './src/controller'),
      '@presentation': path.resolve(__dirname, './src/presentation'),
      '@service': path.resolve(__dirname, './src/service'),
      '@data': path.resolve(__dirname, './src/data')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // 生产环境关闭sourcemap加快构建
    minify: 'esbuild', // 强制使用esbuild，避免terser依赖问题
    target: 'es2015', // 兼容性目标
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          i18n: ['react-i18next', 'i18next', 'i18next-browser-languagedetector'],
          ui: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast'],
          form: ['react-hook-form', 'zod', '@hookform/resolvers'],
          state: ['zustand', '@tanstack/react-query'],
          http: ['axios']
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const extension = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extension)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/css/i.test(extension)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      }
    },
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false, // 加快构建速度
    cssCodeSplit: true
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: true, // 自动打开浏览器
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        // 添加代理日志和错误处理
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error('🔥 API代理错误:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`📤 代理请求: ${req.method} ${req.url}`);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const status = proxyRes.statusCode;
            const statusColor = status >= 400 ? '🔴' : status >= 300 ? '🟡' : '🟢';
            console.log(`📥 代理响应: ${statusColor} ${status} ${req.url}`);
          });
        },
      },
    }
  },
  preview: {
    port: 5173
  }
}) 