# ColorMagic 本地生产环境 Dockerfile
# 基于Node.js 22 Alpine构建轻量级镜像

FROM node:22-alpine AS base

# 安装系统依赖
RUN apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production \
    PORT=3000 \
    TZ=America/New_York

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S colormagic -u 1001 -G nodejs

# === 前端构建阶段 ===
FROM base AS frontend-builder

# 复制前端代码
COPY frontend/package*.json ./frontend/
COPY frontend/ ./frontend/

# 安装前端依赖并构建
WORKDIR /app/frontend
RUN npm ci --omit=dev --no-audit --no-fund && \
    npm run build && \
    npm cache clean --force

# === 后端构建阶段 ===
FROM base AS backend-builder

# 复制后端代码
COPY backend/package*.json ./backend/
COPY backend/ ./backend/

# 安装后端依赖并构建
WORKDIR /app/backend
RUN npm ci --omit=dev --no-audit --no-fund && \
    npm run build && \
    npm cache clean --force

# === 最终运行阶段 ===
FROM base AS runner

# 复制构建产物
COPY --from=backend-builder /app/backend/dist ./
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/package*.json ./
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# 创建必要目录
RUN mkdir -p uploads logs cache && \
    chown -R colormagic:nodejs /app

# 切换到非root用户
USER colormagic

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# 暴露端口
EXPOSE 3000

# 使用dumb-init启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]
