#!/bin/bash
################################################################################
# PostgreSQL总系统 - 站点数据库初始化脚本
#
# 功能：
# 1. 为新站点创建数据库用户
# 2. 创建项目表（使用表前缀）
# 3. 配置反馈系统（接入unified_feedback）
# 4. 授予适当权限
#
# 使用方法：
#   ./scripts/init-postgres-tables.sh <site_id> <table_prefix>
#
# 示例：
#   ./scripts/init-postgres-tables.sh site3 myproject_
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

# 参数检查
if [ $# -lt 2 ]; then
    echo_error "使用方法: $0 <site_id> <table_prefix>"
    echo_info "示例: $0 site3 myproject_"
    exit 1
fi

SITE_ID=$1
TABLE_PREFIX=$2
SITE_USER="${SITE_ID}_user"
SITE_PASS="${SITE_ID}_pass"

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     PostgreSQL总系统 - 站点数据库初始化                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

echo_info "站点ID: $SITE_ID"
echo_info "表前缀: $TABLE_PREFIX"
echo_info "数据库用户: $SITE_USER"
echo ""

# 检查postgres_master容器
if ! docker ps | grep -q "postgres"; then
    echo_error "PostgreSQL总系统未运行"
    echo_info "请先启动PostgreSQL容器"
    exit 1
fi

# 获取postgres容器名
POSTGRES_CONTAINER=$(docker ps | grep postgres | awk '{print $NF}' | head -1)
echo_info "PostgreSQL容器: $POSTGRES_CONTAINER"
echo ""

# ============================================================================
# Step 1: 创建站点用户
# ============================================================================
echo_info "[步骤 1] 创建站点用户"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

docker exec "$POSTGRES_CONTAINER" psql -U postgres -c "
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = '${SITE_USER}') THEN
        CREATE USER ${SITE_USER} WITH PASSWORD '${SITE_PASS}';
        RAISE NOTICE '✅ 用户已创建: ${SITE_USER}';
    ELSE
        RAISE NOTICE '⚠️  用户已存在: ${SITE_USER}';
    END IF;
END
\$\$;
"

echo_success "站点用户配置完成"
echo ""

# ============================================================================
# Step 2: 创建项目表（从模块SQL文件）
# ============================================================================
echo_info "[步骤 2] 创建项目表"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 查找所有模块的数据库脚本
if [ -d "modules" ]; then
    for module_sql in modules/*/database/*.sql; do
        if [ -f "$module_sql" ]; then
            echo_info "处理模块表: $module_sql"
            
            # 替换占位符
            cat "$module_sql" | \
                sed "s/\${PROJECT_PREFIX}/${TABLE_PREFIX}/g" | \
                sed "s/\${SITE_USER}/${SITE_USER}/g" | \
                docker exec -i "$POSTGRES_CONTAINER" psql -U postgres
            
            echo_success "模块表创建完成: $(basename $(dirname $(dirname $module_sql)))"
        fi
    done
else
    echo_warning "未找到modules目录"
fi

echo ""

# ============================================================================
# Step 3: 配置反馈系统
# ============================================================================
echo_info "[步骤 3] 配置反馈系统"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 确保unified_feedback表存在
docker exec "$POSTGRES_CONTAINER" psql -U postgres -c "
CREATE TABLE IF NOT EXISTS unified_feedback (
    id SERIAL PRIMARY KEY,
    site_id VARCHAR(20) NOT NULL,
    user_id INTEGER,
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    contact_info VARCHAR(255),
    user_agent TEXT,
    url TEXT,
    screenshot_url TEXT,
    metadata JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_feedback_type CHECK (type IN ('bug', 'feature', 'suggestion', 'other')),
    CONSTRAINT chk_feedback_status CHECK (status IN ('pending', 'reviewed', 'resolved', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_unified_feedback_site ON unified_feedback(site_id);
CREATE INDEX IF NOT EXISTS idx_unified_feedback_created ON unified_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_unified_feedback_status ON unified_feedback(status);
"

# 授予权限
docker exec "$POSTGRES_CONTAINER" psql -U postgres -c "
GRANT SELECT, INSERT, UPDATE ON unified_feedback TO ${SITE_USER};
GRANT USAGE ON SEQUENCE unified_feedback_id_seq TO ${SITE_USER};
"

echo_success "反馈系统配置完成"
echo ""

# ============================================================================
# Step 4: 创建核心认证表
# ============================================================================
echo_info "[步骤 4] 创建核心认证表"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

docker exec "$POSTGRES_CONTAINER" psql -U postgres -c "
-- 用户表
CREATE TABLE IF NOT EXISTS ${TABLE_PREFIX}users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'active',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_user_role CHECK (role IN ('user', 'premium', 'admin')),
    CONSTRAINT chk_user_status CHECK (status IN ('active', 'suspended', 'deleted'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON ${TABLE_PREFIX}users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON ${TABLE_PREFIX}users(username);

-- 刷新令牌表
CREATE TABLE IF NOT EXISTS ${TABLE_PREFIX}refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES ${TABLE_PREFIX}users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON ${TABLE_PREFIX}refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON ${TABLE_PREFIX}refresh_tokens(token);

-- 授予权限
GRANT ALL PRIVILEGES ON ${TABLE_PREFIX}users TO ${SITE_USER};
GRANT ALL PRIVILEGES ON ${TABLE_PREFIX}refresh_tokens TO ${SITE_USER};
GRANT USAGE ON SEQUENCE ${TABLE_PREFIX}users_id_seq TO ${SITE_USER};
GRANT USAGE ON SEQUENCE ${TABLE_PREFIX}refresh_tokens_id_seq TO ${SITE_USER};
"

echo_success "核心认证表创建完成"
echo ""

# ============================================================================
# Step 5: 验证配置
# ============================================================================
echo_info "[步骤 5] 验证配置"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查用户
echo_info "检查用户权限..."
docker exec "$POSTGRES_CONTAINER" psql -U postgres -c "\du ${SITE_USER}"

# 检查表
echo ""
echo_info "检查已创建的表..."
docker exec "$POSTGRES_CONTAINER" psql -U postgres -c "\dt ${TABLE_PREFIX}*"

# 统计
echo ""
TABLE_COUNT=$(docker exec "$POSTGRES_CONTAINER" psql -U postgres -t -c "
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '${TABLE_PREFIX}%';
" | xargs)

echo_success "共创建 $TABLE_COUNT 个表"

# ============================================================================
# 完成
# ============================================================================
echo ""
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║                   ✅ 数据库初始化完成！                       ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

echo_info "初始化摘要："
echo "  • 站点ID: $SITE_ID"
echo "  • 数据库用户: $SITE_USER"
echo "  • 表前缀: $TABLE_PREFIX"
echo "  • 创建表数量: $TABLE_COUNT"
echo ""

echo_info "后续步骤："
echo "  1. 确保 backend/.env 中配置了正确的数据库信息"
echo "  2. DB_USER=$SITE_USER"
echo "  3. DB_PASS=$SITE_PASS"
echo "  4. 运行 ./scripts/one-click-deploy.sh 部署应用"
echo ""

echo_warning "⚠️  重要提醒："
echo "  • 请修改默认密码: $SITE_PASS"
echo "  • 在生产环境中使用强密码"
echo ""

echo -e "${GREEN}🎉 初始化流程完成！${NC}\n"

