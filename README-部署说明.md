# 南开校园安全卫士—完整部署包

本包包含网页程序、Node.js 后端、当前 JSON 数据库、MySQL 完整备份及导入脚本。

## 最快运行（推荐）

1. 安装 Node.js 18 或更高版本：<https://nodejs.org/>
2. 解压本包。
3. 双击 `启动-本地JSON版.bat`。
4. 浏览器打开 <http://localhost:8021/>。

此方式不需安装 MySQL，使用 `data` 目录内随包附带的数据。默认关闭飞书 OAuth 强制登录，便于在其他电脑本地演示。

## 用 MySQL 运行

1. 安装 MySQL 8.0 和 Node.js 18+。
2. 双击 `导入-MySQL数据库.bat`，按提示填写 MySQL 账号、密码和数据库名。
3. 复制 `.env.mysql.example` 为 `.env`，填写自己电脑上的 MySQL 连接信息。
4. 在命令行进入本目录，运行 `npm start`。

MySQL 备份位于 `database/nankai_security_guard_full.sql`，含表结构和导出时的全部数据。

## 页面入口

- 知识学习：<http://localhost:8021/knowledge.html>
- 一键求助：<http://localhost:8021/help.html>
- 编辑端：<http://localhost:8021/editor.html>
- 审核端：<http://localhost:8021/reviewer.html>
- 管理端：<http://localhost:8021/admin-login.html>

## 配置和安全

- 本包没有携带原电脑的飞书 App Secret、Webhook 和会话密钥。
- 如需飞书登录或机器人通知，请参考 `.env.mysql.example` 自行填写新环境的配置。
- 正式上线前，请修改管理员口令和 `SESSION_SECRET`，并不要将 `.env` 发布到公开仓库。
- 数据库备份可能含业务数据和用户记录，仅应交给经授权人员。

## 目录说明

- `data/`：JSON 数据库、题库、知识库与同步数据。
- `database/`：MySQL 完整 SQL 备份。
- `scripts/`：数据库初始化、检查和政策同步脚本。
- `docs/`：项目使用手册和开发文档。

## 故障排查

- 提示“未找到 Node.js”：安装 Node.js 后重新打开启动脚本。
- 8021 端口被占用：编辑 `启动-本地JSON版.bat`，将 `PORT=8021` 改为其他端口。
- MySQL 无法连接：检查 `.env` 中 `MYSQL_CLI` 的完整路径和账号信息。

