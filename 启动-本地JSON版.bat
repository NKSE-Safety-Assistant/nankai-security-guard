@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo [错误] 未找到 Node.js。请先安装 Node.js 18 或更高版本。
  echo https://nodejs.org/
  pause
  exit /b 1
)
set "DB_MODE=json"
set "PORT=8021"
echo 正在启动南开校园安全卫士...
echo 启动后请访问 http://localhost:8021/
start "" "http://localhost:8021/"
node server.js
pause

