-- ColorMagic VPS PostgreSQL总系统集成脚本
-- 在现有的PostgreSQL总系统中为ColorMagic创建专用表和用户

-- 设置时区
SET timezone = 'America/New_York';

-- 检查是否已存在ColorMagic用户
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_user WHERE usename = 'colormagic_user') THEN
        -- 创建ColorMagic专用用户
        CREATE USER colormagic_user WITH ENCRYPTED PASSWORD 'ColorMagic_VPS_2024_Secure_Pass';
        RAISE NOTICE '✅ 创建用户: colormagic_user';
    ELSE
        RAISE NOTICE 'ℹ️ 用户已存在: colormagic_user';
    END IF;
END $$;

-- 检查unified_feedback表是否存在，如不存在则创建
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

-- 创建unified_feedback表索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_feedback_site_id ON unified_feedback(site_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON unified_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_processed ON unified_feedback(processed);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON unified_feedback(category);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON unified_feedback(rating);

-- 授予unified_feedback表权限给ColorMagic用户
GRANT SELECT, INSERT, UPDATE ON unified_feedback TO colormagic_user;
GRANT USAGE ON SEQUENCE unified_feedback_id_seq TO colormagic_user;

-- ColorMagic专用表：颜色分析历史
CREATE TABLE IF NOT EXISTS colormagic_analysis_history (
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
    algorithm VARCHAR(50) DEFAULT 'production',
    user_ip VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束条件
    CONSTRAINT chk_colormagic_processing_time CHECK (processing_time_ms >= 0),
    CONSTRAINT chk_colormagic_image_dimensions CHECK (
        original_width > 0 AND original_height > 0 AND
        processed_width > 0 AND processed_height > 0
    )
);

-- 创建颜色分析索引
CREATE INDEX IF NOT EXISTS idx_colormagic_analysis_created_at ON colormagic_analysis_history(created_at);
CREATE INDEX IF NOT EXISTS idx_colormagic_analysis_algorithm ON colormagic_analysis_history(algorithm);
CREATE INDEX IF NOT EXISTS idx_colormagic_analysis_processing_time ON colormagic_analysis_history(processing_time_ms);
CREATE INDEX IF NOT EXISTS idx_colormagic_analysis_user_ip ON colormagic_analysis_history(user_ip);

-- ColorMagic专用表：调色板导出历史
CREATE TABLE IF NOT EXISTS colormagic_export_history (
    id SERIAL PRIMARY KEY,
    analysis_id VARCHAR(100) REFERENCES colormagic_analysis_history(analysis_id),
    export_format VARCHAR(20) NOT NULL,
    color_count INTEGER NOT NULL,
    file_size_bytes INTEGER,
    user_ip VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束条件
    CONSTRAINT chk_colormagic_export_format CHECK (export_format IN ('css', 'json', 'scss', 'adobe', 'txt')),
    CONSTRAINT chk_colormagic_color_count CHECK (color_count > 0 AND color_count <= 20)
);

-- 创建导出历史索引
CREATE INDEX IF NOT EXISTS idx_colormagic_export_created_at ON colormagic_export_history(created_at);
CREATE INDEX IF NOT EXISTS idx_colormagic_export_format ON colormagic_export_history(export_format);
CREATE INDEX IF NOT EXISTS idx_colormagic_export_user_ip ON colormagic_export_history(user_ip);

-- 授予ColorMagic专用表完整权限
GRANT ALL PRIVILEGES ON colormagic_analysis_history TO colormagic_user;
GRANT USAGE ON SEQUENCE colormagic_analysis_history_id_seq TO colormagic_user;

GRANT ALL PRIVILEGES ON colormagic_export_history TO colormagic_user;
GRANT USAGE ON SEQUENCE colormagic_export_history_id_seq TO colormagic_user;

-- 创建视图：ColorMagic颜色分析统计
CREATE OR REPLACE VIEW colormagic_analysis_stats AS
SELECT 
    DATE(created_at) as analysis_date,
    COUNT(*) as total_analyses,
    AVG(processing_time_ms) as avg_processing_time_ms,
    COUNT(DISTINCT user_ip) as unique_users,
    algorithm,
    COUNT(CASE WHEN processing_time_ms < 1000 THEN 1 END) as fast_analyses,
    COUNT(CASE WHEN processing_time_ms >= 1000 AND processing_time_ms < 3000 THEN 1 END) as normal_analyses,
    COUNT(CASE WHEN processing_time_ms >= 3000 THEN 1 END) as slow_analyses
FROM colormagic_analysis_history 
GROUP BY DATE(created_at), algorithm
ORDER BY analysis_date DESC;

-- 授予视图权限
GRANT SELECT ON colormagic_analysis_stats TO colormagic_user;

-- 创建函数：获取ColorMagic热门颜色
CREATE OR REPLACE FUNCTION get_colormagic_popular_colors(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(hex_color VARCHAR, color_name VARCHAR, usage_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (jsonb_array_elements(extracted_colors)->>'hex')::VARCHAR as hex_color,
        (jsonb_array_elements(extracted_colors)->>'name')::VARCHAR as color_name,
        COUNT(*) as usage_count
    FROM colormagic_analysis_history 
    WHERE extracted_colors IS NOT NULL
    GROUP BY hex_color, color_name
    ORDER BY usage_count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 授予函数执行权限
GRANT EXECUTE ON FUNCTION get_colormagic_popular_colors TO colormagic_user;

-- 创建函数：获取ColorMagic系统统计
CREATE OR REPLACE FUNCTION get_colormagic_system_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalAnalyses', (SELECT COUNT(*) FROM colormagic_analysis_history),
        'totalFeedbacks', (SELECT COUNT(*) FROM unified_feedback WHERE site_id = 'colormagic'),
        'totalExports', (SELECT COUNT(*) FROM colormagic_export_history),
        'avgProcessingTime', (SELECT AVG(processing_time_ms)/1000 FROM colormagic_analysis_history),
        'uniqueUsers', (SELECT COUNT(DISTINCT user_ip) FROM colormagic_analysis_history WHERE created_at >= NOW() - INTERVAL '30 days'),
        'lastAnalysis', (SELECT created_at FROM colormagic_analysis_history ORDER BY created_at DESC LIMIT 1),
        'popularFormats', (
            SELECT json_agg(json_build_object('format', export_format, 'count', format_count))
            FROM (
                SELECT export_format, COUNT(*) as format_count 
                FROM colormagic_export_history 
                GROUP BY export_format 
                ORDER BY format_count DESC 
                LIMIT 5
            ) as formats
        ),
        'performanceStats', json_build_object(
            'fastAnalyses', (SELECT COUNT(*) FROM colormagic_analysis_history WHERE processing_time_ms < 1000),
            'normalAnalyses', (SELECT COUNT(*) FROM colormagic_analysis_history WHERE processing_time_ms BETWEEN 1000 AND 3000),
            'slowAnalyses', (SELECT COUNT(*) FROM colormagic_analysis_history WHERE processing_time_ms > 3000)
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 授予函数执行权限
GRANT EXECUTE ON FUNCTION get_colormagic_system_stats TO colormagic_user;

-- 插入初始化记录
INSERT INTO unified_feedback (site_id, content, category, processed) 
VALUES ('colormagic', 'ColorMagic VPS集成完成 - 数据库初始化', 'system', true)
ON CONFLICT DO NOTHING;

-- 创建定期清理函数（可选）
CREATE OR REPLACE FUNCTION cleanup_colormagic_old_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- 删除90天前的分析记录（保留最近的数据）
    DELETE FROM colormagic_analysis_history 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- 删除对应的导出记录
    DELETE FROM colormagic_export_history 
    WHERE analysis_id NOT IN (SELECT analysis_id FROM colormagic_analysis_history);
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 授予清理函数权限
GRANT EXECUTE ON FUNCTION cleanup_colormagic_old_data TO colormagic_user;

-- 显示集成完成信息
DO $$
DECLARE
    user_count INTEGER;
    table_count INTEGER;
    function_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM pg_user WHERE usename = 'colormagic_user';
    
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_name IN ('unified_feedback', 'colormagic_analysis_history', 'colormagic_export_history');
    
    SELECT COUNT(*) INTO function_count 
    FROM information_schema.routines 
    WHERE routine_name LIKE '%colormagic%';
    
    RAISE NOTICE '=== ColorMagic VPS PostgreSQL集成完成 ===';
    RAISE NOTICE '数据库: postgres';
    RAISE NOTICE '用户数: %', user_count;
    RAISE NOTICE '表数: %', table_count;
    RAISE NOTICE '函数数: %', function_count;
    RAISE NOTICE '集成时间: %', NOW();
    RAISE NOTICE '时区: %', current_setting('timezone');
    RAISE NOTICE '';
    RAISE NOTICE '📊 已创建的表:';
    RAISE NOTICE '   - unified_feedback (多站点共享)';
    RAISE NOTICE '   - colormagic_analysis_history';
    RAISE NOTICE '   - colormagic_export_history';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 已创建的视图:';
    RAISE NOTICE '   - colormagic_analysis_stats';
    RAISE NOTICE '';
    RAISE NOTICE '⚙️ 已创建的函数:';
    RAISE NOTICE '   - get_colormagic_popular_colors()';
    RAISE NOTICE '   - get_colormagic_system_stats()';
    RAISE NOTICE '   - cleanup_colormagic_old_data()';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 用户权限:';
    RAISE NOTICE '   - colormagic_user: 完整的ColorMagic表权限';
    RAISE NOTICE '   - colormagic_user: unified_feedback表读写权限';
    RAISE NOTICE '==========================================';
END $$;
