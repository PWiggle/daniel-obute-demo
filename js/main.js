(function () {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".menu-toggle");
  const mobileNav = document.querySelector(".mobile-nav");
  const closeBtn = document.querySelector(".mobile-nav-close");

  function setOpen(open) {
    if (!mobileNav || !toggle) return;
    mobileNav.classList.toggle("open", open);
    toggle.classList.toggle("open", open);
    document.body.style.overflow = open ? "hidden" : "";
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  toggle?.addEventListener("click", () => setOpen(!mobileNav.classList.contains("open")));
  closeBtn?.addEventListener("click", () => setOpen(false));
  mobileNav?.addEventListener("click", (e) => {
    if (e.target === mobileNav) setOpen(false);
  });
  mobileNav?.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));

  window.addEventListener("scroll", () => {
    header?.classList.toggle("scrolled", window.scrollY > 12);
  }, { passive: true });

  // Reveal on scroll
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  // Lightbox for gallery
  const lightbox = document.querySelector(".lightbox");
  const lbImg = lightbox?.querySelector("img");
  const lbClose = lightbox?.querySelector(".lightbox-close");
  document.querySelectorAll("[data-lightbox]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const src = el.getAttribute("href") || el.querySelector("img")?.src;
      if (!src || !lightbox || !lbImg) return;
      lbImg.src = src;
      lightbox.classList.add("open");
      document.body.style.overflow = "hidden";
    });
  });
  function closeLb() {
    lightbox?.classList.remove("open");
    document.body.style.overflow = "";
  }
  lbClose?.addEventListener("click", closeLb);
  lightbox?.addEventListener("click", (e) => { if (e.target === lightbox) closeLb(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeLb(); setOpen(false); } });

  // Portfolio filters
  const filters = document.querySelectorAll(".filter-btn");
  const items = document.querySelectorAll(".masonry-item");
  filters.forEach((btn) => {
    btn.addEventListener("click", () => {
      filters.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const f = btn.dataset.filter;
      items.forEach((item) => {
        const show = f === "all" || item.dataset.cat === f;
        item.style.display = show ? "" : "none";
      });
    });
  });

  // Demo contact forms — open mailto
  document.querySelectorAll("form[data-contact]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const name = (fd.get("name") || "").toString().trim();
      const email = (fd.get("email") || "").toString().trim();
      const message = (fd.get("message") || "").toString().trim();
      const subject = encodeURIComponent(`Commission inquiry from ${name || "website"}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
      window.location.href = `mailto:danielobute21@gmail.com?subject=${subject}&body=${body}`;
    });
  });
})();
