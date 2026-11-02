@echo off
chcp 65001 >nul
cd /d "%~dp0"
set /p "MYSQL_BIN=MySQL bin 目录（例如 C:\Program Files\MySQL\MySQL Server 8.0\bin）: "
set /p "MYSQL_HOST=主机 [127.0.0.1]: "
if "%MYSQL_HOST%"=="" set "MYSQL_HOST=127.0.0.1"
set /p "MYSQL_PORT=端口 [3306]: "
if "%MYSQL_PORT%"=="" set "MYSQL_PORT=3306"
set /p "MYSQL_USER=用户 [root]: "
if "%MYSQL_USER%"=="" set "MYSQL_USER=root"
set /p "MYSQL_DATABASE=数据库名 [nankai_security_guard]: "
if "%MYSQL_DATABASE%"=="" set "MYSQL_DATABASE=nankai_security_guard"
set /p "MYSQL_PASSWORD=密码: "
if not exist "%MYSQL_BIN%\mysql.exe" (
  echo [错误] 在指定目录中找不到 mysql.exe。
  pause
  exit /b 1
)
set "MYSQL_PWD=%MYSQL_PASSWORD%"
"%MYSQL_BIN%\mysql.exe" -h "%MYSQL_HOST%" -P "%MYSQL_PORT%" -u "%MYSQL_USER%" -e "CREATE DATABASE IF NOT EXISTS `%MYSQL_DATABASE%` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if errorlevel 1 goto :failed
"%MYSQL_BIN%\mysql.exe" -h "%MYSQL_HOST%" -P "%MYSQL_PORT%" -u "%MYSQL_USER%" "%MYSQL_DATABASE%" < "database\nankai_security_guard_full.sql"
if errorlevel 1 goto :failed
set "MYSQL_PWD="
echo [完成] MySQL 数据库已导入。
pause
exit /b 0
:failed
set "MYSQL_PWD="
echo [错误] 导入失败，请检查 MySQL 服务、路径和账号信息。
pause
exit /b 1

