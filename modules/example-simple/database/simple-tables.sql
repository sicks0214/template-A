-- ============================================================================
-- 简单示例模块 - 数据库表
-- ============================================================================
-- 
-- 表命名规则：
-- - 使用项目表前缀：${PROJECT_PREFIX}
-- - 示例：如果项目前缀是 myproject_，则实际表名为 myproject_simple_data
--
-- 权限：
-- - 站点用户（${SITE_USER}）拥有完整权限
--
-- 使用方法：
-- 1. 在执行脚本时，${PROJECT_PREFIX} 和 ${SITE_USER} 会被替换为实际值
-- 2. 或者手动替换后执行
-- ============================================================================

-- 连接到PostgreSQL总系统
\c postgres

-- ============================================================================
-- 表1：简单数据表
-- ============================================================================
CREATE TABLE IF NOT EXISTS ${PROJECT_PREFIX}simple_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    data JSONB,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束
    CONSTRAINT chk_simple_data_status CHECK (status IN ('active', 'inactive', 'archived'))
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_simple_data_user ON ${PROJECT_PREFIX}simple_data(user_id);
CREATE INDEX IF NOT EXISTS idx_simple_data_status ON ${PROJECT_PREFIX}simple_data(status);
CREATE INDEX IF NOT EXISTS idx_simple_data_created ON ${PROJECT_PREFIX}simple_data(created_at);

-- 授予权限
GRANT ALL PRIVILEGES ON ${PROJECT_PREFIX}simple_data TO ${SITE_USER};
GRANT USAGE ON SEQUENCE ${PROJECT_PREFIX}simple_data_id_seq TO ${SITE_USER};

-- ============================================================================
-- 表2：设置表
-- ============================================================================
CREATE TABLE IF NOT EXISTS ${PROJECT_PREFIX}simple_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    type VARCHAR(20) DEFAULT 'string',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束
    CONSTRAINT chk_simple_settings_type CHECK (type IN ('string', 'number', 'boolean', 'json'))
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_simple_settings_key ON ${PROJECT_PREFIX}simple_settings(key);

-- 授予权限
GRANT ALL PRIVILEGES ON ${PROJECT_PREFIX}simple_settings TO ${SITE_USER};
GRANT USAGE ON SEQUENCE ${PROJECT_PREFIX}simple_settings_id_seq TO ${SITE_USER};

-- ============================================================================
-- 插入示例数据（可选）
-- ============================================================================
INSERT INTO ${PROJECT_PREFIX}simple_settings (key, value, type, description)
VALUES 
    ('module_enabled', 'true', 'boolean', '模块是否启用'),
    ('max_items', '100', 'number', '最大项目数'),
    ('welcome_message', 'Welcome to Simple Module!', 'string', '欢迎消息')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 创建视图（可选）
-- ============================================================================
CREATE OR REPLACE VIEW ${PROJECT_PREFIX}simple_stats AS
SELECT 
    COUNT(*) as total_items,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_items,
    COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_items,
    COUNT(DISTINCT user_id) as unique_users,
    MAX(created_at) as last_created
FROM ${PROJECT_PREFIX}simple_data;

-- 授予视图权限
GRANT SELECT ON ${PROJECT_PREFIX}simple_stats TO ${SITE_USER};

-- ============================================================================
-- 完成提示
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '=== 简单示例模块 - 数据库表创建完成 ===';
    RAISE NOTICE '表前缀: ${PROJECT_PREFIX}';
    RAISE NOTICE '已创建表:';
    RAISE NOTICE '  - ${PROJECT_PREFIX}simple_data';
    RAISE NOTICE '  - ${PROJECT_PREFIX}simple_settings';
    RAISE NOTICE '已创建视图:';
    RAISE NOTICE '  - ${PROJECT_PREFIX}simple_stats';
    RAISE NOTICE '已授予权限给: ${SITE_USER}';
    RAISE NOTICE '==========================================';
END $$;

