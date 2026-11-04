const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const fail = (message) => { throw new Error(message); };
const pass = (message) => console.log(`  [通过] ${message}`);

function priority(item) {
  if (item.id === 'fire-dorm-electric-001' || item.campusScene === '宿舍用电') return 0;
  if (item.id === 'fire-lab-electrical-smoke-002') return 1;
  if (item.id === 'fire-evacuation-blocked-003') return 2;
  if (item.safetyType === '消防安全') return 3;
  return 4;
}

function checkCases() {
  const document = readJson('data/safety-cases.json');
  const approved = (document.cases || [])
    .filter((item) => item.reviewStatus === 'approved')
    .sort((left, right) => priority(left) - priority(right))
    .slice(0, 10);
  if (approved.length !== 10) fail(`静态案例应为 10 个，当前为 ${approved.length} 个`);
  if (new Set(approved.map((item) => item.id)).size !== approved.length) fail('情景 ID 存在重复');
  if (approved.slice(0, 3).some((item) => item.safetyType !== '消防安全')) fail('前 3 个情景未全部按消防主题排序');
  if (new Set(approved.slice(0, 3).map((item) => item.campusScene)).size !== 3) fail('前 3 个消防情景的场景不应重复');
  for (const item of approved) {
    const requiredText = ['id', 'safetyType', 'campusScene', 'title', 'subtitle', 'hook', 'riskyChoice', 'safeChoice', 'helperAction'];
    const missing = requiredText.filter((key) => !String(item[key] || '').trim());
    if (missing.length) fail(`${item.id} 缺少字段：${missing.join('、')}`);
    if (!Array.isArray(item.warningSigns) || item.warningSigns.length < 4) fail(`${item.id} 的风险信号不足 4 条`);
    if (!Array.isArray(item.safeActions) || item.safeActions.length < 4) fail(`${item.id} 的安全动作不足 4 条`);
  }
  pass('10 个情景字段完整，前 3 个为不同消防场景');
}

function checkQuestionsAndStaticTask() {
  const bank = readJson('data/quiz-questions.json');
  const questions = Array.isArray(bank.questions) ? bank.questions : [];
  const ids = new Set();
  for (const item of questions) {
    if (!item.id || ids.has(item.id)) fail(`题目 ID 缺失或重复：${item.id || '空 ID'}`);
    ids.add(item.id);
    if (!Array.isArray(item.options) || ![2, 4].includes(item.options.length)) fail(`${item.id} 的选项数量不正确`);
    const answers = Array.isArray(item.answer) ? item.answer : [item.answer];
    if (!answers.length || answers.some((value) => !Number.isInteger(Number(value)) || Number(value) < 0 || Number(value) >= item.options.length)) fail(`${item.id} 的答案索引不正确`);
  }
  const fireCount = questions.filter((item) => item.category === '消防安全').length;
  if (fireCount < 10) fail(`消防题目仅 ${fireCount} 道`);
  const demoTasks = readJson('data/demo-learning-tasks.json').tasks || [];
  for (const task of demoTasks) {
    const available = questions.filter((item) => task.categories.includes(item.category)).length;
    if (task.questionCount < 5 || task.questionCount > 30 || task.questionCount > available) fail(`${task.id} 的题量配置不可用`);
    if (!Number.isInteger(task.passScore) || task.passScore < 0 || task.passScore > 100) fail(`${task.id} 的合格分数不正确`);
  }
  pass(`${questions.length} 道题结构有效，其中消防题 ${fireCount} 道`);
  pass('静态演示学习任务可完成');
}

function checkDeploymentFiles() {
  const required = [
    'server.js', 'db-adapter.js', 'knowledge.html', 'admin-login.html', 'admin.html', 'editor.html', 'reviewer.html',
    'styles.css', 'app.js', 'assets/nankai-security-logo.png', 'database/nankai_security_guard_full.sql', '.env.example', '.env.mysql.example'
  ];
  const missing = required.filter((relativePath) => !fs.existsSync(path.join(root, relativePath)));
  if (missing.length) fail(`部署文件缺失：${missing.join('、')}`);
  const knowledgeHtml = fs.readFileSync(path.join(root, 'knowledge.html'), 'utf8');
  if (!knowledgeHtml.includes('20261104-nankai-logo-large')) fail('知识学习页未更新静态资源版本，部署后可能继续使用旧缓存');
  const brandedPages = ['knowledge.html', 'help.html', 'help/index.html', 'admin-login.html', 'admin.html', 'editor.html', 'reviewer.html', 'help_new.html'];
  for (const relativePath of brandedPages) {
    const html = fs.readFileSync(path.join(root, relativePath), 'utf8');
    if (!html.includes('nankai-security-logo.png')) fail(`${relativePath} 尚未使用新版南开标识`);
  }
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  if (!/story-visual::after\s*\{[^}]*display:\s*none/s.test(css)) fail('情景封面的无意义占位装饰尚未禁用');
  pass('部署文件、新版南开标识、缓存版本和情景封面样式完整');
}

try {
  console.log('\n南开校园安全卫士 · 部署前离线检查\n');
  checkCases();
  checkQuestionsAndStaticTask();
  checkDeploymentFiles();
  console.log('\n离线检查完成。启动 MySQL 服务后请继续运行 scripts/check-event-demo.js。\n');
} catch (error) {
  console.error(`\n  [失败] ${error.message}\n`);
  process.exitCode = 1;
}
