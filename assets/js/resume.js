// ── skeleton snapshot ────────────────────────────────────────────────────────
// Version bump here whenever the snapshot schema changes (invalidates old cache)
const SKELETON_KEY = "rc_skeleton_v1";

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
    { titleW: 210, posW: 150, dateW: 105, hasGallery: true,  lineCount: 4 },
    { titleW: 175, posW: 165, dateW:  90, hasGallery: false, lineCount: 3 },
    { titleW: 230, posW: 130, dateW: 112, hasGallery: false, lineCount: 4 },
  ],
};

function loadSkeletonSnapshot() {
  try {
    const raw = localStorage.getItem(SKELETON_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

function captureSkeletonSnapshot() {
  try {
    const snap = { summary: {}, skills: [], jobs: [] };

    // summary: count text lines from height ÷ line-height, minus the label line
    const summaryEl = document.getElementById("rc-summary");
    if (summaryEl) {
      const lh = parseFloat(window.getComputedStyle(summaryEl).lineHeight) || 26;
      snap.summary.lines = Math.max(2, Math.round(summaryEl.scrollHeight / lh) - 1);
    }

    // skills: title width % and each chip's pixel width
    document.querySelectorAll("#rc-skills .rc-skill-card").forEach((card) => {
      const cardW = card.getBoundingClientRect().width;
      const h3 = card.querySelector("h3");
      const chips = [...card.querySelectorAll(".rc-chip")];
      snap.skills.push({
        titlePct: h3 && cardW
          ? Math.round((h3.getBoundingClientRect().width / cardW) * 100)
          : 50,
        chipWidths: chips.map((c) => Math.round(c.getBoundingClientRect().width)),
      });
    });

    // jobs: header dimensions, gallery presence, accomplishment count
    document.querySelectorAll("#rc-experience .rc-job").forEach((job) => {
      const h3    = job.querySelector(".rc-job-header h3");
      const pos   = job.querySelector(".rc-position");
      const dates = job.querySelector(".rc-job-dates");
      const lis   = job.querySelectorAll(".rc-accomplishments li");
      snap.jobs.push({
        titleW:    h3    ? Math.round(h3.getBoundingClientRect().width)    : 180,
        posW:      pos   ? Math.round(pos.getBoundingClientRect().width)   : 130,
        dateW:     dates ? Math.round(dates.getBoundingClientRect().width) : 100,
        hasGallery: !!job.querySelector(".rc-job-gallery"),
        lineCount: lis.length,
      });
    });

    localStorage.setItem(SKELETON_KEY, JSON.stringify(snap));
  } catch (_) {}
}

// Deterministic width cycle so lines of the same count look natural
const LINE_WIDTHS = [100, 96, 88, 93, 82, 97, 78, 91, 85, 74];

function showSkeletons() {
  const snap = loadSkeletonSnapshot() || SKELETON_DEFAULTS;

  // ── header (always hardcoded — static, never changes) ────────────
  document.getElementById("rc-name").innerHTML =
    `<div class="rc-skeleton" style="height:44px;width:320px;max-width:80%;border-radius:4px;"></div>`;
  document.getElementById("rc-role").innerHTML =
    `<div class="rc-skeleton" style="height:11px;width:200px;max-width:65%;border-radius:3px;margin-top:10px;"></div>`;
  document.getElementById("rc-contact").innerHTML =
    [150, 130, 110]
      .map((w) => `<div class="rc-skeleton" style="height:12px;width:${w}px;"></div>`)
      .join("");

  // ── summary ──────────────────────────────────────────────────────
  const summaryLines = Array.from({ length: snap.summary.lines }, (_, i) =>
    `<div class="rc-skeleton rc-sk-line" style="width:${LINE_WIDTHS[i % LINE_WIDTHS.length]}%"></div>`
  ).join("");
  document.getElementById("rc-summary").innerHTML = `
    <div class="rc-skeleton" style="height:11px;width:64px;margin-bottom:14px;"></div>
    ${summaryLines}`;

  // ── skills ───────────────────────────────────────────────────────
  document.getElementById("rc-skills").innerHTML = snap.skills
    .map(({ titlePct, chipWidths }) => `
      <div class="rc-skill-card">
        <div class="rc-skeleton" style="height:14px;width:${titlePct}%;margin-bottom:14px;"></div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${chipWidths.map((w) => `<div class="rc-skeleton rc-sk-chip" style="width:${w}px;"></div>`).join("")}
        </div>
      </div>`)
    .join("");

  // ── experience ───────────────────────────────────────────────────
  const galleryStrip = `
    <div style="display:flex;gap:12px;padding:14px 20px 18px;overflow:hidden;">
      ${Array.from({ length: 5 }, () =>
        `<div class="rc-skeleton" style="flex:0 0 calc(20% - 10px);min-width:100px;aspect-ratio:16/10;border-radius:var(--radius);"></div>`
      ).join("")}
    </div>`;

  document.getElementById("rc-experience").innerHTML = snap.jobs
    .map(({ titleW, posW, dateW, hasGallery, lineCount }) => `
      <div class="rc-job">
        <div class="rc-job-header">
          <div>
            <div class="rc-skeleton" style="height:16px;width:${titleW}px;margin-bottom:8px;"></div>
            <div class="rc-skeleton" style="height:12px;width:${posW}px;"></div>
          </div>
          <div class="rc-skeleton" style="height:12px;width:${dateW}px;align-self:center;"></div>
        </div>
        ${hasGallery ? galleryStrip : ""}
        <ul class="rc-accomplishments">
          ${Array.from({ length: lineCount }, (_, i) => `
            <li class="rc-sk-item" style="padding:13px 20px;">
              <div class="rc-skeleton rc-sk-line" style="width:${LINE_WIDTHS[i % LINE_WIDTHS.length]}%"></div>
            </li>`).join("")}
        </ul>
      </div>`)
    .join("");
}

showSkeletons();

fetch("/data/resume.json")
  .then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  })
  .then((RESUME) => {

    const ASSETS_BASE = document.getElementById("resume-root").dataset.assetsBase || "";

    const PERSONA_LABELS = {
      fullstack: "Full-Stack",
      frontend:  "Frontend",
      backend:   "Backend",
      pm:        "PM / Lead",
      seo:       "SEO",
    };

    function fmtDate(d) {
      if (d === "Present") return "Present";
      const [y, m] = d.split("-");
      return new Date(+y, +m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }

    function renderSummary(persona) {
      const p = RESUME.personas[persona];
      document.getElementById("rc-summary").innerHTML =
        `<strong>Summary</strong>${p.summary}`;
    }

    function renderSkills(persona) {
      const grid = document.getElementById("rc-skills");
      const filtered = RESUME.skills.filter((s) => s.personas.includes(persona));
      if (!filtered.length) {
        grid.innerHTML = `<p class="rc-empty">No skills matched.</p>`;
        return;
      }
      grid.innerHTML = filtered
        .map(
          (s) => `
          <div class="rc-skill-card">
            <h3>${s.category}</h3>
            <div class="rc-chips">
              ${s.items.map((i) => `<span class="rc-chip">${i}</span>`).join("")}
            </div>
          </div>`
        )
        .join("");
    }

    let activeSwipers = [];

    function destroySwipers() {
      activeSwipers.forEach((s) => { try { s.destroy(true, true); } catch (_) {} });
      activeSwipers = [];
    }

    function initSwipers() {
      document.querySelectorAll(".rc-experience-swiper").forEach((el, i) => {
        const swiper = new Swiper(el, {
          slidesPerView: 1.2,
          spaceBetween: 12,
          grabCursor: true,
          loop: true,
          autoplay: {
            delay: 5000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
            reverseDirection: i % 2 !== 0,
          },
          speed: 1400,
          navigation: {
            nextEl: el.querySelector(".swiper-button-next"),
            prevEl: el.querySelector(".swiper-button-prev"),
          },
          pagination: {
            el: el.querySelector(".swiper-pagination"),
            clickable: true,
          },
          breakpoints: {
            480: { slidesPerView: 2, spaceBetween: 12 },
            768: { slidesPerView: 3, spaceBetween: 14 },
          },
        });
        activeSwipers.push(swiper);
      });
    }

    function galleryMarkup(gallery) {
      if (!gallery || !gallery.length) return "";
      gallery = gallery.filter((item) => !/_mobile\./i.test(item.file));
      const slides = gallery
        .map(({ file, alt, caption, width, height, loading = "lazy" }) => `
          <div class="swiper-slide">
            <figure class="rc-slide-figure">
              <img
                src="${ASSETS_BASE}${encodeURIComponent(file)}"
                alt="${alt}"
                width="${width || ""}"
                height="${height || ""}"
                loading="${loading}"
                decoding="async"
              />
              ${caption ? `<figcaption class="rc-slide-caption">${caption}</figcaption>` : ""}
            </figure>
          </div>`)
        .join("");
      return `
        <div class="rc-job-gallery">
          <div class="swiper rc-experience-swiper">
            <div class="swiper-wrapper">${slides}</div>
            <div class="swiper-pagination"></div>
            <div class="swiper-button-prev"></div>
            <div class="swiper-button-next"></div>
          </div>
        </div>`;
    }

    function renderExperience(persona) {
      destroySwipers();

      const container = document.getElementById("rc-experience");
      const jobs = RESUME.experience
        .map((job) => ({
          ...job,
          accomplishments: job.accomplishments.filter((a) => a.personas.includes(persona)),
        }))
        .filter((job) => job.accomplishments.length > 0);

      if (!jobs.length) {
        container.innerHTML = `<p class="rc-empty">No experience matched.</p>`;
        return;
      }

      container.innerHTML = jobs
        .map(
          (job) => `
          <div class="rc-job" id="${slugify(job.company)}">
            <div class="rc-job-header">
              <div>
                <h3>${job.company}</h3>
                <span class="rc-position">${job.position}</span>
              </div>
              <span class="rc-job-dates">${fmtDate(job.startDate)} – ${fmtDate(job.endDate)}</span>
            </div>
            ${galleryMarkup(job.gallery)}
            <ul class="rc-accomplishments">
              ${job.accomplishments.map((a) => `<li>${a.text}</li>`).join("")}
            </ul>
          </div>`
        )
        .join("");

      requestAnimationFrame(initSwipers);
    }

    // ── helpers ──
    const VALID_PERSONAS = Object.keys(PERSONA_LABELS);

    function slugify(str) {
      return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }

    function getShowAs() {
      const p = new URLSearchParams(window.location.search).get("show_as");
      return VALID_PERSONAS.includes(p) ? p : "fullstack";
    }

    function pushShowAs(persona) {
      const params = new URLSearchParams(window.location.search);
      params.set("show_as", persona);
      const next = `${window.location.pathname}?${params}${window.location.hash}`;
      history.pushState({ show_as: persona }, "", next);
    }

    function scrollToHash() {
      const hash = window.location.hash.slice(1);
      if (!hash) return;
      requestAnimationFrame(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    function render(persona, { push = false, scroll = false } = {}) {
      const root = document.getElementById("resume-root");
      root.dataset.persona = persona;
      document.getElementById("rc-badge").textContent = PERSONA_LABELS[persona];
      select.value = persona;
      renderSummary(persona);
      renderSkills(persona);
      renderExperience(persona);
      if (push) pushShowAs(persona);
      if (scroll) scrollToHash();
      // Measure live DOM after paint and persist as the next skeleton
      requestAnimationFrame(captureSkeletonSnapshot);
    }

    // ── static header ──
    const { name, label, email, phone, url } = RESUME.basics;
    document.getElementById("rc-name").innerHTML = name.replace(/(Jr\.)$/, '<span class="flicker-suffix">$1</span>');
    document.getElementById("rc-role").textContent = label;
    document.getElementById("rc-contact").innerHTML = `
      <a href="mailto:${email}">${email}</a>
      <a href="tel:${phone}">${phone}</a>
      <a href="${url}" target="_blank">${url}</a>
    `;

    // ── init ──
    const select = document.getElementById("persona-select");

    select.addEventListener("change", () => render(select.value, { push: true }));
    window.addEventListener("popstate", () => render(getShowAs(), { scroll: true }));
    render(getShowAs(), { scroll: true });

    // ── dark mode ──
    const darkToggle = document.getElementById("dark-toggle");
    const darkLabel  = document.getElementById("dark-label");

    function getDarkCookie() {
      return document.cookie.split("; ").find((r) => r.startsWith("rc_dark="))?.split("=")[1] === "1";
    }

    function setDarkCookie(val) {
      document.cookie = `rc_dark=${val ? 1 : 0}; path=/; samesite=lax`;
    }

    function applyDark(val) {
      document.body.classList.toggle("dark", val);
      darkLabel.textContent = val ? "Light" : "Dark";
    }

    let dark = getDarkCookie();
    applyDark(dark);

    darkToggle.addEventListener("click", () => {
      dark = !dark;
      applyDark(dark);
      setDarkCookie(dark);
    });

  })
  .catch((err) => {
    document.getElementById("resume-root").innerHTML = `
      <div class="rc-outage">
        <p class="rc-outage-icon">⚠</p>
        <p class="rc-outage-title">Resume data unavailable</p>
        <p class="rc-outage-msg">Could not load <code>/data/resume.json</code>: ${err.message}</p>
        <button onclick="location.reload()" class="rc-outage-btn">Retry</button>
      </div>`;
  });
