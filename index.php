<?php require_once 'config/personas.php'; ?>
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title><?php echo htmlspecialchars($og_title); ?></title>
    <meta name="description" content="<?php echo htmlspecialchars($og_desc); ?>" />

    <meta property="og:type"        content="profile" />
    <meta property="og:title"       content="<?php echo htmlspecialchars($og_title); ?>" />
    <meta property="og:description" content="<?php echo htmlspecialchars($og_desc); ?>" />
    <meta property="og:url"         content="<?php echo htmlspecialchars($current_url); ?>" />
    <meta property="og:image"       content="<?php echo htmlspecialchars($og_image); ?>" />
    <meta property="profile:first_name" content="Royce" />
    <meta property="profile:last_name"  content="Redfearn" />

    <meta name="twitter:card"        content="summary_large_image" />
    <meta name="twitter:title"       content="<?php echo htmlspecialchars($og_title); ?>" />
    <meta name="twitter:description" content="<?php echo htmlspecialchars($og_desc); ?>" />
    <meta name="twitter:image"       content="<?php echo htmlspecialchars($og_image); ?>" />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Bebas+Neue&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css" />
    <link rel="stylesheet" href="/assets/css/resume.css" />
  </head>
  <body>
    <div class="resume-component" id="resume-root"
         data-persona="<?php echo htmlspecialchars($active_persona); ?>"
         data-assets-base="<?php echo htmlspecialchars(rtrim($cloudflare['public_url'], '/') . '/'); ?>">

      <header class="rc-header">
        <div class="rc-identity">
          <h1 id="rc-name"></h1>
          <p class="rc-role" id="rc-role"></p>
        </div>
        <div class="rc-contact" id="rc-contact"></div>
      </header>

      <div class="rc-persona-bar">
        <label for="persona-select">View as</label>
        <div class="rc-select-wrap">
          <select id="persona-select">
            <option value="fullstack">Full-Stack Developer</option>
            <option value="frontend">Frontend Developer</option>
            <option value="backend">Backend Developer</option>
            <option value="pm">Project Manager / Lead</option>
            <option value="seo">SEO Specialist</option>
          </select>
        </div>
        <span class="rc-persona-badge" id="rc-badge"></span>
        <label class="rc-dark-toggle" id="dark-toggle" title="Toggle dark mode">
          <span id="dark-label">Dark</span>
          <div class="rc-toggle-track">
            <div class="rc-toggle-knob"></div>
          </div>
        </label>
      </div>

      <div id="rc-summary" class="rc-summary"></div>

      <section class="rc-section">
        <p class="rc-section-heading">Skills</p>
        <div class="rc-skills-grid" id="rc-skills"></div>
      </section>

      <section class="rc-section">
        <p class="rc-section-heading">Experience</p>
        <div id="rc-experience"></div>
      </section>

    </div>

    <script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
    <script src="/assets/js/resume.js"></script>
  </body>
</html>
