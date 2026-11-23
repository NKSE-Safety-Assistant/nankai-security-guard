/* Task management: data and mutations continue through the existing authenticated API. */
(() => {
  const panel = document.querySelector('[data-panel="tasks"]');
  const list = document.querySelector('#taskList');
  const detail = panel.querySelector('.admin-v2-detail-panel');
  const filters = { query: '', status: 'all' };
  let returnFocus = null;
  let openRequest = 0;
  document.body.classList.add('task-table-workspace');
  const head = panel.querySelector('.admin-v2-section-head');
  head.innerHTML = '<div><h2>全部学习任务 <span id="taskTotal"></span></h2><p>按主题和状态查找任务，查看配置与完成记录。</p></div><button class="admin-v2-secondary" type="button" id="refreshTasks">刷新列表</button>';
  const toolbar = document.createElement('div'); toolbar.className = 'task-table-toolbar';
  toolbar.innerHTML = '<div class="task-state-tabs" role="group" aria-label="筛选任务状态"><button type="button" data-task-filter="all" aria-pressed="true">全部</button><button type="button" data-task-filter="active" aria-pressed="false">进行中</button><button type="button" data-task-filter="paused" aria-pressed="false">已暂停</button><button type="button" data-task-filter="closed" aria-pressed="false">已结束</button></div><label class="task-search"><span>搜索任务</span><input type="search" id="taskTableSearch" placeholder="任务名称、主题或适用年级" /></label>';
  list.before(toolbar);
  const footer = document.createElement('p'); footer.className = 'task-table-footer'; footer.setAttribute('role','status'); list.after(footer);
  function scopeSummary(value) {
    const groups = {};
    String(value || '').split('、').forEach(part => {
      const match = part.match(/(本科生|研究生)\s*(\d{4})\s*级/);
      if (match) (groups[match[1]] ||= []).push(match[2]);
    });
    if (!Object.keys(groups).length) return value || '未设置';
    return Object.entries(groups).map(([stage, years]) => {
      const sorted = [...new Set(years)].sort();
      const consecutive = sorted.length > 1 && sorted.every((year,index) => index === 0 || Number(year) === Number(sorted[index - 1]) + 1);
      const label = consecutive ? `${sorted[0]}–${sorted.at(-1)}` : sorted.join('、');
      return `${stage} ${label}级`;
    }).join('\n');
  }
  function renderTable() {
    const tasks = state.tasks.filter(task => (filters.status === 'all' || task.status === filters.status) && `${task.title} ${task.targetScope} ${(task.categories || []).join(' ')}`.toLowerCase().includes(filters.query));
    document.querySelector('#taskTotal').textContent = state.tasks.length;
    toolbar.querySelectorAll('[data-task-filter]').forEach(button => { const selected = button.dataset.taskFilter === filters.status; button.setAttribute('aria-pressed', String(selected)); const count = state.tasks.filter(task => button.dataset.taskFilter === 'all' || task.status === button.dataset.taskFilter).length; button.textContent = `${({all:'全部',active:'进行中',paused:'已暂停',closed:'已结束'})[button.dataset.taskFilter]} ${count}`; });
    list.innerHTML = tasks.length ? `<table class="task-management-table"><caption class="visually-hidden">学习任务及其发布状态</caption><thead><tr><th scope="col">任务名称 / 学习主题</th><th scope="col">适用对象</th><th scope="col">答题要求</th><th scope="col">截止时间</th><th scope="col">状态</th><th scope="col">操作</th></tr></thead><tbody>${tasks.map(task => `<tr><td><button class="task-name-button" type="button" data-open-task="${escapeHtml(task.id)}">${escapeHtml(task.title)}</button><span class="task-theme">${escapeHtml(task.categories.join('、'))}</span></td><td class="task-scope-cell">${escapeHtml(scopeSummary(task.targetScope))}</td><td><span>${task.questionCount} 题</span><small>${task.passScore} 分合格</small></td><td>${task.endsAt ? escapeHtml(formatTime(task.endsAt)) : '<span class="task-muted">长期有效</span>'}</td><td><span class="task-state ${escapeHtml(task.status)}">${escapeHtml(statusText[task.status] || task.status)}</span></td><td><button class="task-view-button" type="button" data-open-task="${escapeHtml(task.id)}" aria-label="查看${escapeHtml(task.title)}详情">查看详情</button></td></tr>`).join('')}</tbody></table>` : '<div class="task-table-empty"><strong>没有符合条件的任务</strong><p>调整搜索条件，或新建一项学习任务。</p><button type="button" class="admin-v2-secondary" id="resetTaskFilters">清除筛选</button></div>';
    footer.textContent = `共 ${state.tasks.length} 项任务，当前显示 ${tasks.length} 项。`;
    list.querySelectorAll('[data-open-task]').forEach(button => button.addEventListener('click', () => openDrawer(button.dataset.openTask, button)));
    list.querySelector('#resetTaskFilters')?.addEventListener('click', () => { filters.query = ''; filters.status = 'all'; document.querySelector('#taskTableSearch').value = ''; renderTable(); });
  }
  // Replace only the task presentation; analytics retains its own compact selector list.
  renderTaskList = renderTable;
  renderAnalyticsTaskList = () => {
    document.querySelector('#analyticsTaskList').innerHTML = state.tasks.map(task => `<button class="admin-v2-task-row ${task.id === state.task?.id ? 'selected' : ''}" type="button" data-analytics-task-id="${escapeHtml(task.id)}"><span class="admin-v2-task-status ${escapeHtml(task.status)}">${escapeHtml(statusText[task.status] || task.status)}</span><strong>${escapeHtml(task.title)}</strong><small>${escapeHtml(task.targetScope)}</small></button>`).join('');
  };
  toolbar.addEventListener('click', event => { const button = event.target.closest('[data-task-filter]'); if (button) { filters.status = button.dataset.taskFilter; renderTable(); } });
  document.querySelector('#taskTableSearch').addEventListener('input', event => { filters.query = event.target.value.trim().toLowerCase(); renderTable(); });
  document.querySelector('#refreshTasks').addEventListener('click', async event => { const button = event.currentTarget; button.disabled = true; button.textContent = '刷新中…'; try { await loadOverview(state.task?.id || ''); } finally { button.disabled = false; button.textContent = '刷新列表'; } });
  const scrim = document.createElement('div'); scrim.className = 'task-drawer-scrim'; scrim.hidden = true; document.body.append(scrim);
  detail.classList.add('task-detail-drawer'); detail.setAttribute('role','dialog'); detail.setAttribute('aria-modal','true'); detail.setAttribute('aria-labelledby','taskDrawerHeading'); detail.hidden = true;
  const drawerHead = document.createElement('div'); drawerHead.className = 'task-drawer-heading'; drawerHead.innerHTML = '<h2 id="taskDrawerHeading">任务详情</h2><button type="button" id="closeTaskDrawer" aria-label="关闭任务详情">关闭</button>'; detail.prepend(drawerHead);
  const pending = document.createElement('p'); pending.className = 'task-drawer-pending'; pending.setAttribute('role','status'); pending.hidden = true; drawerHead.after(pending);
  function closeDrawer() { openRequest++; detail.hidden = true; scrim.hidden = true; document.body.classList.remove('task-drawer-open'); if (returnFocus?.isConnected) returnFocus.focus(); else document.querySelector('#taskTableSearch').focus(); }
  async function openDrawer(id, trigger) {
    const request = ++openRequest; returnFocus = trigger; detail.hidden = false; scrim.hidden = false; document.body.classList.add('task-drawer-open'); pending.textContent = '正在读取任务详情…'; pending.hidden = false; document.querySelector('#taskDetail').hidden = true; document.querySelector('#emptyState').hidden = true; document.querySelector('#closeTaskDrawer').focus();
    const loaded = await loadOverview(id);
    if (request !== openRequest) return;
    if (!loaded || state.task?.id !== id) { document.querySelector('#taskDetail').hidden = true; pending.textContent = '任务读取失败，请关闭后重试。'; return; }
    pending.hidden = true;
  }
  document.querySelector('#closeTaskDrawer').addEventListener('click', closeDrawer); scrim.addEventListener('click', closeDrawer);
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => { if (!detail.hidden) closeDrawer(); document.body.dataset.workspaceView = button.dataset.view; }));
  document.body.dataset.workspaceView = state.view;
  document.addEventListener('keydown', event => {
    if (detail.hidden || !document.querySelector('#taskModal').hidden || !document.querySelector('#passwordModal').hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); closeDrawer(); }
    if (event.key === 'Tab') { const controls = [...detail.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled)')].filter(el => el.getClientRects().length); const first = controls[0], last = controls.at(-1); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } }
  });
  // Give long task configuration a clear reading order without changing field names.
  const grid = document.querySelector('#taskForm .admin-v2-form-grid');
  const labels = [...grid.children]; grid.replaceChildren();
  const groups = [['基本信息',[labels[0],labels[1]]],['答题规则',[labels[2],labels[3]]],['有效时间',[labels[4],labels[5]]]];
  groups.forEach(([title, fields]) => { const fieldset = document.createElement('fieldset'); fieldset.className = 'task-form-group'; const legend = document.createElement('legend'); legend.textContent = title; const row = document.createElement('div'); row.className = 'task-form-fields'; fields.forEach(field => row.append(field)); fieldset.append(legend,row); grid.append(fieldset); });
  const expected = document.querySelector('#taskForm [name="expectedCount"]'); const hint = document.createElement('small'); hint.textContent = '填 0 表示不设目标人数，统计将显示实际完成人数。'; expected.after(hint);
  renderTable(); renderAnalyticsTaskList();
})();
