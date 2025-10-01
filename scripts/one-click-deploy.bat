@echo off
REM ============================================================================
REM 一键部署脚本 (Windows) - Universal Web Template
REM 完全符合VPS部署规范 + PostgreSQL总系统架构
REM ============================================================================

setlocal enabledelayedexpansion

echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║     🚀 Universal Web Template - 一键部署脚本 (Windows)        ║
echo ║                                                               ║
echo ║     符合VPS部署规范 + PostgreSQL总系统架构                    ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

REM ========================================
REM Step 0: 预检查
REM ========================================
echo [步骤 0] 环境预检查
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM 检查Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误：Docker未安装
    pause
    exit /b 1
)
echo ✅ Docker已安装

REM 检查环境文件
if not exist "backend\.env" (
    echo ❌ 错误：缺少环境文件 backend\.env
    echo 提示：复制 docker\.env.template 到 backend\.env 并编辑
    pause
    exit /b 1
)
echo ✅ 环境文件存在

REM 读取站点ID
for /f "tokens=2 delims==" %%a in ('findstr "^SITE_ID=" backend\.env 2^>nul') do set SITE_ID=%%a
if "%SITE_ID%"=="" set SITE_ID=siteN
echo ✅ 站点ID: %SITE_ID%

echo.
pause

REM ========================================
REM Step 1: 验证配置
REM ========================================
echo.
echo [步骤 1] 验证配置文件
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM 检查必需的环境变量
findstr /C:"DB_HOST=postgres_master" backend\.env >nul
if errorlevel 1 (
    echo ❌ 错误：DB_HOST必须设置为 postgres_master
    pause
    exit /b 1
)
echo ✅ DB_HOST配置正确

findstr /C:"DB_NAME=postgres" backend\.env >nul
if errorlevel 1 (
    echo ⚠️  警告：建议DB_NAME设置为 postgres
)

echo ✅ 配置验证完成
echo.
pause

REM ========================================
REM Step 2: TypeScript编译
REM ========================================
echo.
echo [步骤 2] 编译TypeScript
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

if exist "backend\src" (
    if exist "backend\tsconfig.json" (
        echo 检测到TypeScript项目，开始编译...
        cd backend
        
        if not exist "node_modules" (
            echo 安装后端依赖...
            call npm install
        )
        
        echo 编译TypeScript...
        call npm run build
        if errorlevel 1 (
            echo ❌ TypeScript编译失败
            cd ..
            pause
            exit /b 1
        )
        
        if not exist "dist" (
            echo ❌ 编译失败：dist目录不存在
            cd ..
            pause
            exit /b 1
        )
        
        echo ✅ TypeScript编译完成
        cd ..
    ) else (
        echo 非TypeScript项目，跳过编译
    )
) else (
    echo 非TypeScript项目，跳过编译
)

echo.
pause

REM ========================================
REM Step 3: 前端构建
REM ========================================
echo.
echo [步骤 3] 前端分离式构建
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

cd frontend

REM 生成package-lock.json
if not exist "package-lock.json" (
    echo 生成package-lock.json...
    docker run --rm -v %cd%:/app -w /app node:22-alpine sh -c "npm install --package-lock-only"
)

REM Docker构建
echo Docker容器中执行构建...
docker run --rm -v %cd%:/app -w /app node:22-alpine sh -c "npm ci --no-audit --no-fund && npm run build"
if errorlevel 1 (
    echo ❌ 前端构建失败
    cd ..
    pause
    exit /b 1
)

REM 复制到后端
echo 复制构建产物到后端...
if exist "..\backend\frontend\dist" rmdir /s /q "..\backend\frontend\dist"
if not exist "..\backend\frontend" mkdir "..\backend\frontend"
xcopy /E /I /Y dist "..\backend\frontend\dist" >nul

cd ..
echo ✅ 前端构建完成

echo.
pause

REM ========================================
REM Step 4: 构建Docker镜像
REM ========================================
echo.
echo [步骤 4] 构建Docker镜像
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM 选择Dockerfile
set DOCKERFILE=docker\Dockerfile.simple
if not exist "%DOCKERFILE%" set DOCKERFILE=backend\Dockerfile.simple
if not exist "%DOCKERFILE%" (
    echo ❌ 找不到Dockerfile
    pause
    exit /b 1
)

echo 使用Dockerfile: %DOCKERFILE%
echo 构建镜像: %SITE_ID%:latest

docker build -f "%DOCKERFILE%" -t "%SITE_ID%:latest" .\backend
if errorlevel 1 (
    echo ❌ Docker镜像构建失败
    pause
    exit /b 1
)

echo ✅ Docker镜像构建完成

echo.
pause

REM ========================================
REM Step 5: 网络配置
REM ========================================
echo.
echo [步骤 5] 配置Docker网络
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo 确保网络存在...
docker network create webproxy 2>nul
docker network create shared_net 2>nul

REM 检查postgres_master
docker ps | findstr postgres_master >nul
if not errorlevel 1 (
    echo ✅ PostgreSQL总系统运行中
) else (
    echo ⚠️  警告：PostgreSQL总系统未运行
    echo 如果需要数据库功能，请先启动PostgreSQL
)

echo ✅ 网络配置完成

echo.
pause

REM ========================================
REM Step 6: 停止旧容器
REM ========================================
echo.
echo [步骤 6] 停止旧容器
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

docker ps -a | findstr "%SITE_ID%" >nul
if not errorlevel 1 (
    echo 停止旧容器: %SITE_ID%
    docker stop %SITE_ID% 2>nul
    docker rm %SITE_ID% 2>nul
    echo ✅ 旧容器已清理
) else (
    echo 没有需要清理的旧容器
)

echo.
pause

REM ========================================
REM Step 7: 启动新容器
REM ========================================
echo.
echo [步骤 7] 启动新容器
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo 启动容器: %SITE_ID%
docker run -d --name "%SITE_ID%" --network webproxy --env-file backend\.env --restart unless-stopped "%SITE_ID%:latest"
if errorlevel 1 (
    echo ❌ 容器启动失败
    pause
    exit /b 1
)

echo ✅ 容器启动成功

echo 连接到数据库网络...
docker network connect shared_net "%SITE_ID%" 2>nul

echo ✅ 网络配置完成

echo.
pause

REM ========================================
REM Step 8: 等待启动
REM ========================================
echo.
echo [步骤 8] 等待服务启动
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo 等待15秒让服务完全启动...
timeout /t 15 /nobreak >nul

echo.
pause

REM ========================================
REM Step 9: 健康检查
REM ========================================
echo.
echo [步骤 9] 健康检查和验证
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo 容器状态:
docker ps | findstr "%SITE_ID%"

echo.
echo 容器日志 (最近20行):
docker logs "%SITE_ID%" --tail 20

echo.
REM 获取容器IP
for /f "tokens=*" %%i in ('docker inspect %SITE_ID% ^| findstr "IPAddress" ^| findstr /v "Secondary" ^| findstr /v """" ^| findstr /r "[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*"') do (
    set LINE=%%i
    for /f "tokens=2 delims=:" %%j in ("!LINE!") do (
        set IP=%%j
        set CONTAINER_IP=!IP:~2,-2!
    )
)

echo 容器IP: !CONTAINER_IP!

REM 健康检查
if not "!CONTAINER_IP!"=="" (
    echo.
    echo 执行健康检查...
    timeout /t 3 /nobreak >nul
    curl -f -s http://!CONTAINER_IP!:3000/health >nul 2>&1
    if not errorlevel 1 (
        echo ✅ 健康检查通过！
        curl -s http://!CONTAINER_IP!:3000/health
    ) else (
        echo ⚠️  健康检查失败（服务可能还在启动）
    )
)

echo.
pause

REM ========================================
REM 部署完成
REM ========================================
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║                   ✅ 部署成功！                               ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

echo ━━━ 访问信息 ━━━
echo 容器名称: %SITE_ID%
echo 容器IP: !CONTAINER_IP!
echo 内部端口: 3000
echo 健康检查: curl http://!CONTAINER_IP!:3000/health
echo.

echo ━━━ 后续步骤 ━━━
echo 1. 配置Nginx Proxy Manager
echo 2. 验证访问
echo 3. 监控和管理
echo.

echo ━━━ 重要提醒 ━━━
echo ⚠️  请修改默认密码和密钥！
echo    - JWT_SECRET: backend\.env
echo    - 数据库密码: backend\.env
echo.

echo 🎉 部署流程完成！
echo.

REM 保存部署信息
echo 部署信息 > .deploy-info-%SITE_ID%.txt
echo ======================================== >> .deploy-info-%SITE_ID%.txt
echo 部署时间: %date% %time% >> .deploy-info-%SITE_ID%.txt
echo 站点ID: %SITE_ID% >> .deploy-info-%SITE_ID%.txt
echo 容器IP: !CONTAINER_IP! >> .deploy-info-%SITE_ID%.txt
echo 镜像: %SITE_ID%:latest >> .deploy-info-%SITE_ID%.txt
echo ======================================== >> .deploy-info-%SITE_ID%.txt

echo 部署信息已保存到: .deploy-info-%SITE_ID%.txt
echo.

pause

