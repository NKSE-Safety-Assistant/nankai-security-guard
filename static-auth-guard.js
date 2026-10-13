(function () {
  var isGithubPages = location.hostname.endsWith(".github.io");
  if (!isGithubPages) return;

  var page = location.pathname.split("/").pop() || "index.html";
  var roleByPage = {
    "admin.html": "admin",
    "editor.html": "editor",
    "reviewer.html": "reviewer"
  };
  var role = roleByPage[page];

  if (role) {
    var base = location.pathname.slice(0, location.pathname.length - page.length);
    location.replace(base + "admin-login.html?role=" + encodeURIComponent(role) + "&next=" + encodeURIComponent(page));
  }
})();
