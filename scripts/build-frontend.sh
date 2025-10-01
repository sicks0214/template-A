#!/bin/bash
################################################################################
# 前端分离式构建脚本
#
# 功能：
# 1. 在Docker容器中构建前端
# 2. 复制构建产物到后端
# 3. 验证构建结果
#
# 使用方法：
#   ./scripts/build-frontend.sh
################################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo_success() { echo -e "${GREEN}✅ $1${NC}"; }
echo_error() { echo -e "${RED}❌ $1${NC}"; }
echo_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
echo_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║                   前端分离式构建                              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

# 检查前端目录
if [ ! -d "frontend" ]; then
    echo_error "前端目录不存在"
    exit 1
fi

# ============================================================================
# Step 1: 检查package-lock.json
# ============================================================================
echo_info "[步骤 1] 检查package-lock.json"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd frontend

if [ ! -f "package-lock.json" ]; then
    echo_warning "package-lock.json不存在，生成中..."
    docker run --rm -v $(pwd):/app -w /app node:22-alpine sh -c "npm install --package-lock-only"
    echo_success "package-lock.json生成完成"
else
    echo_success "package-lock.json已存在"
fi

echo ""

# ============================================================================
# Step 2: Docker容器中构建
# ============================================================================
echo_info "[步骤 2] Docker容器中构建前端"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo_info "使用 Node.js 22 Alpine 镜像"
echo_info "执行: npm ci && npm run build"
echo ""

docker run --rm \
  -v $(pwd):/app \
  -w /app \
  node:22-alpine sh -c "
    echo '➜ 安装依赖...' && \
    npm ci --no-audit --no-fund && \
    echo && \
    echo '➜ 构建前端...' && \
    npm run build && \
    echo && \
    echo '➜ 修改文件权限...' && \
    chown -R 1000:1000 dist 2>/dev/null || true
  "

if [ $? -ne 0 ]; then
    echo_error "前端构建失败"
    cd ..
    exit 1
fi

echo ""
echo_success "前端构建完成"

# ============================================================================
# Step 3: 验证构建结果
# ============================================================================
echo ""
echo_info "[步骤 3] 验证构建结果"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -d "dist" ]; then
    echo_error "构建目录不存在: dist/"
    cd ..
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo_error "index.html不存在"
    cd ..
    exit 1
fi

# 统计文件
FILE_COUNT=$(find dist -type f | wc -l)
DIR_SIZE=$(du -sh dist | cut -f1)

echo_success "构建目录存在"
echo_info "文件数量: $FILE_COUNT"
echo_info "目录大小: $DIR_SIZE"

# 列出主要文件
echo ""
echo_info "主要文件："
ls -lh dist/ | head -10

echo ""

# ============================================================================
# Step 4: 复制到后端
# ============================================================================
echo_info "[步骤 4] 复制构建产物到后端"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 清理旧文件
if [ -d "../backend/frontend/dist" ]; then
    echo_info "清理旧文件..."
    rm -rf ../backend/frontend/dist
fi

# 创建目录
mkdir -p ../backend/frontend

# 复制文件
echo_info "复制文件..."
cp -r dist ../backend/frontend/

echo_success "文件复制完成"

cd ..

# ============================================================================
# Step 5: 验证后端文件
# ============================================================================
echo ""
echo_info "[步骤 5] 验证后端文件"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f "backend/frontend/dist/index.html" ]; then
    echo_success "后端前端文件已就绪"
    
    BACKEND_FILE_COUNT=$(find backend/frontend/dist -type f | wc -l)
    BACKEND_DIR_SIZE=$(du -sh backend/frontend/dist | cut -f1)
    
    echo_info "文件数量: $BACKEND_FILE_COUNT"
    echo_info "目录大小: $BACKEND_DIR_SIZE"
else
    echo_error "后端前端文件不完整"
    exit 1
fi

# ============================================================================
# 完成
# ============================================================================
echo ""
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║                 ✅ 前端构建完成！                             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

echo_info "构建产物位置："
echo "  • 前端: frontend/dist/"
echo "  • 后端: backend/frontend/dist/"
echo ""

echo_info "后续步骤："
echo "  1. 构建Docker镜像: docker build -f docker/Dockerfile.simple -t <image> ./backend"
echo "  2. 或使用一键部署: ./scripts/one-click-deploy.sh"
echo ""

echo -e "${GREEN}🎉 构建流程完成！${NC}\n"
