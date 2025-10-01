-- ============================================================================
-- 通用站点PostgreSQL总系统集成脚本模板
-- 
-- 使用说明：
-- 1. 替换 ${SITE_ID} 为实际站点ID (site1, site2, ..., site20)
-- 2. 替换 ${SITE_USER} 为站点用户名 (site1_user, site2_user, ...)
-- 3. 替换 ${SITE_PASS} 为站点密码（使用强密码）
-- 4. 替换 ${TIMEZONE} 为时区 (如：America/New_York, Asia/Shanghai)
-- 5. 具体项目表将由init-postgres-tables.sh脚本创建
-- ============================================================================

-- 设置时区
SET timezone = '${TIMEZONE}';

-- ============================================================================
-- Step 1: 创建站点用户
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_user WHERE usename = '${SITE_USER}') THEN
        -- 创建站点专用用户
        CREATE USER ${SITE_USER} WITH ENCRYPTED PASSWORD '${SITE_PASS}';
        RAISE NOTICE '✅ 创建用户: ${SITE_USER}';
    ELSE
        RAISE NOTICE 'ℹ️ 用户已存在: ${SITE_USER}';
    END IF;
END $$;

-- ============================================================================
-- Step 2: 确保unified_feedback表存在（多站点共享）
-- ============================================================================
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
    
    -- 约束条件
    CONSTRAINT chk_feedback_type CHECK (type IN ('bug', 'feature', 'suggestion', 'other')),
    CONSTRAINT chk_feedback_status CHECK (status IN ('pending', 'reviewed', 'resolved', 'archived')),
    CONSTRAINT chk_feedback_content_length CHECK (LENGTH(content) >= 5)
);

-- 创建unified_feedback表索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_unified_feedback_site ON unified_feedback(site_id);
CREATE INDEX IF NOT EXISTS idx_unified_feedback_created ON unified_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_unified_feedback_status ON unified_feedback(status);
CREATE INDEX IF NOT EXISTS idx_unified_feedback_type ON unified_feedback(type);

-- ============================================================================
-- Step 3: 授予unified_feedback表权限
-- ============================================================================
GRANT SELECT, INSERT, UPDATE ON unified_feedback TO ${SITE_USER};
GRANT USAGE ON SEQUENCE unified_feedback_id_seq TO ${SITE_USER};

-- ============================================================================
-- Step 4: 插入初始化记录
-- ============================================================================
INSERT INTO unified_feedback (site_id, type, content, status) 
VALUES ('${SITE_ID}', 'other', '${SITE_ID} PostgreSQL集成完成 - 数据库初始化', 'archived')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Step 5: 显示集成完成信息
-- ============================================================================
DO $$
DECLARE
    user_count INTEGER;
    feedback_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM pg_user WHERE usename = '${SITE_USER}';
    SELECT COUNT(*) INTO feedback_count FROM unified_feedback WHERE site_id = '${SITE_ID}';
    
    RAISE NOTICE '=== ${SITE_ID} PostgreSQL集成完成 ===';
    RAISE NOTICE '数据库: postgres';
    RAISE NOTICE '用户: ${SITE_USER}';
    RAISE NOTICE '用户状态: %', CASE WHEN user_count > 0 THEN '已创建' ELSE '创建失败' END;
    RAISE NOTICE '反馈记录数: %', feedback_count;
    RAISE NOTICE '集成时间: %', NOW();
    RAISE NOTICE '时区: %', current_setting('timezone');
    RAISE NOTICE '';
    RAISE NOTICE '📊 已配置的表:';
    RAISE NOTICE '   - unified_feedback (多站点共享，通过site_id区分)';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 用户权限:';
    RAISE NOTICE '   - ${SITE_USER}: unified_feedback表读写权限';
    RAISE NOTICE '   - ${SITE_USER}: 项目专用表权限将由init-postgres-tables.sh脚本授予';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ 后续步骤:';
    RAISE NOTICE '   1. 运行 ./scripts/init-postgres-tables.sh ${SITE_ID} <table_prefix>';
    RAISE NOTICE '   2. 配置 backend/.env 文件';
    RAISE NOTICE '   3. 运行 ./scripts/one-click-deploy.sh 部署应用';
    RAISE NOTICE '==========================================';
END $$;

