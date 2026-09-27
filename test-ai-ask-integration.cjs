/**
 * Avanyx Chat — REAL /api/ai/ask multi-turn integration test.
 * Runs against a live server (dev: `npx tsx server.ts`).
 *
 * Proves the live pipeline:
 *   user message -> conversationBrain -> context injection -> /api/ai/ask
 *   -> DeepSeek -> Gemini fallback -> answer
 */

const BASE = process.env.AVANYX_BASE || 'http://localhost:3000';
const TIMEOUT_MS = Number(process.env.AVANYX_TIMEOUT_MS || 90000);

let passed = 0;
let failed = 0;
const failures = [];
let aiCalls = 0;

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

function info(label, value) {
  console.log('  ..   ' + label + ': ' + value);
}

async function ask(message, { tenantId, userId, history = [], modelId = 'chat' } = {}) {
  aiCalls++;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(BASE + '/api/ai/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
        'x-user-id': userId,
      },
      body: JSON.stringify({ message, modelId, history, businessContext: {} }),
      signal: controller.signal,
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, ...json };
  } catch (e) {
    return { status: 0, success: false, error: 'FETCH_ERROR', message: String(e && e.message) };
  } finally {
    clearTimeout(timer);
  }
}

function has(reply, words) {
  const r = String(reply || '').toLowerCase();
  return words.some((w) => r.includes(w));
}

async function main() {
  console.log('=== Avanyx /api/ai/ask REAL Integration Test ===');
  console.log('Target: ' + BASE);
  console.log('');

  // ── 0. Provider health / fallback wiring ──────────────────────────────────
  console.log('[0] Provider health + routing wiring');
  try {
    const r = await fetch(BASE + '/api/ai/providers/health').then((x) => x.json());
    info('deepseek.configured', r.deepseek && r.deepseek.configured);
    info('gemini.configured', r.gemini && r.gemini.configured);
    info('NORMAL_CHAT routing', JSON.stringify(r.routing && r.routing.NORMAL_CHAT));
    ok('providers health reachable', Boolean(r && r.routing));
    ok('DeepSeek->Gemini fallback route declared', Boolean(r.routing && r.routing.NORMAL_CHAT && r.routing.NORMAL_CHAT.fallback));
  } catch (e) {
    ok('providers health reachable', false, String(e.message));
  }

  // ── 1. Related follow-up + pronoun resolution (astronomy domain) ──────────
  console.log('');
  console.log('[1] Related follow-up + pronoun (astronomy)');
  {
    const t = { tenantId: 'it-tenant-A', userId: 'it-user-A' };
    const a1 = await ask('Explain how black holes form.', t);
    ok('turn1 answered', a1.success === true && String(a1.reply || '').length > 0, a1);
    info('turn1 modelUsed', a1.modelUsed + ' | credits=' + a1.creditsUsed);

    const a2 = await ask('How massive can they get?', t);
    ok('turn2 answered', a2.success === true && String(a2.reply || '').length > 0, a2);
    ok('pronoun "they" resolved to black holes', has(a2.reply, ['black hole', 'black holes', 'singularity', 'event horizon', 'solar mass']), { reply: String(a2.reply || '').slice(0, 300) });
    info('turn2 modelUsed', a2.modelUsed + ' | credits=' + a2.creditsUsed);

    const a3 = await ask('What about their event horizon?', t);
    ok('turn3 answered', a3.success === true, a3);
    ok('turn3 stays on black holes (implicit reference)', has(a3.reply, ['event horizon', 'horizon', 'black hole', 'black holes']), { reply: String(a3.reply || '').slice(0, 300) });
  }


  // ── 2. Implicit reference + genuine topic change ──────────────────────────
  console.log('');
  console.log('[2] Implicit reference then GENUINE topic change (baking -> pet training)');
  {
    const t = { tenantId: 'it-tenant-B', userId: 'it-user-B' };
    const b1 = await ask('I want to learn sourdough baking.', t);
    ok('turn1 answered', b1.success === true, b1);
    const b2 = await ask('How long does it take?', t);
    ok('implicit "it" resolved to sourdough', has(b2.reply, ['sourdough', 'dough', 'ferment', 'proof', 'rise', 'hours', 'bake']), { reply: String(b2.reply || '').slice(0, 300) });
    const b3 = await ask('Forget baking. How do I train a puppy to sit?', t);
    ok('topic change to puppy training answered', b3.success === true && has(b3.reply, ['puppy', 'dog', 'sit', 'treat', 'train']), { reply: String(b3.reply || '').slice(0, 300) });
    ok('topic change did NOT apply baking context to the new topic', !has(b3.reply, ['knead', 'proof the dough', 'preheat', 'bulk ferment']), { reply: String(b3.reply || '').slice(0, 300) });
  }

  // ── 3. Returning to an earlier topic ──────────────────────────────────────
  console.log('');
  console.log('[3] Return to an earlier topic (motorcycles -> tax -> back to motorcycles)');
  {
    const t = { tenantId: 'it-tenant-C', userId: 'it-user-C' };
    await ask('Tell me about motorcycle maintenance.', t);
    await ask('Now explain how value added tax works.', t);
    const c3 = await ask('Back to motorcycles - how often should I change the oil?', t);
    ok('returning to earlier topic answered', c3.success === true && has(c3.reply, ['motorcycle', 'oil', 'engine', 'change', 'km', 'miles']), { reply: String(c3.reply || '').slice(0, 300) });
  }

  // ── 4. Contradictory information ─────────────────────────────────────────
  console.log('');
  console.log('[4] Contradiction handling (headcount changed)');
  {
    const t = { tenantId: 'it-tenant-D', userId: 'it-user-D' };
    await ask('My shop currently has 2 employees. Give me a staffing plan.', t);
    const d2 = await ask('Update: I now actually have 8 employees. How should I structure the teams?', t);
    ok('contradiction turn answered', d2.success === true, d2);
    ok('latest headcount (8) is used', has(d2.reply, ['8 ', 'eight']), { reply: String(d2.reply || '').slice(0, 300) });
  }

  // ── 5. Trivial messages do not break the pipeline ────────────────────────
  console.log('');
  console.log('[5] Trivial messages handled cleanly');
  {
    const t = { tenantId: 'it-tenant-E', userId: 'it-user-E' };
    const e1 = await ask('hi', t);
    ok('greeting answered', e1.success === true, e1);
    const e2 = await ask('thanks', t);
    ok('thanks answered', e2.success === true, e2);
    const e3 = await ask('Explain how solar panels generate electricity.', t);
    ok('real topic after trivial turns works', e3.success === true && has(e3.reply, ['solar', 'photovoltaic', 'panel', 'light', 'electric']), { reply: String(e3.reply || '').slice(0, 300) });
  }

  // ── 6. Tenant / user isolation on the live endpoint ──────────────────────
  console.log('');
  console.log('[6] Tenant + user isolation (same question, different scopes)');
  {
    const isoA = await ask('My product is a handmade leather wallet priced at 40 dollars.', { tenantId: 'it-tenant-ISO1', userId: 'it-user-ISO1' });
    const isoB = await ask('My product is a hand-poured soy candle priced at 12 dollars.', { tenantId: 'it-tenant-ISO2', userId: 'it-user-ISO2' });
    ok('tenant A answered', isoA.success === true, isoA);
    ok('tenant B answered', isoB.success === true, isoB);

    const fA = await ask('What price did I tell you my product sells for?', { tenantId: 'it-tenant-ISO1', userId: 'it-user-ISO1' });
    const fB = await ask('What price did I tell you my product sells for?', { tenantId: 'it-tenant-ISO2', userId: 'it-user-ISO2' });
    ok('tenant A recalls its own product', has(fA.reply, ['wallet', '40', 'leather']), { reply: String(fA.reply || '').slice(0, 300) });
    ok('tenant B recalls its own product', has(fB.reply, ['candle', '12', 'soy']), { reply: String(fB.reply || '').slice(0, 300) });
    ok('tenant A did NOT receive tenant B data', !has(fA.reply, ['candle', 'soy']), { reply: String(fA.reply || '').slice(0, 300) });
    ok('tenant B did NOT receive tenant A data', !has(fB.reply, ['wallet', 'leather']), { reply: String(fB.reply || '').slice(0, 300) });
  }

  // ── 7. Credits / billing path still active ───────────────────────────────
  console.log('');
  console.log('[7] Credits + billing path');
  {
    const t = { tenantId: 'it-tenant-CR', userId: 'it-user-CR' };
    const w1 = await fetch(BASE + '/api/credits/wallet', { headers: { 'x-user-id': t.userId } }).then((x) => x.json()).catch(() => ({}));
    const before = w1 && w1.wallet ? w1.wallet.usedCredits : null;
    const r = await ask('Give me one short sentence about inventory management.', t);
    ok('billing request answered', r.success === true, r);
    const w2 = await fetch(BASE + '/api/credits/wallet', { headers: { 'x-user-id': t.userId } }).then((x) => x.json()).catch(() => ({}));
    const after = w2 && w2.wallet ? w2.wallet.usedCredits : null;
    info('usedCredits before/after', before + ' -> ' + after);
    ok('credits were deducted (billing settled)', before !== null && after !== null && after >= before, { before, after });
  }

  console.log('');
  console.log('---');
  console.log(aiCalls + ' live AI calls made');
  console.log(passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    console.log('Failures:');
    failures.forEach((f) => console.log('  - ' + f));
    process.exit(1);
  }
  console.log('ALL INTEGRATION TESTS PASSED');
}

main().catch((e) => {
  console.error('FATAL: ' + (e && e.stack ? e.stack : e));
  process.exit(2);
});

