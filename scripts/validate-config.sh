#!/bin/bash
################################################################################
# 配置验证脚本
# 
# 功能：验证环境变量配置是否正确
# 
# 使用方法：
#   ./scripts/validate-config.sh backend/.env
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
if [ $# -lt 1 ]; then
    echo_error "使用方法: $0 <env_file>"
    echo_info "示例: $0 backend/.env"
    exit 1
fi

ENV_FILE=$1

if [ ! -f "$ENV_FILE" ]; then
    echo_error "环境文件不存在: $ENV_FILE"
    exit 1
fi

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║                    配置验证工具                               ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

echo_info "验证文件: $ENV_FILE"
echo ""

# 加载环境变量（使用grep+eval方式）
set +e  # 临时关闭错误退出
while IFS= read -r line; do
    # 跳过注释和空行
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "$line" ]] && continue
    
    # 导出环境变量
    export "$line" 2>/dev/null || true
done < <(grep -E '^[A-Z_]+=.*' "$ENV_FILE" || true)
set -e  # 恢复错误退出

# 验证计数器
ERRORS=0
WARNINGS=0
SUCCESS=0

# ============================================================================
# 必需配置检查
# ============================================================================
echo_info "[必需配置]"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# SITE_ID
if [ -n "$SITE_ID" ]; then
    if [[ "$SITE_ID" =~ ^site[0-9]+$ ]] || [[ "$SITE_ID" =~ ^site[1-9][0-9]?$ ]]; then
        echo_success "SITE_ID: $SITE_ID"
        SUCCESS=$((SUCCESS + 1))
    else
        echo_warning "SITE_ID格式可能不正确: $SITE_ID (应为site1-site20)"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo_error "SITE_ID未设置"
    ERRORS=$((ERRORS + 1))
fi

# NODE_ENV
if [ -n "$NODE_ENV" ]; then
    if [[ "$NODE_ENV" == "production" ]] || [[ "$NODE_ENV" == "development" ]]; then
        echo_success "NODE_ENV: $NODE_ENV"
        SUCCESS=$((SUCCESS + 1))
    else
        echo_warning "NODE_ENV值异常: $NODE_ENV"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo_error "NODE_ENV未设置"
    ERRORS=$((ERRORS + 1))
fi

# DB_HOST
if [ -n "$DB_HOST" ]; then
    if [ "$DB_HOST" = "postgres_master" ]; then
        echo_success "DB_HOST: $DB_HOST"
        SUCCESS=$((SUCCESS + 1))
    else
        echo_warning "DB_HOST应为postgres_master，当前为: $DB_HOST"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo_error "DB_HOST未设置"
    ERRORS=$((ERRORS + 1))
fi

# DB_NAME
if [ -n "$DB_NAME" ]; then
    if [ "$DB_NAME" = "postgres" ]; then
        echo_success "DB_NAME: $DB_NAME"
        SUCCESS=$((SUCCESS + 1))
    else
        echo_warning "DB_NAME建议设置为postgres，当前为: $DB_NAME"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo_error "DB_NAME未设置"
    ERRORS=$((ERRORS + 1))
fi

# DB_USER
if [ -n "$DB_USER" ]; then
    if [[ "$DB_USER" =~ ^site[0-9]+_user$ ]]; then
        echo_success "DB_USER: $DB_USER"
        SUCCESS=$((SUCCESS + 1))
    else
        echo_warning "DB_USER格式可能不正确: $DB_USER (建议：siteN_user)"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo_error "DB_USER未设置"
    ERRORS=$((ERRORS + 1))
fi

# DB_PASS
if [ -n "$DB_PASS" ]; then
    if [ "$DB_PASS" = "siteN_pass" ] || [ "$DB_PASS" = "change-me" ]; then
        echo_error "DB_PASS使用默认值，必须修改！"
        ERRORS=$((ERRORS + 1))
    elif [ ${#DB_PASS} -lt 8 ]; then
        echo_warning "DB_PASS太短，建议至少8位"
        WARNINGS=$((WARNINGS + 1))
    else
        echo_success "DB_PASS: ******** (已设置)"
        SUCCESS=$((SUCCESS + 1))
    fi
else
    echo_error "DB_PASS未设置"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ============================================================================
# 安全配置检查
# ============================================================================
echo_info "[安全配置]"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# JWT_SECRET
if [ -n "$JWT_SECRET" ]; then
    if [ "$JWT_SECRET" = "change-this-secret-key" ] || [ "$JWT_SECRET" = "change-me" ] || [ "$JWT_SECRET" = "change-this-to-a-random-secret-key" ]; then
        echo_error "JWT_SECRET使用默认值，必须修改！"
        ERRORS=$((ERRORS + 1))
    elif [ ${#JWT_SECRET} -lt 16 ]; then
        echo_warning "JWT_SECRET太短，建议至少16位"
        WARNINGS=$((WARNINGS + 1))
    else
        echo_success "JWT_SECRET: ******** (已设置，长度: ${#JWT_SECRET})"
        SUCCESS=$((SUCCESS + 1))
    fi
else
    echo_error "JWT_SECRET未设置"
    ERRORS=$((ERRORS + 1))
fi

# JWT_EXPIRES_IN
if [ -n "$JWT_EXPIRES_IN" ]; then
    echo_success "JWT_EXPIRES_IN: $JWT_EXPIRES_IN"
    SUCCESS=$((SUCCESS + 1))
else
    echo_warning "JWT_EXPIRES_IN未设置，将使用默认值"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ============================================================================
# CORS配置检查
# ============================================================================
echo_info "[CORS配置]"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# FRONTEND_URL
if [ -n "$FRONTEND_URL" ]; then
    if [[ "$FRONTEND_URL" =~ ^https?:// ]]; then
        echo_success "FRONTEND_URL: $FRONTEND_URL"
        SUCCESS=$((SUCCESS + 1))
    else
        echo_warning "FRONTEND_URL应包含协议(http/https): $FRONTEND_URL"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo_warning "FRONTEND_URL未设置"
    WARNINGS=$((WARNINGS + 1))
fi

# ALLOWED_ORIGINS
if [ -n "$ALLOWED_ORIGINS" ]; then
    echo_success "ALLOWED_ORIGINS: $ALLOWED_ORIGINS"
    SUCCESS=$((SUCCESS + 1))
    
    # 检查是否包含www子域名
    if [[ "$ALLOWED_ORIGINS" != *"www."* ]]; then
        echo_warning "建议在ALLOWED_ORIGINS中包含www子域名"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo_warning "ALLOWED_ORIGINS未设置"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ============================================================================
# 反馈系统配置检查
# ============================================================================
echo_info "[反馈系统]"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# FEEDBACK_SITE_ID
if [ -n "$FEEDBACK_SITE_ID" ]; then
    if [ "$FEEDBACK_SITE_ID" = "$SITE_ID" ]; then
        echo_success "FEEDBACK_SITE_ID: $FEEDBACK_SITE_ID (与SITE_ID一致)"
        SUCCESS=$((SUCCESS + 1))
    else
        echo_warning "FEEDBACK_SITE_ID ($FEEDBACK_SITE_ID) 与 SITE_ID ($SITE_ID) 不一致"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo_warning "FEEDBACK_SITE_ID未设置"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ============================================================================
# 验证结果
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo_info "验证结果："
echo "  ✅ 通过: $SUCCESS 项"
echo "  ⚠️  警告: $WARNINGS 项"
echo "  ❌ 错误: $ERRORS 项"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo_error "配置验证失败！请修复上述错误后重试。"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo_warning "配置验证通过，但有 $WARNINGS 项警告。"
    echo_info "建议修复警告项以确保最佳配置。"
    exit 0
else
    echo_success "配置验证完全通过！"
    exit 0
fi

