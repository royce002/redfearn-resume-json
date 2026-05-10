fetch("/data/resume.json")
  .then((r) => r.json())
  .then((RESUME) => {

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

    function renderExperience(persona) {
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
            <ul class="rc-accomplishments">
              ${job.accomplishments.map((a) => `<li>${a.text}</li>`).join("")}
            </ul>
          </div>`
        )
        .join("");
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

  });
