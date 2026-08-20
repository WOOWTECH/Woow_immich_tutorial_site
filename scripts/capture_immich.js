// capture_immich.js — read-only Immich Web UI screenshot pipeline.
// Reads scripts/annotations.json, logs in when needed, injects callout/redact
// overlays, and saves annotated PNGs to assets/screenshots/<chapter>/<filename>.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SHOTS_JSON = path.join(ROOT, 'scripts', 'annotations.json');
const SHOTS_DIR = path.join(ROOT, 'assets', 'screenshots');

function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

async function injectOverlay(page, shot) {
  await page.evaluate(({ annotations, redact }) => {
    document.querySelectorAll('[data-immich-overlay]').forEach((n) => n.remove());
    const overlay = document.createElement('div');
    overlay.setAttribute('data-immich-overlay', '1');
    Object.assign(overlay.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '2147483647' });

    function make(text, style) {
      const el = document.createElement('div');
      el.textContent = text;
      Object.assign(el.style, style);
      return el;
    }
    for (const a of redact || []) {
      overlay.appendChild(make(a.text || '已遮罩', {
        position: 'absolute', left: a.at.x + 'px', top: a.at.y + 'px', width: a.w + 'px', height: a.h + 'px',
        background: '#f4f4f4', border: '2px solid #9e9e9e', borderRadius: '4px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#616161', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: '600',
      }));
    }
    for (const a of annotations || []) {
      if (a.type !== 'callout') continue;
      const wrap = document.createElement('div');
      Object.assign(wrap.style, { position: 'absolute', left: a.at.x + 'px', top: a.at.y + 'px', display: 'flex', alignItems: 'center', gap: '10px', transform: 'translateY(-50%)' });
      const num = make(String(a.number ?? ''), { background: '#e53935', color: '#fff', fontWeight: '700', fontSize: '18px', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.35)', flexShrink: '0' });
      const txt = make(a.text || '', { background: '#fff', color: '#212121', fontSize: '15px', fontWeight: '500', padding: '8px 14px', borderRadius: '18px', border: '2px solid #e53935', boxShadow: '0 3px 8px rgba(0,0,0,0.25)', whiteSpace: 'nowrap', maxWidth: '540px', overflow: 'hidden', textOverflow: 'ellipsis' });
      wrap.appendChild(num);
      wrap.appendChild(txt);
      overlay.appendChild(wrap);
    }
    document.body.appendChild(overlay);
  }, { annotations: shot.annotations || [], redact: shot.redact || [] });
  await page.waitForTimeout(250);
}

(async () => {
  const env = loadEnv();
  const config = JSON.parse(fs.readFileSync(SHOTS_JSON, 'utf8'));
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  let loggedIn = false;
  for (const shot of config.shots) {
    console.log(`→ ${shot.chapter}/${shot.filename}`);
    const url = /^https?:\/\//.test(shot.url) ? shot.url : env.IMMICH_URL + (shot.url || '/');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    if (shot.login && !loggedIn) {
      await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 15000 }).catch(() => {});
      const email = page.locator('input[type="email"], input[name="email"]').first();
      if (await email.count()) {
        await email.fill(env.IMMICH_EMAIL);
        const pwd = page.locator('input[type="password"]').first();
        await pwd.fill(env.IMMICH_PASS);
        await pwd.press('Enter');
        await page.waitForTimeout(6000);
        loggedIn = true;
      }
    } else if (shot.login && loggedIn) {
      await page.waitForTimeout(4000);
    }

    if (shot.dismissVersionModal) {
      // Read-only: dismiss the update notification banner if present.
      for (const label of ['Acknowledge', 'Dismiss', 'X']) {
        const btn = page.getByText(label, { exact: true }).first();
        if (await btn.count()) { await btn.click({ timeout: 3000 }).catch(() => {}); break; }
      }
      await page.waitForTimeout(1500);
    }

    if (shot.waitMs) await page.waitForTimeout(shot.waitMs);
    await injectOverlay(page, shot);
    const outDir = path.join(SHOTS_DIR, shot.chapter);
    fs.mkdirSync(outDir, { recursive: true });
    await page.screenshot({ path: path.join(outDir, shot.filename), fullPage: false });
  }
  await browser.close();
  console.log('done.');
})().catch((e) => { console.error('CAPTURE ERROR', e); process.exit(1); });
