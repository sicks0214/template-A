#!/bin/bash

# ============================================================================
# 部署前预检查脚本 - Pre-Deployment Check
# ============================================================================
# 用途: 在执行部署前验证所有关键配置
# 作者: Template Team
# 版本: 1.0
# 日期: 2024-10-02
# ============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 成功/失败计数
SUCCESS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# 打印函数
print_header() {
    echo -e "\n${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║           部署前预检查 - Pre-Deployment Check                ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((SUCCESS_COUNT++))
}

print_fail() {
    echo -e "${RED}❌ $1${NC}"
    ((FAIL_COUNT++))
}

print_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARN_COUNT++))
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# ============================================================================
# 检查1: 环境文件存在性
# ============================================================================
check_env_file() {
    echo -e "\n${BLUE}━━━ 检查1: 环境文件 ━━━${NC}"
    
    if [ ! -f "backend/.env" ]; then
        print_fail "backend/.env 文件不存在"
        print_info "请创建 backend/.env 文件"
        return 1
    fi
    
    print_success "backend/.env 文件存在"
    
    # 检查文件格式
    if grep -q $'\r' backend/.env 2>/dev/null; then
        print_warn "检测到Windows换行符(CRLF)，建议转换为Unix格式(LF)"
    fi
}

# ============================================================================
# 检查2: 必需环境变量
# ============================================================================
check_required_vars() {
    echo -e "\n${BLUE}━━━ 检查2: 必需环境变量 ━━━${NC}"
    
    # 加载环境变量
    if [ -f backend/.env ]; then
        set -a
        source backend/.env 2>/dev/null || true
        set +a
    fi
    
    # 必需变量列表
    required_vars=(
        "DB_HOST"
        "DB_PORT"
        "DB_NAME"
        "DB_USER"
        "DB_PASSWORD"
        "SITE_ID"
        "TABLE_PREFIX"
        "NODE_ENV"
        "PORT"
        "JWT_SECRET"
        "ALLOWED_ORIGINS"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        print_fail "缺少必需的环境变量:"
        for var in "${missing_vars[@]}"; do
            echo "     - $var"
        done
        return 1
    fi
    
    print_success "所有必需环境变量已配置"
    
    # 显示关键配置
    echo -e "\n  关键配置:"
    echo "    • SITE_ID: ${SITE_ID}"
    echo "    • TABLE_PREFIX: ${TABLE_PREFIX}"
    echo "    • DB_HOST: ${DB_HOST}"
    echo "    • DB_USER: ${DB_USER}"
    echo "    • NODE_ENV: ${NODE_ENV}"
}

# ============================================================================
# 检查3: 数据库连接
# ============================================================================
check_database_connection() {
    echo -e "\n${BLUE}━━━ 检查3: 数据库连接 ━━━${NC}"
    
    # 检查 postgres_master 容器是否运行
    if ! docker ps --format '{{.Names}}' | grep -q "^postgres_master$"; then
        print_fail "postgres_master 容器未运行"
        print_info "请先启动 PostgreSQL 总系统"
        return 1
    fi
    
    print_success "postgres_master 容器正在运行"
    
    # 测试数据库连接
    if docker exec postgres_master psql -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT 1;" > /dev/null 2>&1; then
        print_success "数据库连接测试成功 (用户: ${DB_USER})"
    else
        print_fail "无法连接数据库 (用户: ${DB_USER})"
        print_info "请检查 DB_USER 和 DB_PASSWORD 是否正确"
        return 1
    fi
}

# ============================================================================
# 检查4: 数据库表和权限
# ============================================================================
check_database_tables() {
    echo -e "\n${BLUE}━━━ 检查4: 数据库表和权限 ━━━${NC}"
    
    # 检查表是否存在
    local table_name="${TABLE_PREFIX}users"
    
    if docker exec postgres_master psql -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT COUNT(*) FROM ${table_name};" > /dev/null 2>&1; then
        print_success "数据库表已初始化: ${table_name}"
        
        # 获取表数量
        local count=$(docker exec postgres_master psql -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT COUNT(*) FROM ${table_name};")
        echo "    • 用户数: $(echo $count | tr -d ' ')"
    else
        print_fail "数据库表不存在或无权限: ${table_name}"
        print_info "请先执行数据库初始化脚本"
        return 1
    fi
    
    # 检查统一反馈表
    if docker exec postgres_master psql -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT COUNT(*) FROM unified_feedback WHERE site_id='${SITE_ID}';" > /dev/null 2>&1; then
        print_success "统一反馈表访问正常"
    else
        print_warn "无法访问统一反馈表，可能影响反馈功能"
    fi
}

# ============================================================================
# 检查5: TABLE_PREFIX 一致性
# ============================================================================
check_table_prefix_consistency() {
    echo -e "\n${BLUE}━━━ 检查5: TABLE_PREFIX 一致性 ━━━${NC}"
    
    # 列出所有匹配的表
    local tables=$(docker exec postgres_master psql -U admin -d postgres -t -c "\dt ${TABLE_PREFIX}*" 2>/dev/null | grep -E "^ " | awk '{print $3}')
    
    if [ -z "$tables" ]; then
        print_fail "未找到以 '${TABLE_PREFIX}' 开头的表"
        print_info "请确认 TABLE_PREFIX 配置是否正确"
        return 1
    fi
    
    print_success "找到匹配的数据库表:"
    echo "$tables" | while read -r table; do
        [ -n "$table" ] && echo "    • $table"
    done
    
    # 检查是否有单下划线/双下划线混淆
    local single_underscore="${SITE_ID}_"
    local double_underscore="${SITE_ID}__"
    
    if [ "$TABLE_PREFIX" = "$single_underscore" ]; then
        if docker exec postgres_master psql -U admin -d postgres -t -c "\dt ${double_underscore}*" 2>/dev/null | grep -q "^ "; then
            print_warn "检测到双下划线表存在，但配置使用单下划线"
            print_info "请确认 TABLE_PREFIX 应为 '${single_underscore}' 还是 '${double_underscore}'"
        fi
    elif [ "$TABLE_PREFIX" = "$double_underscore" ]; then
        if docker exec postgres_master psql -U admin -d postgres -t -c "\dt ${single_underscore}*" 2>/dev/null | grep -q "^ "; then
            print_warn "检测到单下划线表存在，但配置使用双下划线"
            print_info "请确认 TABLE_PREFIX 应为 '${double_underscore}' 还是 '${single_underscore}'"
        fi
    fi
}

# ============================================================================
# 检查6: Docker 网络
# ============================================================================
check_docker_networks() {
    echo -e "\n${BLUE}━━━ 检查6: Docker 网络 ━━━${NC}"
    
    # 检查 webproxy 网络
    if docker network ls | grep -q "webproxy"; then
        print_success "webproxy 网络已创建"
    else
        print_warn "webproxy 网络不存在"
        print_info "部署时将自动创建"
    fi
    
    # 检查 shared_net 网络
    if docker network ls | grep -q "shared_net"; then
        print_success "shared_net 网络已创建"
    else
        print_warn "shared_net 网络不存在"
        print_info "部署时将自动创建"
    fi
}

# ============================================================================
# 检查7: 编译产物
# ============================================================================
check_build_artifacts() {
    echo -e "\n${BLUE}━━━ 检查7: 编译产物 ━━━${NC}"
    
    # 检查后端 dist 目录
    if [ -d "backend/dist" ] && [ "$(ls -A backend/dist 2>/dev/null)" ]; then
        print_success "后端编译产物存在 (backend/dist/)"
        
        # 检查关键文件
        if [ -f "backend/dist/index.js" ]; then
            print_info "  • index.js 已编译"
        else
            print_warn "  • index.js 不存在"
        fi
    else
        print_warn "后端编译产物不存在"
        print_info "部署时将使用 Docker 容器编译"
    fi
    
    # 检查前端 dist 目录
    if [ -d "frontend/dist" ] && [ "$(ls -A frontend/dist 2>/dev/null)" ]; then
        print_success "前端编译产物存在 (frontend/dist/)"
    else
        print_warn "前端编译产物不存在"
        print_info "部署时将使用 Docker 容器构建"
    fi
}

# ============================================================================
# 检查8: 安全配置
# ============================================================================
check_security_config() {
    echo -e "\n${BLUE}━━━ 检查8: 安全配置 ━━━${NC}"
    
    # 检查 JWT_SECRET
    if [ "${JWT_SECRET}" = "your-super-secret-jwt-key-change-this" ] || \
       [ "${JWT_SECRET}" = "change-this-to-a-random-secret-key" ]; then
        print_fail "JWT_SECRET 使用默认值，必须修改！"
    else
        if [ ${#JWT_SECRET} -lt 32 ]; then
            print_warn "JWT_SECRET 长度过短 (${#JWT_SECRET} 字符)，推荐至少 32 字符"
        else
            print_success "JWT_SECRET 已正确配置"
        fi
    fi
    
    # 检查 DB_PASSWORD
    if [ "${DB_PASSWORD}" = "your-database-password-here" ] || \
       [ "${DB_PASSWORD}" = "change-this-password" ]; then
        print_fail "DB_PASSWORD 使用默认值，必须修改！"
    else
        print_success "DB_PASSWORD 已配置"
    fi
    
    # 检查 NODE_ENV
    if [ "${NODE_ENV}" = "production" ]; then
        print_success "NODE_ENV 设置为 production"
    else
        print_warn "NODE_ENV 不是 production (当前: ${NODE_ENV})"
    fi
    
    # 检查 ALLOWED_ORIGINS
    if [[ "${ALLOWED_ORIGINS}" == *"localhost"* ]]; then
        print_warn "ALLOWED_ORIGINS 包含 localhost，生产环境应使用实际域名"
    elif [ -n "${ALLOWED_ORIGINS}" ]; then
        print_success "ALLOWED_ORIGINS 已配置"
        echo "    • ${ALLOWED_ORIGINS}"
    else
        print_fail "ALLOWED_ORIGINS 未配置"
    fi
}

# ============================================================================
# 检查9: 端口冲突
# ============================================================================
check_port_conflicts() {
    echo -e "\n${BLUE}━━━ 检查9: 端口冲突 ━━━${NC}"
    
    local port="${PORT:-3000}"
    
    # 检查端口是否被占用
    if docker ps --format '{{.Names}}\t{{.Ports}}' | grep -q ":${port}->"; then
        local container=$(docker ps --format '{{.Names}}\t{{.Ports}}' | grep ":${port}->" | awk '{print $1}')
        if [ "$container" = "${SITE_ID}" ]; then
            print_info "端口 ${port} 被当前站点容器占用 (正常)"
        else
            print_warn "端口 ${port} 已被其他容器占用: $container"
            print_info "部署时将停止旧容器"
        fi
    else
        print_success "端口 ${port} 可用"
    fi
}

# ============================================================================
# 检查10: Git 状态
# ============================================================================
check_git_status() {
    echo -e "\n${BLUE}━━━ 检查10: Git 状态 ━━━${NC}"
    
    if [ -d ".git" ]; then
        # 检查是否有未提交的更改
        if [ -n "$(git status --porcelain)" ]; then
            print_warn "有未提交的更改"
            print_info "建议先提交更改再部署"
        else
            print_success "工作目录干净"
        fi
        
        # 显示当前分支和最新提交
        local branch=$(git branch --show-current)
        local commit=$(git log -1 --oneline)
        echo "    • 分支: $branch"
        echo "    • 最新提交: $commit"
    else
        print_warn "不是 Git 仓库"
    fi
}

# ============================================================================
# 主函数
# ============================================================================
main() {
    print_header
    
    # 执行所有检查
    check_env_file || true
    check_required_vars || true
    check_database_connection || true
    check_database_tables || true
    check_table_prefix_consistency || true
    check_docker_networks || true
    check_build_artifacts || true
    check_security_config || true
    check_port_conflicts || true
    check_git_status || true
    
    # 打印总结
    echo -e "\n${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                        检查结果总结                           ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}\n"
    
    echo -e "  ${GREEN}成功: ${SUCCESS_COUNT}${NC}"
    echo -e "  ${YELLOW}警告: ${WARN_COUNT}${NC}"
    echo -e "  ${RED}失败: ${FAIL_COUNT}${NC}"
    
    echo ""
    
    if [ $FAIL_COUNT -gt 0 ]; then
        echo -e "${RED}❌ 发现 ${FAIL_COUNT} 个严重问题，请先修复后再部署！${NC}"
        exit 1
    elif [ $WARN_COUNT -gt 0 ]; then
        echo -e "${YELLOW}⚠️  发现 ${WARN_COUNT} 个警告，建议检查后再部署${NC}"
        echo -e "${YELLOW}是否继续部署？(y/n)${NC}"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            echo "已取消部署"
            exit 0
        fi
    else
        echo -e "${GREEN}✅ 所有检查通过，可以开始部署！${NC}"
    fi
}

# 运行主函数
main

