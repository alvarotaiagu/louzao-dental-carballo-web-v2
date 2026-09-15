// Genera favicons (PNG) y la imagen Open Graph a partir de la marca SVG
// recreada (assets/img/logo/mark.svg) con Playwright. Uso:
//   NODE_PATH=<ruta a node_modules con playwright> node scripts/generate_brand.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const root = path.resolve(__dirname, '..');
const mark = fs.readFileSync(path.join(root, 'assets/img/logo/mark.svg'), 'utf8');

const iconHtml = (size, pad) => `<!doctype html><body style="margin:0;width:${size}px;height:${size}px;background:#F7F4EE;display:grid;place-items:center">
<div style="width:${size - pad * 2}px;height:${size - pad * 2}px">${mark.replace('<svg ', '<svg style="width:100%;height:100%" ')}</div></body>`;

const ogHtml = `<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT@9..144,300,50&family=Outfit:wght@400;600&display=swap" rel="stylesheet">
<style>
body{margin:0;width:1200px;height:630px;background:#0A4A5E;color:#F7F4EE;font-family:Outfit,sans-serif;position:relative;overflow:hidden}
.bg{position:absolute;inset:0;background:radial-gradient(70% 80% at 20% 10%,rgba(63,176,201,.55),transparent 60%),radial-gradient(60% 70% at 85% 90%,rgba(26,139,168,.6),transparent 60%),linear-gradient(180deg,#0F6E8C,#0A4A5E)}
.mark{position:absolute;left:96px;top:120px;width:250px;height:250px}
.mark svg{width:100%;height:100%}
.mark .mark-gold{stroke:#D8B98A}.mark .mark-teal{stroke:#F7F4EE}
.mark path{fill:none;stroke-width:6.5;stroke-linecap:round;stroke-linejoin:round}
.word{position:absolute;left:100px;top:392px;font-weight:600;font-size:34px;letter-spacing:.42em;text-transform:uppercase;line-height:1}
.word small{display:block;font-size:13px;font-weight:400;letter-spacing:.5em;margin-top:12px;opacity:.85}
h1{position:absolute;right:96px;top:150px;width:560px;margin:0;font-family:Fraunces,serif;font-weight:300;font-size:96px;line-height:1;letter-spacing:-.02em;font-variation-settings:"opsz" 144,"SOFT" 50}
.foot{position:absolute;left:100px;right:96px;bottom:56px;display:flex;justify-content:space-between;font-size:20px;letter-spacing:.06em;opacity:.92;border-top:1px solid rgba(216,185,138,.6);padding-top:22px}
</style></head><body><div class="bg"></div>
<div class="mark">${mark.replace(/<defs>[\s\S]*?<\/defs>/, '').replace('stroke="url(#lz-teal)"', 'class="mark-teal"').replace('stroke="#D8B98A"', 'class="mark-gold"')}</div>
<div class="word">Louzao<small>Clínica dental</small></div>
<h1>Aquí se respira.</h1>
<div class="foot"><span>Carballo · Rúa Vázquez de Parga, 5, 3ºC</span><span>5,0 ★ Google · 981 75 54 18</span></div>
</body></html>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  for (const [size, pad] of [[96, 10], [180, 20], [192, 22], [512, 60]]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(iconHtml(size, pad));
    await page.screenshot({ path: path.join(root, `assets/img/logo/icon-${size}.png`), clip: { x: 0, y: 0, width: size, height: size } });
  }
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(ogHtml, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(root, 'assets/img/web/og-image.jpg'), type: 'jpeg', quality: 88 });
  await browser.close();
  console.log('brand assets ok');
})();
