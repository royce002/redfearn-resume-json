#!/usr/bin/env python3
"""Patch render.php brand grid helpers and resume.json Fossil agencyGrid."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RENDER = ROOT / "config" / "render.php"
RESUME = ROOT / "data" / "resume.json"

OLD_FN = '''/**
 * @param list<array<string, mixed>> $brands
 */
function rc_render_job_brand_grid(array $brands, string $assetsBase): string
{
    if ($brands === []) {
        return '';
    }
    $cells = '';
    foreach ($brands as $brand) {
        if (!is_array($brand) || !isset($brand['file'])) {
            continue;
        }
        $file = (string) $brand['file'];
        if ($file === '') {
            continue;
        }
        $src = rc_asset_url($assetsBase, $file);
        $alt = (string) ($brand['alt'] ?? $brand['caption'] ?? 'Brand mark');
        $caption = (string) ($brand['caption'] ?? '');
        $capHtml = $caption !== ''
            ? '<span class="rc-job-brand-caption">' . rc_esc($caption) . '</span>'
            : '';
        $cells .= '<li class="rc-job-brand-cell">'
            . '<img src="' . rc_esc($src) . '" alt="' . rc_esc($alt) . '" loading="lazy" decoding="async" />'
            . $capHtml
            . '</li>';
    }
    if ($cells === '') {
        return '';
    }

    return '<motion.div class="rc-job-brand-grid" role="group" aria-label="WPMU brand marks">'
        . '<ul class="rc-job-brand-grid__list">' . $cells . '</ul>'
        . '</div>';
}
'''

NEW_FN = '''function rc_brand_display_name(array $brand): string
{
    $name = trim((string) ($brand['name'] ?? ''));
    if ($name !== '') {
        return $name;
    }

    return trim((string) ($brand['caption'] ?? ''));
}

function rc_brand_initials(string $name): string
{
    $name = trim($name);
    if ($name === '') {
        return '?';
    }
    if (preg_match('/^A\\/X\\b/i', $name) === 1) {
        return 'AX';
    }
    $clean = preg_replace('/[()\\/]/', ' ', $name) ?? $name;
    $words = preg_split('/\\s+/', $clean, -1, PREG_SPLIT_NO_EMPTY) ?: [];
    $skip = ['LTD', 'BY', 'THE', 'AND', 'OF', 'LABEL', 'PRIVATE'];
    $letters = '';
    foreach ($words as $word) {
        $upper = strtoupper($word);
        if (in_array($upper, $skip, true)) {
            continue;
        }
        $letters .= strtoupper(substr($word, 0, 1));
        if (strlen($letters) >= 2) {
            break;
        }
    }

    return $letters !== '' ? substr($letters, 0, 3) : '?';
}

/**
 * @param array<string, mixed> $brand
 */
function rc_render_brand_cell(array $brand, string $assetsBase): string
{
    $label = rc_brand_display_name($brand);
    if ($label === '') {
        return '';
    }
    $file = trim((string) ($brand['file'] ?? ''));
    if ($file !== '') {
        $src = rc_asset_url($assetsBase, $file);
        $alt = (string) ($brand['alt'] ?? $label);
        $media = '<img src="' . rc_esc($src) . '" alt="' . rc_esc($alt) . '" loading="lazy" decoding="async" />';
    } else {
        $initials = rc_brand_initials($label);
        $media = '<span class="rc-job-brand-placeholder" aria-hidden="true">' . rc_esc($initials) . '</span>';
    }

    return '<li class="rc-job-brand-cell">'
        . $media
        . '<span class="rc-job-brand-caption">' . rc_esc($label) . '</span>'
        . '</li>';
}

/**
 * @param list<array<string, mixed>> $brands
 */
function rc_render_job_brand_grid(array $brands, string $assetsBase, string $ariaLabel): string
{
    if ($brands === []) {
        return '';
    }
    $cells = '';
    foreach ($brands as $brand) {
        if (!is_array($brand)) {
            continue;
        }
        $cells .= rc_render_brand_cell($brand, $assetsBase);
    }
    if ($cells === '') {
        return '';
    }

    return '<motion.div class="rc-job-brand-grid" role="group" aria-label="' . rc_esc($ariaLabel) . '">'
        . '<ul class="rc-job-brand-grid__list">' . $cells . '</ul>'
        . '</motion.div>';
}

/**
 * @param list<array<string, mixed>> $agency
 * @param list<array<string, mixed>> $marks
 */
function rc_render_job_brand_grids(array $agency, array $marks, string $assetsBase): string
{
    $agencyHtml = rc_render_job_brand_grid($agency, $assetsBase, 'Client and agency brands');
    $marksHtml = rc_render_job_brand_grid($marks, $assetsBase, 'WPMU brand marks');
    if ($agencyHtml === '' && $marksHtml === '') {
        return '';
    }

    return '<motion.div class="rc-job-brand-grids">' . $agencyHtml . $marksHtml . '</motion.div>';
}
'''

NEW_FN = NEW_FN.replace("<motion.div", "<div").replace("</motion.div>", "</div>")

def patch_render():
    text = RENDER.read_text(encoding="utf-8")
    # normalize: find function by marker
    start = text.find("function rc_render_job_brand_grid")
    if start < 0:
        raise SystemExit("rc_render_job_brand_grid not found")
    # back up to docblock
    doc_start = text.rfind("/**", 0, start)
    if doc_start < 0 or start - doc_start > 80:
        doc_start = start
    end = text.find("\n/**\n * @param list<array<string, mixed>> $gallery", start)
    if end < 0:
        raise SystemExit("gallery function marker not found")
    new_text = text[:doc_start] + NEW_FN + text[end:]
    new_text = new_text.replace(
        "'brandGrid' => is_array($job['brandGrid'] ?? null) ? $job['brandGrid'] : [],",
        "'agencyGrid' => is_array($job['agencyGrid'] ?? null) ? $job['agencyGrid'] : [],\n"
        "                'brandGrid' => is_array($job['brandGrid'] ?? null) ? $job['brandGrid'] : [],",
    )
    new_text = new_text.replace(
        "$brands = is_array($job['brandGrid']) ? $job['brandGrid'] : [];\n"
        "        $brandGridHtml = rc_render_job_brand_grid($brands, $assetsBase);",
        "$agency = is_array($job['agencyGrid']) ? $job['agencyGrid'] : [];\n"
        "        $marks = is_array($job['brandGrid']) ? $job['brandGrid'] : [];\n"
        "        $brandGridHtml = rc_render_job_brand_grids($agency, $marks, $assetsBase);",
    )
    RENDER.write_text(new_text, encoding="utf-8", newline="\n")
    print("render.php patched")


if __name__ == "__main__":
    patch_render()
