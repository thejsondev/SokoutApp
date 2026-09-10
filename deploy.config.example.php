<?php
/**
 * Copy to deploy.config.php and set your password hash.
 * Generate a hash: php -r "echo password_hash('YOUR_PASSWORD', PASSWORD_DEFAULT), PHP_EOL;"
 */
return [
    // password_verify() hash — change after first login
    'password_hash' => '$2y$12$VtDKhphkYM18oqV1TNDd.eZ6763DvZZXRVzqa9QkgLcSRt1jRlDC.',

    // Relative paths from repo root
    'frontend_dir' => 'frontend',
    'backend_dir' => 'backend',

    // Optional: rebuild frontend on deploy when Node is available on the host
    'build_frontend' => false,

    // Git remote branch to track
    'git_branch' => 'main',
];
