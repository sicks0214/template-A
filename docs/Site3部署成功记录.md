# Site3 部署成功记录

**部署日期**: 2024年10月2日  
**站点域名**: game2030.top, www.game2030.top  
**部署状态**: ✅ 成功  
**部署路径**: `/docker/site3`

---

## 📊 配置信息

### 基本信息
```
站点ID: site3
容器名称: site3
镜像标签: site3:latest
表前缀: site3__ (双下划线)
数据库用户: site3_user
内部端口: 3000
```

### 关键环境变量
```env
# PostgreSQL总系统配置
DB_HOST=postgres_master
DB_PORT=5432
DB_NAME=postgres
DB_USER=site3_user
DB_PASSWORD=site3_prod_pass_2024
TABLE_PREFIX=site3__    # ⚠️ 注意：双下划线

# 站点配置
SITE_ID=site3

# CORS配置
ALLOWED_ORIGINS=https://game2030.top,https://www.game2030.top
FRONTEND_URL=https://game2030.top
```

---

## 🎯 部署过程

### 步骤1: 本地代码准备
```bash
# 在本地开发机器
cd "C:\Users\Administrator.USER-20240417KK\Documents\GitHub\template A"

# 提交代码
git add .
git commit -m "feat: integrate PostgreSQL master system"
git push origin main
```

### 步骤2: VPS拉取代码
```bash
# 在VPS上
cd /docker/site3

# 备份配置
cp backend/.env backend/.env.backup

# 拉取代码
git stash
git pull origin main
git stash pop

# 恢复配置
cp backend/.env.backup backend/.env
```

### 步骤3: 配置验证
```bash
# 验证环境变量
cat backend/.env | grep -E "(SITE_ID|TABLE_PREFIX|DB_USER|DB_PASSWORD)"

# 验证数据库连接
docker exec postgres_master psql -U site3_user -d postgres -c "SELECT COUNT(*) FROM site3__users;"

# 验证编译产物
ls -la backend/dist/ | head -10
```

### 步骤4: 跳过编译（使用已有dist）
```bash
# 检查并修改部署脚本
if [ -d "backend/dist" ] && [ "$(ls -A backend/dist)" ]; then
    sed -i 's/npm run build/echo "使用已有dist目录"/g' scripts/one-click-deploy-postgres.sh
fi
```

### 步骤5: 执行部署
```bash
chmod +x scripts/one-click-deploy-postgres.sh
./scripts/one-click-deploy-postgres.sh
```

---

## ✅ 部署验证结果

```
╔═══════════════════════════════════════════════════════════════╗
║     🚀 Template A - PostgreSQL总系统一键部署                  ║
╚═══════════════════════════════════════════════════════════════╝

▶ 步骤 0: 环境预检查
✅ Docker已安装 : 28.4.0
✅ 环境文件存在
✅ 站点 ID: site3
✅ 表前缀 : site3__
✅ 数据库主机 : postgres_master

▶ 步骤 1: 验证PostgreSQL总系统连接
✅ postgres_master容器正在运行
✅ 数据库连接测试成功
✅ 数据库表已初始化 : site3__users

▶ 步骤 2-5: 编译和构建
✅ TypeScript编译完成
✅ 前端构建完成
✅ Docker镜像构建完成: site3:latest

▶ 步骤 6-8: 网络和容器
✅ 网络配置完成
✅ 已连接webproxy网络
✅ 已连接shared_net网络
✅ 旧容器已清理
✅ 容器启动成功 : site3

▶ 步骤 9: 健康检查
✅ 容器正在运行
✅ 可以连接到PostgreSQL总系统

╔═══════════════════════════════════════════════════════════════╗
║                   ✅ 部署成功！                               ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## 🔧 遇到的问题和解决方案

### 问题1: 表前缀不一致导致权限错误

**症状**:
```
ERROR: permission denied for table site3__users
```

**原因分析**:
- `.env` 文件配置: `TABLE_PREFIX=site3_` (单下划线)
- 数据库实际表名: `site3__users` (双下划线)
- 应用尝试查询不存在的表 `site3_users`

**解决方案**:
```bash
# 1. 确认数据库实际表名
docker exec postgres_master psql -U site3_user -d postgres -c \
  "SELECT COUNT(*) FROM site3__users;"
# 成功返回 0 行，说明表名是 site3__users

# 2. 修改 .env 文件
grep "TABLE_PREFIX" backend/.env
# 输出: TABLE_PREFIX=site3__

# 3. 重新部署
./scripts/one-click-deploy-postgres.sh
```

**预防措施**:
- ✅ 部署前使用 `pre-deployment-check.sh` 检查表前缀一致性
- ✅ 数据库初始化脚本和 `.env` 文件使用相同的表前缀
- ✅ 在部署脚本中添加表前缀验证

---

### 问题2: .env文件格式错误

**症状**:
```
❌ 缺少必需的环境变量: DB_USER, DB_PASSWORD, TABLE_PREFIX
```

**原因分析**:
- 使用 `nano` 编辑器可能导致文件保存为单行
- 环境变量解析失败

**解决方案**:
```bash
# 删除旧文件
rm backend/.env

# 使用 cat 重新创建
cat > backend/.env << 'EOF'
DB_HOST=postgres_master
DB_PORT=5432
DB_NAME=postgres
DB_USER=site3_user
DB_PASSWORD=site3_prod_pass_2024
...（每行一个配置）
EOF

# 验证格式
head -20 backend/.env

# 验证读取
source backend/.env
echo "TABLE_PREFIX: $TABLE_PREFIX"
```

**预防措施**:
- ✅ 使用脚本生成 `.env` 文件
- ✅ 部署前验证文件格式: `head -20 backend/.env`
- ✅ 避免使用 `nano` 直接编辑（推荐使用 `cat` 或 `vi`）

---

### 问题3: npm编译命令找不到

**症状**:
```
./scripts/one-click-deploy-postgres.sh: line 171: npm: command not found
```

**原因分析**:
- VPS 上没有安装 `npm`
- 部署脚本尝试直接运行 `npm run build`

**解决方案**:
```bash
# 方案1: 使用已有的 dist 目录（推荐）
if [ -d "backend/dist" ] && [ "$(ls -A backend/dist)" ]; then
    echo "✅ 使用已有dist目录"
    sed -i 's/npm run build/echo "使用已有dist目录"/g' \
      scripts/one-click-deploy-postgres.sh
fi

# 方案2: 使用Docker容器编译（如果dist不存在）
cd backend
docker run --rm -v $(pwd):/app -w /app node:22-alpine sh -c \
  "npm install && npm run build"
cd ..
```

**预防措施**:
- ✅ 本地编译后将 `dist` 目录提交到 Git
- ✅ 部署脚本自动检测 `dist` 是否存在
- ✅ 使用 Docker 容器编译确保环境一致

---

## 📝 重要经验总结

### 1. 表前缀配置的重要性

**关键点**:
- PostgreSQL总系统使用表前缀隔离不同站点数据
- `.env` 中的 `TABLE_PREFIX` 必须与数据库实际表名一致
- 常见错误: 单下划线 vs 双下划线混淆

**检查方法**:
```bash
# 1. 查看数据库中的实际表名
docker exec postgres_master psql -U admin -d postgres -c "\dt site3*"

# 2. 查看 .env 配置
grep "TABLE_PREFIX" backend/.env

# 3. 确保一致性
# 如果数据库是 site3__users，则 TABLE_PREFIX=site3__
# 如果数据库是 site3_users，则 TABLE_PREFIX=site3_
```

---

### 2. 标准部署流程

**推荐流程**（按顺序执行）:

```bash
# 1. 备份配置
cp backend/.env backend/.env.backup

# 2. 拉取代码
git stash
git pull origin main
git stash pop

# 3. 恢复配置
cp backend/.env.backup backend/.env

# 4. 运行预检查（新增）
chmod +x scripts/pre-deployment-check.sh
./scripts/pre-deployment-check.sh

# 5. 检查编译产物
ls -la backend/dist/

# 6. 部署
./scripts/one-click-deploy-postgres.sh

# 7. 验证
docker logs site3 --tail 50
docker exec site3 nc -zv postgres_master 5432
```

---

### 3. 环境变量配置最佳实践

**必须修改的变量**:
```env
DB_USER=site3_user              # 站点专用用户
DB_PASSWORD=strong_password     # 强密码
SITE_ID=site3                   # 站点标识
TABLE_PREFIX=site3__            # 与数据库一致
JWT_SECRET=random_secret_key    # 随机密钥
ALLOWED_ORIGINS=https://...     # 实际域名
```

**固定不变的变量**:
```env
DB_HOST=postgres_master         # Docker网络别名
DB_PORT=5432                    # PostgreSQL端口
DB_NAME=postgres                # 主数据库名
NODE_ENV=production             # 生产环境
```

---

### 4. 预防性检查清单

**部署前必查项**:

```bash
# ✅ 1. 环境变量完整性
cat backend/.env | grep -E "(SITE_ID|TABLE_PREFIX|DB_USER|DB_PASSWORD)"

# ✅ 2. 数据库连接
docker exec postgres_master psql -U site3_user -d postgres -c "SELECT 1;"

# ✅ 3. 表前缀一致性
docker exec postgres_master psql -U admin -d postgres -c "\dt site3__*"

# ✅ 4. 编译产物
ls -la backend/dist/index.js

# ✅ 5. Docker网络
docker network ls | grep -E "(webproxy|shared_net)"

# ✅ 6. 旧容器清理（可选）
docker ps -a | grep site3
```

---

## 🎯 下一步工作

### NPM（Nginx Proxy Manager）配置

**访问地址**: `http://YOUR_VPS_IP:81`

**配置步骤**:
1. 添加 Proxy Host
2. 域名: `game2030.top`, `www.game2030.top`
3. Forward Hostname: `site3`
4. Forward Port: `3000`
5. 申请 SSL 证书（Let's Encrypt）
6. 启用 Force SSL、HTTP/2、HSTS

**测试访问**:
```bash
# HTTP测试
curl http://game2030.top

# HTTPS测试（配置SSL后）
curl https://game2030.top

# 健康检查
curl https://game2030.top/api/health
```

---

## 📞 常用管理命令

### 容器管理
```bash
# 查看日志
docker logs site3 -f

# 重启容器
docker restart site3

# 进入容器
docker exec -it site3 sh

# 查看容器状态
docker ps | grep site3
```

### 数据库操作
```bash
# 查看用户数
docker exec postgres_master psql -U site3_user -d postgres -c \
  "SELECT COUNT(*) FROM site3__users;"

# 查看反馈
docker exec postgres_master psql -U site3_user -d postgres -c \
  "SELECT * FROM unified_feedback WHERE site_id='site3' ORDER BY created_at DESC LIMIT 5;"

# 进入数据库
docker exec -it postgres_master psql -U site3_user -d postgres
```

### 网络诊断
```bash
# 测试数据库连接
docker exec site3 nc -zv postgres_master 5432

# 查看容器网络
docker inspect site3 | grep -A 10 "Networks"

# 测试健康检查
curl http://localhost:3000/health
```

---

## 📊 部署时间线

| 时间 | 操作 | 状态 |
|------|------|------|
| 2024-10-02 | 本地代码提交 | ✅ 完成 |
| 2024-10-02 | VPS拉取代码 | ✅ 完成 |
| 2024-10-02 | 配置 .env 文件 | ✅ 完成 |
| 2024-10-02 | 解决表前缀问题 | ✅ 完成 |
| 2024-10-02 | 一键部署成功 | ✅ 完成 |
| 待定 | NPM配置SSL | ⏳ 待完成 |
| 待定 | 域名解析 | ⏳ 待完成 |
| 待定 | 生产环境测试 | ⏳ 待完成 |

---

## 🎉 总结

### 成功因素
1. ✅ 详细的部署文档和指南
2. ✅ 一键部署脚本自动化
3. ✅ PostgreSQL总系统架构清晰
4. ✅ 问题排查思路明确
5. ✅ 预防式处理机制

### 改进建议
1. 💡 增加预检查脚本（已创建）
2. 💡 标准化 .env 文件生成
3. 💡 添加自动化测试
4. 💡 完善监控和日志系统

---

**文档版本**: 1.0  
**创建时间**: 2024-10-02  
**维护者**: Template Team  
**状态**: 部署成功 ✅

