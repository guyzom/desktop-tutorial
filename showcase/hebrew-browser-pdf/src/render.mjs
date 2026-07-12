// HTML -> PDF via pinned headless Chromium (Playwright "print to PDF").
// Files are served over a local HTTP server rather than file://, because:
//   - paged.js re-fetches the stylesheet via XHR (blocked under file:// CORS)
//   - http:// avoids assorted file:// resource restrictions
// Deterministic settings: fixed viewport, print media emulation, fonts fully
// loaded before printing. Chromium still embeds a CreationDate in the PDF; the
// determinism gate neutralizes that in a post-pass (scripts/normalize_pdf.py).
//
// Usage: node src/render.mjs <input.html> <output.pdf> [--pagedjs] [--root DIR]

import { chromium } from 'playwright';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';

// Pinned Chromium build 1194 (ships with Playwright 1.56.1).
// Fallback: system Google Chrome (cloud sandboxes often lack the Playwright cache).
const CHROMIUM_EXECUTABLE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SYSTEM_CHROME = '/opt/google/chrome/chrome';
function chromePath() {
  if (fs.existsSync(CHROMIUM_EXECUTABLE)) return CHROMIUM_EXECUTABLE;
  if (fs.existsSync(SYSTEM_CHROME)) return SYSTEM_CHROME;
  return undefined;
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.json': 'application/json',
};

function startServer(root) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
      if (urlPath === '/favicon.ico') { res.writeHead(204); res.end(); return; }  // browsers auto-request it
      const filePath = path.join(root, urlPath);
      if (!filePath.startsWith(root)) { res.writeHead(403); res.end(); return; }
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('not found'); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

// Find the project root (nearest ancestor with package.json) so relative
// asset paths like ../assets/ resolve under the served root.
function findRoot(startFile) {
  let dir = path.dirname(path.resolve(startFile));
  for (;;) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return path.dirname(path.resolve(startFile));
    dir = parent;
  }
}

export async function render(inputHtml, outputPdf, { pagedjs = false, root = null } = {}) {
  const absIn = path.resolve(inputHtml);
  if (!fs.existsSync(absIn)) throw new Error(`input not found: ${absIn}`);
  const serveRoot = root ? path.resolve(root) : findRoot(absIn);
  const relPath = '/' + path.relative(serveRoot, absIn).split(path.sep).join('/');

  const server = await startServer(serveRoot);
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}${relPath}`;

  const browser = await chromium.launch({
    executablePath: chromePath(),
    args: ['--force-color-profile=srgb', '--disable-lcd-text', '--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  // Real JS errors only. "Failed to load resource" is a network 404; flag those
  // via responses instead, so a real missing asset is caught but sourcemaps aren't.
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  page.on('response', (r) => {
    const u = r.url();
    if (!r.ok() && r.status() !== 204 && !u.endsWith('.map') && !u.endsWith('/favicon.ico')) {
      errors.push(`HTTP ${r.status()} ${u}`);
    }
  });

  await page.goto(url, { waitUntil: 'networkidle' });
  if (pagedjs) {
    await page.waitForFunction(() => window.__pagedRendered === true, { timeout: 120000 });
  }
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(async () => { await document.fonts.ready; });

  const pdfOpts = { path: outputPdf, printBackground: true, preferCSSPageSize: true };
  if (!pagedjs) {
    pdfOpts.format = 'A4';
    pdfOpts.margin = { top: '18mm', bottom: '20mm', left: '16mm', right: '16mm' };
  }
  await page.pdf(pdfOpts);
  await browser.close();
  server.close();

  if (errors.length) console.error('[render] page errors:\n' + errors.join('\n'));
  const bytes = fs.statSync(outputPdf).size;
  console.log(`[render] wrote ${outputPdf} (${bytes} bytes)${pagedjs ? ' [paged.js]' : ''}`);
  return { errors };
}

// CLI entry
if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , input, output, ...flags] = process.argv;
  if (!input || !output) {
    console.error('usage: node src/render.mjs <input.html> <output.pdf> [--pagedjs] [--root DIR]');
    process.exit(2);
  }
  const rootIdx = flags.indexOf('--root');
  const root = rootIdx >= 0 ? flags[rootIdx + 1] : null;
  render(input, output, { pagedjs: flags.includes('--pagedjs'), root })
    .then(({ errors }) => {
      // Fail-loud: a page that logged JS errors, an uncaught exception, or a
      // missing asset (HTTP != 2xx) produced a compromised PDF. Exit nonzero so
      // ANY caller — not just the harness's stderr grep — treats it as a failure.
      if (errors.length) process.exit(1);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
