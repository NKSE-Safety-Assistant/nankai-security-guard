// Regression: the imported hidden panels must also work for assigned tasks.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/js/app.js'), 'utf8');
const sections = ['quiz', 'story'].map(mode => ({
  dataset: { learningSection: mode }, hidden: true,
  classList: { toggle(name, value) { this[name] = value; } }
}));
const context = { learningModeButtons: [], learningSections: sections };
vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('function switchLearningMode('), source.indexOf('function getInitialTab(')), context);
context.switchLearningMode('quiz');
assert.equal(sections[0].hidden, false, '任务答题必须可见');
assert.equal(sections[1].hidden, true);
context.switchLearningMode('story');
assert.equal(sections[0].hidden, true);
assert.equal(sections[1].hidden, false);
context.switchLearningMode('');
assert(sections.every(section => section.hidden), '日常学习入口不应提前展开模式');
const css = fs.readFileSync(path.join(root, 'assets/css/preview-unify.css'), 'utf8');
const covers = [...new Set([...css.matchAll(/url\(["']?([^"')]+\.png)["']?\)/g)].map(match => match[1]).filter(value => value.includes('scenario-covers/')))];
assert.equal(covers.length, 11);
for (const cover of covers) assert(fs.existsSync(path.resolve(root, 'assets/css', cover)), '封面缺失：' + cover);
console.log('学生端任务/日常模式显示切换与11张情景封面检查通过。');
vm.runInContext(source.slice(source.indexOf('const coverClassByCaseId ='), source.indexOf('function caseList(')), context);
assert.equal(context.resolveScenarioCover({id:'case-generated-id',safetyType:'网络安全',campusScene:'钓鱼链接'}),'cover-phishing-login');
assert.equal(context.resolveScenarioCover({id:'fire-dorm-electric-001'}),'cover-dorm-electric');
assert.equal(context.resolveScenarioCover({id:'case-unknown',safetyType:'网络安全',campusScene:'个人信息授权'}),'');
assert.equal(context.resolveScenarioCover({id:'case-event',safetyType:'消防安全',campusScene:'大型活动消防'}),'cover-campus-fire-event');
console.log('动态案例封面匹配通过；无对应素材的情景不会套用无关图片。');
