<?php
declare(strict_types=1);

header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header(
    "Content-Security-Policy: default-src 'self'; "
    . "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://cdn.logr-in.com https://embed.tawk.to https://*.tawk.to; "
    . "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
    . "font-src 'self' https://fonts.gstatic.com; "
    . "img-src 'self' data: https://assets.redfearn.co https://placehold.co https://lh3.googleusercontent.com; "
    . "connect-src 'self' wss: https:; "
    . "frame-src https://embed.tawk.to https://*.tawk.to;"
);

require_once __DIR__ . '/config/personas.php';
require_once __DIR__ . '/config/render.php';

$resume_path = __DIR__ . '/data/resume.json';
$initial_resume = null;
if (is_readable($resume_path)) {
    $resume_raw = file_get_contents($resume_path);
    $decoded = json_decode((string) $resume_raw, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
        $initial_resume = $decoded;
    }
}

$persona_keys = $initial_resume !== null && isset($initial_resume['personas']) && is_array($initial_resume['personas'])
    ? array_keys($initial_resume['personas'])
    : [];
$preferred_order = ['fullstack', 'frontend', 'backend', 'pm', 'seo'];
$persona_order = array_values(array_filter($preferred_order, static function ($k) use ($persona_keys): bool {
    return in_array($k, $persona_keys, true);
}));
foreach ($persona_keys as $k) {
    if (!in_array($k, $persona_order, true)) {
        $persona_order[] = $k;
    }
}

// ── Platform / Theme config from viewConfig SSOT ──────────────────────────
$view_config     = is_array($initial_resume) ? ($initial_resume['viewConfig'] ?? []) : [];
$platform_config = is_array($view_config['platforms'] ?? null) ? $view_config['platforms'] : [
    'wordpress' => ['label' => 'WordPress (Timber / REST)'],
    'shopify'   => ['label' => 'Shopify (Liquid)'],
    'headless'  => ['label' => 'Headless (Decoupled API)'],
];
$theme_config = is_array($view_config['themes'] ?? null) ? $view_config['themes'] : [
    'modern'     => ['label' => 'Modern Architect'],
    'legacy'     => ['label' => 'Legacy Terminal'],
    'accessible' => ['label' => 'Accessible / Enterprise'],
];
$valid_platforms = array_keys($platform_config);
$valid_themes    = array_keys($theme_config);

// Priority: URL → cookie → default
$active_persona = 'fullstack';
if ($initial_resume !== null && isset($_GET['show_as']) && is_string($_GET['show_as']) && in_array($_GET['show_as'], $persona_keys, true)) {
    $active_persona = $_GET['show_as'];
}

$active_platform = 'wordpress';
if (isset($_GET['platform']) && is_string($_GET['platform']) && in_array($_GET['platform'], $valid_platforms, true)) {
    $active_platform = $_GET['platform'];
} elseif (isset($_COOKIE['rc_platform']) && is_string($_COOKIE['rc_platform']) && in_array($_COOKIE['rc_platform'], $valid_platforms, true)) {
    $active_platform = $_COOKIE['rc_platform'];
}

$active_theme = 'modern';
if (isset($_GET['theme']) && is_string($_GET['theme']) && in_array($_GET['theme'], $valid_themes, true)) {
    $active_theme = $_GET['theme'];
} elseif (isset($_COOKIE['rc_theme']) && is_string($_COOKIE['rc_theme']) && in_array($_COOKIE['rc_theme'], $valid_themes, true)) {
    $active_theme = $_COOKIE['rc_theme'];
}

$base_trim = rtrim(RC_BASE_URL, '/');
$canonical_url = $active_persona === 'fullstack'
    ? $base_trim . '/'
    : $base_trim . '/?show_as=' . rawurlencode($active_persona);

rc_redirect_to_canonical_url_if_needed($canonical_url, $active_persona, $valid_platforms, $valid_themes);

$assets_base = rtrim($cloudflare['public_url'], '/') . '/';
$og_image = $assets_base . 'og/' . rawurlencode($active_persona) . '.png';

$p_meta = $initial_resume !== null && isset($initial_resume['personas'][$active_persona])
    ? $initial_resume['personas'][$active_persona]
    : [];
$og_title = 'Royce Redfearn Jr. — ' . (string) ($p_meta['title'] ?? 'Resume');
$og_desc = (string) ($p_meta['metaDescription'] ?? '');

$avatar_url = $initial_resume !== null
    ? (string) ($p_meta['image'] ?? $initial_resume['basics']['image'] ?? '/assets/images/image_738ca0.jpg')
    : '/assets/images/image_738ca0.jpg';

$dark_initial = false;
if (isset($_COOKIE['rc_dark']) && $_COOKIE['rc_dark'] === '1') {
    $dark_initial = true;
} elseif (!isset($_COOKIE['rc_dark']) && isset($_SERVER['HTTP_SEC_CH_PREFERS_COLOR_SCHEME']) && $_SERVER['HTTP_SEC_CH_PREFERS_COLOR_SCHEME'] === 'dark') {
    $dark_initial = true;
}

// Matches assets/css/resume.css (--bg per persona / .dark) for Android Chrome theme-color.
if ($initial_resume === null) {
    $theme_color = $dark_initial ? '#0f0f14' : '#eef2ff';
} else {
    $persona_theme_bg = [
        'fullstack' => ['light' => '#eef2ff', 'dark' => '#0a0f1e'],
        'frontend' => ['light' => '#fff7ed', 'dark' => '#1c0a06'],
        'backend' => ['light' => '#faf5ff', 'dark' => '#0f0720'],
        'pm' => ['light' => '#f0fdfa', 'dark' => '#042f2e'],
        'seo' => ['light' => '#fffbeb', 'dark' => '#1a1004'],
    ];
    $palette = $persona_theme_bg[$active_persona] ?? $persona_theme_bg['fullstack'];
    $theme_color = $palette[$dark_initial ? 'dark' : 'light'];
}

$body_attrs = $dark_initial ? ' class="dark"' : '';
if ($initial_resume !== null) {
    $body_attrs .= ' data-persona="' . rc_esc($active_persona) . '"';
}

$person_json_ld = null;
if ($initial_resume !== null) {
    $person_json_ld = rc_person_json_ld($initial_resume, $active_persona, $canonical_url);
}

$critical_css_path = __DIR__ . '/assets/css/critical.min.css';
$critical_css = is_readable($critical_css_path) ? file_get_contents($critical_css_path) : '';

if ($initial_resume === null) {
    http_response_code(503);
    header('Retry-After: 3600');
} else {
    header('Link: <' . $canonical_url . '>; rel="canonical"');
}
?>
<!DOCTYPE html>
<html lang="en" data-theme="<?php echo rc_esc($active_theme); ?>">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Accept-CH" content="Sec-CH-Prefers-Color-Scheme" />

    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-2XPGPC9BX3"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        dataLayer.push(arguments);
      }
      gtag("js", new Date());
      gtag("config", "G-2XPGPC9BX3");
    </script>

    <title><?php echo rc_esc($og_title); ?></title>
    <meta name="description" content="<?php echo rc_esc($og_desc); ?>" />
    <link rel="canonical" href="<?php echo rc_esc($canonical_url); ?>" />

    <link rel="icon" type="image/png" href="/assets/images/favicon-96x96.png" sizes="96x96" />
    <link rel="icon" type="image/svg+xml" href="/assets/images/favicon.svg" />
    <link rel="shortcut icon" href="/assets/images/favicon.ico" />
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/images/apple-touch-icon.png" />
    <meta name="apple-mobile-web-app-title" content="Resume Royce Redfearn" />
    <link rel="manifest" href="/assets/images/site.webmanifest" />

    <meta name="theme-color" content="<?php echo rc_esc($theme_color); ?>" />
    <meta name="color-scheme" content="light dark" />
    <meta name="application-name" content="Resume Royce Redfearn" />

    <meta property="og:type" content="profile" />
    <meta property="og:title" content="<?php echo rc_esc($og_title); ?>" />
    <meta property="og:description" content="<?php echo rc_esc($og_desc); ?>" />
    <meta property="og:url" content="<?php echo rc_esc($canonical_url); ?>" />
    <meta property="og:image" content="<?php echo rc_esc($og_image); ?>" />
    <meta property="profile:first_name" content="Royce" />
    <meta property="profile:last_name" content="Redfearn" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="<?php echo rc_esc($og_title); ?>" />
    <meta name="twitter:description" content="<?php echo rc_esc($og_desc); ?>" />
    <meta name="twitter:image" content="<?php echo rc_esc($og_image); ?>" />

<?php if ($person_json_ld !== null) { ?>
    <script type="application/ld+json"><?php echo json_encode($person_json_ld, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); ?></script>
<?php } ?>

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="preconnect" href="https://assets.redfearn.co" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Bebas+Neue&family=IBM+Plex+Mono:wght@400;600&display=swap"
      rel="stylesheet"
    />
    <style><?php echo $critical_css; ?></style>
    <link rel="stylesheet" href="/assets/css/resume.css" media="print" onload="this.media='all'" />
    <noscript><link rel="stylesheet" href="/assets/css/resume.css" /></noscript>
  </head>
  <body<?php echo $body_attrs; ?>>
    <a class="skip-link" href="#rc-experience">Skip to experience</a>
<?php if ($initial_resume === null) { ?>
    <div class="resume-component" id="resume-root" data-persona="fullstack" data-assets-base="<?php echo rc_esc($assets_base); ?>">
      <div class="rc-outage">
        <p class="rc-outage-title">Resume data could not be loaded</p>
        <p class="rc-outage-msg">Check that <code>data/resume.json</code> exists and is valid JSON.</p>
      </div>
    </div>
<?php } else { ?>
    <script>
      window.INITIAL_RESUME_DATA = <?php echo json_encode($initial_resume, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE); ?>;
    </script>
    <main id="resume-root" class="resume-component"
         data-persona="<?php echo rc_esc($active_persona); ?>"
         data-platform="<?php echo rc_esc($active_platform); ?>"
         data-assets-base="<?php echo rc_esc($assets_base); ?>"
         data-hydrated="true">

      <header class="rc-header">
        <div class="rc-header-intro">
          <img
            src="<?php echo rc_esc($avatar_url); ?>"
            alt="<?php echo rc_esc((string) ($initial_resume['basics']['name'] ?? '')); ?>"
            id="rc-avatar"
            class="rc-avatar"
            width="96"
            height="96"
            fetchpriority="high"
          />
          <div class="rc-identity">
            <h1 id="rc-name"><?php echo rc_render_name_html((string) ($initial_resume['basics']['name'] ?? '')); ?></h1>
            <p class="rc-role" id="rc-role"><?php echo rc_esc(rc_persona_headline($initial_resume, $active_persona)); ?></p>
          </div>
        </div>
        <div class="rc-contact" id="rc-contact">
          <?php echo rc_render_contact($initial_resume['basics'] ?? []); ?>
        </div>
      </header>

      <form id="persona-form" class="rc-persona-bar" method="get" action="/" aria-label="View controls">
        <label for="persona-select">View as</label>
        <div class="rc-select-wrap">
          <select id="persona-select" name="show_as" class="rc-control-select">
            <?php
            foreach ($persona_order as $pk) {
                $pl = $initial_resume['personas'][$pk]['selectLabel'] ?? $pk;
                $sel = $pk === $active_persona ? ' selected' : '';
                echo '<option value="' . rc_esc($pk) . '"' . $sel . '>' . rc_esc((string) $pl) . '</option>';
            }
            ?>
          </select>
        </div>
        <span class="rc-persona-badge" id="rc-badge"><?php echo rc_esc((string) ($p_meta['badgeLabel'] ?? '')); ?></span>

        <label for="platform-select" style="display:none">Platform</label>
        <div class="rc-select-wrap" style="display:none">
          <select id="platform-select" name="platform" class="rc-control-select">
            <?php
            foreach ($platform_config as $pk => $pmeta) {
                $pl = is_array($pmeta) ? ($pmeta['label'] ?? $pk) : $pk;
                $sel = $pk === $active_platform ? ' selected' : '';
                echo '<option value="' . rc_esc((string) $pk) . '"' . $sel . '>' . rc_esc((string) $pl) . '</option>';
            }
            ?>
          </select>
        </div>

        <label for="theme-select" style="display:none">Skin</label>
        <div class="rc-select-wrap" style="display:none">
          <select id="theme-select" name="theme" class="rc-control-select">
            <?php
            foreach ($theme_config as $tk => $tmeta) {
                $tl = is_array($tmeta) ? ($tmeta['label'] ?? $tk) : $tk;
                $sel = $tk === $active_theme ? ' selected' : '';
                echo '<option value="' . rc_esc((string) $tk) . '"' . $sel . '>' . rc_esc((string) $tl) . '</option>';
            }
            ?>
          </select>
        </div>

        <label class="rc-dark-toggle" id="dark-toggle" title="Toggle dark mode">
          <span id="dark-label"><?php echo $dark_initial ? 'Light' : 'Dark'; ?></span>
          <div class="rc-toggle-track">
            <div class="rc-toggle-knob"></div>
          </div>
        </label>
        <button type="submit" class="rc-sr-only">Apply view settings</button>
      </form>

      <aside id="rc-platform-flyout" class="rc-platform-flyout" hidden aria-live="polite" aria-label="Platform render log"></aside>

      <div id="rc-summary" class="rc-summary"><?php echo rc_render_summary($initial_resume, $active_persona); ?></div>

      <section class="rc-section" aria-labelledby="skills-heading">
        <h2 id="skills-heading" class="rc-section-heading"><?php echo $active_platform === 'shopify' ? 'Product Collections' : 'Skills'; ?></h2>
        <div class="rc-skills-grid" id="rc-skills"><?php echo rc_render_skills_for_platform($initial_resume, $active_persona, $active_platform); ?></div>
      </section>

      <section class="rc-section" aria-labelledby="exp-heading">
        <h2 id="exp-heading" class="rc-section-heading">Experience</h2>
        <div id="rc-experience"><?php echo rc_render_experience($initial_resume, $active_persona, $assets_base); ?></div>
      </section>

      <?php
        $edu_html = rc_render_education($initial_resume);
        $edu_hidden = $edu_html === '';
      ?>
      <section class="rc-section rc-section-education" id="rc-section-education"<?php echo $edu_hidden ? ' hidden' : ''; ?> aria-labelledby="edu-heading">
        <h2 id="edu-heading" class="rc-section-heading">Education</h2>
        <div id="rc-education"><?php echo $edu_html; ?></div>
      </section>

      <?php
        $rec_html = rc_render_recommendations($initial_resume, $active_persona);
        $rec_hidden = $rec_html === '';
      ?>
      <section class="rc-section rc-section-recommendations" id="rc-section-recommendations"<?php echo $rec_hidden ? ' hidden' : ''; ?> aria-labelledby="rec-heading">
        <h2 id="rec-heading" class="rc-section-heading">Recommendations</h2>
        <div id="rc-recommendations"><?php echo $rec_html; ?></div>
      </section>

    </main>
<?php } ?>
    <script src="https://cdn.logr-in.com/LogRocket.min.js" crossorigin="anonymous"></script>
    <script>
      window.LogRocket && window.LogRocket.init("3iqi5o/redfearnco");
    </script>
    <script src="/assets/js/resume.js" defer></script>
    <!--Start of Tawk.to Script-->
    <script>
      var Tawk_API = Tawk_API || {},
        Tawk_LoadStart = new Date();
      (function () {
        var s1 = document.createElement("script"),
          s0 = document.getElementsByTagName("script")[0];
        s1.async = true;
        s1.src = "https://embed.tawk.to/6a03bd49defb6f1c3776f438/1jof9mps8";
        s1.charset = "UTF-8";
        s1.setAttribute("crossorigin", "*");
        s0.parentNode.insertBefore(s1, s0);
      })();
    </script>
    <!--End of Tawk.to Script-->
  </body>
</html>
