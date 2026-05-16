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
    const VALID_PERSONAS  = Object.keys(RESUME.personas || {});

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

      const persona  = (VALID_PERSONAS.includes(urlPersona)   ? urlPersona  : null)
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
        persona:  VALID_PERSONAS.includes(persona)   ? persona  : DEFAULTS.persona,
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

    function renderContact(basics) {
      const { email, phone, url, sameAs = [] } = basics || {};
      let html = "";
      if (email) html += `<a href="mailto:${esc(email)}">${esc(email)}</a>`;
      if (phone) {
        const tel = String(phone).replace(/[^\d+]/g, "");
        html += `<a href="tel:${esc(tel)}">${esc(phone)}</a>`;
      }
      if (url) html += `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url)}</a>`;
      for (const link of sameAs) {
        if (!link) continue;
        html += `<a href="${esc(link)}" target="_blank" rel="noopener noreferrer">${esc(contactLinkLabel(link))}</a>`;
      }
      return html;
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
      const p = RESUME.personas[persona] || {};
      return p.badgeLabel || persona;
    }

    function renderSummary(persona) {
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
      const filtered = liquidWhere(RESUME.skills, "personas", persona);

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
      const filtered = RESUME.skills.filter((s) => s.personas.includes(persona));
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

      const pData = RESUME.personas[persona] || {};
      const avatarSrc = pData.image || RESUME.basics.image || "/assets/images/image_738ca0.jpg";
      const av = document.getElementById("rc-avatar");
      if (av) av.src = avatarSrc;

      document.getElementById("rc-role").textContent = pData.headline || pData.title || RESUME.basics.label || "";

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
    const root          = document.getElementById("resume-root");
    const prefs         = getPrefs();
    const hydrated      = root.dataset.hydrated === "true";
    const serverPersona = root.dataset.persona || "fullstack";

    applyTheme(prefs.theme);

    if (hydrated && prefs.persona === serverPersona && prefs.platform === (root.dataset.platform || "wordpress")) {
      personaSelect.value  = prefs.persona;
      platformSelect.value = prefs.platform;
      themeSelect.value    = prefs.theme;
      document.getElementById("rc-badge").textContent = badgeFor(prefs.persona);
      renderEducation();
      requestAnimationFrame(() => initJobGalleries());
      scrollToHash();
      requestAnimationFrame(captureSkeletonSnapshot);

      // Still run platform-specific side effects even when hydrated
      if (prefs.platform === "wordpress") {
        showWordPressLog(prefs.persona);
      } else if (prefs.platform === "shopify") {
        renderSkillsShopify(prefs.persona);
      } else if (prefs.platform === "headless") {
        renderSkillsHeadless(prefs.persona);
      }
    } else {
      render(prefs.persona, {
        platform: prefs.platform,
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
