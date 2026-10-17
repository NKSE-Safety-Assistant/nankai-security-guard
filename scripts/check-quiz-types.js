const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const element = () => ({ textContent: '', className: '', append() {}, replaceChildren() {}, classList: { add() {}, toggle() {} }, setAttribute() {} });
const buttons = Array.from({ length: 4 }, element);
const context = { document: { createElement: element }, quizOptions: { querySelectorAll: () => buttons }, quizFeedback: element(), nextQuestion: element(), quizScore: element() };
vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('function normalizeQuizQuestion'), source.indexOf('async function loadQuizQuestions')), context);
vm.runInContext(source.slice(source.indexOf('function chooseAnswer'), source.indexOf('function setStoryPhase')), context);
const bank = JSON.parse(fs.readFileSync(path.join(root, 'data/quiz-questions.json'), 'utf8')).questions;
assert.equal(bank.length, 315);
for (const question of bank) assert(context.normalizeQuizQuestion(question), 'Unsupported question: ' + question.id);
for (const question of [bank.find(q => q.type === 'single'), bank.find(q => q.type === 'boolean'), bank.find(q => q.type === 'multiple')]) {
  const correct = Array.isArray(question.answer) ? question.answer : [question.answer];
  for (const [selected, expected] of [[correct, true], [[], false], ...(correct.length > 1 ? [[correct.slice(1), false]] : [])]) {
    Object.assign(context, { quizQuestions: [question], quizIndex: 0, answered: false, quizAttempts: [], quizPoints: 0, quizSelections: [] });
    context.submitQuizAnswer(selected);
    assert.equal(context.quizAttempts[0].correct, expected, question.type);
  }
  if (Array.isArray(question.answer)) {
    Object.assign(context, { quizQuestions: [question], quizIndex: 0, answered: false, quizSelections: [] });
    context.chooseAnswer(correct[0]);
    assert.equal(context.answered, false);
    assert.equal(context.quizSelections.length, 1);
    context.chooseAnswer(correct[0]);
    assert.equal(context.quizSelections.length, 0);
  }
}
console.log('315题前端兼容验证通过；单选、判断、多选评分与多选切换验证通过。');
