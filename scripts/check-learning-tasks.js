const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const source = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
let profile = { grade: '2026', studyStage: '研究生', status: 'active' };
const session = { feishuUserId: 'test-student', name: '测试' };
const task = { id: 'test-task', status: 'active', targetScope: '本科生 2026 级、研究生 2026 级', questionCount: 2, categories: ['消防安全'], passScore: 80 };
const questions = [
  { id: 'single', category: '消防安全', options: ['A', 'B'], answer: 1 },
  { id: 'multi', category: '消防安全', options: ['A', 'B', 'C', 'D'], answer: [0, 2] },
];
const records = [];
const context = {
  Date, crypto: require('crypto'),
  dbAdapter: {
    mysqlEnabled: () => true,
    findMysqlStudentProfileByFeishuId: () => profile,
    readMysqlQuizTasks: () => [task],
    readMysqlQuizQuestions: () => questions,
    insertMysqlQuizAttempt: (attempt, answers) => records.push({ attempt, answers }),
  },
  requireApiRole: () => session,
  readRequestBody: async (request) => request.body,
  sendJson: (response, status, body) => Object.assign(response, { status, body }),
};
vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('function eligibleQuizTasks'), source.indexOf('async function handleApi')), context);
const branch = source.slice(source.indexOf('  if (url.pathname === "/api/quiz-attempts"'), source.indexOf('  if (url.pathname === "/api/admin/quiz-bank"'));
vm.runInContext('async function submit(request,response,url) {' + branch + '}', context);
async function submit(body) {
  const response = {};
  await context.submit({ method: 'POST', body }, response, { pathname: '/api/quiz-attempts' });
  return response;
}
(async () => {
  assert.equal(context.eligibleQuizTasks(session).length, 1);
  profile = { ...profile, grade: '2025' };
  assert.equal(context.eligibleQuizTasks(session).length, 0);
  profile = { ...profile, grade: '2026' };
  const answers = [{ questionId: 'single', selectedAnswer: [1] }, { questionId: 'multi', selectedAnswer: [2, 0] }];
  assert.equal((await submit({ taskId: task.id, answers })).status, 201);
  assert.equal(records[0].attempt.taskId, task.id);
  assert.equal(records[0].attempt.score, 100);
  assert.equal((await submit({ answers })).status, 201);
  assert.equal(records[1].attempt.taskId, '');
  assert.equal((await submit({ taskId: task.id, answers: answers.slice(0, 1) })).status, 422);
  profile = { ...profile, grade: '2025' };
  assert.equal((await submit({ taskId: task.id, answers })).status, 422);
  profile = { ...profile, grade: '2026' };
  task.status = 'closed';
  assert.equal((await submit({ taskId: task.id, answers })).status, 422);
  assert.equal(records.length, 2);
  console.log('通过：学段年级匹配、任务完整提交、多选计分、日常独立记录、未完成/不匹配/已结束任务拦截。');
})().catch((error) => { console.error(error); process.exitCode = 1; });
