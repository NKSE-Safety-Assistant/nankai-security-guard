/* Role-specific case presentation; all field names and business handlers are retained. */
(() => {
  const editor = location.pathname.endsWith('/editor.html');
  const detail = document.querySelector('#adminReviewDetail');
  const list = document.querySelector('#adminReviewList');
  function disclosure(element, title) {
    if (!element || element.parentElement.classList.contains('case-source-disclosure')) return;
    if (element.tagName === 'DETAILS') { element.classList.add('case-source-disclosure'); return; }
    const details = document.createElement('details'); details.className = 'case-source-disclosure';
    const summary = document.createElement('summary'); summary.textContent = title;
    element.before(details); details.append(summary,element);
  }
  function enhanceDetail() {
    if (!detail.firstElementChild || detail.firstElementChild.dataset.caseEnhanced) return;
    detail.firstElementChild.dataset.caseEnhanced = 'true';
    disclosure(detail.querySelector('.admin-source-capture'), '采集原文与来源依据');
    const form = detail.querySelector('#caseEditForm');
    if (form) {
      disclosure(form.querySelector('.editor-writing-guide'), '查看案例整理标准与写作示例');
      form.querySelector(':scope > strong')?.remove();
      const fieldGroups = [
        ['基础信息与来源', ['.admin-edit-grid','textarea[name="title"]','input[name="title"]']],
        ['材料脱敏', ['.source-redaction-editor','textarea[name="desensitization"]']],
        ['编写情景', ['textarea[name="hook"]','textarea[name="escalation"]']],
        ['风险识别与安全动作', ['textarea[name="warningSigns"]','textarea[name="safeActions"]']]
      ];
      const anchor = form.querySelector('.editor-live-check') || form.querySelector('button[type="submit"]');
      const navigation = document.createElement('nav'); navigation.className = 'case-section-nav'; navigation.setAttribute('aria-label', '案例编辑分区');
      fieldGroups.forEach(([title,selectors], index) => {
        const nodes = selectors.map(selector => { const el = form.querySelector(selector); return el?.matches('input,textarea') ? el.closest('label') : el; }).filter(Boolean);
        if (!nodes.length) return;
        const group = document.createElement('fieldset'); group.className = 'case-form-group'; group.id = `case-section-${index}`;
        const link = document.createElement('button'); link.type = 'button'; link.textContent = title;
        link.addEventListener('click', () => { group.scrollIntoView({block:'start',behavior:'auto'}); group.querySelector('input,select,textarea')?.focus({preventScroll:true}); }); navigation.append(link);
        const legend = document.createElement('legend'); legend.textContent = title;
        const fields = document.createElement('div'); fields.className = 'case-form-fields'; nodes.forEach(node => fields.append(node));
        group.append(legend,fields); if (anchor) anchor.before(group); else form.append(group);
      });
      form.prepend(navigation);
    }
    if (!editor && detail.querySelector('#approveCaseButton')) {
      const note = document.createElement('p'); note.className = 'case-action-note';
      note.textContent = '自动检查仅辅助判断。请打开原文核实来源，并检查事实、脱敏和安全建议；需要修改时填写原因后退回。';
      detail.querySelector('.admin-note-label')?.before(note);
    }
    if (!editor) {
      const item = findCase(activeCaseId);
      if (item) {
        const guidance = document.createElement('section'); guidance.className = 'case-guidance-comparison'; guidance.setAttribute('aria-label','风险信号与安全动作核验');
        [['风险信号',item.warningSigns],['安全动作',item.safeActions]].forEach(([title, values]) => {
          const section = document.createElement('div'); const heading = document.createElement('h4'); heading.textContent = title;
          const content = document.createElement('ul'); (values || []).forEach(value => { const li = document.createElement('li'); li.textContent = value; content.append(li); });
          if (!content.children.length) { const li = document.createElement('li'); li.textContent = '尚未填写，请退回编辑员补充。'; content.append(li); }
          section.append(heading,content); guidance.append(section);
        }); detail.querySelector('.admin-checklist')?.before(guidance);
        detail.querySelector('.admin-chip-group')?.remove();
      }
      const actions = document.createElement('div'); actions.className = 'case-evidence-actions';
      [['原文依据','.admin-meta-grid'],['情景内容','.admin-story-preview'],['审核检查','.admin-checklist'],['填写意见','.admin-note-label']].forEach(([label,selector]) => {
        const target = detail.querySelector(selector); if (!target) return;
        const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
        button.addEventListener('click', () => { target.scrollIntoView({block:'start'}); target.querySelector('textarea')?.focus({preventScroll:true}); }); actions.append(button);
      }); detail.querySelector('.admin-detail-head')?.after(actions);
    }
  }
  function enhanceList() {
    document.querySelectorAll(editor ? '[data-editor-status]' : '[data-reviewer-status]').forEach(button => {
      if (!button.closest('.staff-sidebar')) return;
      const selected = button.dataset[editor ? 'editorStatus' : 'reviewerStatus'] === activeStatus;
      button.classList.toggle('active',selected);
      if (selected) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
    });
    const heading = document.querySelector('.admin-review-board .workspace-head h2');
    if (heading) heading.textContent = editor ? ({draft:'待完善案例',revision:'退回修改',review:'已提交审核'})[activeStatus] || '案例列表' : activeStatus === 'approved' ? '已发布案例' : '待审核案例';
    const column = list.closest('.desk-case-column'); if (column) column.hidden = list.hidden;
    const failure = list.querySelector('.admin-error');
    if (failure && !list.querySelector('.case-retry')) {
      const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'secondary-button case-retry'; retry.textContent = '重新加载案例'; retry.addEventListener('click', () => initAdminCases()); failure.after(retry);
    }
    const empty = list.querySelector('.admin-empty'); if (!empty || list.querySelector('.case-empty-guidance')) return;
    empty.remove();
    const section = document.createElement('div'); section.className = 'case-empty-guidance';
    const title = document.createElement('strong'); title.textContent = editor ? ({draft:'暂无待完善案例',revision:'当前没有退回修改的案例',review:'暂无已提交的案例'})[activeStatus] || '当前列表为空' : activeStatus === 'review' ? '当前没有待审核案例' : '当前没有已发布案例';
    const hint = document.createElement('p'); hint.textContent = editor ? '可切换到待完善列表继续整理；新增材料也可通过顶部采集入口获取。' : '编辑员提交案例后将在这里显示，也可查看已发布案例。';
    const button = document.createElement('button'); button.type = 'button'; button.className = 'secondary-button'; button.textContent = editor ? '查看待完善案例' : '查看已发布案例';
    button.addEventListener('click', () => document.querySelector(editor ? '.staff-sidebar-subnav [data-editor-status="draft"]' : '.staff-sidebar-subnav [data-reviewer-status="approved"]')?.click());
    section.append(title,hint,button); list.append(section);
  }
  new MutationObserver(enhanceDetail).observe(detail, {childList:true,subtree:true});
  new MutationObserver(enhanceList).observe(list, {childList:true,attributes:true,attributeFilter:['hidden']});
  enhanceDetail(); enhanceList();
})();
