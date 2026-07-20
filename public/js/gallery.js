(function () {
  const items = document.querySelectorAll(".gallery-item");
  if (!items.length) return;

  const lb = document.createElement("div");
  lb.className = "lightbox";
  lb.setAttribute("role", "dialog");
  lb.setAttribute("aria-modal", "true");
  lb.setAttribute("aria-label", "Image preview");
  lb.innerHTML =
    '<button type="button" class="lightbox-close" aria-label="Close">&times;</button>' +
    "<img alt=\"\">";
  document.body.appendChild(lb);

  const img = lb.querySelector("img");
  const closeBtn = lb.querySelector(".lightbox-close");

  function open(src, alt) {
    img.src = src;
    img.alt = alt || "";
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function close() {
    lb.classList.remove("open");
    img.removeAttribute("src");
    document.body.style.overflow = "";
  }

  items.forEach((item) => {
    item.setAttribute("tabindex", "0");
    item.setAttribute("role", "button");
    const thumb = item.querySelector("img");

    function activate() {
      if (!thumb) return;
      open(thumb.currentSrc || thumb.src, thumb.alt || "");
    }

    item.addEventListener("click", activate);
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activate();
      }
    });
  });

  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    close();
  });
  lb.addEventListener("click", (e) => {
    if (e.target === lb) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lb.classList.contains("open")) close();
  });
})();
