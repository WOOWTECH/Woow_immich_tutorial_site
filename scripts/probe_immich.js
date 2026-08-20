// probe_immich.js — read-only dump of the Immich Web UI structure.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

(async () => {
  const env = loadEnv();
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  await page.goto(env.IMMICH_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  console.log('URL after load:', page.url());

  // Login form: Immich uses email + password inputs and a "Login" button.
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="Email" i]').first();
  if (await emailInput.count()) {
    await emailInput.fill(env.IMMICH_EMAIL);
    const pwd = page.locator('input[type="password"]').first();
    await pwd.fill(env.IMMICH_PASS);
    await pwd.press('Enter');
    console.log('submitted login');
    await page.waitForTimeout(8000);
  }
  console.log('URL after login:', page.url());

  // Dump visible text (labels, nav, buttons).
  const data = await page.evaluate(() => {
    const bodyText = (document.body.innerText || '').slice(0, 5000);
    // Collect clickable/label elements with bounding boxes.
    const out = [];
    const seen = new Set();
    function walk(root, depth) {
      if (!root || depth > 50) return;
      for (const el of root.children || []) {
        const own = [...(el.childNodes || [])].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
        const aria = el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('placeholder') || '';
        const text = (own || aria).trim();
        if (text && text.length < 60 && /[a-zA-Z\u4e00-\u9fff]/.test(text)) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0 && r.top >= 0 && r.top < 900) {
            const k = text + '@' + Math.round(r.left) + ',' + Math.round(r.top);
            if (!seen.has(k)) { seen.add(k); out.push({ tag: el.tagName, text, x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }); }
          }
        }
        walk(el, depth + 1);
        if (el.shadowRoot) walk(el.shadowRoot, depth + 1);
      }
    }
    walk(document.body, 0);
    return { bodyText, boxes: out.sort((a, b) => a.y - b.y || a.x - b.x) };
  });

  console.log('\n=== VISIBLE BODY TEXT ===');
  console.log(data.bodyText || '(empty)');
  console.log('\n=== KEY ELEMENTS ===');
  for (const b of data.boxes) console.log(`${b.tag.padEnd(7)} (${String(b.x).padStart(4)},${String(b.y).padStart(4)}) ${String(b.w).padStart(4)}x${String(b.h).padStart(4)}  ${b.text}`);

  await browser.close();
})().catch((e) => { console.error('PROBE ERROR', e); process.exit(1); });
