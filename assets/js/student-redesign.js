// Student-only presentation layer: existing learning actions remain in app.js.
(function () {
  const open = (entry, mode) => {
    const trigger = document.getElementById(entry === 'tasks' ? 'taskEntryButton' : 'dailyEntryButton');
    if (!trigger) return;
    trigger.click();
    if (entry === 'daily' && mode) document.querySelector(`[data-learning-mode="${mode}"]`)?.click();
    document.querySelector('.knowledge-workspace')?.scrollIntoView({behavior:'smooth', block:'start'});
  };
  document.querySelectorAll('[data-open-entry]').forEach(el => el.addEventListener('click', () => open(el.dataset.openEntry, el.dataset.openMode)));
  const revealHome = () => { if (typeof setLearningEntry === 'function') setLearningEntry('home'); };
  document.querySelectorAll('[data-home-target]').forEach(el => el.addEventListener('click', () => { if (document.body.dataset.studentView !== 'home') revealHome(); }));
  if (window.location.hash === '#studentTopics') setTimeout(() => document.querySelector('#studentTopics')?.scrollIntoView(), 60);
})();
