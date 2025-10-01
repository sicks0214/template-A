# ColorMagic VPS生产环境 Dockerfile
# 优化的多阶段构建，适用于VPS部署

FROM node:22-alpine AS base

# 安装系统依赖和工具
RUN apk add --no-cache \
    curl \
    dumb-init \
    tzdata \
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

# 复制前端源码
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend

# 安装前端依赖（仅生产依赖）
RUN npm ci --omit=dev --no-audit --no-fund && \
    npm cache clean --force

# 复制前端代码并构建
COPY frontend/ ./
RUN npm run build

# === 后端构建阶段 ===
FROM base AS backend-builder

# 复制后端源码
COPY backend/package*.json ./backend/
WORKDIR /app/backend

# 安装后端依赖（包含devDependencies用于构建）
RUN npm ci --no-audit --no-fund && \
    npm cache clean --force

# 复制后端代码
COPY backend/ ./

# 构建TypeScript代码
RUN npm run build

# 重新安装仅生产依赖
RUN rm -rf node_modules && \
    npm ci --omit=dev --no-audit --no-fund && \
    npm cache clean --force

# === 最终运行阶段 ===
FROM base AS runner

# 设置时区
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 复制构建产物
COPY --from=backend-builder --chown=colormagic:nodejs /app/backend/dist ./
COPY --from=backend-builder --chown=colormagic:nodejs /app/backend/node_modules ./node_modules
COPY --from=backend-builder --chown=colormagic:nodejs /app/backend/package*.json ./
COPY --from=backend-builder --chown=colormagic:nodejs /app/backend/server.js ./

# 复制前端构建产物
COPY --from=frontend-builder --chown=colormagic:nodejs /app/frontend/dist ./frontend/dist

# 创建必要目录并设置权限
RUN mkdir -p uploads logs cache && \
    chown -R colormagic:nodejs /app && \
    chmod 755 uploads logs cache

# 添加健康检查脚本
RUN echo '#!/bin/sh' > /usr/local/bin/healthcheck && \
    echo 'curl -f http://localhost:3000/api/health || exit 1' >> /usr/local/bin/healthcheck && \
    chmod +x /usr/local/bin/healthcheck

# 切换到非root用户
USER colormagic

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD /usr/local/bin/healthcheck

# 暴露端口
EXPOSE 3000

# 启动信息
RUN echo "ColorMagic VPS Production Build" > /tmp/build-info.txt && \
    echo "Build Date: $(date)" >> /tmp/build-info.txt && \
    echo "Node Version: $(node --version)" >> /tmp/build-info.txt

# 使用dumb-init启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
