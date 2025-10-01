-- ColorMagic 本地PostgreSQL初始化脚本
-- 模拟VPS总系统的unified_feedback表和ColorMagic专用表

-- 设置时区
SET timezone = 'America/New_York';

-- 创建统一反馈表（模拟VPS总系统）
CREATE TABLE IF NOT EXISTS unified_feedback (
    id SERIAL PRIMARY KEY,
    site_id VARCHAR(20) NOT NULL DEFAULT 'colormagic',
    content TEXT NOT NULL,
    contact VARCHAR(255),
    user_ip VARCHAR(45), 
    user_agent TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT FALSE,
    priority INTEGER DEFAULT 1,
    
    -- 约束条件
    CONSTRAINT chk_content_length CHECK (LENGTH(content) >= 5),
    CONSTRAINT chk_site_id_format CHECK (site_id ~ '^[a-zA-Z][a-zA-Z0-9_]*$')
);

-- 创建索引提升性能
CREATE INDEX IF NOT EXISTS idx_feedback_site_id ON unified_feedback(site_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON unified_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_processed ON unified_feedback(processed);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON unified_feedback(category);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON unified_feedback(rating);

-- ColorMagic专用表：颜色分析历史
CREATE TABLE IF NOT EXISTS color_analysis_history (
    id SERIAL PRIMARY KEY,
    analysis_id VARCHAR(100) UNIQUE NOT NULL,
    image_name VARCHAR(255),
    image_size_bytes INTEGER,
    original_width INTEGER,
    original_height INTEGER,
    processed_width INTEGER,
    processed_height INTEGER,
    extracted_colors JSONB,
    dominant_colors JSONB,
    palette JSONB,
    metadata JSONB,
    processing_time_ms REAL,
    algorithm VARCHAR(50) DEFAULT 'mock',
    user_ip VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束条件
    CONSTRAINT chk_processing_time CHECK (processing_time_ms >= 0),
    CONSTRAINT chk_image_dimensions CHECK (
        original_width > 0 AND original_height > 0 AND
        processed_width > 0 AND processed_height > 0
    )
);

-- 创建颜色分析索引
CREATE INDEX IF NOT EXISTS idx_analysis_created_at ON color_analysis_history(created_at);
CREATE INDEX IF NOT EXISTS idx_analysis_algorithm ON color_analysis_history(algorithm);
CREATE INDEX IF NOT EXISTS idx_analysis_processing_time ON color_analysis_history(processing_time_ms);

-- ColorMagic专用表：调色板导出历史
CREATE TABLE IF NOT EXISTS palette_export_history (
    id SERIAL PRIMARY KEY,
    analysis_id VARCHAR(100) REFERENCES color_analysis_history(analysis_id),
    export_format VARCHAR(20) NOT NULL,
    color_count INTEGER NOT NULL,
    file_size_bytes INTEGER,
    user_ip VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束条件
    CONSTRAINT chk_export_format CHECK (export_format IN ('css', 'json', 'scss', 'adobe', 'txt')),
    CONSTRAINT chk_color_count CHECK (color_count > 0 AND color_count <= 20)
);

-- 创建导出历史索引
CREATE INDEX IF NOT EXISTS idx_export_created_at ON palette_export_history(created_at);
CREATE INDEX IF NOT EXISTS idx_export_format ON palette_export_history(export_format);

-- 创建ColorMagic专用用户（模拟VPS用户权限）
CREATE USER colormagic_user WITH ENCRYPTED PASSWORD 'colormagic_pass';

-- 授予unified_feedback表权限（模拟VPS总系统权限）
GRANT SELECT, INSERT, UPDATE ON unified_feedback TO colormagic_user;
GRANT USAGE ON SEQUENCE unified_feedback_id_seq TO colormagic_user;

-- 授予ColorMagic专用表完整权限
GRANT ALL PRIVILEGES ON color_analysis_history TO colormagic_user;
GRANT USAGE ON SEQUENCE color_analysis_history_id_seq TO colormagic_user;

GRANT ALL PRIVILEGES ON palette_export_history TO colormagic_user;
GRANT USAGE ON SEQUENCE palette_export_history_id_seq TO colormagic_user;

-- 创建视图：颜色分析统计
CREATE OR REPLACE VIEW color_analysis_stats AS
SELECT 
    DATE(created_at) as analysis_date,
    COUNT(*) as total_analyses,
    AVG(processing_time_ms) as avg_processing_time,
    COUNT(DISTINCT user_ip) as unique_users,
    algorithm
FROM color_analysis_history 
GROUP BY DATE(created_at), algorithm
ORDER BY analysis_date DESC;

-- 授予视图权限
GRANT SELECT ON color_analysis_stats TO colormagic_user;

-- 创建函数：获取热门颜色
CREATE OR REPLACE FUNCTION get_popular_colors(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(hex_color VARCHAR, color_name VARCHAR, usage_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (jsonb_array_elements(extracted_colors)->>'hex')::VARCHAR as hex_color,
        (jsonb_array_elements(extracted_colors)->>'name')::VARCHAR as color_name,
        COUNT(*) as usage_count
    FROM color_analysis_history 
    WHERE extracted_colors IS NOT NULL
    GROUP BY hex_color, color_name
    ORDER BY usage_count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 授予函数执行权限
GRANT EXECUTE ON FUNCTION get_popular_colors TO colormagic_user;

-- 插入初始化日志
INSERT INTO unified_feedback (site_id, content, category, processed) 
VALUES ('colormagic', 'ColorMagic数据库初始化完成', 'system', true);

-- 显示初始化完成信息
DO $$
BEGIN
    RAISE NOTICE '=== ColorMagic PostgreSQL 初始化完成 ===';
    RAISE NOTICE '数据库: postgres';
    RAISE NOTICE '用户: colormagic_user';
    RAISE NOTICE '表: unified_feedback, color_analysis_history, palette_export_history';
    RAISE NOTICE '视图: color_analysis_stats';
    RAISE NOTICE '函数: get_popular_colors()';
    RAISE NOTICE '时区: %', current_setting('timezone');
    RAISE NOTICE '========================================';
END $$;
