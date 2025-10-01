#!/bin/bash
################################################################################
# 创建新模块脚本
#
# 功能：自动生成新模块的完整目录结构和基础代码
#
# 使用方法：
#   ./scripts/create-new-module.sh <module-name>
#
# 示例：
#   ./scripts/create-new-module.sh my-feature
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
    echo_error "使用方法: $0 <module-name>"
    echo_info "示例: $0 my-feature"
    exit 1
fi

MODULE_NAME=$1

# 验证模块名格式
if [[ ! "$MODULE_NAME" =~ ^[a-z][a-z0-9-]*$ ]]; then
    echo_error "模块名格式不正确"
    echo_info "模块名必须：以小写字母开头，只包含小写字母、数字和连字符"
    echo_info "正确示例: my-feature, user-profile, data-import"
    exit 1
fi

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║                   创建新模块工具                              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

echo_info "模块名称: $MODULE_NAME"
echo ""

# 转换命名格式
CAMEL_CASE=$(echo "$MODULE_NAME" | sed -r 's/(^|-)([a-z])/\U\2/g')  # MyFeature
PASCAL_CASE="$CAMEL_CASE"                                          # MyFeature
SNAKE_CASE=$(echo "$MODULE_NAME" | tr '-' '_')                     # my_feature

echo_info "Pascal Case: $PASCAL_CASE (用于组件名)"
echo_info "Snake Case: $SNAKE_CASE (用于表名)"
echo ""

# 检查模块是否已存在
MODULE_DIR="modules/$MODULE_NAME"
if [ -d "$MODULE_DIR" ]; then
    echo_error "模块已存在: $MODULE_DIR"
    exit 1
fi

# ============================================================================
# 创建目录结构
# ============================================================================
echo_info "[步骤 1] 创建目录结构"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

mkdir -p "$MODULE_DIR"/{frontend/{pages,components},backend/{routes,controllers},database}

echo_success "目录结构创建完成"
echo ""

# ============================================================================
# 创建模块配置文件
# ============================================================================
echo_info "[步骤 2] 创建模块配置"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cat > "$MODULE_DIR/module.config.ts" << EOF
/**
 * $PASCAL_CASE 模块配置
 */

import { ModuleConfig } from '../../template-config/module.registry'

export const ${SNAKE_CASE}Config: ModuleConfig = {
  // 基础信息
  id: '$MODULE_NAME',
  name: '$PASCAL_CASE',
  displayName: '$PASCAL_CASE',
  description: '$PASCAL_CASE 功能模块',
  version: '1.0.0',
  author: '',
  
  // 前端路由配置
  routes: [
    {
      path: '/$MODULE_NAME',
      component: '${PASCAL_CASE}Page',
      exact: true,
      protected: false  // 是否需要登录
    },
  ],
  
  // 导航菜单配置
  navItems: [
    {
      label: 'nav.${SNAKE_CASE}',
      path: '/$MODULE_NAME',
      icon: 'star',  // 修改为合适的图标
      order: 10,     // 修改为合适的顺序
      protected: false
    },
  ],
  
  // 数据库表（会自动添加项目表前缀）
  databaseTables: [
    '${SNAKE_CASE}_data',
  ],
  
  // API路由前缀
  apiPrefix: '/api/$MODULE_NAME',
  
  // i18n命名空间
  i18nNamespaces: ['${SNAKE_CASE}'],
  
  // 依赖的核心系统
  dependencies: ['i18n'],
}

export default ${SNAKE_CASE}Config
EOF

echo_success "模块配置创建完成"
echo ""

# ============================================================================
# 创建前端页面
# ============================================================================
echo_info "[步骤 3] 创建前端页面"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cat > "$MODULE_DIR/frontend/pages/${PASCAL_CASE}Page.tsx" << 'EOFPAGE'
/**
 * MODULE_PASCAL_CASE 页面
 */

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const MODULE_PASCAL_CASEPage: React.FC = () => {
  const { t } = useTranslation('MODULE_SNAKE_CASE')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/MODULE_NAME/hello')
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              {t('title', 'MODULE_PASCAL_CASE')}
            </h1>
            <p className="text-lg text-gray-600">
              {t('subtitle', 'MODULE_PASCAL_CASE 功能模块')}
            </p>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">{t('loading', '加载中...')}</p>
              </div>
            ) : data ? (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  {t('dataTitle', '数据')}
                </h2>
                <pre className="bg-gray-50 rounded-lg p-4 overflow-auto">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                {t('noData', '暂无数据')}
              </p>
            )}

            <button
              onClick={fetchData}
              disabled={loading}
              className="mt-6 w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? t('loading', '加载中...') : t('refresh', '刷新')}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

export default MODULE_PASCAL_CASEPage
EOFPAGE

# 替换占位符
sed -i "s/MODULE_PASCAL_CASE/$PASCAL_CASE/g" "$MODULE_DIR/frontend/pages/${PASCAL_CASE}Page.tsx"
sed -i "s/MODULE_SNAKE_CASE/$SNAKE_CASE/g" "$MODULE_DIR/frontend/pages/${PASCAL_CASE}Page.tsx"
sed -i "s/MODULE_NAME/$MODULE_NAME/g" "$MODULE_DIR/frontend/pages/${PASCAL_CASE}Page.tsx"

echo_success "前端页面创建完成"
echo ""

# ============================================================================
# 创建后端路由
# ============================================================================
echo_info "[步骤 4] 创建后端路由"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cat > "$MODULE_DIR/backend/routes/${SNAKE_CASE}Routes.ts" << EOF
/**
 * $PASCAL_CASE 模块 - API路由
 */

import express, { Request, Response } from 'express'

const router = express.Router()

/**
 * GET /api/$MODULE_NAME/hello
 * 示例端点
 */
router.get('/hello', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Hello from $PASCAL_CASE Module!',
    module: '$MODULE_NAME',
    timestamp: new Date().toISOString(),
  })
})

/**
 * GET /api/$MODULE_NAME/data
 * 获取数据
 */
router.get('/data', async (req: Request, res: Response) => {
  try {
    // TODO: 实现数据查询逻辑
    res.json({
      success: true,
      data: [],
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
})

/**
 * POST /api/$MODULE_NAME/data
 * 创建数据
 */
router.post('/data', async (req: Request, res: Response) => {
  try {
    const data = req.body
    // TODO: 实现数据创建逻辑
    res.json({
      success: true,
      message: 'Data created successfully',
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
})

export default router
EOF

echo_success "后端路由创建完成"
echo ""

# ============================================================================
# 创建数据库表SQL
# ============================================================================
echo_info "[步骤 5] 创建数据库表SQL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cat > "$MODULE_DIR/database/${SNAKE_CASE}_tables.sql" << EOF
-- ============================================================================
-- $PASCAL_CASE 模块 - 数据库表
-- ============================================================================

-- 连接到PostgreSQL总系统
\c postgres

-- 主数据表
CREATE TABLE IF NOT EXISTS \${PROJECT_PREFIX}${SNAKE_CASE}_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    title VARCHAR(255),
    content TEXT,
    data JSONB,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_${SNAKE_CASE}_status CHECK (status IN ('active', 'inactive', 'archived'))
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_${SNAKE_CASE}_user ON \${PROJECT_PREFIX}${SNAKE_CASE}_data(user_id);
CREATE INDEX IF NOT EXISTS idx_${SNAKE_CASE}_status ON \${PROJECT_PREFIX}${SNAKE_CASE}_data(status);
CREATE INDEX IF NOT EXISTS idx_${SNAKE_CASE}_created ON \${PROJECT_PREFIX}${SNAKE_CASE}_data(created_at);

-- 授予权限
GRANT ALL PRIVILEGES ON \${PROJECT_PREFIX}${SNAKE_CASE}_data TO \${SITE_USER};
GRANT USAGE ON SEQUENCE \${PROJECT_PREFIX}${SNAKE_CASE}_data_id_seq TO \${SITE_USER};

-- 完成提示
DO \$\$
BEGIN
    RAISE NOTICE '✅ $PASCAL_CASE 模块表创建完成';
    RAISE NOTICE '   表名: \${PROJECT_PREFIX}${SNAKE_CASE}_data';
END \$\$;
EOF

echo_success "数据库表SQL创建完成"
echo ""

# ============================================================================
# 创建README
# ============================================================================
echo_info "[步骤 6] 创建模块README"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cat > "$MODULE_DIR/README.md" << EOF
# $PASCAL_CASE 模块

## 功能描述

TODO: 描述模块功能

## 目录结构

\`\`\`
$MODULE_NAME/
├── frontend/
│   ├── pages/
│   │   └── ${PASCAL_CASE}Page.tsx    # 主页面
│   └── components/                    # 组件
├── backend/
│   ├── routes/
│   │   └── ${SNAKE_CASE}Routes.ts    # API路由
│   └── controllers/                   # 控制器
├── database/
│   └── ${SNAKE_CASE}_tables.sql      # 数据库表
├── module.config.ts                   # 模块配置
└── README.md                          # 说明文档
\`\`\`

## API端点

- \`GET /api/$MODULE_NAME/hello\` - 示例端点
- \`GET /api/$MODULE_NAME/data\` - 获取数据
- \`POST /api/$MODULE_NAME/data\` - 创建数据

## 数据库表

- \`\${PROJECT_PREFIX}${SNAKE_CASE}_data\` - 主数据表

## 开发指南

### 1. 修改模块配置

编辑 \`module.config.ts\`，配置路由、导航等信息。

### 2. 注册模块

在 \`template-config/module.registry.ts\` 中注册模块：

\`\`\`typescript
// 导入模块配置
import ${SNAKE_CASE}Config from '../modules/$MODULE_NAME/module.config'

// 添加到可用模块
static availableModules = new Map<string, ModuleConfig>([
  // ...其他模块
  ['$MODULE_NAME', ${SNAKE_CASE}Config],
])

// 激活模块
static activeModules: string[] = [
  // ...其他模块
  '$MODULE_NAME',
]
\`\`\`

### 3. 初始化数据库

\`\`\`bash
./scripts/init-postgres-tables.sh <site_id> <table_prefix>
\`\`\`

### 4. 开发前端

在 \`frontend/pages/${PASCAL_CASE}Page.tsx\` 中开发页面。

### 5. 开发后端

在 \`backend/routes/${SNAKE_CASE}Routes.ts\` 中开发API。

### 6. 部署

\`\`\`bash
./scripts/one-click-deploy.sh
\`\`\`

## TODO

- [ ] 完善功能描述
- [ ] 实现核心功能
- [ ] 添加单元测试
- [ ] 添加国际化翻译
- [ ] 更新文档

## 作者

TODO: 添加作者信息

## 许可证

MIT
EOF

echo_success "模块README创建完成"
echo ""

# ============================================================================
# 完成提示
# ============================================================================
echo ""
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║                   ✅ 模块创建成功！                           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

echo_info "模块目录: $MODULE_DIR"
echo ""

echo_info "已创建文件："
echo "  ✅ module.config.ts - 模块配置"
echo "  ✅ frontend/pages/${PASCAL_CASE}Page.tsx - 前端页面"
echo "  ✅ backend/routes/${SNAKE_CASE}Routes.ts - 后端路由"
echo "  ✅ database/${SNAKE_CASE}_tables.sql - 数据库表"
echo "  ✅ README.md - 模块文档"
echo ""

echo_info "后续步骤："
echo ""
echo "1. 注册模块（在 template-config/module.registry.ts）:"
echo -e "   ${BLUE}import ${SNAKE_CASE}Config from '../modules/$MODULE_NAME/module.config'${NC}"
echo -e "   ${BLUE}static availableModules = [..., ['$MODULE_NAME', ${SNAKE_CASE}Config]]${NC}"
echo -e "   ${BLUE}static activeModules = [..., '$MODULE_NAME']${NC}"
echo ""
echo "2. 初始化数据库:"
echo -e "   ${BLUE}./scripts/init-postgres-tables.sh <site_id> <table_prefix>${NC}"
echo ""
echo "3. 开发功能:"
echo -e "   ${BLUE}# 前端: $MODULE_DIR/frontend/pages/${PASCAL_CASE}Page.tsx${NC}"
echo -e "   ${BLUE}# 后端: $MODULE_DIR/backend/routes/${SNAKE_CASE}Routes.ts${NC}"
echo ""
echo "4. 部署:"
echo -e "   ${BLUE}./scripts/one-click-deploy.sh${NC}"
echo ""

echo -e "${GREEN}🎉 模块创建完成！开始开发吧！${NC}\n"

