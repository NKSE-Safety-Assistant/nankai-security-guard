@echo off
setlocal
cd /d "%~dp0"
where node.exe >nul 2>nul
if errorlevel 1 goto no_node
node.exe scripts\check-event-demo.js
pause
exit /b %errorlevel%

:no_node
echo Node.js 18 or newer is required.
pause
exit /b 1
