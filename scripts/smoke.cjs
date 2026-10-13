const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const out = path.join(root, '.artifacts'); fs.mkdirSync(out, { recursive: true });
const backend = fs.existsSync(path.join(root, 'server.py'));
const publicRoot = backend ? path.join(root, 'public') : root;
const port = Number(process.env.TEST_PORT || 18851);
const base = `http://127.0.0.1:${port}/`;
const server = spawn('python3', backend ? ['server.py', '--port', String(port), '--runtime', path.join(out, 'test-runtime')] : ['scripts/preview.py', '--port', String(port)], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
let log = ''; server.stdout.on('data', x => log += x); server.stderr.on('data', x => log += x);
let browser; const report = { pages: [], errors: [], checks: 0 };
(async () => { try {
  for (let i=0; i<100; i++) { try { const r=await fetch(base); if (r.ok) break; } catch {} if(i===99) throw new Error('Preview failed to start: '+log); await new Promise(r=>setTimeout(r,100)); }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  // External services are outside the preview test; never submit a real enquiry.
  await page.route('**/*', route => { const url=new URL(route.request().url()); return url.hostname==='127.0.0.1' || ['data:','blob:'].includes(url.protocol) ? route.continue() : route.fulfill({status:200,contentType:'application/json',body:'[]'}); });
  page.on('pageerror', e => report.errors.push(e.message));
  page.on('response', r => { if (r.url().startsWith(base) && r.status()>=400) report.errors.push(`${r.status()} ${r.url()}`); });
  let urls=fs.readdirSync(publicRoot).filter(x=>x.endsWith('.html'));
  if (backend) urls=['yori3d/','bonsai3d/','atelier/','brief.html','brandboard.html'];
  for (const width of [390,1440]) {
    await page.setViewportSize({width,height:900});
    for (const url of urls) {
      const response=await page.goto(base+url, {waitUntil:'networkidle'});
      assert(response.ok(), `HTTP ${response.status()} ${url}`); report.checks++;
      assert((await page.title()).trim(), `Missing title: ${url}`); report.checks++;
      await page.evaluate(async()=> { for (const img of document.images) img.loading='eager'; await Promise.all([...document.images].filter(x=>x.getAttribute('src')).map(x=>x.decode().catch(()=>{}))); });
      const broken=await page.evaluate(()=>[...document.images].filter(i=>i.getAttribute('src') && !i.naturalWidth).map(i=>i.src));
      assert.deepEqual(broken, [], `Broken images on ${url}`); report.checks++;
      if (url==='index.html' || url==='bonsai3d/' || url==='yori3d/' || url==='galerij.html') await page.screenshot({path:path.join(out, `${width}-${url.replace(/[^a-z0-9]/gi,'-')}.png`),fullPage:true});
      report.pages.push({width,url});
    }
  }
  assert.deepEqual(report.errors, [], 'Browser errors'); report.checks++; report.status='passed';
} catch(e) { report.status='failed'; report.failure=e.stack; process.exitCode=1; }
finally { if(browser) await browser.close(); server.kill(); fs.writeFileSync(path.join(out,'server.log'),log); fs.writeFileSync(path.join(out,'smoke.json'),JSON.stringify(report,null,2)); console.log(JSON.stringify({status:report.status,checks:report.checks,pages:report.pages.length,errors:report.errors,failure:report.failure,report:path.join(out,'smoke.json')},null,2)); }
})();
