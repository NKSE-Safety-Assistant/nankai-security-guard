/* Presentation and navigation helpers; existing API and role workflows stay authoritative. */
(() => {
  const admin = document.body.classList.contains('admin-v2-page');
  const navPaths = {
    tasks:'M8 5h11v16H5V5h3m0-2h8v4H8zM9 12h6m-6 4h6',
    analytics:'M4 20h16M7 16v-5m5 5V5m5 11V8',
    'question-bank':'M4 4h7v16H4zM13 4h7v16h-7M7 8h1m8 0h1',
    roles:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m14-18a4 4 0 0 1 0 8m6 10v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    cases:'M14 3H5v18h14V8zm0 0v5h5M8 12h8m-8 4h5',
    logout:'M9 4H4v16h5m5-13 5 5-5 5m-5-5h10'
  };
  document.querySelectorAll('.admin-v2-nav > button,.staff-sidebar-nav > button').forEach(button => {
    const key = button.dataset.view || (button.id.toLowerCase().includes('logout') || button.className.includes('logout') ? 'logout' : 'cases');
    const icon = document.createElementNS('http://www.w3.org/2000/svg','svg'); icon.classList.add('staff-nav-icon'); icon.setAttribute('viewBox','0 0 24 24'); icon.setAttribute('aria-hidden','true');
    const path = document.createElementNS('http://www.w3.org/2000/svg','path'); path.setAttribute('d',navPaths[key] || navPaths.cases); icon.append(path); button.prepend(icon);
  });
  const editor = location.pathname.endsWith('/editor.html');
  const heading = document.querySelector(admin ? '.admin-v2-header > div' : '.admin-toolbar > div');
  const description = document.createElement('p');
  description.className = 'desk-description';
  const descriptions = { tasks: '发布学习任务，跟进学生完成情况与学习成果。', analytics: '按任务查看主题掌握情况，定位需要重点复习的知识。', 'question-bank': '维护题库内容，检查主题分布，追溯每次上传记录。', roles: '管理工作人员身份与授权，明确内容编辑、审核和管理职责。' };
  description.textContent = admin ? descriptions.tasks : editor ? '从待办案例开始，完善情景内容与脱敏材料，再提交审核。' : '核对来源、脱敏与处置建议，完成发布或提出明确修改意见。';
  heading?.append(description);
  const main = document.querySelector('main');
  const utility = document.createElement('div'); utility.className = 'desk-utility';
  const back = document.createElement('a'); back.href = 'knowledge.html'; back.textContent = '返回学生学习页';
  const role = document.createElement('span'); role.textContent = admin ? '管理员 / 安全教育管理' : editor ? '编辑员 / 案例内容编辑' : '审核员 / 案例审核发布';
  utility.append(back, document.createTextNode(' / '), role); main?.prepend(utility);
  if (admin) {
    document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => { description.textContent = descriptions[button.dataset.view] || ''; button.setAttribute('aria-current', 'page'); document.querySelectorAll('[data-view]').forEach(other => { if (other !== button) other.removeAttribute('aria-current'); }); }));
  } else {
    const nav = document.querySelector(editor ? '#caseEditNavButton' : '#caseReviewNavButton');
    const subnav = document.querySelector('.staff-sidebar-subnav');
    if (subnav) subnav.hidden = false;
    nav?.setAttribute('aria-expanded', 'true');
  }
  function addSearch(containerId, selector, label) {
    const container = document.getElementById(containerId); if (!container) return;
    if (!admin) { const column = document.createElement('div'); column.className = 'desk-case-column'; container.before(column); column.append(container); }
    const wrapper = document.createElement('label'); wrapper.className = 'desk-search'; wrapper.textContent = label;
    const input = document.createElement('input'); input.type = 'search'; input.placeholder = admin ? '搜索任务名称、年级或主题' : '搜索案例名称、类型或来源'; input.setAttribute('aria-label', label); wrapper.append(input); container.before(wrapper);
    const empty = document.createElement('p'); empty.className = 'desk-search-empty'; empty.textContent = '没有匹配项，请尝试其他关键词。'; empty.hidden = true; container.after(empty);
    const filter = () => { let visible = 0; const rows = container.querySelectorAll(selector); rows.forEach(row => { const matched = row.textContent.toLocaleLowerCase().includes(input.value.trim().toLocaleLowerCase()); row.hidden = !matched; if (matched) visible++; }); empty.hidden = !rows.length || visible > 0; };
    input.addEventListener('input', filter); new MutationObserver(filter).observe(container, { childList: true, subtree: true });
  }
  if (!admin) addSearch('adminReviewList', '[data-case-id]', '查找当前列表案例');
  if (admin) addSearch('analyticsTaskList', '[data-analytics-task-id]', '查找统计任务');
  let dirtyForm = null;
  if (!admin) {
    document.addEventListener('input', event => { const form = event.target.closest('#caseEditForm') || (event.target.id === 'reviewNote' && (document.querySelector('#caseEditForm') || event.target)); if (form) { dirtyForm = form; const status = document.querySelector('#adminSaveState'); if (status) status.textContent = editor ? '有未保存的修改' : '审核意见尚未提交'; } });
    document.addEventListener('click', event => { const navigation = event.target.closest('[data-case-id],.admin-status-tabs button,.staff-sidebar button,a'); if (navigation && dirtyForm?.isConnected && !window.confirm('当前案例有未保存的修改，确定离开吗？')) { event.preventDefault(); event.stopImmediatePropagation(); } }, true);
    window.addEventListener('beforeunload', event => { if (dirtyForm?.isConnected) { event.preventDefault(); event.returnValue = ''; } });
  }
  const toast = document.querySelector('#adminToast'); toast?.setAttribute('role', 'status');
  document.querySelector('#adminSaveState')?.setAttribute('role','status');
})();
