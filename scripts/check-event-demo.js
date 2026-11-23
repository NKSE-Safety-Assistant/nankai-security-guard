const baseUrl = process.env.DEMO_BASE_URL || 'http://127.0.0.1:8021';

async function readJson(pathname) {
  const response = await fetch(baseUrl + pathname, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${pathname} 返回 ${response.status}`);
  return response.json();
}

async function readPage(pathname, expectedText) {
  const response = await fetch(baseUrl + pathname, { cache: 'no-store' });
  const text = await response.text();
  if (!response.ok) throw new Error(`${pathname} 返回 ${response.status}`);
  if (!text.includes(expectedText)) throw new Error(`${pathname} 缺少“${expectedText}”`);
}

function pass(label, detail) {
  console.log(`  [通过] ${label}${detail ? `：${detail}` : ''}`);
}

(async () => {
  console.log('\n南开校园安全卫士 · 消防活动演示自检\n');

  const health = await readJson('/api/health');
  if (health.service !== 'nankai-security-guard' || health.databaseMode !== 'mysql') throw new Error('服务未以 MySQL 模式启动');
  pass('服务与数据库模式', 'MySQL');

  const learningPage = await fetch(baseUrl + '/knowledge.html', { redirect: 'manual' });
  if (learningPage.status !== 302 || learningPage.headers.get('location') !== '/api/auth/login?role=student') {
    throw new Error('学生学习入口未跳转到飞书认证');
  }
  pass('学生学习入口要求飞书登录');

  await readPage('/help.html', '一键求助');
  pass('一键求助页面');

  const bank = await readJson('/data/quiz-questions.json');
  const questions = Array.isArray(bank.questions) ? bank.questions : [];
  const fireQuestions = questions.filter((item) => item.category === '消防安全');
  if (questions.length < 1) throw new Error('题库为空');
  if (fireQuestions.length < 10) throw new Error(`消防安全题目仅 ${fireQuestions.length} 道`);
  pass('消防题库', `${fireQuestions.length} 道消防题，题库共 ${questions.length} 道`);

  const taskResponse = await fetch(baseUrl + '/api/quiz-task/active');
  if (taskResponse.status !== 401) throw new Error('学习任务接口未要求学生登录');
  pass('个人学习任务接口要求学生登录');

  const cases = await readJson('/api/cases?status=approved');
  const bundledCases = await readJson('/data/safety-cases.json');
  const caseItems = Array.isArray(cases) ? cases : Array.isArray(cases.cases) ? cases.cases : [];
  const bundledItems = Array.isArray(bundledCases.cases) ? bundledCases.cases : [];
  const mergedCases = new Map();
  [...caseItems, ...bundledItems].forEach((item) => {
    const key = item.id || `${item.safetyType || ''}::${item.campusScene || ''}::${item.title || ''}`;
    if (!mergedCases.has(key)) mergedCases.set(key, item);
  });
  const priority = (item) => {
    if (item.id === 'fire-dorm-electric-001' || item.campusScene === '宿舍用电') return 0;
    if (item.id === 'fire-lab-electrical-smoke-002') return 1;
    if (item.id === 'fire-evacuation-blocked-003') return 2;
    if (item.safetyType === '消防安全') return 3;
    return 4;
  };
  const visibleCases = [...mergedCases.values()]
    .filter((item) => item.reviewStatus === 'approved')
    .sort((left, right) => priority(left) - priority(right))
    .slice(0, 10);
  const fireCases = visibleCases.filter((item) => item.safetyType === '消防安全');
  if (visibleCases.length !== 10) throw new Error(`情景数量为 ${visibleCases.length}，应为 10`);
  if (fireCases.length < 3) throw new Error(`消防情景仅 ${fireCases.length} 个`);
  if (visibleCases.slice(0, 3).some((item) => item.safetyType !== '消防安全')) throw new Error('前 3 个情景未全部按消防主题排序');
  pass('安全案例', `${visibleCases.length} 条可展示案例，前 3 个均为不同消防情景`);

  console.log('\n自检完成。个人任务和成绩请用飞书学生账号验收。\n');
})().catch((error) => {
  console.error(`\n  [失败] ${error.message}`);
  console.error('  请确认 MySQL 服务和本地项目均已启动，再重新运行自检。\n');
  process.exitCode = 1;
});
