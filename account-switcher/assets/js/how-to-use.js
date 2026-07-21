(function () {
  const root = document.getElementById("walkthrough");
  if (!root) return;

  const noteEl = document.getElementById("walkthrough-note");

  fetch("assets/how_to_use.json")
    .then(function (res) {
      if (!res.ok) throw new Error("Failed to load how_to_use.json");
      return res.json();
    })
    .then(function (data) {
      if (noteEl && data.note) {
        noteEl.textContent = data.note;
      }

      const steps = data.how_to_use || [];
      root.innerHTML = steps.map(renderStep).join("");
    })
    .catch(function () {
      root.innerHTML =
        '<p class="walkthrough__error">Could not load the usage guide. Please refresh the page.</p>';
    });

  function renderStep(item) {
    const hasImage = Boolean(item.image);
    const mod = hasImage ? " walkthrough__item--visual" : " walkthrough__item--compact";
    const reverse = hasImage && item.step % 2 === 0 ? " walkthrough__item--reverse" : "";

    let visual = "";
    if (hasImage) {
      visual =
        '<figure class="walkthrough__figure">' +
        '<img src="' +
        escapeAttr(item.image) +
        '" alt="' +
        escapeAttr(item.image_alt || item.title) +
        '" loading="lazy" width="384" height="600">' +
        (item.image_secondary
          ? '<img class="walkthrough__figure-secondary" src="' +
            escapeAttr(item.image_secondary) +
            '" alt="' +
            escapeAttr(item.image_secondary_alt || "") +
            '" loading="lazy" width="200">'
          : "") +
        "</figure>";
    }

    return (
      '<article class="walkthrough__item' +
      mod +
      reverse +
      '" aria-labelledby="walk-step-' +
      item.step +
      '">' +
      '<div class="walkthrough__content">' +
      '<span class="walkthrough__num" aria-hidden="true">' +
      String(item.step).padStart(2, "0") +
      "</span>" +
      '<h3 id="walk-step-' +
      item.step +
      '" class="walkthrough__title">' +
      escapeHtml(item.title) +
      "</h3>" +
      '<p class="walkthrough__action">' +
      escapeHtml(item.action) +
      "</p>" +
      '<p class="walkthrough__detail">' +
      escapeHtml(item.detail) +
      "</p>" +
      "</div>" +
      visual +
      "</article>"
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
