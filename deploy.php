<?php
/**
 * Sokout install / deploy panel
 * URL: https://sokout.app/deploy.php
 *
 * First visit: enter the password from deploy.config.php
 * Then use Pull (install/update) and Migrate as needed.
 */

declare(strict_types=1);

session_start();

const CONFIG_FILE = __DIR__ . '/deploy.config.php';
const EXAMPLE_CONFIG = __DIR__ . '/deploy.config.example.php';

function load_config(): array
{
    if (!is_file(CONFIG_FILE)) {
        if (is_file(EXAMPLE_CONFIG)) {
            copy(EXAMPLE_CONFIG, CONFIG_FILE);
        } else {
            http_response_code(500);
            exit('Missing deploy.config.php');
        }
    }

    /** @var array $config */
    $config = require CONFIG_FILE;
    return $config;
}

function h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function cmd_env(): array
{
    $home = getenv('HOME') ?: '';
    if ($home === '' || !is_dir($home)) {
        $home = is_dir('/home/infleggc') ? '/home/infleggc' : git_root();
    }

    $composerHome = $home . '/.composer';
    if (!is_dir($composerHome)) {
        @mkdir($composerHome, 0700, true);
    }

    $env = $_ENV + $_SERVER;
    $env['HOME'] = $home;
    $env['COMPOSER_HOME'] = $composerHome;
    $env['COMPOSER_ALLOW_SUPERUSER'] = '1';
    if (empty($env['PATH'])) {
        $env['PATH'] = '/usr/local/bin:/usr/bin:/bin';
    }

    return $env;
}

function run_cmd(string $cmd, ?string $cwd = null): array
{
    $descriptor = [
        0 => ['pipe', 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w'],
    ];
    $process = proc_open(
        $cmd,
        $descriptor,
        $pipes,
        $cwd ?? __DIR__,
        cmd_env(),
        ['bypass_shell' => false]
    );
    if (!is_resource($process)) {
        return ['ok' => false, 'output' => 'Failed to start process.', 'code' => 1];
    }
    fclose($pipes[0]);
    $stdout = stream_get_contents($pipes[1]) ?: '';
    $stderr = stream_get_contents($pipes[2]) ?: '';
    fclose($pipes[1]);
    fclose($pipes[2]);
    $code = proc_close($process);
    $output = trim($stdout . (strlen($stderr) ? "\n" . $stderr : ''));
    return ['ok' => $code === 0, 'output' => $output, 'code' => $code];
}

function git_root(): string
{
    return __DIR__;
}

function backend_path(array $config): string
{
    return git_root() . '/' . trim($config['backend_dir'] ?? 'backend', '/');
}

function php_cli(): string
{
    static $resolved = null;
    if ($resolved !== null) {
        return $resolved;
    }

    $candidates = [
        '/opt/alt/php84/usr/bin/php',
        '/opt/alt/php85/usr/bin/php',
        '/opt/alt/php83/usr/bin/php',
        '/opt/alt/php82/usr/bin/php',
        '/usr/local/bin/php',
        'php',
    ];

    // Prefer a real CLI binary — PHP_BINARY under LiteSpeed is often lsphp/cgi.
    foreach ($candidates as $bin) {
        if ($bin === 'php') {
            $check = run_cmd('command -v php');
            if ($check['ok'] && trim($check['output']) !== '') {
                $resolved = trim($check['output']);
                return $resolved;
            }
            continue;
        }
        if (is_file($bin) && is_executable($bin)) {
            $resolved = $bin;
            return $resolved;
        }
    }

    $resolved = (PHP_BINARY && is_file(PHP_BINARY)) ? PHP_BINARY : 'php';
    return $resolved;
}

function composer_cmd(): ?string
{
    static $resolved = null;
    if ($resolved !== null) {
        return $resolved === '' ? null : $resolved;
    }

    $php = escapeshellarg(php_cli());
    $phars = [
        git_root() . '/backend/composer.phar',
        git_root() . '/composer.phar',
        '/opt/cpanel/ea-wappspector/composer.phar',
        '/usr/local/bin/composer',
        '/usr/bin/composer',
    ];

    foreach ($phars as $phar) {
        if (is_file($phar)) {
            $resolved = $php . ' ' . escapeshellarg($phar);
            return $resolved;
        }
    }

    $which = run_cmd('command -v composer');
    if ($which['ok'] && trim($which['output']) !== '') {
        $resolved = escapeshellarg(trim($which['output']));
        return $resolved;
    }

    $resolved = '';
    return null;
}

function vendor_autoload(array $config): string
{
    return backend_path($config) . '/vendor/autoload.php';
}

function ensure_vendor(array $config): array
{
    if (is_file(vendor_autoload($config))) {
        return ['ok' => true, 'output' => 'vendor/ already present', 'installed' => false];
    }

    $composer = composer_cmd();
    if ($composer === null) {
        return [
            'ok' => false,
            'output' => "Composer not found. Install Composer or place composer.phar in the project root/backend.",
            'installed' => false,
        ];
    }

    $result = run_cmd(
        $composer . ' install --no-dev --optimize-autoloader --no-interaction',
        backend_path($config)
    );
    $result['installed'] = true;

    if ($result['ok'] && !is_file(vendor_autoload($config))) {
        $result['ok'] = false;
        $result['output'] .= "\ncomposer finished but vendor/autoload.php is still missing.";
    }

    return $result;
}

function artisan(array $config, string $args): array
{
    if (!is_file(vendor_autoload($config))) {
        return [
            'ok' => false,
            'output' => "Laravel vendor/ is missing. Click Install/pull first (runs composer install), then try again.",
            'code' => 1,
        ];
    }

    $backend = backend_path($config);
    $php = escapeshellarg(php_cli());
    return run_cmd($php . ' artisan ' . $args, $backend);
}

$config = load_config();
$flash = null;
$error = null;
$authed = !empty($_SESSION['sokout_deploy_auth']);

if (isset($_GET['logout'])) {
    unset($_SESSION['sokout_deploy_auth']);
    header('Location: deploy.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['password']) && !$authed) {
    $hash = (string) ($config['password_hash'] ?? '');
    if ($hash !== '' && password_verify((string) $_POST['password'], $hash)) {
        $_SESSION['sokout_deploy_auth'] = true;
        $authed = true;
    } else {
        $error = 'Invalid password.';
    }
}

$action = $_SERVER['REQUEST_METHOD'] === 'POST' ? (string) ($_POST['action'] ?? '') : '';

if ($authed && $action !== '') {
    if (!hash_equals((string) ($_SESSION['sokout_csrf'] ?? ''), (string) ($_POST['csrf'] ?? ''))) {
        $error = 'Invalid CSRF token. Refresh and try again.';
    } else {
        if ($action === 'pull') {
            $branch = preg_replace('/[^a-zA-Z0-9._\\/-]/', '', (string) ($config['git_branch'] ?? 'main')) ?: 'main';
            $fetch = run_cmd('git fetch origin ' . escapeshellarg($branch), git_root());
            $before = run_cmd('git rev-parse HEAD', git_root());
            $pull = run_cmd('git pull --ff-only origin ' . escapeshellarg($branch), git_root());
            $after = run_cmd('git rev-parse HEAD', git_root());

            $composerBin = composer_cmd();
            if ($composerBin === null) {
                $composer = ['ok' => false, 'output' => 'Composer not found on this host.'];
            } else {
                $composer = run_cmd(
                    $composerBin . ' install --no-dev --optimize-autoloader --no-interaction',
                    backend_path($config)
                );
            }

            $buildOut = '';
            if (!empty($config['build_frontend'])) {
                $build = run_cmd('npm ci && npm run build', git_root());
                $buildOut = "\n\n[frontend build]\n" . $build['output'];
            }

            $changed = ($before['output'] ?? '') !== ($after['output'] ?? '');
            $flash = [
                'title' => $changed ? 'Pulled latest changes' : 'Already up to date',
                'body' => trim(
                    "[git fetch]\n{$fetch['output']}\n\n[git pull]\n{$pull['output']}\n\n[composer]\n{$composer['output']}{$buildOut}"
                ),
                'ok' => $fetch['ok'] && $pull['ok'] && $composer['ok'],
                'updated' => $changed,
            ];
        }

        if ($action === 'migrate') {
            $vendor = ensure_vendor($config);
            if (!$vendor['ok']) {
                $flash = [
                    'title' => 'Migration blocked — dependencies missing',
                    'body' => "[composer install]\n{$vendor['output']}",
                    'ok' => false,
                    'updated' => false,
                ];
            } else {
                $migrate = artisan($config, 'migrate --force --no-interaction');
                $prefix = !empty($vendor['installed'])
                    ? "[composer install]\n{$vendor['output']}\n\n"
                    : '';
                $flash = [
                    'title' => $migrate['ok'] ? 'Migrations completed' : 'Migration failed',
                    'body' => $prefix . $migrate['output'],
                    'ok' => $migrate['ok'],
                    'updated' => true,
                ];
            }
        }

        if ($action === 'optimize') {
            $vendor = ensure_vendor($config);
            if (!$vendor['ok']) {
                $flash = [
                    'title' => 'Cache refresh blocked — dependencies missing',
                    'body' => "[composer install]\n{$vendor['output']}",
                    'ok' => false,
                    'updated' => false,
                ];
            } else {
                $clear = artisan($config, 'optimize:clear');
                $cache = artisan($config, 'config:cache');
                $flash = [
                    'title' => ($clear['ok'] && $cache['ok']) ? 'Caches refreshed' : 'Cache refresh failed',
                    'body' => "[optimize:clear]\n{$clear['output']}\n\n[config:cache]\n{$cache['output']}",
                    'ok' => $clear['ok'] && $cache['ok'],
                    'updated' => true,
                ];
            }
        }
    }
}

if (empty($_SESSION['sokout_csrf'])) {
    $_SESSION['sokout_csrf'] = bin2hex(random_bytes(16));
}
$csrf = $_SESSION['sokout_csrf'];

$status = [
    'branch' => '',
    'head' => '',
    'remote' => '',
    'behind' => 0,
    'ahead' => 0,
    'dirty' => false,
    'pending_migrations' => [],
    'env_exists' => false,
    'frontend_exists' => false,
    'vendor_exists' => false,
    'updated' => true,
];

if ($authed) {
    $branchCfg = (string) ($config['git_branch'] ?? 'main');
    run_cmd('git fetch origin ' . escapeshellarg($branchCfg) . ' 2>/dev/null', git_root());

    $status['branch'] = trim(run_cmd('git rev-parse --abbrev-ref HEAD', git_root())['output'] ?? '');
    $status['head'] = trim(run_cmd('git rev-parse --short HEAD', git_root())['output'] ?? '');
    $status['remote'] = trim(run_cmd('git rev-parse --short origin/' . $branchCfg, git_root())['output'] ?? '');

    $safeBranch = preg_replace('/[^a-zA-Z0-9._\\/-]/', '', $branchCfg) ?: 'main';
    $counts = trim(run_cmd('git rev-list --left-right --count HEAD...origin/' . $safeBranch, git_root())['output'] ?? "0\t0");
    // HEAD...origin → ahead [tab] behind
    $parts = preg_split('/\s+/', $counts) ?: ['0', '0'];
    $status['ahead'] = (int) ($parts[0] ?? 0);
    $status['behind'] = (int) ($parts[1] ?? 0);

    $dirty = trim(run_cmd('git status --porcelain', git_root())['output'] ?? '');
    $status['dirty'] = $dirty !== '';
    $status['updated'] = $status['behind'] === 0;

    $status['env_exists'] = is_file(backend_path($config) . '/.env');
    $status['vendor_exists'] = is_file(vendor_autoload($config));
    $status['frontend_exists'] = is_dir(git_root() . '/' . ($config['frontend_dir'] ?? 'frontend'))
        && is_file(git_root() . '/' . ($config['frontend_dir'] ?? 'frontend') . '/index.html');

    if ($status['vendor_exists']) {
        $pending = artisan($config, 'migrate:status --pending=1 --no-interaction');
        if ($pending['ok'] || $pending['output'] !== '') {
            $lines = preg_split('/\R/', $pending['output']) ?: [];
            foreach ($lines as $line) {
                $line = trim($line);
                if ($line === '' || stripos($line, 'Migration name') !== false || stripos($line, 'Pending') === 0) {
                    continue;
                }
                // migrate:status --pending prints migration file names
                if (preg_match('/\d{4}_\d{2}_\d{2}_\d{6}_\S+/', $line, $m) || preg_match('/^[0-9].+\.php$/', $line)) {
                    $status['pending_migrations'][] = $m[0] ?? $line;
                } elseif (stripos($line, 'Pending') !== false || preg_match('/^\s*\d+\s+/', $line)) {
                    // Laravel 11+ table style: keep non-header rows that look like migrations
                    if (preg_match('/(\d{4}_\d{2}_\d{2}_\d{6}_[a-z0-9_]+)/i', $line, $m2)) {
                        $status['pending_migrations'][] = $m2[1];
                    }
                }
            }
            $status['pending_migrations'] = array_values(array_unique($status['pending_migrations']));
        }
    }
}

?><!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Sokout Deploy</title>
  <style>
    :root {
      --bg: #0f1419;
      --panel: #1a222c;
      --text: #e8eef4;
      --muted: #8b9aab;
      --accent: #3d9a6a;
      --warn: #c9852e;
      --danger: #c44c4c;
      --line: #2a3542;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
      background:
        radial-gradient(1200px 600px at 10% -10%, #1d3a2e 0%, transparent 55%),
        radial-gradient(900px 500px at 100% 0%, #243044 0%, transparent 50%),
        var(--bg);
      color: var(--text);
      min-height: 100vh;
    }
    main {
      max-width: 720px;
      margin: 0 auto;
      padding: 48px 20px 64px;
    }
    h1 {
      font-family: "IBM Plex Serif", Georgia, serif;
      font-weight: 600;
      font-size: 2rem;
      margin: 0 0 8px;
      letter-spacing: -0.02em;
    }
    .sub { color: var(--muted); margin-bottom: 28px; }
    .card {
      background: color-mix(in srgb, var(--panel) 92%, transparent);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 22px;
      margin-bottom: 16px;
      backdrop-filter: blur(8px);
    }
    .row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 12px;
      border: 1px solid var(--line);
      color: var(--muted);
    }
    .pill.ok { color: #9fdfbb; border-color: #2f6b4c; background: #163528; }
    .pill.warn { color: #f0c58a; border-color: #7a5520; background: #2c2112; }
    label { display: block; font-size: 13px; color: var(--muted); margin-bottom: 6px; }
    input[type=password] {
      width: 100%;
      padding: 12px 14px;
      border-radius: 10px;
      border: 1px solid var(--line);
      background: #10161d;
      color: var(--text);
      margin-bottom: 14px;
    }
    button, .btn {
      appearance: none;
      border: 0;
      border-radius: 10px;
      padding: 11px 16px;
      font-weight: 600;
      cursor: pointer;
      background: var(--accent);
      color: #04140c;
    }
    button.secondary { background: #2a3542; color: var(--text); }
    button.danger { background: var(--danger); color: #fff; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    pre {
      white-space: pre-wrap;
      word-break: break-word;
      background: #0c1116;
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 14px;
      font-size: 12px;
      color: #c5d2df;
      max-height: 320px;
      overflow: auto;
    }
    ul { margin: 8px 0 0; padding-left: 18px; color: var(--muted); }
    .err { color: #ffb4b4; margin-bottom: 12px; }
    a { color: #9ec5ff; }
    .grid { display: grid; gap: 8px; }
    .kv { display: flex; justify-content: space-between; gap: 12px; font-size: 14px; border-bottom: 1px solid var(--line); padding: 8px 0; }
    .kv span:last-child { color: var(--muted); font-family: ui-monospace, monospace; }
  </style>
</head>
<body>
<main>
  <h1>Sokout Deploy</h1>
  <p class="sub">Install &amp; update panel for <strong>sokout.app</strong></p>

  <?php if (!$authed): ?>
    <div class="card">
      <?php if ($error): ?><p class="err"><?= h($error) ?></p><?php endif; ?>
      <form method="post">
        <label for="password">Deploy password</label>
        <input id="password" type="password" name="password" autocomplete="current-password" required>
        <button type="submit">Unlock</button>
      </form>
    </div>
  <?php else: ?>
    <div class="card">
      <div class="row" style="margin-bottom:14px">
        <?php if ($status['updated']): ?>
          <span class="pill ok">Everything is updated</span>
        <?php else: ?>
          <span class="pill warn"><?= (int) $status['behind'] ?> commit(s) available</span>
        <?php endif; ?>
        <?php if (count($status['pending_migrations'])): ?>
          <span class="pill warn"><?= count($status['pending_migrations']) ?> migration(s) pending</span>
        <?php else: ?>
          <span class="pill ok">No pending migrations</span>
        <?php endif; ?>
        <?php if (!$status['env_exists']): ?>
          <span class="pill warn">backend/.env missing</span>
        <?php endif; ?>
        <?php if (!$status['vendor_exists']): ?>
          <span class="pill warn">vendor/ missing — migrate will install deps first</span>
        <?php endif; ?>
        <?php if (!$status['frontend_exists']): ?>
          <span class="pill warn">frontend/ build missing</span>
        <?php endif; ?>
        <a href="?logout=1" style="margin-left:auto;font-size:13px">Log out</a>
      </div>

      <div class="grid">
        <div class="kv"><span>Branch</span><span><?= h($status['branch']) ?></span></div>
        <div class="kv"><span>Local HEAD</span><span><?= h($status['head']) ?></span></div>
        <div class="kv"><span>Origin</span><span><?= h($status['remote'] ?: 'n/a') ?></span></div>
        <div class="kv"><span>Working tree</span><span><?= $status['dirty'] ? 'dirty' : 'clean' ?></span></div>
      </div>
    </div>

    <?php if ($flash): ?>
      <div class="card">
        <div class="row" style="margin-bottom:10px">
          <strong><?= h($flash['title']) ?></strong>
          <span class="pill <?= !empty($flash['ok']) ? 'ok' : 'warn' ?>"><?= !empty($flash['ok']) ? 'ok' : 'check output' ?></span>
        </div>
        <pre><?= h($flash['body']) ?></pre>
      </div>
    <?php endif; ?>

    <div class="card">
      <form method="post" class="row">
        <input type="hidden" name="csrf" value="<?= h($csrf) ?>">
        <button type="submit" name="action" value="pull">
          <?= $status['updated'] ? 'Pull / reinstall' : 'Install / pull updates' ?>
        </button>
        <button class="secondary" type="submit" name="action" value="optimize">Refresh caches</button>
      </form>
      <p class="sub" style="margin:12px 0 0;font-size:13px">
        Pull runs <code>git pull</code> + <code>composer install</code> in <code>backend/</code>.
        <?= !empty($config['build_frontend']) ? 'Frontend rebuild is enabled.' : 'Commit a built <code>frontend/</code> folder (or enable <code>build_frontend</code> in config).' ?>
      </p>
    </div>

    <div class="card">
      <strong>Migrations</strong>
      <?php if (count($status['pending_migrations'])): ?>
        <ul>
          <?php foreach ($status['pending_migrations'] as $m): ?>
            <li><code><?= h($m) ?></code></li>
          <?php endforeach; ?>
        </ul>
        <form method="post" style="margin-top:14px">
          <input type="hidden" name="csrf" value="<?= h($csrf) ?>">
          <button type="submit" name="action" value="migrate">Run migrate</button>
        </form>
      <?php else: ?>
        <p class="sub" style="margin:10px 0 0">Database schema is up to date.</p>
        <form method="post" style="margin-top:14px">
          <input type="hidden" name="csrf" value="<?= h($csrf) ?>">
          <button class="secondary" type="submit" name="action" value="migrate">Run migrate anyway</button>
        </form>
      <?php endif; ?>
    </div>
  <?php endif; ?>
</main>
</body>
</html>
