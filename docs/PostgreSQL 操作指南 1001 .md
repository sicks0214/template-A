## VPS 上 PostgreSQL（单实例）管理 20 个站点 - 操作指南

本指南适用于已按本文档部署的环境：
- 容器名：`fb1d223e9d77_postgres_master` (网络别名: `postgres_master`)
- Postgres 版本：`15.14`
- 管理员：`admin`
- 管理员密码：`supersecret`
- 端口映射：宿主机 `5432 -> 5432`
- Compose 文件目录：`/docker/db_master`
- Docker 网络：`shared_net`

### 🔐 Site4 (ColorMagic) 数据库凭据
- **ColorMagic专用用户**：`colormagic_user`
- **密码**：`ColorMagic_VPS_2024_Secure_Pass`
- **数据库**：`postgres` (使用主数据库)
- **连接测试**：`PGPASSWORD='ColorMagic_VPS_2024_Secure_Pass' docker compose exec -T postgres psql -U colormagic_user -d postgres -c "SELECT current_user;"`
- **专用表**：`colormagic_analysis_history`, `colormagic_export_history`
- **标准站点用户**：`site4_user` / `site4_pass` (备用方案)

### 🌐 Site4 (ColorMagic) CORS配置参考
- **主域名**：`https://imagecolorpicker.cc`
- **www子域名**：`https://www.imagecolorpicker.cc`
- **环境变量**：`ALLOWED_ORIGINS=https://imagecolorpicker.cc,https://www.imagecolorpicker.cc`
- **格式要求**：英文逗号分隔，无空格，无引号
- **验证方法**：`docker logs site4 | grep "允许的CORS源"`
- **常见问题**：www子域名被阻止 → 检查ALLOWED_ORIGINS是否包含www域名

所有命令均可直接复制粘贴在 VPS 终端执行。

---

## 🎯 核心功能：站点应用接入总系统指南

### ⚡ 重要说明
**本PostgreSQL总系统的核心目的是为所有站点应用提供统一的数据服务。各站点应用应该接入本总系统，而不是创建独立的数据库实例。**

---

## 🔧 实战验证：ColorMagic (site4) 完整接入流程

### ⚡ 预防式部署指南
**基于VPS实战经验的ColorMagic数据库接入标准流程，预防90%以上的常见问题。**

#### Step 1: PostgreSQL总系统状态验证（必须先执行）

```bash
# 快速自检PostgreSQL总系统状态
docker compose version
docker ps | grep postgres_master || true
docker logs postgres_master --tail=50 | cat || true

# 如果postgres_master容器不存在，启动PostgreSQL总系统
cd /docker/db_master && docker compose up -d

# 验证PostgreSQL连接（关键步骤）
cd /docker/db_master
docker compose exec postgres psql -U admin -d postgres -c "SELECT version();"

# 预期结果：显示PostgreSQL 15.x版本信息
```

#### Step 2: 基础站点配置验证

```bash
# 检查site4基础配置是否存在
cd /docker/db_master
docker compose exec postgres psql -U admin -d postgres -c "SELECT usename FROM pg_user WHERE usename = 'site4_user';"
docker compose exec postgres psql -U admin -d postgres -c "SELECT datname FROM pg_database WHERE datname = 'site4_db';"
docker compose exec postgres psql -U admin -d postgres -c "SELECT tablename FROM pg_tables WHERE tablename = 'unified_feedback';"

# 如果site4配置不存在，创建基础配置
docker compose exec postgres psql -U admin -d postgres <<EOF
CREATE DATABASE site4_db;
CREATE USER site4_user WITH ENCRYPTED PASSWORD 'site4_pass';
GRANT ALL PRIVILEGES ON DATABASE site4_db TO site4_user;
GRANT SELECT, INSERT, UPDATE ON unified_feedback TO site4_user;
GRANT USAGE ON SEQUENCE unified_feedback_id_seq TO site4_user;
EOF
```

#### Step 3: ColorMagic专用数据库集成

```bash
# 进入ColorMagic项目目录
cd /docker/site4

# 验证VPS集成脚本存在
ls -la database/vps/vps-integration.sql || echo "❌ 缺少VPS集成脚本"

# 运行ColorMagic VPS数据库集成脚本
cat database/vps/vps-integration.sql | docker compose -f /docker/db_master/docker-compose.yml exec -T postgres psql -U admin -d postgres

# 可选：运行用户认证架构
cat database/vps/user-auth-schema.sql | docker compose -f /docker/db_master/docker-compose.yml exec -T postgres psql -U admin -d postgres 2>/dev/null || echo "用户认证脚本不存在"

# 验证ColorMagic专用配置创建成功
cd /docker/db_master
docker compose exec postgres psql -U admin -d postgres -c "SELECT usename FROM pg_user WHERE usename = 'colormagic_user';"
docker compose exec postgres psql -U admin -d postgres -c "SELECT tablename FROM pg_tables WHERE tablename LIKE 'colormagic_%';"
docker compose exec postgres psql -U admin -d postgres -c "SELECT * FROM get_colormagic_system_stats();"

# 预期结果：
# - colormagic_user用户存在
# - colormagic_analysis_history、colormagic_export_history表存在
# - 系统统计函数返回JSON数据
```

#### Step 4: 网络配置验证

```bash
# 检查必需的Docker网络
docker network ls | grep -E "(shared_net|webproxy)"

# 创建缺失的网络（预防性创建）
docker network create webproxy || echo "webproxy网络已存在"
docker network create shared_net || echo "shared_net网络已存在"

# 预期结果：两个网络都应该存在
```

#### Step 5: ColorMagic应用环境配置

```bash
cd /docker/site4

# 创建标准化.env配置文件
cat > .env << 'EOF'
# 应用配置
NODE_ENV=production
PORT=3000
TZ=America/New_York

# 数据库配置（连接PostgreSQL总系统）
USE_DATABASE=true
DB_HOST=postgres_master
DB_USER=colormagic_user
DB_PASSWORD=ColorMagic_VPS_2024_Secure_Pass
DB_NAME=postgres
DB_PORT=5432
DB_SSL=false

# API配置（生产环境）
API_BASE_URL=https://imagecolorpicker.cc
FRONTEND_URL=https://imagecolorpicker.cc
ALLOWED_ORIGINS=https://imagecolorpicker.cc,https://www.imagecolorpicker.cc

# ⚠️ 重要：ALLOWED_ORIGINS支持多个域名（逗号分隔），包括主域名和www子域名
# 格式：域名1,域名2（英文逗号，无空格）

# 文件上传配置
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp

# 缓存和安全配置
ENABLE_REDIS=false
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
EOF

# 设置安全权限
chmod 600 .env

# 验证配置文件
echo "✅ .env文件已创建，内容："
cat .env | head -10
```

#### Step 6: TypeScript编译（如果使用TypeScript）

```bash
cd /docker/site4

# ⚠️ 重要：如果应用使用TypeScript，必须在部署前编译
# 检查是否需要编译
if [ -d "backend/src" ] && [ -f "backend/tsconfig.json" ]; then
    echo "检测到TypeScript项目，开始编译..."
    cd backend
    npm run build || echo "编译失败，请检查"
    
    # 验证编译结果
    echo "验证编译产物："
    ls -la dist/ | head -10
    
    # 验证CORS配置是否已编译
    grep -q "ALLOWED_ORIGINS" dist/index.js && echo "✅ CORS配置已编译" || echo "⚠️ CORS配置未找到"
    
    cd ..
else
    echo "非TypeScript项目，跳过编译步骤"
fi
```

#### Step 7: ColorMagic应用启动和验证

```bash
cd /docker/site4

# 启动ColorMagic应用
docker compose up -d

# 确保容器连接到shared_net网络（关键步骤）
docker network connect shared_net site4 2>/dev/null || echo "容器可能已连接"

# 验证部署状态
echo "=== 容器状态 ==="
docker compose ps

echo "=== 网络连接 ==="
docker inspect site4 | grep -A 10 "Networks" || echo "容器尚未启动"

# 等待应用启动
sleep 15

echo "=== 应用日志 ==="
docker logs site4 --tail=20

echo "=== 数据库连接测试 ==="
docker exec site4 nc -zv postgres_master 5432 || echo "网络连接测试"

echo "=== 健康检查 ==="
curl -f http://localhost:3000/health || echo "应用尚未就绪，需要等待或检查日志"

echo "=== CORS配置验证 ==="
docker logs site4 2>&1 | grep "允许的CORS源" | tail -1 || echo "未找到CORS配置日志"

echo "=== 验证多域名CORS支持 ==="
docker logs site4 2>&1 | grep "imagecolorpicker.cc" | head -5 || echo "CORS配置可能不完整"
```

### 🎯 预防性检查清单

#### 部署前必检项目：
- [ ] postgres_master容器正常运行
- [ ] PostgreSQL连接测试通过
- [ ] site4_user和site4_db已存在
- [ ] unified_feedback表已创建
- [ ] shared_net和webproxy网络已创建

#### ColorMagic专用检查：
- [ ] colormagic_user用户已创建
- [ ] colormagic_analysis_history表已创建
- [ ] colormagic_export_history表已创建
- [ ] get_colormagic_system_stats()函数正常工作
- [ ] .env文件配置正确（包含生产域名）
- [ ] ALLOWED_ORIGINS包含主域名和www子域名
- [ ] TypeScript代码已编译（如适用）
- [ ] 容器连接到shared_net网络
- [ ] CORS配置在容器日志中可见

#### 常见问题预防：
- **容器名称问题**：使用docker compose命令而非直接容器名
- **网络连接问题**：确保容器加入shared_net网络
- **权限问题**：验证colormagic_user权限正确配置
- **环境变量问题**：使用标准化.env模板，确保包含生产域名
- **CORS域名问题**：ALLOWED_ORIGINS必须包含主域名和www子域名（英文逗号分隔，无空格）
- **TypeScript编译问题**：部署前必须执行`npm run build`，验证dist/目录存在
- **Docker缓存问题**：修改代码后使用`--no-cache`重新构建，或在VPS上重新编译
- **启动顺序问题**：先确保PostgreSQL总系统运行

### 📊 验证成功标准

**PostgreSQL总系统集成成功的标志：**
1. `get_colormagic_system_stats()`返回完整JSON统计数据
2. ColorMagic应用健康检查通过：`curl http://localhost:3000/health`
3. 容器日志显示数据库连接成功
4. unified_feedback表可以正常插入site_id='site4'的记录

**CORS配置成功的标志：**
1. 容器日志显示：`🌐 允许的CORS源: ['https://imagecolorpicker.cc', 'https://www.imagecolorpicker.cc', ...]`
2. 主域名访问正常：`curl -I https://imagecolorpicker.cc` 返回 200 OK
3. www子域名访问正常：`curl -I https://www.imagecolorpicker.cc` 返回 200 OK
4. 浏览器控制台无CORS错误
5. 所有静态资源（JS/CSS）加载成功

---

## 1. 统一反馈系统接入（推荐方案）

### 1.1 为什么要接入总系统？

**资源对比**：
- ❌ **独立方案**：每个站点创建MySQL容器（20个站点 = 2-4GB内存）
- ✅ **总系统方案**：所有站点共享PostgreSQL（额外开销接近0）

**管理优势**：
- 统一备份策略
- 跨站点数据分析
- 集中监控管理
- 零额外资源消耗

### 1.2 创建统一反馈表

```bash
# 在PostgreSQL总系统中创建统一反馈表
docker exec -i postgres_master psql -U admin -d postgres <<'SQL'
CREATE TABLE IF NOT EXISTS unified_feedback (
    id SERIAL PRIMARY KEY,
    site_id VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    contact VARCHAR(255),
    user_ip VARCHAR(45), 
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT FALSE,
    priority INTEGER DEFAULT 1,
    
    -- 约束条件
    CONSTRAINT chk_content_length CHECK (LENGTH(content) >= 5),
    CONSTRAINT chk_site_id_format CHECK (site_id ~ '^site[0-9]+$')
);

-- 创建索引提升性能
CREATE INDEX idx_feedback_site_id ON unified_feedback(site_id);
CREATE INDEX idx_feedback_created_at ON unified_feedback(created_at);
CREATE INDEX idx_feedback_processed ON unified_feedback(processed);
SQL
```

### 1.3 配置站点权限

```bash
# 为所有站点用户授予反馈表权限
for i in {1..20}; do
docker exec -i postgres_master psql -U admin -d postgres <<EOF
GRANT SELECT, INSERT, UPDATE ON unified_feedback TO site${i}_user;
GRANT USAGE ON SEQUENCE unified_feedback_id_seq TO site${i}_user;
EOF
done
```

### 1.4 站点应用连接配置

#### 反馈系统连接字符串：
```bash
# 生成各站点的PostgreSQL连接配置
echo "=== 站点应用接入总系统连接配置 ==="
for i in {1..20}; do
  echo "site${i} 反馈系统: postgres://site${i}_user:site${i}_pass@postgres_master:5432/postgres"
done
```

#### 网络配置要求：
```bash
# 确保站点容器加入共享网络
# 各站点容器需要执行：
# docker network connect shared_net <站点容器名>

# 验证连通性测试命令：
# docker exec <站点容器名> nc -zv postgres_master 5432
```

### 1.5 应用层配置示例

#### Node.js应用配置：
```javascript
// 接入总系统的数据库配置示例
const dbConfig = {
  host: 'postgres_master',      // PostgreSQL总系统容器名
  user: 'site3_user',          // 对应站点用户（site1_user, site2_user等）
  password: 'site3_pass',      // 对应站点密码
  database: 'postgres',        // 使用主数据库
  port: 5432
};

// 反馈插入示例
const insertFeedback = async (content, contact, userIp, userAgent) => {
  const query = `
    INSERT INTO unified_feedback (site_id, content, contact, user_ip, user_agent) 
    VALUES ($1, $2, $3, $4, $5) 
    RETURNING id;
  `;
  const values = ['site3', content, contact, userIp, userAgent];  // site_id对应具体站点
  // 执行查询...
};
```

---

## 2. 统一数据管理与查询

### 2.1 查看所有站点反馈统计
```bash
docker exec -it postgres_master psql -U admin -d postgres -c "
SELECT 
    site_id as 站点,
    COUNT(*) as 总反馈数,
    COUNT(CASE WHEN contact IS NOT NULL THEN 1 END) as 有联系方式,
    COUNT(CASE WHEN processed = false THEN 1 END) as 待处理,
    MAX(created_at) as 最新反馈时间
FROM unified_feedback 
GROUP BY site_id 
ORDER BY 总反馈数 DESC;"
```

### 2.2 查看最新反馈
```bash
docker exec -it postgres_master psql -U admin -d postgres -c "
SELECT 
    site_id as 站点,
    LEFT(content, 50) as 反馈内容预览,
    contact as 联系方式,
    created_at as 提交时间
FROM unified_feedback 
ORDER BY created_at DESC 
LIMIT 10;"
```

### 2.3 反馈趋势分析
```bash
docker exec -it postgres_master psql -U admin -d postgres -c "
SELECT 
    DATE(created_at) as 日期,
    COUNT(*) as 当日反馈总数,
    COUNT(DISTINCT site_id) as 活跃站点数
FROM unified_feedback 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY 日期 DESC;"
```

### 2.4 创建统一监控脚本
```bash
# 创建反馈系统监控脚本
cat > /docker/db_master/check_unified_feedback.sh << 'EOF'
#!/bin/bash
echo "=== PostgreSQL总系统 - 统一反馈监控 $(date) ==="
docker exec -it postgres_master psql -U admin -d postgres -c "
SELECT 
    '总反馈数' as 指标,
    COUNT(*)::text as 数值
FROM unified_feedback
UNION ALL
SELECT 
    '今日反馈' as 指标,
    COUNT(*)::text as 数值
FROM unified_feedback 
WHERE created_at >= CURRENT_DATE
UNION ALL
SELECT 
    '待处理反馈' as 指标,
    COUNT(*)::text as 数值
FROM unified_feedback 
WHERE processed = false
UNION ALL
SELECT 
    '活跃站点数' as 指标,
    COUNT(DISTINCT site_id)::text as 数值
FROM unified_feedback 
WHERE created_at >= NOW() - INTERVAL '24 hours';"
EOF

chmod +x /docker/db_master/check_unified_feedback.sh

# 使用方法
echo "执行监控检查：/docker/db_master/check_unified_feedback.sh"
```

---

## 0. 快速自检（确保一切正常）
```bash
docker compose version
docker ps | grep postgres_master || true
docker logs postgres_master --tail=50 | cat || true
```

若 `docker ps` 看不到 `postgres_master`，执行"启动/停止/重启"中的启动命令。

---

## 3. 启动 / 停止 / 重启
```bash
# 启动（后台）
cd /docker/db_master && docker compose up -d

# 查看状态
docker ps | grep postgres_master

# 查看最近日志
docker logs postgres_master --tail=100 | cat

# 停止
cd /docker/db_master && docker compose down

# 重启
cd /docker/db_master && docker compose restart
```

---

## 4. 列出数据库 / 用户
```bash
# 列出所有数据库
docker exec -it postgres_master psql -U admin -d postgres -c '\l'

# 列出所有角色（用户）
docker exec -it postgres_master psql -U admin -d postgres -c '\du'
```

---

## 5. 生成 20 个站点的连接串（便于配置）
```bash
for i in {1..20}; do
  echo "site${i}: postgres://site${i}_user:site${i}_pass@127.0.0.1:5432/site${i}_db"
done
```

容器内的站点（已加入网络 `shared_net`）可使用主机名 `postgres_master`：
```bash
for i in {1..20}; do
  echo "site${i}: postgres://site${i}_user:site${i}_pass@postgres_master:5432/site${i}_db"
done
```

---

## 6. 批量创建 20 个站点（数据库与账号）

已创建过可跳过。若需要重新执行：
```bash
for i in {1..20}; do
docker exec -i postgres_master psql -U admin -d postgres <<EOF
CREATE DATABASE site${i}_db;
CREATE USER site${i}_user WITH ENCRYPTED PASSWORD 'site${i}_pass';
GRANT ALL PRIVILEGES ON DATABASE site${i}_db TO site${i}_user;
EOF
done
```

提示：如果某些已存在会报错，可忽略报错；或改成只为新编号执行，如 `for i in {21..25}; do ... done`。

---

## 7. 新增单个站点（示例：site21）
```bash
NUM=21
docker exec -i postgres_master psql -U admin -d postgres <<EOF
CREATE DATABASE site${NUM}_db;
CREATE USER site${NUM}_user WITH ENCRYPTED PASSWORD 'site${NUM}_pass';
GRANT ALL PRIVILEGES ON DATABASE site${NUM}_db TO site${NUM}_user;
EOF
```

---

## 8. 修改某站点密码（示例：site5）
```bash
docker exec -it postgres_master psql -U admin -d postgres -c "ALTER USER site5_user WITH PASSWORD 'New_Strong_Pass_5';"
```

---

## 9. 删除某站点（危险操作，数据库将被清空）
示例删除 `site7`：
```bash
docker exec -i postgres_master psql -U admin -d postgres <<'SQL'
REVOKE CONNECT ON DATABASE site7_db FROM PUBLIC;
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='site7_db';
DROP DATABASE IF EXISTS site7_db;
DROP USER IF EXISTS site7_user;
SQL
```

---

## 10. 备份与恢复

### 10.1 备份全部数据库（含角色、权限、反馈数据）
```bash
mkdir -p /docker/db_master/backups
# 全库备份（包含统一反馈系统数据）
docker exec postgres_master pg_dumpall -U admin | gzip > /docker/db_master/backups/all_$(date +%F_%H%M).sql.gz
ls -lh /docker/db_master/backups | tail -n +1
```

### 10.1.1 单独备份统一反馈数据
```bash
# 只备份反馈系统数据
docker exec postgres_master pg_dump -U admin -d postgres -t unified_feedback | gzip > /docker/db_master/backups/unified_feedback_$(date +%F_%H%M).sql.gz
```

### 10.2 备份单个站点数据库（示例：site3）
```bash
mkdir -p /docker/db_master/backups
docker exec postgres_master pg_dump -U site3_user -d site3_db -F c -f /tmp/site3_db.dump
docker cp postgres_master:/tmp/site3_db.dump /docker/db_master/backups/site3_db_$(date +%F_%H%M).dump
```

### 10.3 恢复全部（覆盖当前集群）
```bash
FILE=/docker/db_master/backups/all_latest.sql.gz   # 改成你的文件
gunzip -c "$FILE" | docker exec -i postgres_master psql -U admin -d postgres
```

### 10.4 恢复单个站点（示例：site3）
```bash
FILE=/docker/db_master/backups/site3_db_xxx.dump   # 改成你的文件
docker cp "$FILE" postgres_master:/tmp/site3_db.restore
docker exec -i postgres_master pg_restore -U admin -d site3_db --clean --if-exists /tmp/site3_db.restore
```

---

## 11. 常见排错

- Docker 命令报错 “Is the docker daemon running?”
  ```bash
  systemctl enable --now docker || true
  systemctl status docker | cat || true
  ```

- `docker compose up -d` 报端口占用（5432）：
  1) 编辑 `/docker/db_master/docker-compose.yml`，将 `ports` 修改为 `"15432:5432"`。
  2) 重新启动：
  ```bash
  cd /docker/db_master && docker compose up -d
  ```

- 查看容器日志：
  ```bash
  docker logs -f postgres_master
  ```

- 进入容器内交互式 psql：
  ```bash
  docker exec -it postgres_master psql -U admin -d postgres
  ```

---

## 12. 连接示例

宿主机上的站点：
```text
postgres://site1_user:site1_pass@127.0.0.1:5432/site1_db
```

容器内（同一网络 `shared_net`）的站点：
```text
postgres://site1_user:site1_pass@postgres_master:5432/site1_db
```

---

## 13. 重要提示

- 请尽快将默认管理员密码 `supersecret` 修改为强密码：
  ```bash
  docker exec -it postgres_master psql -U admin -d postgres -c "ALTER USER admin WITH PASSWORD 'Your_Strong_Admin_Pass';"
  ```
- 定期执行“8.1 备份全部数据库”，并妥善保管备份文件。

---

文档位置：`VPS/postgres_20_sites_admin_guide.md`。


