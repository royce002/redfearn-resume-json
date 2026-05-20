/**
 * Local dev: PHP on :8001, BrowserSync on :8000 (proxy + live reload).
 * Open http://localhost:8000
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import browserSync from "browser-sync";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

const PHP_HOST = "127.0.0.1";
const PHP_PORT = 8001;
const BS_PORT = 8000;

const php = spawn("php", ["-S", `${PHP_HOST}:${PHP_PORT}`, "-t", "."], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
});

php.on("error", (err) => {
  console.error("Failed to start PHP. Is php on PATH (WAMP)?", err.message);
  process.exit(1);
});

const bs = browserSync.create("redfearn-dev");
bs.init(
  {
    proxy: `http://${PHP_HOST}:${PHP_PORT}`,
    port: BS_PORT,
    open: false,
    notify: true,
    ghostMode: false,
    ui: false,
    files: [
      "index.php",
      "config/**/*.php",
      "assets/css/**/*.css",
      "assets/js/**/*.js",
      "data/**/*.json",
    ],
    watchOptions: {
      ignoreInitial: true,
      ignored: [
        "**/node_modules/**",
        "**/dist/**",
        "**/.git/**",
        "**/assets/images/**",
        "**/*.bak",
        "**/__pycache__/**",
      ],
      awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 50 },
    },
  },
  (err, bsInstance) => {
    if (err) {
      console.error(err);
      php.kill();
      process.exit(1);
    }
    console.log(`\n  Dev:  http://localhost:${BS_PORT}`);
    console.log(`  PHP:  http://${PHP_HOST}:${PHP_PORT} (proxied)\n`);
  }
);

function shutdown() {
  bs.exit();
  php.kill("SIGTERM");
  setTimeout(() => process.exit(0), 300);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
