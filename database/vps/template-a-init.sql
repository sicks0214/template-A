-- ============================================
-- Template A - PostgreSQL总系统初始化脚本
-- ============================================
-- 
-- 使用说明：
-- 1. 修改下面的站点配置变量
-- 2. 在VPS的postgres_master容器中执行此脚本
-- 3. 执行命令：docker exec -i postgres_master psql -U admin -d postgres < template-a-init.sql
--
-- ============================================

-- ========================================
-- 配置变量（修改这里）
-- ========================================
\set site_id 'siteN'
\set site_user 'siteN_user'
\set site_password '''siteN_prod_pass_2024'''
\set table_prefix 'myproject_'

-- ========================================
-- 1. 创建站点用户
-- ========================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = :'site_user') THEN
        EXECUTE format('CREATE USER %I WITH PASSWORD %s', :'site_user', :'site_password');
        RAISE NOTICE '✅ 用户已创建: %', :'site_user';
    ELSE
        RAISE NOTICE '⚠️ 用户已存在: %', :'site_user';
    END IF;
END
$$;

-- ========================================
-- 2. 创建核心认证表
-- ========================================

-- 用户表
CREATE TABLE IF NOT EXISTS :table_prefix_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'user',
    subscription_type VARCHAR(20) DEFAULT 'free',
    status VARCHAR(20) DEFAULT 'active',
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 刷新令牌表
CREATE TABLE IF NOT EXISTS :table_prefix_refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES :table_prefix_users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(50),
    user_agent TEXT
);

-- ========================================
-- 3. 创建业务数据表
-- ========================================

-- 分析历史表
CREATE TABLE IF NOT EXISTS :table_prefix_analysis_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES :table_prefix_users(id) ON DELETE SET NULL,
    analysis_id VARCHAR(100) UNIQUE NOT NULL,
    analysis_type VARCHAR(50) DEFAULT 'general',
    analysis_result JSONB NOT NULL,
    image_name VARCHAR(255),
    image_size_bytes INTEGER,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 调色板表
CREATE TABLE IF NOT EXISTS :table_prefix_palettes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES :table_prefix_users(id) ON DELETE CASCADE,
    palette_name VARCHAR(100) NOT NULL,
    colors JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 使用统计表
CREATE TABLE IF NOT EXISTS :table_prefix_usage_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES :table_prefix_users(id) ON DELETE SET NULL,
    stat_date DATE NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_count INTEGER DEFAULT 1,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, stat_date, action_type)
);

-- ========================================
-- 4. 创建示例模块表
-- ========================================

-- 简单数据表
CREATE TABLE IF NOT EXISTS :table_prefix_simple_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES :table_prefix_users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    status VARCHAR(20) DEFAULT 'active',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 简单设置表
CREATE TABLE IF NOT EXISTS :table_prefix_simple_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES :table_prefix_users(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, setting_key)
);

-- ========================================
-- 5. 创建索引
-- ========================================

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_email ON :table_prefix_users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON :table_prefix_users(username);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON :table_prefix_users(created_at DESC);

-- 刷新令牌索引
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON :table_prefix_refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON :table_prefix_refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON :table_prefix_refresh_tokens(expires_at);

-- 分析历史索引
CREATE INDEX IF NOT EXISTS idx_analysis_user_id ON :table_prefix_analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_created_at ON :table_prefix_analysis_history(created_at DESC);

-- 调色板索引
CREATE INDEX IF NOT EXISTS idx_palettes_user_id ON :table_prefix_palettes(user_id);
CREATE INDEX IF NOT EXISTS idx_palettes_is_public ON :table_prefix_palettes(is_public);

-- ========================================
-- 6. 授予权限
-- ========================================

-- 授予所有表的权限
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT tablename FROM pg_tables 
        WHERE tablename LIKE :'table_prefix' || '%'
    LOOP
        EXECUTE format('GRANT ALL PRIVILEGES ON TABLE %I TO %I', table_name, :'site_user');
        EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %I TO %I', table_name || '_id_seq', :'site_user');
        RAISE NOTICE '✅ 已授权表: %', table_name;
    END LOOP;
END
$$;

-- 授予unified_feedback表的权限（共享表）
GRANT SELECT, INSERT, UPDATE ON unified_feedback TO :site_user;

-- ========================================
-- 7. 验证配置
-- ========================================

-- 显示创建的表
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE tablename LIKE :'table_prefix' || '%'
ORDER BY tablename;

-- 显示用户权限
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.table_privileges 
WHERE grantee = :'site_user' 
    AND table_name LIKE :'table_prefix' || '%'
ORDER BY table_name, privilege_type;

-- 完成提示
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '╔═══════════════════════════════════════════════════════╗';
    RAISE NOTICE '║     ✅ Template A 数据库初始化完成！                  ║';
    RAISE NOTICE '╚═══════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
    RAISE NOTICE '站点信息:';
    RAISE NOTICE '  - 站点ID: %', :'site_id';
    RAISE NOTICE '  - 数据库用户: %', :'site_user';
    RAISE NOTICE '  - 表前缀: %', :'table_prefix';
    RAISE NOTICE '';
    RAISE NOTICE '下一步：';
    RAISE NOTICE '  1. 更新应用的 .env 文件';
    RAISE NOTICE '  2. 配置 DB_USER=%', :'site_user';
    RAISE NOTICE '  3. 配置 TABLE_PREFIX=%', :'table_prefix';
    RAISE NOTICE '  4. 配置 SITE_ID=%', :'site_id';
    RAISE NOTICE '  5. 运行一键部署脚本';
END
$$;

