<?php
$cloudflare = [
    'public_url' => 'https://assets.redfearn.co/images/',
];

$personas = [
    'fullstack' => [
        'title' => 'Senior Full-Stack Architect & Technical Lead',
        'desc'  => '15+ year veteran of web architecture, specializing in high-performance legacy-to-modern migrations. Bridging robust backend infrastructure with optimized modern frontends.',
        'color' => '1d4ed8',
        'label' => 'Full-Stack Developer',
    ],
    'frontend' => [
        'title' => 'Senior Front-End Architect & UI Engineer',
        'desc'  => 'Specialist in crafting high-performance, accessible, and scalable user interfaces using modern build tools, utility-first CSS, and complex state management.',
        'color' => 'c2410c',
        'label' => 'Frontend Developer',
    ],
    'backend' => [
        'title' => 'Senior Back-End Engineer & Infrastructure Specialist',
        'desc'  => 'Backend architect focused on secure, scalable data systems, server infrastructure, OOP PHP, and REST API development for enterprise sectors.',
        'color' => '6d28d9',
        'label' => 'Backend Developer',
    ],
    'pm' => [
        'title' => 'Technical Project Lead & Agile Manager',
        'desc'  => 'Player-coach developer translating complex business requirements into actionable technical execution using Agile methodologies to ensure on-time delivery.',
        'color' => '0f766e',
        'label' => 'Project Manager / Lead',
    ],
    'seo' => [
        'title' => 'Technical SEO & Growth Architecture Specialist',
        'desc'  => 'Technical growth engineer specializing in Core Web Vitals, organic traffic scaling, automated asset pipelines, and complex Schema architectures.',
        'color' => 'b45309',
        'label' => 'SEO Specialist',
    ],
];

$active_persona = 'fullstack';
if (isset($_GET['show_as']) && array_key_exists($_GET['show_as'], $personas)) {
    $active_persona = $_GET['show_as'];
}

$p           = $personas[$active_persona];
$og_title    = 'Royce Redfearn Jr. — ' . $p['title'];
$og_desc     = $p['desc'];
$base_url    = 'https://redfearn.co/';
$current_url = $active_persona === 'fullstack' ? $base_url : $base_url . '?show_as=' . $active_persona;
$og_image    = 'https://placehold.co/1200x630/' . $p['color'] . '/FFFFFF?text=' . urlencode("Royce Redfearn Jr.\n" . $p['label']) . '&font=roboto';
