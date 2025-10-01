import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import compression from 'compression'
import dotenv from 'dotenv'
import path from 'path'

// 路由导入 - 通用模板版本
import feedbackRoutes from './routes/feedback'
import authRoutes from './routes/auth'

// ⚠️ 模块路由将在这里导入
// 示例：import simpleRoutes from '../../modules/example-simple/backend/routes/simpleRoutes'

// 数据库服务导入
import { initializeDatabaseService, closeDatabaseService, getDatabaseServiceInfo } from './services/database/databaseServiceFactory'

// 缓存相关导入
import { initializeRedis, isRedisConnected, closeRedisConnection } from './services/cache/redisClient'
// getPixelArtCacheManager 已删除 - COLOR03功能已移除
// logger 已删除 - COLOR03功能已移除

// 加载环境变量 - Railway兼容配置
const isRailway = !!(process.env.RAILWAY_ENVIRONMENT_NAME || process.env.RAILWAY_PROJECT_ID)
const isProduction = process.env.NODE_ENV === 'production'

if (!isProduction && !isRailway) {
  // 本地开发环境加载.env文件
  dotenv.config({ path: '.env' })
}

// Railway环境日志
if (isRailway) {
  console.log('🚂 Railway environment detected')
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🆔 Railway Project: ${process.env.RAILWAY_PROJECT_ID || 'N/A'}`)
}

const app = express()
const PORT = parseInt(process.env.PORT || '3001', 10)

// 简单的内存速率限制器
const requestCounts = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15分钟
const RATE_LIMIT_MAX = 100 // 最大请求数

// 速率限制中间件
const rateLimitMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown'
  const now = Date.now()
  
  const clientData = requestCounts.get(clientIp)
  
  if (!clientData || now > clientData.resetTime) {
    // 重置或初始化计数器
    requestCounts.set(clientIp, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    })
    return next()
  }
  
  if (clientData.count >= RATE_LIMIT_MAX) {
    const resetIn = Math.ceil((clientData.resetTime - now) / 1000)
    res.set('Retry-After', resetIn.toString())
    return res.status(429).json({
      success: false,
      error: 'Too many requests',
      retryAfter: resetIn
    })
  }
  
  clientData.count++
  next()
}

// 中间件 - Railway + Vercel兼容的CORS配置
const getAllowedOrigins = (): (string | RegExp)[] => {
  const origins: (string | RegExp)[] = []
  
  // 开发环境
  if (process.env.NODE_ENV !== 'production') {
    origins.push('http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173')
  }
  
  // 生产环境 - Vercel域名
  if (process.env.VERCEL_FRONTEND_URL) {
    origins.push(process.env.VERCEL_FRONTEND_URL)
  }
  
  // 自定义前端URL
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL)
  }
  
  // ⭐ 新增：解析 ALLOWED_ORIGINS 环境变量（支持多个域名，逗号分隔）
  if (process.env.ALLOWED_ORIGINS) {
    const allowedOriginsArray = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    origins.push(...allowedOriginsArray)
  }
  
  // Vercel预览部署域名模式
  if (process.env.NODE_ENV === 'production') {
    // 允许所有Vercel域名
    origins.push(/^https:\/\/.*\.vercel\.app$/)
  }
  
  console.log('🌐 允许的CORS源:', origins)
  return origins
}

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins()
    
    // 允许没有origin的请求（如移动应用）
    if (!origin) return callback(null, true)
    
    // 检查字符串匹配
    if (allowedOrigins.some(allowed => typeof allowed === 'string' && allowed === origin)) {
      return callback(null, true)
    }
    
    // 检查正则表达式匹配
    if (allowedOrigins.some(allowed => allowed instanceof RegExp && allowed.test(origin))) {
      return callback(null, true)
    }
    
    // 开发环境允许所有localhost
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
      return callback(null, true)
    }
    
    console.warn('⚠️ CORS阻止的源:', origin)
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))
app.use(compression())
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// 应用速率限制
app.use('/api/', rateLimitMiddleware)

// 先行健康检查路由（绕过CORS/速率限制），用于Railway探针
app.get('/api/health', (req, res) => {
	res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API路由 - 通用模板版本
app.use('/api/auth', authRoutes)
app.use('/api/feedback', feedbackRoutes)

// ⚠️ 模块路由将在这里注册
// 示例：app.use('/api/simple', simpleRoutes)

// 前端静态文件服务 - 生产环境配置
if (process.env.NODE_ENV === 'production') {
  // 注意：编译后__dirname指向 /app/dist
  // 前端静态文件实际位于 /app/frontend/dist（在构建脚本中已复制到backend/frontend/dist）
  const frontendPath = path.join(__dirname, '../frontend/dist')

  // 提供前端静态文件
  app.use(express.static(frontendPath))

  // SPA路由回退 - 所有非API请求都返回index.html
  app.get('*', (req, res) => {
    // 排除API路由
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({
        success: false,
        error: 'API endpoint not found',
        path: req.path
      })
    }

    // 返回前端应用的入口文件
    res.sendFile(path.join(frontendPath, 'index.html'))
  })
}

// 复杂的健康检查已移除，使用上面的简单版本

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  
  // AI服务已移除，不需要相关错误处理

  // 图像处理错误特殊处理
  if (err.message && (err.message.includes('图像') || err.message.includes('image'))) {
    return res.status(400).json({
      success: false,
      error: '图像处理失败，请检查图像格式和大小',
      timestamp: new Date().toISOString()
    })
  }

  // 数据库错误特殊处理
  if (err.code === 'P2002') { // Prisma unique constraint error
    return res.status(409).json({
      success: false,
      error: '数据冲突',
      timestamp: new Date().toISOString()
    })
  }

  // 数据库连接错误
  if (err.code === 'ECONNREFUSED' && err.message.includes('database')) {
    return res.status(503).json({
      success: false,
      error: '数据库连接失败，请检查数据库配置',
      timestamp: new Date().toISOString()
    })
  }
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    timestamp: new Date().toISOString()
  })
})

// 异步初始化函数 - 第二阶段数据库集成版本
async function initializeServices(): Promise<void> {
	try {
		console.log('🔧 开始初始化服务...')
		
		// 初始化数据库服务（Mock或PostgreSQL）
		console.log('🗄️ 初始化数据库服务...')
		try {
			await initializeDatabaseService()
			const dbInfo = getDatabaseServiceInfo()
			console.log(`✅ 数据库服务已初始化: ${dbInfo.type.toUpperCase()}`)
		} catch (error) {
			console.error('❌ 数据库服务初始化失败:', error)
			// 如果是PostgreSQL失败，可以降级到Mock模式
			if (process.env.USE_DATABASE === 'true') {
				console.log('⚠️ PostgreSQL连接失败，请检查数据库配置')
				throw error // 生产环境必须有数据库
			}
		}
		
		// 检查是否为开发环境
		const isDev = !isProduction && !isRailway
		
		if (isDev) {
			console.log('🛠️ 开发环境检测：跳过Redis等外部服务依赖')
			console.log('📝 核心功能将使用已配置的数据库服务')
			return // 开发环境快速启动，跳过Redis等外部依赖
		}
		
		// 只在明确启用时初始化Redis，默认关闭
		const enableCache = (process.env.ENABLE_REDIS_CACHE === 'true' || 
		                    process.env.CACHE_ENABLED === 'true' || 
		                    process.env.ENABLE_REDIS === 'true') && 
		                    process.env.DISABLE_REDIS !== 'true'
		
		if (enableCache) {
			console.log('🗄️  尝试初始化Redis缓存...')
			try {
				// 设置超时，防止无限等待
				const timeoutPromise = new Promise((_, reject) => {
					setTimeout(() => reject(new Error('Redis连接超时')), 5000)
				})
				
				await Promise.race([initializeRedis(), timeoutPromise])
				
			if (isRedisConnected()) {
				console.log('✅ Redis缓存已连接')
				// cacheManager 已删除 - COLOR03功能已移除
				console.log(`💾 缓存配置: 已启用`)
			} else {
				console.log('⚠️  Redis缓存连接失败，使用无缓存模式')
			}
			} catch (error) {
				// 静默处理Redis错误，不影响核心服务启动
				console.log('⚠️  缓存服务初始化跳过，使用无缓存模式')
				console.log('💡 这不会影响像素画转换等核心功能')
			}
		} else {
			console.log('🚫 缓存功能已禁用（开发环境优化）')
		}
		
		console.log('✅ 服务初始化完成')
		
	} catch (error) {
		// 即使初始化失败，也不阻止服务启动
		console.log('⚠️  某些辅助服务初始化失败，但核心服务将正常运行')
		console.log('💡 像素画转换等核心功能不受影响')
	}
}

// 非 Serverless 环境启动 HTTP 服务（Railway/本地）
const isServerless = !!process.env.VERCEL
if (!isServerless) {
	// 异步启动服务器
	initializeServices().then(() => {
		const server = app.listen(PORT, '0.0.0.0', () => {
			console.log(`🚀 Server running on port ${PORT}`)
			if (isRailway) {
				console.log(`🚂 Railway Health check: https://your-app.railway.app/api/health`)
			} else {
				console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
			}
			// 🎨 ColorWeaver API 已删除 - COLOR01功能已移除
			// 🎮 COLOR03 Pixel Art API 已删除 - COLOR03功能已移除
			console.log(`🖼️  Image Analysis API: http://localhost:${PORT}/api/images`)
			console.log(`🎯 COLOR02 Analysis API: http://localhost:${PORT}/api/color-analysis`)
			
			// 显示缓存状态
			if (isRedisConnected()) {
				console.log(`🗄️  缓存服务: ✅ 已启用`)
			} else {
				console.log(`🗄️  缓存服务: ❌ 未启用`)
			}
			
			// AI服务已移除，专注于核心颜色分析功能
			console.log(`🎨 核心功能: 图像颜色提取和调色板生成`)
		})
		
		return server
	}).catch(error => {
		console.error('❌ 服务器启动失败:', error)
		process.exit(1)
	}).then(server => {
		if (server) {
			setupGracefulShutdown(server)
		}
	})
} else {
	// Serverless环境（Vercel）：初始化但不启动HTTP服务器
	initializeServices().catch(error => {
		// logger 已删除 - COLOR03功能已移除
		console.warn('⚠️  Serverless环境服务初始化失败:', error)
	})
}

// 设置优雅关闭
function setupGracefulShutdown(server: any): void {
	const gracefulShutdown = async () => {
		console.log('🛑 优雅关闭中...')
		
		try {
			// 停止接受新连接
			server.close(() => {
				console.log('✅ HTTP服务器已关闭')
			})
			
			// 关闭数据库连接
			console.log('🗄️ 正在关闭数据库连接...')
			await closeDatabaseService()
			console.log('✅ 数据库连接已关闭')
			
			// 关闭Redis连接
			if (isRedisConnected()) {
				console.log('🗄️ 正在关闭Redis连接...')
				await closeRedisConnection()
				console.log('✅ Redis连接已关闭')
			}
			
			// 清理其他资源
			console.log('🧹 清理完成')
			process.exit(0)
		} catch (error) {
			console.error('❌ 优雅关闭失败:', error)
			process.exit(1)
		}
	}

	process.on('SIGTERM', gracefulShutdown)
	process.on('SIGINT', gracefulShutdown)
}

// Vercel部署导出
export default app 