// ── skeleton snapshot (persona swap only) ───────────────────────────────────
const SKELETON_KEY = "rc_skeleton_v1";
const VIEW_ALL_PERSONA = "all";

function isViewAllPersona(persona) {
  return persona === VIEW_ALL_PERSONA;
}

const SKELETON_DEFAULTS = {
  summary: { lines: 4 },
  skills: [
    { titlePct: 55, chipWidths: [88, 72, 80, 64] },
    { titlePct: 48, chipWidths: [84, 76, 58, 90, 54] },
    { titlePct: 62, chipWidths: [68, 84, 100, 62] },
    { titlePct: 50, chipWidths: [80, 90, 68] },
    { titlePct: 44, chipWidths: [64, 80, 92, 58] },
    { titlePct: 58, chipWidths: [74, 86, 68, 88] },
  ],
  jobs: [
    { titleW: 210, posW: 150, dateW: 105, hasGallery: true, lineCount: 4 },
    { titleW: 175, posW: 165, dateW: 90, hasGallery: false, lineCount: 3 },
    { titleW: 230, posW: 130, dateW: 112, hasGallery: false, lineCount: 4 },
  ],
};

function loadSkeletonSnapshot() {
  try {
    const raw = localStorage.getItem(SKELETON_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function captureSkeletonSnapshot() {
  try {
    const snap = { summary: {}, skills: [], jobs: [] };

    const summaryEl = document.getElementById("rc-summary");
    if (summaryEl) {
      const lh = parseFloat(window.getComputedStyle(summaryEl).lineHeight) || 26;
      snap.summary.lines = Math.max(2, Math.round(summaryEl.scrollHeight / lh) - 1);
    }

    document.querySelectorAll("#rc-skills .rc-skill-card").forEach((card) => {
      const cardW = card.getBoundingClientRect().width;
      const h3 = card.querySelector("h3");
      const chips = [...card.querySelectorAll(".rc-chip")];
      snap.skills.push({
        titlePct: h3 && cardW ? Math.round((h3.getBoundingClientRect().width / cardW) * 100) : 50,
        chipWidths: chips.map((c) => Math.round(c.getBoundingClientRect().width)),
      });
    });

    document.querySelectorAll("#rc-experience .rc-job").forEach((job) => {
      const h3 = job.querySelector(".rc-job-header h3");
      const pos = job.querySelector(".rc-position");
      const dates = job.querySelector(".rc-job-dates");
      const lis = job.querySelectorAll(".rc-accomplishments li");
      snap.jobs.push({
        titleW: h3 ? Math.round(h3.getBoundingClientRect().width) : 180,
        posW: pos ? Math.round(pos.getBoundingClientRect().width) : 130,
        dateW: dates ? Math.round(dates.getBoundingClientRect().width) : 100,
        hasGallery: !!job.querySelector("[data-rc-gallery]"),
        lineCount: lis.length,
      });
    });

    localStorage.setItem(SKELETON_KEY, JSON.stringify(snap));
  } catch (_) {}
}

const LINE_WIDTHS = [100, 96, 88, 93, 82, 97, 78, 91, 85, 74];

function showSkeletons() {
  const snap = loadSkeletonSnapshot() || SKELETON_DEFAULTS;

  document.getElementById("rc-name").innerHTML = `<div class="rc-skeleton" style="height:44px;width:320px;max-width:80%;border-radius:4px;"></div>`;
  document.getElementById("rc-role").innerHTML = `<div class="rc-skeleton" style="height:11px;width:200px;max-width:65%;border-radius:3px;margin-top:10px;"></div>`;
  document.getElementById("rc-contact").innerHTML = [150, 130, 110]
    .map((w) => `<div class="rc-skeleton" style="height:12px;width:${w}px;"></div>`)
    .join("");

  const summaryLines = Array.from({ length: snap.summary.lines }, (_, i) =>
    `<div class="rc-skeleton rc-sk-line" style="width:${LINE_WIDTHS[i % LINE_WIDTHS.length]}%"></div>`
  ).join("");
  document.getElementById("rc-summary").innerHTML = `
    <div class="rc-skeleton" style="height:11px;width:64px;margin-bottom:14px;"></div>
    ${summaryLines}`;

  showSkillsSkeletons(snap.skills);

  const galleryStrip = `
    <div style="display:flex;gap:12px;padding:14px 20px 18px;overflow:hidden;">
      ${Array.from(
        { length: 5 },
        () =>
          `<div class="rc-skeleton" style="flex:0 0 calc(20% - 10px);min-width:100px;aspect-ratio:16/10;border-radius:var(--radius);"></div>`
      ).join("")}
    </div>`;

  document.getElementById("rc-experience").innerHTML = snap.jobs
    .map(
      ({ titleW, posW, dateW, hasGallery, lineCount }) => `
      <article class="rc-job">
        <header class="rc-job-header">
          <div>
            <div class="rc-skeleton" style="height:16px;width:${titleW}px;margin-bottom:8px;"></div>
            <div class="rc-skeleton" style="height:12px;width:${posW}px;"></div>
          </div>
          <div class="rc-skeleton" style="height:12px;width:${dateW}px;align-self:center;"></div>
        </header>
        ${hasGallery ? galleryStrip : ""}
        <ul class="rc-accomplishments">
          ${Array.from(
            { length: lineCount },
            (_, i) => `
            <li class="rc-sk-item" style="padding:13px 20px;">
              <div class="rc-skeleton rc-sk-line" style="width:${LINE_WIDTHS[i % LINE_WIDTHS.length]}%"></div>
            </li>`
          ).join("")}
        </ul>
      </article>`
    )
    .join("");
}

/** Show only the skills grid as skeleton — lighter than full-page showSkeletons(). */
function showSkillsSkeletons(skillsSnap) {
  const snap = skillsSnap || (loadSkeletonSnapshot() || SKELETON_DEFAULTS).skills;
  const grid = document.getElementById("rc-skills");
  if (!grid) return;
  grid.innerHTML = snap
    .map(
      ({ titlePct, chipWidths }) => `
      <div class="rc-skill-card">
        <div class="rc-skeleton" style="height:14px;width:${titlePct}%;margin-bottom:14px;"></div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${chipWidths.map((w) => `<div class="rc-skeleton rc-sk-chip" style="width:${w}px;"></div>`).join("")}
        </div>
      </div>`
    )
    .join("");
}

function loadResumeData() {
  const inlined = window.INITIAL_RESUME_DATA;
  if (inlined != null && typeof inlined === "object" && !Array.isArray(inlined)) {
    return Promise.resolve(inlined);
  }
  return fetch("/data/resume.json").then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });
}

function assetUrl(base, file) {
  const path = String(file || "").replace(/\\/g, "/");
  const encoded = path
    .split("/")
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  return `${base.replace(/\/$/, "")}/${encoded}`;
}

/** Same-origin /assets/images/ (profile avatar; matches rc_site_image_url in PHP). */
function siteImageUrl(file) {
  const raw = String(file || "").replace(/\\/g, "/").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  const rel = raw.replace(/^assets\/images\//i, "");
  const encoded = rel
    .split("/")
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  return `/assets/images/${encoded}`;
}

function gallerySrcsetAttr(item, assetsBase) {
  const v = item.srcsetVariants;
  if (!Array.isArray(v) || !v.length) return "";
  const parts = v
    .filter((x) => x && x.file && x.w)
    .map((x) => `${assetUrl(assetsBase, x.file)} ${Number(x.w)}w`);
  return parts.length ? ` srcset="${parts.join(", ")}"` : "";
}

function isMobileGalleryFile(file) {
  return /[-_]mobile\./i.test(file);
}

function pairGalleryItems(gallery) {
  if (!Array.isArray(gallery)) return [];
  const byFile = Object.fromEntries(
    gallery.filter((item) => item && item.file).map((item) => [item.file, item])
  );
  const pairs = [];
  for (const item of gallery) {
    if (!item || !item.file || isMobileGalleryFile(item.file)) continue;
    let mobile = null;
    if (/-desktop\./i.test(item.file)) {
      const mobileFile = item.file.replace(/-desktop\./i, "-mobile.");
      mobile = byFile[mobileFile] || null;
    }
    pairs.push({ desktop: item, mobile });
  }
  return pairs;
}

const projectModalState = {
  galleryEl: null,
  index: 0,
  lastFocus: null,
};

function getGallerySlides(galleryEl) {
  return [...galleryEl.querySelectorAll(".rc-slide-figure[data-rc-slide-index]")];
}

function slideModalPayload(slideEl) {
  return {
    desktop: slideEl.dataset.rcDesktop || "",
    mobile: slideEl.dataset.rcMobile || "",
    desktopAlt: slideEl.dataset.rcDesktopAlt || "",
    mobileAlt: slideEl.dataset.rcMobileAlt || "",
    title: slideEl.dataset.rcTitle || "",
    description: slideEl.dataset.rcDescription || "",
  };
}

const IMG_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%201%201%27%2F%3E";

function initDeferredImages(root = document) {
  const scope = root instanceof Element ? root : document;
  const imgs = scope.querySelectorAll("img[data-rc-src]:not([data-rc-loaded])");
  if (!imgs.length) return;

  const load = (img) => {
    const src = img.dataset.rcSrc;
    if (!src || img.dataset.rcLoaded === "1") return;
    img.src = src;
    img.removeAttribute("data-rc-src");
    img.dataset.rcLoaded = "1";
  };

  const isNearViewport = (img) => {
    const rect = img.getBoundingClientRect();
    return rect.top < window.innerHeight + 320 && rect.bottom > -320;
  };

  if (!("IntersectionObserver" in window)) {
    imgs.forEach(load);
    return;
  }

  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        load(entry.target);
        obs.unobserve(entry.target);
      });
    },
    { rootMargin: "240px 0px", threshold: 0.01 }
  );

  imgs.forEach((img) => {
    if (isNearViewport(img)) load(img);
    else io.observe(img);
  });
}

function preloadModalImages(galleryEl, index) {
  const slides = getGallerySlides(galleryEl);
  [index - 1, index + 1].forEach((i) => {
    if (i < 0 || i >= slides.length) return;
    const p = slideModalPayload(slides[i]);
    [p.desktop, p.mobile].filter(Boolean).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  });
}

function populateProjectModal(galleryEl, index) {
  const dialog = document.getElementById("rc-project-modal");
  if (!dialog) return;
  const slides = getGallerySlides(galleryEl);
  const slide = slides[index];
  if (!slide) return;

  const company = galleryEl.dataset.rcCompany || "";
  const p = slideModalPayload(slide);

  const titleEl = dialog.querySelector(".rc-modal-title");
  const companyEl = dialog.querySelector(".rc-modal-company");
  const descEl = dialog.querySelector(".rc-modal-description");
  const counterEl = dialog.querySelector(".rc-modal-counter");
  const desktopImg = dialog.querySelector(".rc-modal-desktop img");
  const mobileWrap = dialog.querySelector(".rc-modal-mobile");
  const mobileImg = dialog.querySelector(".rc-modal-mobile img");

  if (titleEl) titleEl.textContent = p.title;
  if (companyEl) {
    companyEl.textContent = company;
    companyEl.hidden = !company;
  }
  if (descEl) {
    if (p.description) {
      descEl.textContent = p.description;
      descEl.hidden = false;
    } else {
      descEl.textContent = "";
      descEl.hidden = true;
    }
  }
  if (counterEl) counterEl.textContent = `${index + 1} / ${slides.length}`;
  if (desktopImg) {
    desktopImg.src = p.desktop;
    desktopImg.alt = p.desktopAlt;
  }
  if (mobileWrap && mobileImg) {
    if (p.mobile) {
      mobileWrap.hidden = false;
      mobileImg.src = p.mobile;
      mobileImg.alt = p.mobileAlt || p.desktopAlt;
    } else {
      mobileWrap.hidden = true;
      mobileImg.removeAttribute("src");
    }
  }

  const prevBtn = dialog.querySelector(".rc-modal-prev");
  const nextBtn = dialog.querySelector(".rc-modal-next");
  if (prevBtn) prevBtn.disabled = index <= 0;
  if (nextBtn) nextBtn.disabled = index >= slides.length - 1;

  projectModalState.galleryEl = galleryEl;
  projectModalState.index = index;
  preloadModalImages(galleryEl, index);
}

function openProjectModal(galleryEl, slideIndex) {
  const dialog = document.getElementById("rc-project-modal");
  if (!dialog) return;
  projectModalState.lastFocus = document.activeElement;
  populateProjectModal(galleryEl, slideIndex);
  if (!dialog.open) dialog.showModal();
}

function closeProjectModal() {
  const dialog = document.getElementById("rc-project-modal");
  if (!dialog || !dialog.open) return;
  dialog.close();
  const focus = projectModalState.lastFocus;
  projectModalState.galleryEl = null;
  if (focus && typeof focus.focus === "function") focus.focus();
}

function stepProjectModal(delta) {
  const { galleryEl, index } = projectModalState;
  if (!galleryEl) return;
  const slides = getGallerySlides(galleryEl);
  const next = index + delta;
  if (next < 0 || next >= slides.length) return;
  populateProjectModal(galleryEl, next);
}

let projectModalBound = false;

function initProjectModal() {
  if (projectModalBound) return;
  const dialog = document.getElementById("rc-project-modal");
  if (!dialog) return;
  projectModalBound = true;

  dialog.querySelector(".rc-modal-close")?.addEventListener("click", closeProjectModal);
  dialog.querySelector(".rc-modal-prev")?.addEventListener("click", () => stepProjectModal(-1));
  dialog.querySelector(".rc-modal-next")?.addEventListener("click", () => stepProjectModal(1));

  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeProjectModal();
  });

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) closeProjectModal();
  });

  dialog.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      stepProjectModal(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      stepProjectModal(1);
    }
  });

  document.addEventListener("click", (e) => {
    const slide = e.target.closest(".rc-slide-figure[data-rc-slide-index]");
    if (!slide) return;
    if (e.target.closest(".rc-gallery-prev, .rc-gallery-next")) return;
    const gallery = slide.closest("[data-rc-gallery]");
    if (!gallery) return;
    const index = Number(slide.dataset.rcSlideIndex);
    if (Number.isNaN(index)) return;
    openProjectModal(gallery, index);
  });

  document.addEventListener("keydown", (e) => {
    if (!(e.target instanceof Element)) return;
    const slide = e.target.closest(".rc-slide-figure[data-rc-slide-index]");
    if (!slide) return;
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    const gallery = slide.closest("[data-rc-gallery]");
    if (!gallery) return;
    openProjectModal(gallery, Number(slide.dataset.rcSlideIndex));
  });
}

function destroyGalleryControllers() {
  closeProjectModal();
  document.querySelectorAll("[data-rc-gallery]").forEach((el) => {
    const timerId = el.dataset.rcGalleryTimer;
    if (timerId) {
      clearInterval(Number(timerId));
      delete el.dataset.rcGalleryTimer;
    }
    const startId = el.dataset.rcGalleryStartTimer;
    if (startId) {
      clearTimeout(Number(startId));
      delete el.dataset.rcGalleryStartTimer;
    }
    delete el.dataset.rcGalleryInit;
    delete el.dataset.rcGalleryPaused;
  });
}

function initJobGalleries() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const modalOpen = () => {
    const d = document.getElementById("rc-project-modal");
    return d && d.open;
  };

  document.querySelectorAll("[data-rc-gallery]").forEach((wrap) => {
    const sc = wrap.querySelector(".rc-job-gallery-scroll");
    const prev = wrap.querySelector(".rc-gallery-prev");
    const next = wrap.querySelector(".rc-gallery-next");
    if (!sc || !prev || !next) return;
    if (wrap.dataset.rcGalleryInit) return;
    wrap.dataset.rcGalleryInit = "1";

    const step = () => Math.max(260, Math.round(sc.clientWidth * 0.88));
    prev.addEventListener("click", (e) => {
      e.stopPropagation();
      sc.scrollBy({ left: -step(), behavior: reduce ? "auto" : "smooth" });
    });
    next.addEventListener("click", (e) => {
      e.stopPropagation();
      sc.scrollBy({ left: step(), behavior: reduce ? "auto" : "smooth" });
    });

    const isPaused = () =>
      wrap.dataset.rcGalleryPaused === "1" || wrap.matches(":hover") || modalOpen();

    const pauseAutoScroll = () => {
      wrap.dataset.rcGalleryPaused = "1";
    };
    const resumeAutoScroll = () => {
      if (!wrap.matches(":hover") && !modalOpen()) {
        delete wrap.dataset.rcGalleryPaused;
      }
    };

    wrap.addEventListener("focusin", pauseAutoScroll);
    wrap.addEventListener("focusout", (e) => {
      if (e.relatedTarget && wrap.contains(e.relatedTarget)) return;
      resumeAutoScroll();
    });

    if (!reduce && sc.scrollWidth > sc.clientWidth + 8) {
      let dir = 1;
      const tick = () => {
        if (isPaused()) return;
        const max = sc.scrollWidth - sc.clientWidth;
        if (max <= 0) return;
        let t = sc.scrollLeft + dir * step();
        if (t >= max) {
          dir = -1;
          t = max;
        } else if (t <= 0) {
          dir = 1;
          t = 0;
        }
        sc.scrollTo({ left: t, behavior: "smooth" });
      };
      const startDelay = reduce ? 0 : 3000;
      const startTimer = window.setTimeout(() => {
        const timer = window.setInterval(tick, 9000);
        wrap.dataset.rcGalleryTimer = String(timer);
      }, startDelay);
      wrap.dataset.rcGalleryStartTimer = String(startTimer);
    }
  });
}

// ── Liquid simulation helpers ────────────────────────────────────────────────
function liquidWhere(items, key, value) {
  return items.filter((row) => Array.isArray(row[key]) && row[key].includes(value));
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

loadResumeData()
  .then((RESUME) => {

    const ASSETS_BASE = document.getElementById("resume-root").dataset.assetsBase || "";
    const BRAND_LOGOS = window.RC_BRAND_LOGOS || {};

    // ── View config from SSOT ─────────────────────────────────────────────────
    const viewConfig = RESUME.viewConfig || {};
    const platformConfig = viewConfig.platforms || {
      wordpress: { label: "WordPress (Timber / REST)" },
      shopify:   { label: "Shopify (Liquid)" },
      headless:  { label: "Headless (Decoupled API)" },
    };
    const themeConfig = viewConfig.themes || {
      modern:     { label: "Modern Architect" },
      legacy:     { label: "Legacy Terminal" },
      accessible: { label: "Accessible / Enterprise" },
    };
    const VALID_PLATFORMS = Object.keys(platformConfig);
    const VALID_THEMES    = Object.keys(themeConfig);
    const VALID_PERSONAS = Object.keys(RESUME.personas || {});
    const SELECTABLE_PERSONAS = [...VALID_PERSONAS, VIEW_ALL_PERSONA];

    const DEFAULTS = { persona: "fullstack", platform: "wordpress", theme: "modern" };

    // ── Preferences: URL → cookie → localStorage → default ───────────────────
    function getCookie(name) {
      const m = document.cookie.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"));
      return m ? decodeURIComponent(m[1]) : null;
    }

    function setCookie(name, value) {
      document.cookie = `${name}=${encodeURIComponent(value)}; path=/; samesite=lax; max-age=31536000`;
    }

    function loadLocalPrefs() {
      try {
        const raw = localStorage.getItem("rc_prefs_v2");
        return raw ? JSON.parse(raw) : {};
      } catch (_) {
        return {};
      }
    }

    function saveLocalPrefs(prefs) {
      try {
        localStorage.setItem("rc_prefs_v2", JSON.stringify(prefs));
      } catch (_) {}
    }

    function getPrefs() {
      const params = new URLSearchParams(window.location.search);
      const local  = loadLocalPrefs();

      const urlPersona   = params.get("show_as");
      const urlPlatform  = params.get("platform");
      const urlTheme     = params.get("theme");

      const persona  = (SELECTABLE_PERSONAS.includes(urlPersona) ? urlPersona : null)
                    ?? getCookie("rc_persona")
                    ?? local.persona
                    ?? DEFAULTS.persona;
      const platform = (VALID_PLATFORMS.includes(urlPlatform) ? urlPlatform : null)
                    ?? getCookie("rc_platform")
                    ?? local.platform
                    ?? DEFAULTS.platform;
      const theme    = (VALID_THEMES.includes(urlTheme)       ? urlTheme    : null)
                    ?? getCookie("rc_theme")
                    ?? local.theme
                    ?? DEFAULTS.theme;

      return {
        persona:  SELECTABLE_PERSONAS.includes(persona) ? persona : DEFAULTS.persona,
        platform: VALID_PLATFORMS.includes(platform) ? platform : DEFAULTS.platform,
        theme:    VALID_THEMES.includes(theme)        ? theme    : DEFAULTS.theme,
      };
    }

    function persistPrefs(prefs, { push = false } = {}) {
      setCookie("rc_persona",  prefs.persona);
      setCookie("rc_platform", prefs.platform);
      setCookie("rc_theme",    prefs.theme);
      saveLocalPrefs(prefs);

      if (push) {
        const params = new URLSearchParams();
        if (prefs.persona  !== DEFAULTS.persona)   params.set("show_as",  prefs.persona);
        if (prefs.platform !== DEFAULTS.platform)  params.set("platform", prefs.platform);
        if (prefs.theme    !== DEFAULTS.theme)      params.set("theme",    prefs.theme);

        const qs   = params.toString();
        const path = window.location.pathname || "/";
        const next = qs ? `${path}?${qs}${window.location.hash}` : `${path}${window.location.hash}`;
        history.pushState(prefs, "", next);
      }
    }

    // ── DOM helpers ────────────────────────────────────────────────────────────
    function esc(s) {
      return String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function contactLinkLabel(url) {
      const gh = /github\.com\/([^/?#]+)/i.exec(url);
      if (gh) return `github.com/${gh[1]}`;
      try {
        const u = new URL(url);
        return u.host + (u.pathname !== "/" ? u.pathname : "");
      } catch (_) {
        return url;
      }
    }

    const CONTACT_ICONS = {
      email:
        '<svg class="rc-contact-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 2v.01L12 13 4 6.01V6h16ZM4 18V8.24l7.38 6.46a1 1 0 0 0 1.24 0L20 8.24V18H4Z"/></svg>',
      phone:
        '<svg class="rc-contact-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M15.5 1h-7A2.5 2.5 0 0 0 6 3.5v17A2.5 2.5 0 0 0 8.5 23h7a2.5 2.5 0 0 0 2.5-2.5v-17A2.5 2.5 0 0 0 15.5 1Zm-3.5 20a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Z"/></svg>',
      website:
        '<svg class="rc-contact-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 17.93V18a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v1.93A8.001 8.001 0 0 1 4.07 13H6a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H4.07A8.001 8.001 0 0 1 11 4.07V6a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V4.07A8.001 8.001 0 0 1 19.93 11H18a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h1.93A8.001 8.001 0 0 1 13 19.93Z"/></svg>',
      linkedin:
        '<svg class="rc-contact-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.35-1.85 3.59 0 4.25 2.36 4.25 5.43v6.31ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm1.78 13.02H3.56V9h3.56v11.45ZM22 0H2C.9 0 0 .9 0 2v20c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2Z"/></svg>',
      github:
        '<svg class="rc-contact-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.01-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.76.41-1.27.74-1.56-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.47.11-3.06 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 2.88-.39c.98.01 1.97.13 2.88.39 2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.77.11 3.06.73.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.68.42.36.8 1.08.8 2.18 0 1.57-.01 2.84-.01 3.22 0 .31.21.68.8.56A10.51 10.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/></svg>',
    };

    function contactTypeFromUrl(url) {
      if (/linkedin\.com/i.test(url)) return "linkedin";
      if (/github\.com/i.test(url)) return "github";
      return "website";
    }

    function buildContactItems(basics) {
      const { email, phone, url, sameAs = [] } = basics || {};
      const items = [];
      if (email) {
        items.push({
          type: "email",
          href: `mailto:${email}`,
          label: email,
          showLabel: true,
          external: false,
          ariaLabel: `Email ${email}`,
        });
      }
      if (phone) {
        const tel = String(phone).replace(/[^\d+]/g, "");
        items.push({
          type: "phone",
          href: `tel:${tel}`,
          label: phone,
          showLabel: true,
          external: false,
          ariaLabel: `Phone ${phone}`,
        });
      }
      if (url) {
        const hostLabel = contactLinkLabel(url);
        items.push({
          type: "website",
          href: url,
          label: hostLabel,
          showLabel: false,
          external: true,
          ariaLabel: `Website: ${hostLabel}`,
        });
      }
      for (const link of sameAs) {
        if (!link) continue;
        const type = contactTypeFromUrl(link);
        const hostLabel = contactLinkLabel(link);
        const ariaLabel =
          type === "linkedin"
            ? "LinkedIn profile"
            : type === "github"
              ? "GitHub profile"
              : hostLabel;
        items.push({
          type,
          href: link,
          label: hostLabel,
          showLabel: false,
          external: true,
          ariaLabel,
        });
      }
      return items;
    }

    function renderContactItem(item) {
      const icon = CONTACT_ICONS[item.type] || CONTACT_ICONS.website;
      const ext = item.external ? ' target="_blank" rel="noopener noreferrer"' : "";
      const aria = item.showLabel ? "" : ` aria-label="${esc(item.ariaLabel)}"`;
      const text = item.showLabel
        ? `<span class="rc-contact-label">${esc(item.label)}</span>`
        : "";
      return `<a class="rc-contact-item rc-contact-item--${esc(item.type)}" href="${esc(item.href)}"${ext}${aria}>${icon}${text}</a>`;
    }

    function renderContact(basics) {
      const items = buildContactItems(basics);
      const labeled = items.filter((i) => i.showLabel).map(renderContactItem).join("");
      const social = items.filter((i) => !i.showLabel).map(renderContactItem).join("");
      return (
        labeled +
        (social
          ? `<div class="rc-contact-social" aria-label="Social and web links">${social}</div>`
          : "")
      );
    }

    function resumeMonthKey(date, isEnd) {
      if (isEnd && (!date || date === "Present")) return Number.MAX_SAFE_INTEGER;
      if (!date) return 0;
      const parts = String(date).split("-");
      const y = parseInt(parts[0], 10) || 0;
      const rawM = parts[1] != null ? parseInt(parts[1], 10) : isEnd ? 12 : 1;
      if (y <= 0) return 0;
      const m = Math.max(1, Math.min(12, rawM || 1));
      return y * 12 + m;
    }

    function fmtDate(d) {
      if (d === "Present") return "Present";
      const [y, m] = d.split("-");
      return new Date(+y, +m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }

    function badgeFor(persona) {
      if (isViewAllPersona(persona)) return "View All";
      const p = RESUME.personas[persona] || {};
      return p.badgeLabel || persona;
    }

    function accomplishmentMatchesPersona(a, persona) {
      if (!a || !a.text) return false;
      if (isViewAllPersona(persona)) return true;
      return Array.isArray(a.personas) && a.personas.includes(persona);
    }

    function renderAccomplishmentItem(a, persona) {
      const text = a.text || "";
      if (!isViewAllPersona(persona)) {
        return `<li>${esc(text)}</li>`;
      }
      const tags = (a.personas || [])
        .map((pk) => {
          const p = RESUME.personas[pk] || {};
          const label = p.selectLabel || p.badgeLabel || pk;
          return `<span class="rc-persona-tag" data-persona-tag="${esc(pk)}">${esc(label)}</span>`;
        })
        .join("");
      const tagWrap = tags ? `<span class="rc-bullet-personas">${tags}</span>` : "";
      return `<li class="rc-accomplishment-item rc-accomplishment-item--audit">${tagWrap}<span class="rc-accomplishment-text">${esc(text)}</span></li>`;
    }

    function renderSummary(persona) {
      if (isViewAllPersona(persona)) {
        document.getElementById("rc-summary").innerHTML =
          `<strong>Summary</strong><em class="rc-view-all-note">Viewing all personas — experience lists every tagged bullet with persona labels.</em>`;
        return;
      }
      const p = RESUME.personas[persona];
      const text = p && p.summary ? esc(p.summary) : "";
      document.getElementById("rc-summary").innerHTML = `<strong>Summary</strong>${text}`;
    }

    // ── Platform: WordPress flyout ─────────────────────────────────────────────
    function showWordPressLog(persona) {
      const flyout = document.getElementById("rc-platform-flyout");
      if (!flyout) return;

      const platformFlyoutEnabled = false; /* set true to restore Timber/Twig log panel */
      if (!platformFlyoutEnabled) {
        flyout.hidden = true;
        flyout.innerHTML = "";
        return;
      }

      const skillCount = RESUME.skills.filter((s) => Array.isArray(s.personas) && s.personas.includes(persona)).length;
      const now = new Date();
      const ts = (offset = 0) => {
        const d = new Date(now.getTime() - offset);
        return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
      };

      const lines = [
        { status: "OK",   msg: `Timber\\Timber::context() → 'resume' key set`, t: 320 },
        { status: "INFO", msg: `file_get_contents('data/resume.json') — ${JSON.stringify(RESUME).length} bytes`, t: 248 },
        { status: "OK",   msg: `json_decode() → ${Object.keys(RESUME.personas || {}).length} personas, ${(RESUME.skills || []).length} skill groups`, t: 180 },
        { status: "INFO", msg: `Twig context → personas['${persona}'] (${skillCount} skills tagged)`, t: 110 },
        { status: "OK",   msg: `wp-rest: GET /wp-json/resume/v1/persona?show_as=${persona} → 200`, t: 60 },
        { status: "OK",   msg: `Rendered partials/skills.twig, partials/experience.twig`, t: 20 },
      ];

      const logHtml = lines
        .map(({ status, msg, t }) => {
          const cls = status === "OK" ? "ok" : "info";
          return `<div class="rc-platform-flyout__line rc-platform-flyout__line--${cls}">
            <span class="rc-log-time">[${ts(t)}]</span>
            <span class="rc-log-status">${status}</span>
            <span class="rc-log-msg">${esc(msg)}</span>
          </div>`;
        })
        .join("");

      flyout.innerHTML = `
        <div class="rc-platform-flyout__header">
          <span class="rc-platform-flyout__badge">WP</span>
          <span class="rc-platform-flyout__title">Timber / Twig render trace — persona: ${esc(persona)}</span>
          <button type="button" class="rc-platform-flyout__close" aria-label="Close platform log">✕</button>
        </div>
        <div class="rc-platform-flyout__log">${logHtml}</div>`;

      flyout.hidden = false;
      flyout.querySelector(".rc-platform-flyout__close").addEventListener("click", () => {
        flyout.hidden = true;
      });

      console.groupCollapsed(`[WP] Timber\\Twig render — persona: ${persona}`);
      lines.forEach(({ status, msg }) => console.log(`[${status}] ${msg}`));
      console.groupEnd();
    }

    // ── Platform: Shopify Liquid skills ───────────────────────────────────────
    function renderSkillsShopify(persona) {
      const grid = document.getElementById("rc-skills");
      const filtered = isViewAllPersona(persona) ? RESUME.skills : liquidWhere(RESUME.skills, "personas", persona);

      document.getElementById("skills-heading").textContent = "Product Collections";

      if (!filtered.length) {
        grid.innerHTML = `<p class="rc-empty">No collections available for this persona. Select <strong>Full-Stack Developer</strong>.</p>`;
        return;
      }

      grid.innerHTML = filtered
        .map((s) => {
          const handle = slugify(s.category);
          const variants = s.items
            .map((i) => `<span class="rc-variant-tag">{{ '${esc(i)}' | downcase }}</span>`)
            .join("");
          return `
          <div class="rc-collection-card" data-collection-handle="${esc(handle)}">
            <h3 class="rc-collection-title">
              <span class="rc-collection-prefix">collection:</span>${esc(s.category)}
            </h3>
            <div class="rc-collection-variants">${variants}</div>
          </div>`;
        })
        .join("");
    }

    // ── Platform: Headless — skeleton → simulated fetch → real render ─────────
    function renderSkillsHeadless(persona) {
      const grid = document.getElementById("rc-skills");
      const heading = document.getElementById("skills-heading");

      heading.textContent = "Skills";
      grid.setAttribute("aria-busy", "true");
      showSkillsSkeletons();

      const endpoint = `/api/v1/resume?persona=${encodeURIComponent(persona)}&fields=skills`;
      const status = document.createElement("div");
      status.className = "rc-network-status";
      status.innerHTML = `
        <span class="rc-network-status__method">GET</span>
        <code>${esc(endpoint)}</code>
        <span class="rc-network-status__time" id="rc-net-time">…</span>`;
      grid.insertAdjacentElement("beforebegin", status);

      const t0 = Date.now();
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const delay = reduce ? 0 : 620;

      setTimeout(() => {
        const elapsed = Date.now() - t0;
        status.innerHTML = `
          <span class="rc-network-status__method">GET</span>
          <code>${esc(endpoint)}</code>
          <span class="rc-network-status__status">200 OK</span>
          <span class="rc-network-status__time">${elapsed}ms</span>`;

        grid.removeAttribute("aria-busy");
        renderSkills(persona);

        setTimeout(() => status.remove(), 3500);
      }, delay);
    }

    // ── Unified skills renderer (dispatches by platform) ─────────────────────
    function renderSkills(persona) {
      const grid = document.getElementById("rc-skills");
      const filtered = isViewAllPersona(persona)
        ? RESUME.skills
        : RESUME.skills.filter((s) => s.personas.includes(persona));
      const heading = document.getElementById("skills-heading");
      if (heading) heading.textContent = "Skills";

      if (!filtered.length) {
        grid.innerHTML = `<p class="rc-empty">No skills are tagged for this persona yet. Select <strong>Full-Stack Developer</strong> for the complete skill matrix.</p>`;
        return;
      }
      grid.innerHTML = filtered
        .map(
          (s) => `
          <div class="rc-skill-card">
            <h3>${esc(s.category)}</h3>
            <div class="rc-chips">
              ${s.items.map((i) => `<span class="rc-chip">${esc(i)}</span>`).join("")}
            </div>
          </div>`
        )
        .join("");
    }

    function renderSkillsByPlatform(persona, platform) {
      const oldStatus = document.querySelector(".rc-network-status");
      if (oldStatus) oldStatus.remove();

      if (platform === "shopify") {
        renderSkillsShopify(persona);
      } else if (platform === "headless") {
        renderSkillsHeadless(persona);
      } else {
        renderSkills(persona);
      }
    }

    function renderGallerySlideImg(item, className, decorative) {
      const src = assetUrl(ASSETS_BASE, item.file);
      const srcset = decorative ? "" : gallerySrcsetAttr(item, ASSETS_BASE);
      const sizes = srcset ? ' sizes="(max-width: 768px) 90vw, 33vw"' : "";
      const altAttr = decorative ? ' alt="" aria-hidden="true"' : ` alt="${esc(item.alt || "")}"`;
      return `<img class="${className}" src="${esc(src)}"${srcset}${sizes}${altAttr} width="${item.width || ""}" height="${item.height || ""}" loading="lazy" decoding="async" fetchpriority="low" />`;
    }

    function brandDisplayName(brand) {
      const name = (brand.name || "").trim();
      if (name) return name;
      return (brand.caption || "").trim();
    }

    function brandLogoEntry(label) {
      const key = (label || "").trim().toUpperCase();
      return key ? BRAND_LOGOS[key] || null : null;
    }

    function brandFallbackText(label) {
      const key = (label || "").trim().toUpperCase();
      const short = {
        "PL (PRIVATE LABEL)": "PL",
        "AAVAN ALLIANCE LTD": "AAVAN",
        "MASS MARKET": "MASS",
        "PRIVATE LABEL": "PRIVATE",
        "PHILIPPE STARCK": "STARCK",
      };
      return short[key] || (label || "").trim().toUpperCase();
    }

    function brandCellMarkup(brand) {
      const label = brandDisplayName(brand);
      if (!label) return "";
      const alt = brand.alt || label;
      let media;
      if (brand.file) {
        const src = assetUrl(ASSETS_BASE, brand.file);
        media = `<img class="rc-job-brand-img" src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async" fetchpriority="low" />`;
      } else {
        let entry =
          typeof brand.url === "string" && /^https:\/\//i.test(brand.url.trim())
            ? { type: "url", src: brand.url.trim() }
            : brandLogoEntry(label);
        if (entry && entry.type === "text") {
          media = `<span class="rc-job-brand-text" aria-hidden="true">${esc(brandFallbackText(label))}</span>`;
        } else if (entry && entry.type === "url" && entry.src) {
          media = `<img class="rc-job-brand-img rc-deferred-img" src="${IMG_PLACEHOLDER}" data-rc-src="${esc(entry.src)}" alt="${esc(alt)}" loading="lazy" decoding="async" fetchpriority="low" referrerpolicy="no-referrer" />`;
        } else if (entry && entry.type === "file" && entry.src) {
          const src = assetUrl(ASSETS_BASE, entry.src);
          media = `<img class="rc-job-brand-img" src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async" fetchpriority="low" />`;
        } else {
          media = `<span class="rc-job-brand-text" aria-hidden="true">${esc(brandFallbackText(label))}</span>`;
        }
      }
      return `<li class="rc-fifth-grid__cell rc-job-brand-cell">${media}<span class="rc-job-brand-caption">${esc(label)}</span></li>`;
    }

    function brandGridSection(brands, ariaLabel) {
      if (!Array.isArray(brands) || !brands.length) return "";
      const cells = brands.map((b) => (b ? brandCellMarkup(b) : "")).join("");
      if (!cells) return "";
      return `<div class="rc-fifth-grid-wrap rc-job-brand-grid" role="group" aria-label="${esc(ariaLabel)}">
        <ul class="rc-fifth-grid">${cells}</ul>
      </div>`;
    }

    function jobBrandGridsMarkup(agency, marks) {
      const agencyHtml = brandGridSection(agency, "Client and agency brands");
      const marksHtml = brandGridSection(marks, "WPMU brand marks");
      if (!agencyHtml && !marksHtml) return "";
      return `<div class="rc-job-brand-grids">${agencyHtml}${marksHtml}</div>`;
    }

    function galleryMarkup(gallery, company) {
      const pairs = pairGalleryItems(gallery || []);
      if (!pairs.length) return "";
      const slides = pairs
        .map(({ desktop, mobile }, index) => {
          const caption = desktop.caption || "";
          const description = desktop.description || "";
          const desktopSrc = assetUrl(ASSETS_BASE, desktop.file);
          const mobileSrc = mobile ? assetUrl(ASSETS_BASE, mobile.file) : "";
          const pairedClass = mobile ? " rc-slide-figure--paired" : "";
          const cap = caption ? `<figcaption class="rc-slide-caption">${esc(caption)}</figcaption>` : "";
          const mobileImg = mobile ? renderGallerySlideImg(mobile, "rc-slide-mobile", true) : "";
          return `
          <figure class="rc-slide-figure${pairedClass}" role="button" tabindex="0"
            data-rc-slide-index="${index}"
            data-rc-desktop="${esc(desktopSrc)}"
            ${mobileSrc ? `data-rc-mobile="${esc(mobileSrc)}"` : ""}
            data-rc-desktop-alt="${esc(desktop.alt || "")}"
            ${mobile ? `data-rc-mobile-alt="${esc(mobile.alt || "")}"` : ""}
            data-rc-title="${esc(caption)}"
            data-rc-description="${esc(description)}">
            <div class="rc-slide-stack">
              ${renderGallerySlideImg(desktop, "rc-slide-desktop", false)}
              ${mobileImg}
            </div>
            ${cap}
          </figure>`;
        })
        .join("");
      return `
        <div class="rc-job-gallery" data-rc-gallery data-rc-company="${esc(company || "")}">
          <div class="rc-job-gallery-scroll" tabindex="0" role="region" aria-label="Project screenshots">
            ${slides}
          </div>
          <button type="button" class="rc-gallery-prev" aria-label="Scroll gallery left">‹</button>
          <button type="button" class="rc-gallery-next" aria-label="Scroll gallery right">›</button>
        </div>`;
    }

    function renderExperience(persona) {
      destroyGalleryControllers();

      const container = document.getElementById("rc-experience");
      const jobs = RESUME.experience
        .map((job) => ({
          ...job,
          accomplishments: job.accomplishments.filter((a) => accomplishmentMatchesPersona(a, persona)),
        }))
        .filter((job) => job.accomplishments.length > 0)
        .sort((a, b) => {
          const endA = resumeMonthKey(a.endDate, true);
          const endB = resumeMonthKey(b.endDate, true);
          if (endB !== endA) return endB - endA;
          const startA = resumeMonthKey(a.startDate, false);
          const startB = resumeMonthKey(b.startDate, false);
          return startB - startA;
        });

      if (!jobs.length) {
        container.innerHTML = `<p class="rc-empty">Experience specific to this persona is currently being updated. Please select <strong>Full-Stack Developer</strong> for a complete work history.</p>`;
        return;
      }

      container.innerHTML = jobs
        .map((job) => {
          const id = slugify(job.company);
          const end = job.endDate;
          const endIsPresent = end === "Present" || !end;
          const endHtml = endIsPresent
            ? "Present"
            : `<time datetime="${esc(end)}">${esc(fmtDate(end))}</time>`;
          return `
          <article class="rc-job" id="${esc(id)}">
            <header class="rc-job-header">
              <div>
                <h3>${esc(job.company)}</h3>
                <p class="rc-position">${esc(job.position)}</p>
              </div>
              <p class="rc-job-dates"><time datetime="${esc(job.startDate)}">${esc(fmtDate(job.startDate))}</time> – ${endHtml}</p>
            </header>
            ${jobBrandGridsMarkup(job.agencyGrid, job.brandGrid)}
            ${galleryMarkup(job.gallery, job.company)}
            <ul class="rc-accomplishments">
              ${job.accomplishments.map((a) => renderAccomplishmentItem(a, persona)).join("")}
            </ul>
          </article>`;
        })
        .join("");

      requestAnimationFrame(() => {
        initProjectModal();
        initJobGalleries();
        initDeferredImages(container);
      });
    }

    function renderEducation() {
      const edu = RESUME.education || [];
      const section = document.getElementById("rc-section-education");
      const grid = document.getElementById("rc-education");
      if (!edu.length) {
        section.hidden = true;
        grid.innerHTML = "";
        return;
      }
      section.hidden = false;
      grid.innerHTML = edu
        .map((e) => {
          const program = e.area || e.degree || "";
          const focusLegacy = e.focus && !e.area ? e.focus : "";
          const studyLine = [e.studyType, e.startDate && e.endDate ? `${e.startDate} – ${e.endDate}` : ""]
            .filter(Boolean)
            .join(" · ");
          const grade = e.score || e.gpa;
          const highlights =
            Array.isArray(e.highlights) && e.highlights.length
              ? `<ul class="rc-edu-highlights">${e.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>`
              : "";
          return `
          <div class="rc-edu-card">
            <h3 class="rc-edu-institution">${esc(e.institution)}</h3>
            ${program ? `<p class="rc-edu-area">${esc(program)}</p>` : ""}
            ${focusLegacy ? `<p class="rc-edu-focus">${esc(focusLegacy)}</p>` : ""}
            ${studyLine ? `<p class="rc-edu-study">${esc(studyLine)}</p>` : ""}
            ${grade ? `<p class="rc-edu-meta">GPA: ${esc(String(grade))}</p>` : ""}
            ${highlights}
          </div>`;
        })
        .join("");
    }

    function renderRecommendations(_persona) {
      const section = document.getElementById("rc-section-recommendations");
      const el = document.getElementById("rc-recommendations");
      if (section) section.hidden = true;
      if (el) el.innerHTML = "";
    }

    // ── Theme application ─────────────────────────────────────────────────────
    function applyTheme(theme) {
      document.documentElement.dataset.theme = theme;
      const sel = document.getElementById("theme-select");
      if (sel) sel.value = theme;
    }

    // ── Platform application ──────────────────────────────────────────────────
    function applyPlatform(platform, persona) {
      const root = document.getElementById("resume-root");
      if (root) root.dataset.platform = platform;
      const sel = document.getElementById("platform-select");
      if (sel) sel.value = platform;

      const flyout = document.getElementById("rc-platform-flyout");

      if (platform === "wordpress") {
        showWordPressLog(persona);
      } else {
        if (flyout) flyout.hidden = true;
      }
    }

    // ── Main render orchestrator ──────────────────────────────────────────────
    function render(persona, { platform, theme, push = false, scroll = false, showSkeleton = false } = {}) {
      const prefs = getPrefs();
      const resolvedPlatform = platform ?? prefs.platform;
      const resolvedTheme    = theme    ?? prefs.theme;

      if (showSkeleton) showSkeletons();

      applyTheme(resolvedTheme);
      applyPlatform(resolvedPlatform, persona);

      const root = document.getElementById("resume-root");
      root.dataset.persona = persona;
      document.body.dataset.persona = persona;
      document.getElementById("rc-badge").textContent = badgeFor(persona);
      personaSelect.value = persona;

      const pData = isViewAllPersona(persona) ? {} : RESUME.personas[persona] || {};
      const avatarSrc = pData.image || RESUME.basics.image || "";
      const av = document.getElementById("rc-avatar");
      if (av && avatarSrc) {
        av.src = siteImageUrl(avatarSrc);
      }

      document.getElementById("rc-role").textContent = isViewAllPersona(persona)
        ? RESUME.basics.label || ""
        : pData.headline || pData.title || RESUME.basics.label || "";

      const { name } = RESUME.basics;
      document.getElementById("rc-name").innerHTML = name.replace(/(Jr\.)$/, '<span class="flicker-suffix">$1</span>');
      document.getElementById("rc-contact").innerHTML = renderContact(RESUME.basics);

      renderSummary(persona);
      renderSkillsByPlatform(persona, resolvedPlatform);
      renderExperience(persona);
      renderRecommendations(persona);

      if (push) {
        persistPrefs({ persona, platform: resolvedPlatform, theme: resolvedTheme }, { push: true });
      }
      if (scroll) scrollToHash();
      requestAnimationFrame(captureSkeletonSnapshot);
    }

    function scrollToHash() {
      const hash = window.location.hash.slice(1);
      if (!hash) return;
      requestAnimationFrame(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    const personaSelect  = document.getElementById("persona-select");
    const platformSelect = document.getElementById("platform-select");
    const themeSelect    = document.getElementById("theme-select");
    const form           = document.getElementById("persona-form");

    // ── Select event listeners ─────────────────────────────────────────────────
    personaSelect.addEventListener("change", () => {
      const prefs = getPrefs();
      render(personaSelect.value, {
        platform: prefs.platform,
        theme: prefs.theme,
        push: true,
        showSkeleton: true,
      });
    });

    platformSelect.addEventListener("change", () => {
      const prefs = getPrefs();
      render(prefs.persona, {
        platform: platformSelect.value,
        theme: prefs.theme,
        push: true,
        showSkeleton: false,
      });
    });

    themeSelect.addEventListener("change", () => {
      const prefs = getPrefs();
      applyTheme(themeSelect.value);
      persistPrefs({ persona: prefs.persona, platform: prefs.platform, theme: themeSelect.value }, { push: true });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const prefs = getPrefs();
      render(personaSelect.value, {
        platform: platformSelect.value || prefs.platform,
        theme: themeSelect.value || prefs.theme,
        push: true,
        showSkeleton: true,
      });
    });

    window.addEventListener("popstate", () => {
      const prefs = getPrefs();
      applyTheme(prefs.theme);
      render(prefs.persona, {
        platform: prefs.platform,
        theme: prefs.theme,
        scroll: true,
        showSkeleton: true,
      });
    });

    // ── Initial hydration ──────────────────────────────────────────────────────
    const root           = document.getElementById("resume-root");
    const urlParams      = new URLSearchParams(window.location.search);
    const prefs          = getPrefs();
    const hydrated       = root.dataset.hydrated === "true";
    const serverPersona  = root.dataset.persona || "fullstack";
    const serverPlatform = root.dataset.platform || "wordpress";
    const urlPersona     = urlParams.get("show_as");
    const urlPlatform    = urlParams.get("platform");
    const initialPersona =
      urlPersona && SELECTABLE_PERSONAS.includes(urlPersona) ? urlPersona : serverPersona;
    const initialPlatform =
      urlPlatform && VALID_PLATFORMS.includes(urlPlatform) ? urlPlatform : serverPlatform;

    applyTheme(prefs.theme);

    function bindHydratedPage(persona, platform) {
      personaSelect.value = persona;
      platformSelect.value = platform;
      themeSelect.value = prefs.theme;
      document.getElementById("rc-badge").textContent = badgeFor(persona);
      initProjectModal();
      initJobGalleries();
      initDeferredImages(root);
      const eduGrid = document.getElementById("rc-education");
      if (eduGrid && !eduGrid.children.length) renderEducation();
      scrollToHash();
      requestAnimationFrame(captureSkeletonSnapshot);
      if (platform === "wordpress") showWordPressLog(persona);
    }

    if (hydrated) {
      // SSR already rendered — do not wipe DOM for cookie/localStorage prefs on refresh.
      if (!urlPersona && prefs.persona !== serverPersona) {
        persistPrefs(
          { persona: serverPersona, platform: initialPlatform, theme: prefs.theme },
          { push: false }
        );
      }
      bindHydratedPage(initialPersona, initialPlatform);
    } else if (
      initialPersona === serverPersona &&
      initialPlatform === serverPlatform
    ) {
      bindHydratedPage(initialPersona, initialPlatform);
    } else {
      render(initialPersona, {
        platform: initialPlatform,
        theme: prefs.theme,
        scroll: true,
        showSkeleton: false,
      });
      renderEducation();
    }

    // ── dark mode ──────────────────────────────────────────────────────────────
    const darkToggle = document.getElementById("dark-toggle");
    const darkLabel  = document.getElementById("dark-label");

    function setDarkCookie(val) {
      document.cookie = `rc_dark=${val ? 1 : 0}; path=/; samesite=lax`;
    }

    function applyDark(val) {
      document.body.classList.toggle("dark", val);
      darkLabel.textContent = val ? "Light" : "Dark";
    }

    function getInitialDark() {
      const m = document.cookie.match(/(?:^|;\s*)rc_dark=([01])/);
      if (m) return m[1] === "1";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    let dark = getInitialDark();
    applyDark(dark);

    darkToggle.addEventListener("click", () => {
      dark = !dark;
      applyDark(dark);
      setDarkCookie(dark);
    });
  })
  .catch((err) => {
    const root = document.getElementById("resume-root");
    if (root) {
      root.innerHTML = `
      <div class="rc-outage">
        <p class="rc-outage-icon">⚠</p>
        <p class="rc-outage-title">Resume data unavailable</p>
        <p class="rc-outage-msg">Could not load resume data: ${String(err.message)}</p>
        <button type="button" onclick="location.reload()" class="rc-outage-btn">Retry</button>
      </div>`;
    }
  });
