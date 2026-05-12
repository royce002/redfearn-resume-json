// ── skeleton snapshot (persona swap only) ───────────────────────────────────
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

  document.getElementById("rc-skills").innerHTML = snap.skills
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
  return `${base.replace(/\/$/, "")}/${encodeURIComponent(file)}`;
}

function gallerySrcsetAttr(item, assetsBase) {
  const v = item.srcsetVariants;
  if (!Array.isArray(v) || !v.length) return "";
  const parts = v
    .filter((x) => x && x.file && x.w)
    .map((x) => `${assetUrl(assetsBase, x.file)} ${Number(x.w)}w`);
  return parts.length ? ` srcset="${parts.join(", ")}"` : "";
}

/** Tear down gallery autoplay timers before re-render */
function destroyGalleryControllers() {
  document.querySelectorAll("[data-rc-gallery]").forEach((el) => {
    const id = el.dataset.rcGalleryTimer;
    if (id) {
      clearInterval(Number(id));
      delete el.dataset.rcGalleryTimer;
    }
    delete el.dataset.rcGalleryInit;
  });
}

function initJobGalleries() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("[data-rc-gallery]").forEach((wrap) => {
    const sc = wrap.querySelector(".rc-job-gallery-scroll");
    const prev = wrap.querySelector(".rc-gallery-prev");
    const next = wrap.querySelector(".rc-gallery-next");
    if (!sc || !prev || !next) return;
    if (wrap.dataset.rcGalleryInit) return;
    wrap.dataset.rcGalleryInit = "1";

    const step = () => Math.max(260, Math.round(sc.clientWidth * 0.88));
    prev.addEventListener("click", () => sc.scrollBy({ left: -step(), behavior: reduce ? "auto" : "smooth" }));
    next.addEventListener("click", () => sc.scrollBy({ left: step(), behavior: reduce ? "auto" : "smooth" }));

    if (!reduce && sc.scrollWidth > sc.clientWidth + 8) {
      let dir = 1;
      const tick = () => {
        if (wrap.matches(":hover")) return;
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
      const timer = window.setInterval(tick, 5200);
      wrap.dataset.rcGalleryTimer = String(timer);
    }
  });
}

loadResumeData()
  .then((RESUME) => {
    const ASSETS_BASE = document.getElementById("resume-root").dataset.assetsBase || "";

    function esc(s) {
      return String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
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

    const VALID_PERSONAS = Object.keys(RESUME.personas || {});

    function badgeFor(persona) {
      const p = RESUME.personas[persona] || {};
      return p.badgeLabel || persona;
    }

    function renderSummary(persona) {
      const p = RESUME.personas[persona];
      const text = p && p.summary ? esc(p.summary) : "";
      document.getElementById("rc-summary").innerHTML = `<strong>Summary</strong>${text}`;
    }

    function renderSkills(persona) {
      const grid = document.getElementById("rc-skills");
      const filtered = RESUME.skills.filter((s) => s.personas.includes(persona));
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

    let pageLcpAssigned = false;

    function galleryMarkup(gallery) {
      if (!gallery || !gallery.length) return "";
      gallery = gallery.filter((item) => !/_mobile\./i.test(item.file));
      const slides = gallery
        .map((item) => {
          const { file, alt, caption, width, height, loading = "lazy" } = item;
          const src = assetUrl(ASSETS_BASE, file);
          const srcset = gallerySrcsetAttr(item, ASSETS_BASE);
          const sizes = srcset ? ' sizes="(max-width: 768px) 90vw, 33vw"' : "";
          let fetchP = "";
          if (loading === "eager" && !pageLcpAssigned) {
            fetchP = ' fetchpriority="high"';
            pageLcpAssigned = true;
          }
          const cap = caption ? `<figcaption class="rc-slide-caption">${esc(caption)}</figcaption>` : "";
          return `
          <figure class="rc-slide-figure">
            <img src="${esc(src)}"${srcset}${sizes} alt="${esc(alt)}" width="${width || ""}" height="${height || ""}" loading="${esc(
            loading
          )}" decoding="async"${fetchP} />
            ${cap}
          </figure>`;
        })
        .join("");
      return `
        <div class="rc-job-gallery" data-rc-gallery>
          <div class="rc-job-gallery-scroll" tabindex="0" role="region" aria-label="Project screenshots">
            ${slides}
          </div>
          <button type="button" class="rc-gallery-prev" aria-label="Scroll gallery left">‹</button>
          <button type="button" class="rc-gallery-next" aria-label="Scroll gallery right">›</button>
        </div>`;
    }

    function renderExperience(persona) {
      destroyGalleryControllers();
      pageLcpAssigned = false;

      const container = document.getElementById("rc-experience");
      const jobs = RESUME.experience
        .map((job) => ({
          ...job,
          accomplishments: job.accomplishments.filter((a) => a.personas.includes(persona)),
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
            ${galleryMarkup(job.gallery)}
            <ul class="rc-accomplishments">
              ${job.accomplishments.map((a) => `<li>${esc(a.text)}</li>`).join("")}
            </ul>
          </article>`;
        })
        .join("");

      requestAnimationFrame(() => initJobGalleries());
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

    function renderRecommendations(persona) {
      const all = RESUME.recommendations || [];
      const filtered = all.filter((r) => !r.personas || !r.personas.length || r.personas.includes(persona));
      const section = document.getElementById("rc-section-recommendations");
      const el = document.getElementById("rc-recommendations");
      if (!filtered.length) {
        section.hidden = true;
        el.innerHTML = "";
        return;
      }
      section.hidden = false;
      el.innerHTML = filtered
        .map(
          (r) => `
          <blockquote class="rc-rec-card" cite="${esc(r.name)}">
            <p class="rc-rec-text">${esc(r.text)}</p>
            <footer class="rc-rec-attribution">
              <strong>${esc(r.name)}</strong>
              ${r.title ? `<span class="rc-rec-title">${esc(r.title)}</span>` : ""}
            </footer>
          </blockquote>`
        )
        .join("");
    }

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
      const path = window.location.pathname || "/";
      const next = `${path}?${params}${window.location.hash}`;
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

    function render(persona, { push = false, scroll = false, showSkeleton = false } = {}) {
      if (showSkeleton) showSkeletons();

      const root = document.getElementById("resume-root");
      root.dataset.persona = persona;
      document.getElementById("rc-badge").textContent = badgeFor(persona);
      select.value = persona;

      const pData = RESUME.personas[persona] || {};
      document.getElementById("rc-role").textContent = pData.headline || pData.title || RESUME.basics.label || "";

      const { name, email, phone, url } = RESUME.basics;
      document.getElementById("rc-name").innerHTML = name.replace(/(Jr\.)$/, '<span class="flicker-suffix">$1</span>');
      document.getElementById("rc-contact").innerHTML = `
      <a href="mailto:${esc(email)}">${esc(email)}</a>
      <a href="tel:${esc(String(phone).replace(/[^\d+]/g, ""))}">${esc(phone)}</a>
      <a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url)}</a>
    `;

      renderSummary(persona);
      renderSkills(persona);
      renderExperience(persona);
      renderRecommendations(persona);
      if (push) pushShowAs(persona);
      if (scroll) scrollToHash();
      requestAnimationFrame(captureSkeletonSnapshot);
    }

    const select = document.getElementById("persona-select");
    const form = document.getElementById("persona-form");

    function onPersonaChange(nextPersona, { push, scroll }) {
      render(nextPersona, { push, scroll, showSkeleton: true });
    }

    select.addEventListener("change", () => {
      onPersonaChange(select.value, { push: true, scroll: false });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      onPersonaChange(select.value, { push: true, scroll: false });
    });

    window.addEventListener("popstate", () => {
      render(getShowAs(), { scroll: true, showSkeleton: true });
    });

    const root = document.getElementById("resume-root");
    const urlPersona = getShowAs();
    const hydrated = root.dataset.hydrated === "true";
    const serverPersona = root.dataset.persona || "fullstack";

    if (hydrated && urlPersona === serverPersona) {
      select.value = urlPersona;
      document.getElementById("rc-badge").textContent = badgeFor(urlPersona);
      renderEducation();
      requestAnimationFrame(() => initJobGalleries());
      scrollToHash();
      requestAnimationFrame(captureSkeletonSnapshot);
    } else {
      render(urlPersona, { scroll: true, showSkeleton: false });
      renderEducation();
    }

    // ── dark mode ──
    const darkToggle = document.getElementById("dark-toggle");
    const darkLabel = document.getElementById("dark-label");

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
