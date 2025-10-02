#!/bin/bash
# ============================================
# Template A - 一键部署脚本（PostgreSQL总系统版）
# ============================================
# 
# 功能：
# 1. 验证环境配置
# 2. 验证PostgreSQL连接
# 3. 编译TypeScript
# 4. 构建前端
# 5. 构建Docker镜像
# 6. 部署容器
# 7. 验证部署结果
#
# 使用方法：
#   chmod +x scripts/one-click-deploy-postgres.sh
#   ./scripts/one-click-deploy-postgres.sh
#
# ============================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
print_header() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║     🚀 Template A - PostgreSQL总系统一键部署                  ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "${GREEN}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 计数器
SUCCESS_COUNT=0
TOTAL_STEPS=10

# ========================================
# 步骤0: 环境预检查
# ========================================
print_header
print_step "步骤 0: 环境预检查"

# 检查Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker未安装"
    exit 1
fi
print_success "Docker已安装: $(docker --version | cut -d' ' -f3)"
SUCCESS_COUNT=$((SUCCESS_COUNT + 1))

# 检查backend/.env文件
if [ ! -f "backend/.env" ]; then
    print_error "backend/.env 文件不存在"
    print_warning "请先创建环境变量文件"
    exit 1
fi
print_success "环境文件存在"
SUCCESS_COUNT=$((SUCCESS_COUNT + 1))

# 加载环境变量
set +e
while IFS= read -r line; do
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "$line" ]] && continue
    export "$line" 2>/dev/null || true
done < <(grep -E '^[A-Z_]+=.*' backend/.env || true)
set -e

# 检查必需的环境变量
required_vars=("DB_HOST" "DB_USER" "DB_PASSWORD" "SITE_ID" "TABLE_PREFIX")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    print_error "缺少必需的环境变量:"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    exit 1
fi

print_success "站点ID: $SITE_ID"
print_success "表前缀: $TABLE_PREFIX"
print_success "数据库主机: $DB_HOST"

# ========================================
# 步骤1: 验证PostgreSQL连接
# ========================================
print_step "步骤 1: 验证PostgreSQL总系统连接"

# 检查postgres_master容器
if ! docker ps | grep -q postgres_master; then
    print_error "postgres_master容器未运行"
    print_warning "请先启动PostgreSQL总系统"
    exit 1
fi
print_success "postgres_master容器正在运行"

# 检查shared_net网络
if ! docker network ls | grep -q shared_net; then
    print_warning "shared_net网络不存在，正在创建..."
    docker network create shared_net
    print_success "shared_net网络已创建"
fi

# 测试数据库连接
print_step "测试数据库连接..."
if docker exec postgres_master psql -U "$DB_USER" -d postgres -c "SELECT 1" &>/dev/null; then
    print_success "数据库连接测试成功"
else
    print_error "数据库连接失败"
    print_warning "请检查数据库用户和密码"
    exit 1
fi

# 验证表前缀表是否存在
TABLE_CHECK="${TABLE_PREFIX}users"
if docker exec postgres_master psql -U "$DB_USER" -d postgres -c "\dt $TABLE_CHECK" 2>/dev/null | grep -q "$TABLE_CHECK"; then
    print_success "数据库表已初始化: $TABLE_CHECK"
else
    print_warning "表 $TABLE_CHECK 不存在"
    print_warning "请先运行数据库初始化脚本:"
    echo "  docker exec -i postgres_master psql -U admin -d postgres < database/vps/template-a-init.sql"
    exit 1
fi

SUCCESS_COUNT=$((SUCCESS_COUNT + 1))

# ========================================
# 步骤2: 编译TypeScript
# ========================================
print_step "步骤 2: 编译TypeScript代码"

cd backend

# 检查是否已有编译产物
if [ -d "dist" ] && [ -n "$(ls -A dist 2>/dev/null)" ]; then
    print_success "使用已有的编译产物（dist目录已存在）"
else
    # 使用Docker容器编译（VPS上可能没有npm）
    print_step "使用Docker容器编译TypeScript..."
    
    if command -v npm &> /dev/null; then
        # 本地有npm，直接编译
        if [ ! -d "node_modules" ]; then
            npm install
        fi
        npm run build
    else
        # 使用Docker编译
        docker run --rm -v "$(pwd)":/app -w /app node:18-alpine sh -c "
            npm ci --no-audit --no-fund && \
            npm run build && \
            chown -R $(id -u):$(id -g) dist
        "
    fi
    
    # 验证编译结果
    if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
        print_error "TypeScript编译失败"
        exit 1
    fi
fi

print_success "TypeScript编译完成"
SUCCESS_COUNT=$((SUCCESS_COUNT + 1))

cd ..

# ========================================
# 步骤3: 构建前端（分离式）
# ========================================
print_step "步骤 3: 构建前端（使用Docker容器）"

cd frontend

# 检查是否已有编译产物
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    print_success "使用已有的编译产物（dist目录已存在）"
else
    # 生成package-lock.json（如果不存在）
    if [ ! -f "package-lock.json" ]; then
        print_step "生成package-lock.json..."
        docker run --rm -v "$(pwd)":/app -w /app node:22-alpine sh -c "npm install --package-lock-only"
    fi

    # 在Docker容器中构建前端
    print_step "Docker容器中执行前端构建..."
    docker run --rm -v "$(pwd)":/app -w /app node:22-alpine sh -c "
        npm ci --no-audit --no-fund && \
        npm run build && \
        chown -R $(id -u):$(id -g) dist
    "

    # 验证构建结果
    if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
        print_error "前端构建失败"
        exit 1
    fi
fi

# 复制到后端目录
print_step "复制前端构建产物到后端..."
rm -rf ../backend/frontend/dist
mkdir -p ../backend/frontend
cp -r dist ../backend/frontend/

print_success "前端构建完成"
SUCCESS_COUNT=$((SUCCESS_COUNT + 1))

cd ..

# ========================================
# 步骤4: 构建Docker镜像
# ========================================
print_step "步骤 4: 构建Docker镜像"

IMAGE_NAME="${SITE_ID}:latest"

docker build \
    -f backend/Dockerfile.simple \
    -t "$IMAGE_NAME" \
    ./backend

print_success "Docker镜像构建完成: $IMAGE_NAME"
SUCCESS_COUNT=$((SUCCESS_COUNT + 1))

# ========================================
# 步骤5: 配置Docker网络
# ========================================
print_step "步骤 5: 配置Docker网络"

# 创建webproxy网络（如果不存在）
if ! docker network ls | grep -q webproxy; then
    print_warning "webproxy网络不存在，正在创建..."
    docker network create webproxy
    print_success "webproxy网络已创建"
fi

# 创建shared_net网络（如果不存在）
if ! docker network ls | grep -q shared_net; then
    docker network create shared_net
    print_success "shared_net网络已创建"
fi

# 检查postgres_master是否在shared_net中
if ! docker network inspect shared_net | grep -q postgres_master; then
    print_warning "postgres_master不在shared_net中，正在连接..."
    docker network connect --alias postgres_master shared_net postgres_master 2>/dev/null || true
fi

print_success "网络配置完成"
SUCCESS_COUNT=$((SUCCESS_COUNT + 1))

# ========================================
# 步骤6: 停止旧容器
# ========================================
print_step "步骤 6: 停止旧容器"

if docker ps -a | grep -q "$SITE_ID"; then
    print_step "停止并删除旧容器: $SITE_ID"
    docker stop "$SITE_ID" 2>/dev/null || true
    docker rm "$SITE_ID" 2>/dev/null || true
    print_success "旧容器已清理"
else
    print_success "无需清理旧容器"
fi

SUCCESS_COUNT=$((SUCCESS_COUNT + 1))

# ========================================
# 步骤7: 启动新容器
# ========================================
print_step "步骤 7: 启动新容器"

docker run -d \
    --name "$SITE_ID" \
    --network webproxy \
    --env-file backend/.env \
    --restart unless-stopped \
    "$IMAGE_NAME"

# 连接到shared_net网络
docker network connect shared_net "$SITE_ID"

print_success "容器启动成功: $SITE_ID"
SUCCESS_COUNT=$((SUCCESS_COUNT + 1))

# ========================================
# 步骤8: 等待服务启动
# ========================================
print_step "步骤 8: 等待服务启动（15秒）..."

sleep 15

print_success "等待完成"
SUCCESS_COUNT=$((SUCCESS_COUNT + 1))

# ========================================
# 步骤9: 健康检查和验证
# ========================================
print_step "步骤 9: 健康检查和验证"

# 检查容器状态
if ! docker ps | grep -q "$SITE_ID"; then
    print_error "容器未运行"
    docker logs "$SITE_ID" --tail 30
    exit 1
fi
print_success "容器正在运行"

# 检查网络连接
if docker network inspect webproxy | grep -q "$SITE_ID"; then
    print_success "已连接webproxy网络"
fi

if docker network inspect shared_net | grep -q "$SITE_ID"; then
    print_success "已连接shared_net网络"
fi

# 测试健康检查端点
CONTAINER_IP=$(docker inspect "$SITE_ID" | grep -m1 '"IPAddress"' | cut -d'"' -f4)
if [ -n "$CONTAINER_IP" ]; then
    print_success "容器IP: $CONTAINER_IP"
    
    if docker exec "$SITE_ID" curl -sf http://localhost:3000/health > /dev/null 2>&1; then
        print_success "健康检查通过！"
    else
        print_warning "健康检查失败，请查看日志"
    fi
fi

# 测试PostgreSQL连接
if docker exec "$SITE_ID" sh -c "command -v nc" &>/dev/null; then
    if docker exec "$SITE_ID" nc -zv postgres_master 5432 2>&1 | grep -q "succeeded"; then
        print_success "可以连接到PostgreSQL总系统"
    else
        print_warning "无法连接到PostgreSQL"
    fi
fi

SUCCESS_COUNT=$((SUCCESS_COUNT + 1))

# ========================================
# 步骤10: 显示部署信息
# ========================================
print_step "步骤 10: 部署信息汇总"

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                   ✅ 部署成功！                               ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}━━━ 部署信息 ━━━${NC}"
echo "容器名称: $SITE_ID"
echo "镜像: $IMAGE_NAME"
echo "容器IP: $CONTAINER_IP"
echo "内部端口: 3000"
echo "站点ID: $SITE_ID"
echo "表前缀: $TABLE_PREFIX"
echo "数据库主机: $DB_HOST"
echo ""

echo -e "${GREEN}━━━ 验证命令 ━━━${NC}"
echo "查看日志:"
echo "  docker logs $SITE_ID --tail 50"
echo ""
echo "查看健康状态:"
echo "  curl http://$CONTAINER_IP:3000/health"
echo ""
echo "进入容器:"
echo "  docker exec -it $SITE_ID sh"
echo ""
echo "测试数据库连接:"
echo "  docker exec $SITE_ID nc -zv postgres_master 5432"
echo ""

echo -e "${GREEN}━━━ 后续步骤 ━━━${NC}"
echo "1. 配置Nginx Proxy Manager"
echo "   - 域名: 您的域名"
echo "   - 转发主机: $SITE_ID"
echo "   - 转发端口: 3000"
echo ""
echo "2. 申请SSL证书"
echo "3. 测试访问: https://您的域名"
echo "4. 查看反馈数据:"
echo "   docker exec postgres_master psql -U $DB_USER -d postgres -c \"SELECT * FROM unified_feedback WHERE site_id='$SITE_ID' LIMIT 5;\""
echo ""

SUCCESS_COUNT=$((SUCCESS_COUNT + 1))

# ========================================
# 总结
# ========================================
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  部署完成 - 成功: $SUCCESS_COUNT/$TOTAL_STEPS 步                          ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

