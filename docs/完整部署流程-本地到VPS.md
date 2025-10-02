# Template A - 完整部署流程（本地到VPS）

> **从本地开发到VPS生产环境的完整流程**  
> **GitHub仓库**: https://github.com/sicks0214/template-A  
> **最后更新**: 2024-10-02

---

## 📋 前置准备

### 1. 本地环境
- ✅ Git已安装并配置
- ✅ Node.js 18+ 已安装
- ✅ 代码已克隆到本地

### 2. VPS环境
- ✅ Docker + Docker Compose已安装
- ✅ PostgreSQL总系统已部署（postgres_master）
- ✅ Nginx Proxy Manager已配置
- ✅ SSH密钥已配置

### 3. GitHub仓库
- ✅ 仓库已创建: https://github.com/sicks0214/template-A
- ✅ 本地仓库已关联远程仓库

---

## 🚀 完整部署流程

### 阶段1: 本地配置和修改

#### 步骤1.1: 修改项目配置

```bash
# 进入项目目录
cd "C:\Users\Administrator.USER-20240417KK\Documents\GitHub\template A"

# 编辑项目配置
# 使用VS Code或其他编辑器打开
code template-config/project.config.ts
```

**修改内容**：
```typescript
export const ProjectConfig = {
  deployment: {
    siteId: 'site5',              // 修改为您的站点ID
    siteName: 'site5',
    timezone: 'Asia/Shanghai',    // 修改为您的时区
  },
  
  database: {
    user: 'site5_user',           // 修改为您的数据库用户
    password: 'site5_pass',       // 修改为您的密码
    tablePrefix: 'myapp_',        // 修改为您的表前缀（唯一）
  },
  
  feedback: {
    siteId: 'site5',              // 修改为您的站点ID
  },
  
  domains: {
    primary: 'example.com',        // 修改为您的域名
    additional: ['www.example.com'],
  },
}
```

#### 步骤1.2: 创建环境变量文件（VPS使用）

创建 `backend/.env.production`：

```bash
# PostgreSQL总系统配置
DB_HOST=postgres_master
DB_PORT=5432
DB_NAME=postgres
DB_USER=site5_user
DB_PASSWORD=YourStrongPassword123!
DB_SSL=false
DB_MAX_CONNECTIONS=20

# 站点配置
SITE_ID=site5
TABLE_PREFIX=myapp_

# 应用配置
NODE_ENV=production
PORT=3000
USE_DATABASE=true

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS配置
FRONTEND_URL=https://example.com
ALLOWED_ORIGINS=https://example.com,https://www.example.com

# 时区
TZ=Asia/Shanghai
```

**⚠️ 注意**: 
- 不要将 `.env.production` 提交到Git
- 这个文件将在VPS上手动配置

#### 步骤1.3: 编译TypeScript

```bash
# 编译后端代码
cd backend
npm install
npm run build

# 验证编译结果
ls dist/
grep "database" dist/config/database.js
```

#### 步骤1.4: 验证配置文件

```bash
# 返回项目根目录
cd ..

# 运行配置验证（如果有）
node -e "const config = require('./template-config/project.config.ts'); console.log(config.ProjectConfig)"
```

### 阶段2: 提交到GitHub

#### 步骤2.1: 检查Git状态

```bash
# 查看修改的文件
git status

# 查看具体修改内容
git diff template-config/project.config.ts
git diff backend/dist/
```

#### 步骤2.2: 添加并提交修改

```bash
# 添加所有修改
git add .

# 或者选择性添加
git add template-config/project.config.ts
git add backend/src/
git add backend/dist/
git add database/vps/
git add scripts/
git add docs/

# 提交修改
git commit -m "feat: 配置site5接入PostgreSQL总系统

- 修改站点ID为site5
- 更新数据库配置
- 添加表前缀myapp_
- 更新域名配置
- 添加部署脚本和SQL初始化脚本
"
```

#### 步骤2.3: 推送到GitHub

```bash
# 推送到远程仓库
git push origin main

# 如果是第一次推送
git push -u origin main
```

#### 步骤2.4: 验证GitHub

访问: https://github.com/sicks0214/template-A

确认：
- ✅ 最新提交已显示
- ✅ 所有文件已更新
- ✅ 编译后的 `backend/dist/` 文件已上传

---

### 阶段3: VPS部署

#### 步骤3.1: SSH连接到VPS

```bash
# Windows PowerShell
ssh root@YOUR_VPS_IP

# 或使用PuTTY等SSH工具
```

#### 步骤3.2: 克隆或更新代码

**首次部署**：
```bash
# 进入docker目录
cd /docker

# 克隆仓库
git clone https://github.com/sicks0214/template-A.git site5

# 进入项目目录
cd site5
```

**已部署更新**：
```bash
# 进入项目目录
cd /docker/site5

# 备份.env文件
cp backend/.env backend/.env.backup

# 拉取最新代码
git stash
git pull origin main
git stash pop

# 恢复.env文件（如果被覆盖）
cp backend/.env.backup backend/.env
```

#### 步骤3.3: 配置环境变量

```bash
# 复制环境变量模板
cp backend/.env.production backend/.env

# 编辑环境变量
nano backend/.env
```

**修改关键配置**：
```bash
DB_PASSWORD=YourActualStrongPassword   # 修改为实际密码
JWT_SECRET=your-actual-secret-key      # 修改为实际密钥
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

保存并退出（Ctrl+O, Enter, Ctrl+X）

#### 步骤3.4: 初始化数据库

```bash
# 修改SQL脚本中的配置变量
nano database/vps/template-a-init.sql
```

修改顶部的配置：
```sql
\set site_id 'site5'
\set site_user 'site5_user'
\set site_password '''YourStrongPassword123!'''
\set table_prefix 'myapp_'
```

保存后执行：
```bash
# 执行初始化脚本
docker exec -i postgres_master psql -U admin -d postgres < database/vps/template-a-init.sql
```

**预期输出**：
```
✅ 用户已创建: site5_user
✅ 已授权表: myapp_users
✅ 已授权表: myapp_refresh_tokens
...
✅ Template A 数据库初始化完成！
```

#### 步骤3.5: 执行一键部署

```bash
# 赋予执行权限
chmod +x scripts/one-click-deploy-postgres.sh

# 执行部署
./scripts/one-click-deploy-postgres.sh
```

**部署过程**（约3-5分钟）：
```
🚀 Template A - PostgreSQL总系统一键部署

▶ 步骤 0: 环境预检查
✅ Docker已安装: 24.0.x
✅ 环境文件存在
✅ 站点ID: site5
✅ 表前缀: myapp_

▶ 步骤 1: 验证PostgreSQL总系统连接
✅ postgres_master容器正在运行
✅ 数据库连接测试成功
✅ 数据库表已初始化: myapp_users

▶ 步骤 2: 编译TypeScript代码
✅ TypeScript编译完成

▶ 步骤 3: 构建前端（使用Docker容器）
✅ 前端构建完成

▶ 步骤 4: 构建Docker镜像
✅ Docker镜像构建完成: site5:latest

▶ 步骤 5: 配置Docker网络
✅ 网络配置完成

▶ 步骤 6: 停止旧容器
✅ 无需清理旧容器

▶ 步骤 7: 启动新容器
✅ 容器启动成功: site5

▶ 步骤 8: 等待服务启动（15秒）...
✅ 等待完成

▶ 步骤 9: 健康检查和验证
✅ 容器正在运行
✅ 已连接webproxy网络
✅ 已连接shared_net网络
✅ 容器IP: 172.18.0.x
✅ 健康检查通过！
✅ 可以连接到PostgreSQL总系统

▶ 步骤 10: 部署信息汇总

╔═══════════════════════════════════════════════════════════════╗
║                   ✅ 部署成功！                               ║
╚═══════════════════════════════════════════════════════════════╝
```

#### 步骤3.6: 验证部署

```bash
# 查看容器日志
docker logs site5 --tail 50

# 应该看到：
# 🗄️ PostgreSQL客户端连接成功
# ✅ PostgreSQL连接测试成功
# 🚀 服务启动成功: http://0.0.0.0:3000

# 测试健康检查
CONTAINER_IP=$(docker inspect site5 | grep -m1 '"IPAddress"' | cut -d'"' -f4)
curl http://$CONTAINER_IP:3000/health

# 应该返回：
# {"status":"ok","connected":true,...}

# 测试数据库连接
docker exec site5 nc -zv postgres_master 5432

# 应该显示：
# Connection to postgres_master 5432 port [tcp/postgresql] succeeded!

# 查看数据库表
docker exec postgres_master psql -U site5_user -d postgres -c "\dt myapp_*"

# 应该显示所有创建的表
```

---

### 阶段4: 配置Nginx Proxy Manager

#### 步骤4.1: 登录NPM

```
访问: http://YOUR_VPS_IP:81
账号: admin@example.com
密码: changeme（首次登录后修改）
```

#### 步骤4.2: 添加代理主机

1. 点击 **"Proxy Hosts"** → **"Add Proxy Host"**

2. **Details标签页**：
   ```
   Domain Names:
   - example.com
   - www.example.com
   
   Scheme: http
   Forward Hostname / IP: site5
   Forward Port: 3000
   
   ✅ Cache Assets
   ✅ Block Common Exploits
   ✅ Websockets Support
   ```

3. **SSL标签页**：
   ```
   ✅ Request a new SSL Certificate
   Email: your@email.com
   ✅ Force SSL
   ✅ HTTP/2 Support
   ✅ HSTS Enabled
   ```

4. 点击 **"Save"**

#### 步骤4.3: 等待SSL证书

应该看到：
```
✅ Certificate obtained successfully
✅ Proxy host created successfully
```

---

### 阶段5: 最终验证

#### 步骤5.1: DNS配置验证

```bash
# 在本地Windows PowerShell中
nslookup example.com

# 应该返回VPS的IP地址
```

#### 步骤5.2: 访问测试

```bash
# 测试健康检查
curl https://example.com/api/health

# 应该返回：
# {"status":"ok",...}

# 浏览器访问
# 打开: https://example.com
# 打开: https://www.example.com
```

#### 步骤5.3: 功能测试

1. **首页访问**
   - ✅ 页面正常加载
   - ✅ 无SSL警告
   - ✅ 语言切换正常

2. **用户认证**
   - ✅ 注册新用户
   - ✅ 登录成功
   - ✅ Token正常

3. **反馈功能**
   - ✅ 提交反馈
   - ✅ 数据保存到unified_feedback表

4. **数据库验证**
   ```bash
   # SSH到VPS
   docker exec postgres_master psql -U site5_user -d postgres -c "
   SELECT * FROM unified_feedback WHERE site_id='site5' ORDER BY created_at DESC LIMIT 5;
   "
   
   # 应该看到提交的反馈数据
   ```

---

## 🔄 后续更新流程

### 代码修改更新

```bash
# === 本地 ===
# 1. 修改代码
# 2. 编译TypeScript
cd backend && npm run build

# 3. 提交到GitHub
git add .
git commit -m "feat: 添加新功能"
git push origin main

# === VPS ===
# 1. SSH到VPS
ssh root@YOUR_VPS_IP

# 2. 进入项目目录
cd /docker/site5

# 3. 备份配置
cp backend/.env backend/.env.backup

# 4. 拉取最新代码
git stash
git pull origin main
git stash pop

# 5. 恢复配置
cp backend/.env.backup backend/.env

# 6. 重新编译和部署
cd backend && npm run build && cd ..
./scripts/one-click-deploy-postgres.sh
```

### 配置修改更新

```bash
# 只修改.env文件
ssh root@YOUR_VPS_IP
cd /docker/site5
nano backend/.env

# 修改后重启容器
docker restart site5

# 验证
docker logs site5 --tail 30
```

---

## 📊 检查清单

### 部署前检查
- [ ] 项目配置已修改（siteId, tablePrefix, 域名）
- [ ] TypeScript已编译（backend/dist/存在）
- [ ] 代码已推送到GitHub
- [ ] VPS环境已准备（Docker, PostgreSQL总系统）
- [ ] .env文件已配置（数据库密码、JWT密钥）

### 部署后检查
- [ ] 容器正在运行（docker ps | grep site5）
- [ ] 数据库连接成功（nc -zv postgres_master 5432）
- [ ] 健康检查通过（/health返回200）
- [ ] NPM代理已配置
- [ ] SSL证书已获取
- [ ] 域名可以访问
- [ ] 功能测试通过

### 数据库检查
- [ ] 用户已创建（site5_user）
- [ ] 表已创建（myapp_users等）
- [ ] 权限已授予
- [ ] 反馈表可访问（unified_feedback）

---

## 🐛 常见问题

### 问题1: Git推送失败

```bash
# 检查远程仓库
git remote -v

# 应该显示：
# origin  https://github.com/sicks0214/template-A.git (fetch)
# origin  https://github.com/sicks0214/template-A.git (push)

# 如果没有，添加远程仓库
git remote add origin https://github.com/sicks0214/template-A.git

# 重新推送
git push -u origin main
```

### 问题2: VPS拉取代码失败

```bash
# 检查Git配置
git config --list

# 清理并重新克隆
cd /docker
rm -rf site5
git clone https://github.com/sicks0214/template-A.git site5
```

### 问题3: 数据库连接失败

```bash
# 检查网络
docker network inspect shared_net | grep site5
docker network inspect shared_net | grep postgres_master

# 重新连接
docker network connect shared_net site5

# 测试连接
docker exec site5 nc -zv postgres_master 5432
```

### 问题4: TypeScript编译产物不存在

```bash
# 本地重新编译
cd backend
rm -rf dist node_modules
npm install
npm run build

# 验证
ls -la dist/

# 提交
git add dist/
git commit -m "build: 重新编译TypeScript"
git push origin main
```

---

## 📞 获取帮助

- **GitHub仓库**: https://github.com/sicks0214/template-A
- **文档**: `/docker/site5/docs/`
- **日志查看**: `docker logs site5 -f`

---

**最后更新**: 2024-10-02  
**版本**: 1.0  
**状态**: 生产验证完成

