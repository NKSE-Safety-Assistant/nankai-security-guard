// Separate student pages share the original tested learning engine.
// Navigation uses real HTML pages; no tab routing or dynamic page injection.
document.querySelectorAll('.student-main-nav a').forEach(a => { if (a.getAttribute('href') === location.pathname.split('/').pop()) a.setAttribute('aria-current','page'); });
