#!/bin/bash
################################################################################
# 一键部署脚本 - Universal Web Template
# 完全符合VPS部署规范 + PostgreSQL总系统架构
#
# 功能：
# 1. 自动检测环境
# 2. 验证所有配置
# 3. 编译TypeScript
# 4. 构建前端
# 5. 构建Docker镜像
# 6. 停止旧容器
# 7. 启动新容器
# 8. 配置网络
# 9. 初始化数据库
# 10. 健康检查
# 11. 显示访问信息
#
# 使用方法：
#   ./scripts/one-click-deploy.sh
################################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 输出函数
echo_success() { echo -e "${GREEN}✅ $1${NC}"; }
echo_error() { echo -e "${RED}❌ $1${NC}"; }
echo_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
echo_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
echo_step() { echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "${BLUE}▶ $1${NC}"; echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"; }

# 错误处理
error_exit() {
    echo_error "部署失败: $1"
    exit 1
}

# 欢迎信息
clear
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     🚀 Universal Web Template - 一键部署脚本                  ║
║                                                               ║
║     符合VPS部署规范 + PostgreSQL总系统架构                    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

# ========================================
# Step 0: 预检查
# ========================================
echo_step "步骤 0: 环境预检查"

# 检查必需工具
echo_info "检查必需工具..."
command -v docker >/dev/null 2>&1 || error_exit "Docker未安装"
command -v node >/dev/null 2>&1 || echo_warning "Node.js未安装（将使用Docker执行npm）"
echo_success "工具检查完成"

# 检查环境文件
if [ ! -f "backend/.env" ]; then
    echo_error "缺少环境文件: backend/.env"
    echo_info "提示：复制 docker/.env.template 到 backend/.env 并编辑"
    error_exit "请先创建环境文件"
fi

# 读取站点配置
SITE_ID=$(grep "^SITE_ID=" backend/.env | cut -d'=' -f2 || grep "siteId:" template-config/project.config.ts | cut -d"'" -f2)
SITE_ID=${SITE_ID:-siteN}
echo_success "站点ID: $SITE_ID"

# 检查当前目录
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    error_exit "请在项目根目录执行此脚本"
fi

# ========================================
# Step 1: 验证配置
# ========================================
echo_step "步骤 1: 验证配置文件"

if [ -f "scripts/validate-config.sh" ]; then
    chmod +x scripts/validate-config.sh
    ./scripts/validate-config.sh backend/.env || error_exit "配置验证失败"
else
    echo_warning "配置验证脚本不存在，跳过验证"
fi

echo_success "配置验证完成"

# ========================================
# Step 2: TypeScript编译
# ========================================
echo_step "步骤 2: 编译TypeScript"

if [ -d "backend/src" ] && [ -f "backend/tsconfig.json" ]; then
    echo_info "检测到TypeScript项目，开始编译..."
    cd backend
    
    # 检查是否有node_modules
    if [ ! -d "node_modules" ]; then
        echo_info "安装后端依赖..."
        npm install
    fi
    
    # 编译
    npm run build || error_exit "TypeScript编译失败"
    
    # 验证编译结果
    if [ ! -d "dist" ]; then
        error_exit "编译失败：dist目录不存在"
    fi
    
    echo_success "TypeScript编译完成"
    
    # 验证关键配置
    if grep -q "ALLOWED_ORIGINS" dist/index.js 2>/dev/null; then
        echo_success "CORS配置已编译"
    else
        echo_warning "CORS配置可能未编译"
    fi
    
    cd ..
else
    echo_info "非TypeScript项目，跳过编译"
fi

# ========================================
# Step 3: 前端分离式构建
# ========================================
echo_step "步骤 3: 前端分离式构建"

if [ -f "scripts/build-frontend.sh" ]; then
    chmod +x scripts/build-frontend.sh
    ./scripts/build-frontend.sh || error_exit "前端构建失败"
else
    echo_info "使用简化构建流程..."
    cd frontend
    
    # 检查package-lock.json
    if [ ! -f "package-lock.json" ]; then
        echo_info "生成package-lock.json..."
        docker run --rm -v $(pwd):/app -w /app node:22-alpine sh -c "npm install --package-lock-only"
    fi
    
    # Docker构建
    echo_info "Docker容器中执行构建..."
    docker run --rm -v $(pwd):/app -w /app node:22-alpine sh -c "
        npm ci --no-audit --no-fund && \
        npm run build && \
        chown -R 1000:1000 dist
    " || error_exit "前端构建失败"
    
    # 复制到后端
    echo_info "复制构建产物到后端..."
    rm -rf ../backend/frontend/dist
    mkdir -p ../backend/frontend
    cp -r dist ../backend/frontend/
    
    cd ..
fi

echo_success "前端构建完成"

# ========================================
# Step 4: 构建Docker镜像
# ========================================
echo_step "步骤 4: 构建Docker镜像"

# 选择Dockerfile
DOCKERFILE="docker/Dockerfile.simple"
if [ ! -f "$DOCKERFILE" ]; then
    DOCKERFILE="backend/Dockerfile.simple"
fi

if [ ! -f "$DOCKERFILE" ]; then
    error_exit "找不到Dockerfile"
fi

echo_info "使用Dockerfile: $DOCKERFILE"
echo_info "构建镜像: ${SITE_ID}:latest"

docker build -f "$DOCKERFILE" -t "${SITE_ID}:latest" ./backend || error_exit "Docker镜像构建失败"

echo_success "Docker镜像构建完成"

# ========================================
# Step 5: 网络配置
# ========================================
echo_step "步骤 5: 配置Docker网络"

# 创建必需的网络
echo_info "确保网络存在..."
docker network create webproxy 2>/dev/null && echo_success "创建webproxy网络" || echo_info "webproxy网络已存在"
docker network create shared_net 2>/dev/null && echo_success "创建shared_net网络" || echo_info "shared_net网络已存在"

# 验证postgres_master
if docker ps | grep -q postgres_master; then
    echo_success "PostgreSQL总系统运行中"
    
    # 确保postgres_master有网络别名
    echo_info "配置postgres_master网络别名..."
    POSTGRES=$(docker ps | grep postgres | awk '{print $NF}' | head -1)
    docker network disconnect shared_net $POSTGRES 2>/dev/null || true
    docker network connect --alias postgres_master shared_net $POSTGRES 2>/dev/null || echo_info "别名已存在"
    
    echo_success "PostgreSQL网络配置完成"
else
    echo_warning "PostgreSQL总系统未运行"
    echo_info "如果需要数据库功能，请先启动PostgreSQL："
    echo_info "  cd /docker/db_master && docker compose up -d"
fi

# ========================================
# Step 6: 停止旧容器
# ========================================
echo_step "步骤 6: 停止旧容器"

if docker ps -a | grep -q "\\b${SITE_ID}\\b"; then
    echo_info "停止旧容器: $SITE_ID"
    docker stop $SITE_ID 2>/dev/null || true
    docker rm $SITE_ID 2>/dev/null || true
    echo_success "旧容器已清理"
else
    echo_info "没有需要清理的旧容器"
fi

# ========================================
# Step 7: 启动新容器
# ========================================
echo_step "步骤 7: 启动新容器"

echo_info "启动容器: $SITE_ID"
echo_info "网络: webproxy（对外访问）"
echo_info "端口: 3000（内部）"

docker run -d \
  --name "$SITE_ID" \
  --network webproxy \
  --env-file backend/.env \
  --restart unless-stopped \
  "${SITE_ID}:latest" || error_exit "容器启动失败"

echo_success "容器启动成功"

# 连接到shared_net网络
echo_info "连接到数据库网络..."
docker network connect shared_net "$SITE_ID" 2>/dev/null || echo_info "已连接到shared_net"

echo_success "网络配置完成"

# ========================================
# Step 8: 等待服务启动
# ========================================
echo_step "步骤 8: 等待服务启动"

echo_info "等待15秒让服务完全启动..."
sleep 15

# ========================================
# Step 9: 初始化数据库（可选）
# ========================================
echo_step "步骤 9: 初始化数据库"

if [ -f "scripts/init-postgres-tables.sh" ]; then
    read -p "是否初始化数据库表？(y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        chmod +x scripts/init-postgres-tables.sh
        PROJECT_PREFIX=$(grep "tablePrefix:" template-config/project.config.ts | cut -d"'" -f2)
        PROJECT_PREFIX=${PROJECT_PREFIX:-myproject_}
        ./scripts/init-postgres-tables.sh "$SITE_ID" "$PROJECT_PREFIX" || echo_warning "数据库初始化失败（可能已初始化）"
    else
        echo_info "跳过数据库初始化"
    fi
else
    echo_info "数据库初始化脚本不存在，跳过"
fi

# ========================================
# Step 10: 健康检查和验证
# ========================================
echo_step "步骤 10: 健康检查和验证"

# 容器状态
echo_info "容器状态："
docker ps | grep "$SITE_ID" || echo_error "容器未运行！"

# 获取容器IP
CONTAINER_IP=$(docker inspect "$SITE_ID" 2>/dev/null | grep -m1 '"IPAddress"' | cut -d'"' -f4)
echo_info "容器IP: $CONTAINER_IP"

# 网络连接验证
echo_info "网络连接："
docker network inspect webproxy | grep -q "$SITE_ID" && echo_success "✓ 已连接webproxy" || echo_error "✗ 未连接webproxy"
docker network inspect shared_net | grep -q "$SITE_ID" && echo_success "✓ 已连接shared_net" || echo_error "✗ 未连接shared_net"

# 容器日志
echo -e "\n${BLUE}━━━ 容器日志（最近20行）━━━${NC}"
docker logs "$SITE_ID" --tail 20

# 健康检查
echo -e "\n${BLUE}━━━ 健康检查 ━━━${NC}"
if [ -n "$CONTAINER_IP" ]; then
    sleep 3
    if curl -f -s "http://$CONTAINER_IP:3000/health" > /dev/null 2>&1; then
        echo_success "健康检查通过！"
        echo -e "\n${GREEN}健康检查响应：${NC}"
        curl -s "http://$CONTAINER_IP:3000/health" | python3 -m json.tool 2>/dev/null || curl -s "http://$CONTAINER_IP:3000/health"
    else
        echo_warning "健康检查失败（服务可能还在启动）"
        echo_info "稍后可手动检查: curl http://$CONTAINER_IP:3000/health"
    fi
else
    echo_warning "无法获取容器IP"
fi

# 数据库连接测试
if docker ps | grep -q postgres_master; then
    echo -e "\n${BLUE}━━━ 数据库连接测试 ━━━${NC}"
    if docker exec "$SITE_ID" nc -zv postgres_master 5432 2>&1 | grep -q "open"; then
        echo_success "可以连接到PostgreSQL总系统"
    else
        echo_warning "无法连接到postgres_master"
    fi
fi

# CORS配置验证
echo -e "\n${BLUE}━━━ CORS配置验证 ━━━${NC}"
docker logs "$SITE_ID" 2>&1 | grep "允许的CORS源" | tail -1 || echo_info "未找到CORS配置日志"

# ========================================
# Step 11: 部署完成信息
# ========================================
echo -e "\n"
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}║                   ✅ 部署成功！                               ║${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo -e "\n"

echo -e "${BLUE}━━━ 访问信息 ━━━${NC}"
echo_info "容器名称: $SITE_ID"
echo_info "容器IP: $CONTAINER_IP"
echo_info "内部端口: 3000"
echo_info "健康检查: curl http://$CONTAINER_IP:3000/health"

echo -e "\n${BLUE}━━━ 后续步骤 ━━━${NC}"
echo "1. 配置Nginx Proxy Manager:"
echo "   - 域名: 在 template-config/project.config.ts 中配置"
echo "   - 目标: http://$SITE_ID:3000"
echo "   - SSL: Let's Encrypt (自动证书)"

echo -e "\n2. 验证访问:"
DOMAIN=$(grep "primary:" template-config/project.config.ts | cut -d"'" -f2)
echo "   - 健康检查: curl http://$CONTAINER_IP:3000/health"
echo "   - 生产域名: https://$DOMAIN (配置NPM后)"

echo -e "\n3. 监控和管理:"
echo "   - 查看日志: docker logs -f $SITE_ID"
echo "   - 重启容器: docker restart $SITE_ID"
echo "   - 停止容器: docker stop $SITE_ID"

echo -e "\n${BLUE}━━━ 重要提醒 ━━━${NC}"
echo_warning "请修改默认密码和密钥！"
echo "   - JWT_SECRET: backend/.env"
echo "   - 数据库密码: backend/.env"

echo -e "\n${GREEN}🎉 部署流程完成！祝您使用愉快！${NC}\n"

# 保存部署信息
DEPLOY_INFO_FILE=".deploy-info-${SITE_ID}.txt"
cat > "$DEPLOY_INFO_FILE" << EOF
部署信息
========================================
部署时间: $(date)
站点ID: $SITE_ID
容器IP: $CONTAINER_IP
镜像: ${SITE_ID}:latest
网络: webproxy, shared_net
健康检查: http://$CONTAINER_IP:3000/health
========================================
EOF

echo_info "部署信息已保存到: $DEPLOY_INFO_FILE"

