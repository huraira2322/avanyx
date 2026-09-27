/**
 * Avanyx Chat — DeepSeek FAILURE -> Gemini fallback integration test.
 *
 * Run this against a server started with an INVALID DEEPSEEK_API_KEY
 * (see start-fallback-server.cmd) to prove the cascade is resilient:
 *   /api/ai/ask -> DeepSeek (fails) -> Gemini -> answer
 */
const BASE = process.env.AVANYX_BASE || 'http://localhost:3000';
const TIMEOUT_MS = Number(process.env.AVANYX_TIMEOUT_MS || 90000);

let passed = 0;
let failed = 0;
const failures = [];

function ok(name, cond, extra) {
  if (cond) {
    passed++;
    console.log('  OK   ' + name);
  } else {
    failed++;
    failures.push(name + (extra ? ' :: ' + JSON.stringify(extra).slice(0, 400) : ''));
    console.log('  FAIL ' + name + (extra ? ' :: ' + JSON.stringify(extra).slice(0, 400) : ''));
  }
}

async function ask(message, tenantId, userId) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(BASE + '/api/ai/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId, 'x-user-id': userId },
      body: JSON.stringify({ message, modelId: 'chat', history: [], businessContext: {} }),
      signal: controller.signal,
    });
    return { status: res.status, ...(await res.json().catch(() => ({}))) };
  } catch (e) {
    return { status: 0, success: false, error: 'FETCH_ERROR', message: String(e && e.message) };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  console.log('=== Avanyx DeepSeek -> Fallback Integration Test ===');
  console.log('Target: ' + BASE);
  console.log('(server is started with an INVALID DEEPSEEK_API_KEY)');
  console.log('');

  // Confirm the server really sees a configured-but-broken DeepSeek key
  try {
    const h = await fetch(BASE + '/api/ai/providers/health').then((x) => x.json());
    console.log('  ..   deepseek.configured: ' + (h.deepseek && h.deepseek.configured));
    console.log('  ..   gemini.configured:   ' + (h.gemini && h.gemini.configured));
    ok('DeepSeek is configured (with a broken key) so the fallback path is exercised', Boolean(h.deepseek && h.deepseek.configured), h);
  } catch (e) {
    ok('providers health reachable', false, String(e.message));
  }

  console.log('');
  console.log('[1] Multi-turn conversation must still succeed while DeepSeek is broken');
  {
    const t = ['fb-tenant-1', 'fb-user-1'];
    const r1 = await ask('Explain what a supply chain is.', t[0], t[1]);
    console.log('  ..   turn1 reply: ' + String(r1.reply || r1.message || '').slice(0, 160).replace(/\n/g, ' '));
    console.log('  ..   turn1 modelUsed: ' + r1.modelUsed);
    ok('turn1 still returns a real reply despite broken DeepSeek', r1.success === true && String(r1.reply || '').length > 40, r1);

    const r2 = await ask('What are the biggest risks in one?', t[0], t[1]);
    console.log('  ..   turn2 modelUsed: ' + r2.modelUsed);
    ok('turn2 (contextual follow-up) still returns a real reply', r2.success === true && String(r2.reply || '').length > 40, r2);
    ok('turn2 kept the supply-chain context', String(r2.reply || '').toLowerCase().includes('supply'), { reply: String(r2.reply || '').slice(0, 200) });
  }

  console.log('');
  console.log('[2] Second tenant also survives the provider outage');
  {
    const r = await ask('Give me two tips for managing cash flow.', 'fb-tenant-2', 'fb-user-2');
    console.log('  ..   modelUsed: ' + r.modelUsed);
    ok('second tenant still served', r.success === true && String(r.reply || '').length > 40, r);
  }

  console.log('');
  console.log('---');
  console.log(passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    console.log('Failures:');
    failures.forEach((f) => console.log('  - ' + f));
    process.exit(1);
  }
  console.log('ALL FALLBACK TESTS PASSED');
}

main().catch((e) => {
  console.error('FATAL: ' + (e && e.stack ? e.stack : e));
  process.exit(2);
});
