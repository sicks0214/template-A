-- ============================================================================
-- ColorMagic 用户认证系统数据库结构
-- 接入PostgreSQL总系统 (postgres_master)
-- 创建时间: 2024-09-27
-- ============================================================================

-- 用户基础信息表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    display_name VARCHAR(100),
    
    -- 用户状态
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    email_verification_expires_at TIMESTAMP,
    
    -- 会员信息
    subscription_type VARCHAR(20) DEFAULT 'free' CHECK (subscription_type IN ('free', 'premium', 'vip')),
    subscription_expires_at TIMESTAMP,
    subscription_features JSONB DEFAULT '[]',
    
    -- 用户偏好设置
    preferences JSONB DEFAULT '{}',
    
    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    login_count INTEGER DEFAULT 0,
    
    -- 安全字段
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP
);

-- 用户会话管理表
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255),
    expires_at TIMESTAMP NOT NULL,
    refresh_expires_at TIMESTAMP NOT NULL,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户分析历史表
CREATE TABLE IF NOT EXISTS user_analysis_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    image_url VARCHAR(500),
    image_hash VARCHAR(64), -- 图片内容哈希，避免重复分析
    analysis_result JSONB NOT NULL,
    analysis_type VARCHAR(50) NOT NULL CHECK (analysis_type IN ('basic', 'advanced', 'ai_powered')),
    processing_time_ms INTEGER,
    is_public BOOLEAN DEFAULT false,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户收藏调色板表
CREATE TABLE IF NOT EXISTS user_favorite_palettes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    palette_name VARCHAR(100) NOT NULL,
    colors JSONB NOT NULL, -- 存储颜色数组 [{"hex": "#FF5733", "name": "Sunset Orange"}]
    source_type VARCHAR(20) DEFAULT 'manual' CHECK (source_type IN ('manual', 'extracted', 'ai_generated')),
    source_image_url VARCHAR(500),
    tags TEXT[],
    is_public BOOLEAN DEFAULT false,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户使用统计表
CREATE TABLE IF NOT EXISTS user_usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    analyses_count INTEGER DEFAULT 0,
    ai_analyses_count INTEGER DEFAULT 0,
    palettes_created INTEGER DEFAULT 0,
    palettes_shared INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, date)
);

-- ============================================================================
-- 索引创建
-- ============================================================================

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_subscription_type ON users(subscription_type);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at);

-- 会话表索引
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);

-- 分析历史表索引
CREATE INDEX IF NOT EXISTS idx_user_analysis_history_user_id ON user_analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analysis_history_created_at ON user_analysis_history(created_at);
CREATE INDEX IF NOT EXISTS idx_user_analysis_history_analysis_type ON user_analysis_history(analysis_type);
CREATE INDEX IF NOT EXISTS idx_user_analysis_history_image_hash ON user_analysis_history(image_hash);
CREATE INDEX IF NOT EXISTS idx_user_analysis_history_is_public ON user_analysis_history(is_public);

-- 收藏调色板表索引
CREATE INDEX IF NOT EXISTS idx_user_favorite_palettes_user_id ON user_favorite_palettes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_palettes_created_at ON user_favorite_palettes(created_at);
CREATE INDEX IF NOT EXISTS idx_user_favorite_palettes_is_public ON user_favorite_palettes(is_public);
CREATE INDEX IF NOT EXISTS idx_user_favorite_palettes_tags ON user_favorite_palettes USING GIN(tags);

-- 使用统计表索引
CREATE INDEX IF NOT EXISTS idx_user_usage_stats_user_id ON user_usage_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_stats_date ON user_usage_stats(date);

-- ============================================================================
-- 触发器：自动更新 updated_at 字段
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表创建触发器
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_favorite_palettes_updated_at 
    BEFORE UPDATE ON user_favorite_palettes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 初始数据和权限配置
-- ============================================================================

-- 创建用于ColorMagic的专用用户（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'colormagic_user') THEN
        CREATE USER colormagic_user WITH PASSWORD 'ColorMagic_VPS_2024_Secure_Pass';
    END IF;
END
$$;

-- 授予权限
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO colormagic_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO colormagic_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_analysis_history TO colormagic_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_favorite_palettes TO colormagic_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_usage_stats TO colormagic_user;

-- 授予序列权限
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO colormagic_user;

-- ============================================================================
-- 数据清理和维护函数
-- ============================================================================

-- 清理过期会话
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions 
    WHERE expires_at < CURRENT_TIMESTAMP 
       OR (refresh_expires_at < CURRENT_TIMESTAMP AND is_active = false);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 用户统计更新函数
CREATE OR REPLACE FUNCTION update_user_daily_stats(
    p_user_id UUID,
    p_analysis_type VARCHAR DEFAULT 'basic'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_usage_stats (user_id, date, analyses_count, ai_analyses_count)
    VALUES (
        p_user_id, 
        CURRENT_DATE, 
        CASE WHEN p_analysis_type != 'ai_powered' THEN 1 ELSE 0 END,
        CASE WHEN p_analysis_type = 'ai_powered' THEN 1 ELSE 0 END
    )
    ON CONFLICT (user_id, date) 
    DO UPDATE SET 
        analyses_count = user_usage_stats.analyses_count + CASE WHEN p_analysis_type != 'ai_powered' THEN 1 ELSE 0 END,
        ai_analyses_count = user_usage_stats.ai_analyses_count + CASE WHEN p_analysis_type = 'ai_powered' THEN 1 ELSE 0 END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 示例查询和管理命令
-- ============================================================================

-- 查看用户统计
/*
SELECT 
    u.username,
    u.email,
    u.subscription_type,
    u.created_at,
    u.last_login_at,
    u.login_count,
    COUNT(h.id) as analysis_count,
    COUNT(f.id) as favorite_count
FROM users u
LEFT JOIN user_analysis_history h ON u.id = h.user_id
LEFT JOIN user_favorite_palettes f ON u.id = f.user_id
WHERE u.status = 'active'
GROUP BY u.id, u.username, u.email, u.subscription_type, u.created_at, u.last_login_at, u.login_count
ORDER BY u.created_at DESC;
*/

-- 清理过期会话（建议定期执行）
/*
SELECT cleanup_expired_sessions();
*/

-- 查看活跃用户统计
/*
SELECT 
    DATE(last_login_at) as login_date,
    COUNT(*) as active_users
FROM users 
WHERE last_login_at >= CURRENT_DATE - INTERVAL '30 days'
  AND status = 'active'
GROUP BY DATE(last_login_at)
ORDER BY login_date DESC;
*/

COMMENT ON TABLE users IS 'ColorMagic用户基础信息表';
COMMENT ON TABLE user_sessions IS 'ColorMagic用户会话管理表';
COMMENT ON TABLE user_analysis_history IS 'ColorMagic用户分析历史记录表';
COMMENT ON TABLE user_favorite_palettes IS 'ColorMagic用户收藏调色板表';
COMMENT ON TABLE user_usage_stats IS 'ColorMagic用户使用统计表';
