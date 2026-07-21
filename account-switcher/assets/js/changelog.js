(function () {
  const featuresRoot = document.getElementById("changelog-features");
  const timelineRoot = document.getElementById("changelog-timeline");
  const versionBadge = document.getElementById("changelog-version");

  if (!featuresRoot || !timelineRoot) return;

  fetch("assets/changelog.json")
    .then(function (res) {
      if (!res.ok) throw new Error("Failed to load changelog.json");
      return res.json();
    })
    .then(function (data) {
      if (versionBadge && data.current_version) {
        versionBadge.textContent = "v" + data.current_version;
      }

      featuresRoot.innerHTML = (data.active_features || []).map(renderFeature).join("");
      timelineRoot.innerHTML = (data.releases || []).map(renderRelease).join("");
    })
    .catch(function () {
      featuresRoot.innerHTML = '<p class="changelog__error">Could not load features.</p>';
      timelineRoot.innerHTML = '<p class="changelog__error">Could not load release notes.</p>';
    });

  function renderFeature(item) {
    return (
      '<li class="changelog-feature">' +
      '<span class="changelog-feature__status" aria-label="Active">Active</span>' +
      '<div class="changelog-feature__body">' +
      '<strong class="changelog-feature__name">' +
      escapeHtml(item.name) +
      "</strong>" +
      '<span class="changelog-feature__detail">' +
      escapeHtml(item.detail) +
      "</span>" +
      "</div></li>"
    );
  }

  function renderRelease(item) {
    const label = item.label
      ? '<span class="changelog-release__label">' + escapeHtml(item.label) + "</span>"
      : "";

    const notes = (item.notes || [])
      .map(function (note) {
        return "<li>" + escapeHtml(note) + "</li>";
      })
      .join("");

    return (
      '<article class="changelog-release">' +
      '<div class="changelog-release__marker" aria-hidden="true"></div>' +
      '<div class="changelog-release__card">' +
      '<header class="changelog-release__header">' +
      '<div class="changelog-release__meta">' +
      '<span class="changelog-release__version">v' +
      escapeHtml(item.version) +
      "</span>" +
      label +
      '<time class="changelog-release__date" datetime="' +
      escapeAttr(item.date) +
      '">' +
      escapeHtml(item.date) +
      "</time>" +
      "</div>" +
      '<h3 class="changelog-release__title">' +
      escapeHtml(item.title) +
      "</h3>" +
      "</header>" +
      '<ul class="changelog-release__notes">' +
      notes +
      "</ul>" +
      "</div></article>"
    );
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, "&#39;");
  }
})();
