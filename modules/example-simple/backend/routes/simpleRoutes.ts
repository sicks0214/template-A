/**
 * 简单示例模块 - API路由
 * 
 * 这是模块的后端API端点定义
 */

import express, { Request, Response } from 'express'

const router = express.Router()

/**
 * GET /api/simple/hello
 * 简单的Hello World端点
 */
router.get('/hello', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Hello from Simple Module!',
    module: 'example-simple',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  })
})

/**
 * GET /api/simple/info
 * 获取模块信息
 */
router.get('/info', (req: Request, res: Response) => {
  res.json({
    success: true,
    module: {
      id: 'example-simple',
      name: 'Simple Example',
      description: '一个最小化的功能模块示例',
      version: '1.0.0',
      author: 'Template Team',
      features: [
        '基础的API端点',
        '数据库集成示例',
        '国际化支持',
        'TypeScript类型安全',
      ],
    },
  })
})

/**
 * GET /api/simple/health
 * 模块健康检查
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'healthy',
    module: 'example-simple',
    timestamp: new Date().toISOString(),
  })
})

/**
 * POST /api/simple/echo
 * 回显请求数据（用于测试）
 */
router.post('/echo', (req: Request, res: Response) => {
  res.json({
    success: true,
    receivedData: req.body,
    timestamp: new Date().toISOString(),
  })
})

export default router

