# 部署说明

当前网页端只保留真正需要网页承载的页面：

- index.html：跳转到 `knowledge.html`。Node.js 服务上的学习页会先验证学生的飞书身份。
- knowledge.html：安全答题与三角色学习模式。
- help.html：一键求助页面。
- editor.html：编辑员工作台。
- reviewer.html：审核员工作台。

政策问答由飞书机器人直接承载，隐患上报由飞书表单直接承载，网页端不再保留首页或对应中转页面。

GitHub Pages 用于静态演示，只发布前端资源以及演示用的 `data/safety-cases.json`、`data/quiz-questions.json` 和 `data/demo-learning-tasks.json`。飞书回调、工作台和 MySQL 学习记录由 Node.js 服务提供。

## 工作人员飞书网页登录

1. 在南开大学飞书组织下创建并发布企业自建应用，将管理员、编辑员和审核员加入应用可用范围。在「开发配置 → 安全设置」登记与 `FEISHU_REDIRECT_URI` 完全一致的重定向 URL。生产环境使用站点的 HTTPS 域名。本地联调时，如果开放平台接受本地地址，可登记 `http://localhost:8021/api/auth/callback`，并用 `http://localhost:8021` 打开本站。浏览器访问的主机名和回调主机名须一致。
2. 参考 `.env.example`，在当前项目的 `.env` 填写下列配置。`FEISHU_TENANT_KEY` 可留空，填入南开大学组织的 `tenant_key` 后会额外校验租户。`SESSION_SECRET` 可用 `node -p "require('node:crypto').randomBytes(32).toString('hex')"` 生成。`FEISHU_SCOPE` 可留空，应用需要额外业务权限时再按需填写。正式开放前确认工作人员已修改默认密码。

   ```dotenv
   FEISHU_APP_ID=
   FEISHU_APP_SECRET=
   FEISHU_TENANT_KEY=
   PUBLIC_BASE_URL=http://localhost:8021
   FEISHU_REDIRECT_URI=http://localhost:8021/api/auth/callback
   SESSION_SECRET=
   ```

3. 以 MySQL 模式运行 `npm start`，打开 `/admin-login.html`，选择身份并点击「飞书授权登录」。首次授权时，「无工作台权限」页面会显示该应用返回的飞书 `open_id`。用现有管理员账号进入「角色管理」，绑定飞书用户 ID 并启用相应角色。后端确认账号已绑定、已启用且有对应角色后才签发本站会话。更换 App ID 时，同一个人的 `open_id` 可能变化，需要重新核对关联。
4. 用已授权工作人员、未绑定账号、停用账号和选择了错误角色的工作人员分别验收。只有已启用且角色匹配的账号能进入对应工作台。如果填写了 `FEISHU_TENANT_KEY`，另需验证租户不匹配时会拒绝登录。站点升级后已有会话需重新登录。OAuth 发起和回调由同一个 Node.js 进程处理。

## 学生飞书登录

把飞书机器人菜单里的日常学习链接设为 Node.js 服务的 HTTPS 地址加 `/knowledge.html`，并登记同一域名下的 `/api/auth/callback`。应用可用范围需要覆盖目标学生。首次进入时跳转飞书授权，授权成功后按 `open_id` 自动建立学习档案。学生首次查看学习任务时填写学段和入学年份，已有资料的学生直接查看匹配任务。学生身份只用于学习，工作人员权限由「角色管理」单独授权。

个人成绩和任务完成情况按飞书账号保存。原有访客答题数据保留在数据库中，个人学习统计忽略这些记录。

飞书接口参考 [获取访问凭证](https://open.feishu.cn/document/server-docs/api-call-guide/calling-process/get-access-token?lang=zh-CN) 和 [获取 user_access_token](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/authentication-management/access-token/get-user-access-token)。
