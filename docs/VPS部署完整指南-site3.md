# 🚀 VPS部署完整指南 - Site3

**项目仓库**: https://github.com/sicks0214/template-A  
**部署位置**: /docker/site3  
**站点ID**: site3  
**部署时间**: 2024-10-01

---

## 📋 前置检查

在开始部署前，确保VPS已经具备：

```bash
# 1. 检查Docker
docker --version
# 应输出：Docker version 20.x.x 或更高

# 2. 检查Docker Compose
docker compose version
# 应输出：Docker Compose version v2.x.x 或更高

# 3. 检查网络
docker network ls | grep webproxy
docker network ls | grep shared_net
# 应该看到这两个网络

# 4. 检查PostgreSQL总系统
docker ps | grep postgres
# 应该看到postgres_master容器正在运行
```

如果缺少任何组件，请先完成基础设施搭建。

---

## 🔧 步骤1: 拉取代码到VPS

### 1.1 SSH连接到VPS

```bash
# 从本地连接到VPS
ssh root@your-vps-ip
# 或使用SSH密钥
ssh -i ~/.ssh/your-key.pem root@your-vps-ip
```

### 1.2 克隆项目到site3目录

```bash
# 进入docker目录
cd /docker

# 克隆项目（使用site3作为目录名）
git clone https://github.com/sicks0214/template-A.git site3

# 进入项目目录
cd site3

# 查看文件结构
ls -la
```

应该看到以下目录：
```
/docker/site3/
├── backend/
├── frontend/
├── database/
├── docker/
├── modules/
├── scripts/
├── template-config/
└── ...
```

---

## ⚙️ 步骤2: 配置项目

### 2.1 修改项目配置文件

```bash
# 编辑项目配置
nano template-config/project.config.ts
```

修改以下关键配置：

```typescript
export const ProjectConfig = {
  // 【必须修改】项目信息
  project: {
    name: 'My Site3 Project',           // 改为您的项目名
    displayName: 'Site3 App',           // 改为显示名称
    description: 'My application',      // 改为项目描述
    version: '1.0.0',
    author: 'Your Name',                // 改为您的名字
  },
  
  // 【必须修改】VPS部署配置
  deployment: {
    siteId: 'site3',                    // ✅ 确认是site3
    siteName: 'site3',                  // ✅ 确认是site3
    timezone: 'Asia/Shanghai',          // 改为您的时区
  },
  
  // 【必须修改】数据库配置
  database: {
    user: 'site3_user',                 // ✅ 确认是site3_user
    password: 'site3_pass',             // ⚠️ 需要修改为强密码
    tablePrefix: 'mysite3_',            // 改为您的表前缀（唯一）
  },
  
  // 【必须修改】反馈系统配置
  feedback: {
    siteId: 'site3',                    // ✅ 确认是site3
  },
  
  // 【必须修改】域名配置
  domains: {
    primary: 'yoursite3.com',           // 改为您的主域名
    additional: ['www.yoursite3.com'],  // 改为额外域名
  },
}
```

**保存并退出**：
- 按 `Ctrl+O` 保存
- 按 `Enter` 确认
- 按 `Ctrl+X` 退出

### 2.2 创建环境变量文件

```bash
# 复制环境变量模板
cp docker/env.template backend/.env

# 编辑环境变量
nano backend/.env
```

**完整配置内容**：

```bash
# ============================================================================
# Site3 环境变量配置
# ============================================================================

# 站点配置
SITE_ID=site3
NODE_ENV=production
PORT=3000
TZ=Asia/Shanghai

# PostgreSQL总系统配置
DB_HOST=postgres_master
DB_PORT=5432
DB_NAME=postgres
DB_USER=site3_user
DB_PASS=YourStrongPassword123!          # ⚠️ 修改为强密码

# SSL配置
DB_SSL=false

# JWT认证配置
JWT_SECRET=your-super-secret-key-min-32-chars-long-abc123  # ⚠️ 修改为随机字符串
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS配置
FRONTEND_URL=https://yoursite3.com
ALLOWED_ORIGINS=https://yoursite3.com,https://www.yoursite3.com  # ⚠️ 修改为您的域名

# 反馈系统
FEEDBACK_SITE_ID=site3

# 缓存配置（可选）
CACHE_ENABLED=false
ENABLE_REDIS_CACHE=false

# 数据库配置
USE_DATABASE=true
```

**生成强密码的方法**：
```bash
# 生成JWT_SECRET
openssl rand -base64 32

# 生成DB_PASS
openssl rand -base64 16
```

**保存并退出**：
- 按 `Ctrl+O` 保存
- 按 `Enter` 确认
- 按 `Ctrl+X` 退出

### 2.3 验证配置

```bash
# 运行配置验证脚本
chmod +x scripts/validate-config.sh
./scripts/validate-config.sh backend/.env
```

应该看到类似输出：
```
✅ SITE_ID: site3
✅ DB_HOST: postgres_master
✅ DB_USER: site3_user
✅ JWT_SECRET: ******** (已设置)
...
✅ 配置验证完全通过！
```

---

## 🗄️ 步骤3: 初始化数据库

### 3.1 初始化PostgreSQL表

```bash
# 确保脚本有执行权限
chmod +x scripts/init-postgres-tables.sh

# 执行初始化（使用您在project.config.ts中设置的表前缀）
./scripts/init-postgres-tables.sh site3 mysite3_
```

**参数说明**：
- `site3`: 站点ID
- `mysite3_`: 表前缀（与project.config.ts中的tablePrefix一致）

**预期输出**：
```
╔═══════════════════════════════════════════════════════════════╗
║     PostgreSQL总系统 - 站点数据库初始化                      ║
╚═══════════════════════════════════════════════════════════════╝

站点ID: site3
表前缀: mysite3_

[步骤 1] 创建站点用户
✅ 用户已创建: site3_user

[步骤 2] 创建项目表
✅ 模块表创建完成: example-simple

[步骤 3] 配置反馈系统
✅ 反馈系统配置完成

[步骤 4] 创建核心认证表
✅ 核心认证表创建完成

[步骤 5] 验证配置
✅ 共创建 4 个表

╔═══════════════════════════════════════════════════════════════╗
║                   ✅ 数据库初始化完成！                       ║
╚═══════════════════════════════════════════════════════════════╝
```

### 3.2 验证数据库连接

```bash
# 连接到PostgreSQL查看表
docker exec -it postgres_master psql -U postgres

# 在psql中执行：
\dt mysite3_*

# 应该看到：
# mysite3_users
# mysite3_refresh_tokens
# mysite3_simple_data
# mysite3_simple_settings

# 查看统一反馈表
SELECT * FROM unified_feedback WHERE site_id = 'site3';

# 退出psql
\q
```

---

## 🚀 步骤4: 一键部署

### 4.1 赋予脚本执行权限

```bash
# 给所有脚本添加执行权限
chmod +x scripts/*.sh
```

### 4.2 执行一键部署

```bash
# 运行一键部署脚本
./scripts/one-click-deploy.sh
```

**部署过程**（约3-5分钟）：

```
╔═══════════════════════════════════════════════════════════════╗
║     🚀 Universal Web Template - 一键部署脚本                  ║
╚═══════════════════════════════════════════════════════════════╝

▶ 步骤 0: 环境预检查
✅ Docker已安装
✅ 环境文件存在
✅ 站点ID: site3

▶ 步骤 1: 验证配置文件
✅ 配置验证完成

▶ 步骤 2: 编译TypeScript
✅ TypeScript编译完成

▶ 步骤 3: 前端分离式构建
Docker容器中执行构建...
✅ 前端构建完成

▶ 步骤 4: 构建Docker镜像
✅ Docker镜像构建完成

▶ 步骤 5: 配置Docker网络
✅ webproxy网络已存在
✅ shared_net网络已存在
✅ PostgreSQL网络配置完成

▶ 步骤 6: 停止旧容器
✅ 旧容器已清理（或无需清理）

▶ 步骤 7: 启动新容器
✅ 容器启动成功
✅ 网络配置完成

▶ 步骤 8: 等待服务启动
等待15秒...

▶ 步骤 9: 初始化数据库
跳过数据库初始化（已完成）

▶ 步骤 10: 健康检查和验证
✅ 容器正在运行
✅ 已连接webproxy
✅ 已连接shared_net
✅ 健康检查通过！
✅ 可以连接到PostgreSQL总系统

╔═══════════════════════════════════════════════════════════════╗
║                   ✅ 部署成功！                               ║
╚═══════════════════════════════════════════════════════════════╝

━━━ 访问信息 ━━━
容器名称: site3
容器IP: 172.18.0.x
内部端口: 3000
健康检查: curl http://172.18.0.x:3000/health

━━━ 后续步骤 ━━━
1. 配置Nginx Proxy Manager
2. 验证访问
3. 监控和管理
```

### 4.3 验证部署

```bash
# 1. 查看容器状态
docker ps | grep site3

# 2. 查看容器日志
docker logs site3 --tail 50

# 3. 获取容器IP
docker inspect site3 | grep IPAddress

# 4. 健康检查
CONTAINER_IP=$(docker inspect site3 | grep -m1 "IPAddress" | cut -d'"' -f4)
curl http://$CONTAINER_IP:3000/health

# 应该返回：
# {"status":"ok","timestamp":"..."}
```

---

## 🌐 步骤5: 配置Nginx Proxy Manager

### 5.1 登录NPM管理界面

```
访问: http://your-vps-ip:81
默认账号: admin@example.com
默认密码: changeme
```

### 5.2 添加代理主机

1. 点击 **"Proxy Hosts"** → **"Add Proxy Host"**

2. **Details标签页**配置：
   ```
   Domain Names:
   - yoursite3.com
   - www.yoursite3.com
   
   Scheme: http
   Forward Hostname / IP: site3
   Forward Port: 3000
   
   ✅ Cache Assets
   ✅ Block Common Exploits
   ✅ Websockets Support
   ```

3. **SSL标签页**配置：
   ```
   ✅ SSL Certificate: Request a new SSL Certificate
   
   Email Address: your@email.com
   
   ✅ Force SSL
   ✅ HTTP/2 Support
   ✅ HSTS Enabled
   
   点击 "I Agree" 同意Let's Encrypt条款
   ```

4. 点击 **"Save"**

### 5.3 等待SSL证书申请

```
应该看到：
✅ Certificate obtained successfully
✅ Proxy host created successfully
```

---

## ✅ 步骤6: 验证完整访问

### 6.1 DNS配置（如果还未配置）

在您的域名DNS管理中，添加A记录：

```
类型    主机记录    记录值
A       @           your-vps-ip
A       www         your-vps-ip
```

### 6.2 测试访问

```bash
# 1. 测试健康检查（内部）
curl http://site3:3000/health

# 2. 测试健康检查（通过NPM）
curl https://yoursite3.com/api/health

# 3. 浏览器访问
# 打开浏览器访问：https://yoursite3.com
```

### 6.3 验证功能

访问以下页面验证：

1. **首页**: https://yoursite3.com
   - ✅ 页面正常加载
   - ✅ 语言切换正常

2. **认证功能**: https://yoursite3.com
   - ✅ 点击登录按钮
   - ✅ 注册新账号
   - ✅ 登录成功

3. **反馈功能**: https://yoursite3.com
   - ✅ 点击右下角反馈按钮
   - ✅ 提交反馈成功

4. **API测试**:
   ```bash
   # 健康检查
   curl https://yoursite3.com/api/health
   
   # 应返回：{"status":"ok",...}
   ```

---

## 📊 步骤7: 监控和管理

### 7.1 查看容器日志

```bash
# 实时查看日志
docker logs -f site3

# 查看最近100行日志
docker logs site3 --tail 100

# 查看包含错误的日志
docker logs site3 2>&1 | grep -i error
```

### 7.2 查看资源使用

```bash
# 查看容器资源使用情况
docker stats site3

# 应该看到：
# CONTAINER  CPU %  MEM USAGE / LIMIT   MEM %   NET I/O
# site3      0.5%   150MiB / 2GiB       7.5%    ...
```

### 7.3 常用管理命令

```bash
# 重启容器
docker restart site3

# 停止容器
docker stop site3

# 启动容器
docker start site3

# 进入容器调试
docker exec -it site3 sh

# 查看容器网络
docker network inspect shared_net | grep site3
docker network inspect webproxy | grep site3
```

---

## 🔧 故障排查

### 问题1: 容器无法启动

```bash
# 查看详细错误
docker logs site3

# 常见原因：
# 1. 端口冲突 → 检查3000端口是否被占用
# 2. 环境变量错误 → 验证backend/.env
# 3. 数据库连接失败 → 检查postgres_master

# 解决方法：
docker stop site3
docker rm site3
./scripts/one-click-deploy.sh
```

### 问题2: 数据库连接失败

```bash
# 测试数据库连接
docker exec site3 nc -zv postgres_master 5432

# 如果失败，检查网络
docker network inspect shared_net | grep site3
docker network inspect shared_net | grep postgres

# 重新连接网络
docker network connect shared_net site3
```

### 问题3: CORS错误

```bash
# 查看CORS配置
docker logs site3 | grep "允许的CORS源"

# 应该看到：
# 🌐 允许的CORS源: ['https://yoursite3.com', 'https://www.yoursite3.com']

# 如果没有，检查backend/.env
cat backend/.env | grep ALLOWED_ORIGINS

# 修改后重新部署
./scripts/one-click-deploy.sh
```

### 问题4: SSL证书申请失败

```bash
# 原因：域名DNS未生效
# 解决：等待DNS传播（可能需要几分钟到几小时）

# 检查DNS
nslookup yoursite3.com

# 应该返回VPS的IP地址
```

---

## 📝 后续更新部署

当您修改代码后，更新部署：

```bash
# 1. SSH到VPS
ssh root@your-vps-ip

# 2. 进入项目目录
cd /docker/site3

# 3. 拉取最新代码
git pull origin main

# 4. 重新部署
./scripts/one-click-deploy.sh
```

---

## 🔒 安全建议

### 1. 修改默认密码

```bash
# 修改数据库密码
nano backend/.env
# 找到 DB_PASS 并修改为强密码

# 修改JWT密钥
# 找到 JWT_SECRET 并修改为随机字符串
```

### 2. 配置防火墙

```bash
# 只开放必要端口
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw enable
```

### 3. 定期备份数据库

```bash
# 创建备份脚本
nano /root/backup-site3.sh

# 内容：
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec postgres_master pg_dump -U postgres postgres > /backup/site3_${DATE}.sql

# 赋予执行权限
chmod +x /root/backup-site3.sh

# 添加到crontab（每天凌晨3点备份）
crontab -e
# 添加：0 3 * * * /root/backup-site3.sh
```

---

## 📞 获取帮助

如果遇到问题：

1. **查看日志**:
   ```bash
   docker logs site3 --tail 100
   ```

2. **查看文档**:
   - `/docker/site3/TEMPLATE-README.md`
   - `/docker/site3/docs/快速开始指南.md`

3. **GitHub Issues**:
   - https://github.com/sicks0214/template-A/issues

---

## ✅ 部署完成检查清单

- [ ] VPS基础设施就绪（Docker、NPM、PostgreSQL）
- [ ] 代码克隆到 `/docker/site3`
- [ ] 修改 `template-config/project.config.ts`
- [ ] 创建并配置 `backend/.env`
- [ ] 运行 `validate-config.sh` 验证配置
- [ ] 运行 `init-postgres-tables.sh` 初始化数据库
- [ ] 运行 `one-click-deploy.sh` 部署应用
- [ ] 配置NPM代理主机和SSL证书
- [ ] DNS配置完成
- [ ] 浏览器访问成功
- [ ] 测试认证功能
- [ ] 测试反馈功能
- [ ] 修改默认密码

---

**🎉 恭喜！Site3部署完成！**

**访问地址**: https://yoursite3.com  
**管理**: `docker logs -f site3`  
**更新**: `git pull && ./scripts/one-click-deploy.sh`

祝您使用愉快！

