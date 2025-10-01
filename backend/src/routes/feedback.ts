/**
 * 反馈路由配置 - 第一阶段Mock版本
 * 处理用户反馈相关的所有API路由
 */

import express from 'express';
import { feedbackController } from '../controllers/feedbackController';

const router = express.Router();

// 中间件：请求日志
router.use((req, res, next) => {
  console.log(`[Feedback Routes] ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// 中间件：CORS
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// 中间件：请求体解析
router.use(express.json({ limit: '1mb' }));
router.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 健康检查
router.get('/health', 
  feedbackController.healthCheck.bind(feedbackController)
);

// 提交反馈
router.post('/submit', 
  feedbackController.submitFeedback.bind(feedbackController)
);

// 获取反馈历史（管理员功能）
router.get('/history', 
  feedbackController.getFeedbackHistory.bind(feedbackController)
);

// 获取反馈统计信息（管理员功能）
router.get('/stats', 
  feedbackController.getFeedbackStats.bind(feedbackController)
);

// 错误处理中间件
router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Feedback Routes] 路由错误:', error);
  
  if (res.headersSent) {
    return next(error);
  }

  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = '服务器内部错误';

  if (error.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = '请求参数验证失败';
  } else if (error.type === 'entity.too.large') {
    statusCode = 413;
    errorCode = 'PAYLOAD_TOO_LARGE';
    message = '请求内容过大';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date()
    }
  });
});

// 404处理
router.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `反馈路由不存在: ${req.method} ${req.originalUrl}`,
      timestamp: new Date()
    }
  });
});

export default router;
