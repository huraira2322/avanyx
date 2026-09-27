/**
 * Avanyx Chat — refined live re-test.
 * Covers: corrected topic-change check, LONG multi-turn continuity,
 * and genuinely AMBIGUOUS reference resolution.
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

async function ask(message, { tenantId, userId, history = [], modelId = 'chat' } = {}) {
  aiCalls++;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(BASE + '/api/ai/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId, 'x-user-id': userId },
      body: JSON.stringify({ message, modelId, history, businessContext: {} }),
      signal: controller.signal,
    });
    return { status: res.status, ...(await res.json().catch(() => ({}))) };
  } catch (e) {
    return { status: 0, success: false, error: 'FETCH_ERROR', message: String(e && e.message) };
  } finally {
    clearTimeout(timer);
  }
}

const has = (reply, words) => {
  const r = String(reply || '').toLowerCase();
  return words.some((w) => r.includes(w));
};

async function main() {
  console.log('=== Avanyx Refined Live Re-Test ===');
  console.log('Target: ' + BASE);
  console.log('');

  // ── A. Corrected genuine topic-change check ─────────────────────────────
  console.log('[A] Genuine topic change (baking -> dog training) with corrected assertion');
  {
    const t = { tenantId: 'rt-tenant-A', userId: 'rt-user-A' };
    await ask('I want to learn sourdough baking.', t);
    await ask('How long does the whole process take?', t);
    const a3 = await ask('Forget baking. How do I train a puppy to sit?', t);
    ok('topic change answered', a3.success === true, a3);
    ok('answer is substantively about dog training', has(a3.reply, ['puppy', 'dog', 'sit', 'treat', 'cue']), { reply: String(a3.reply || '').slice(0, 250) });
    ok('NO baking technique context leaked into the new topic', !has(a3.reply, ['knead', 'preheat', 'bulk ferment', 'hydration']), { reply: String(a3.reply || '').slice(0, 250) });
  }

  // ── B. LONG conversation keeps continuity across many turns ─────────────
  console.log('');
  console.log('[B] LONG conversation (7 turns, one evolving topic) keeps continuity');
  {
    const t = { tenantId: 'rt-tenant-B', userId: 'rt-user-B' };
    await ask('I am opening a specialty coffee roastery.', t);
    await ask('What equipment do I need first?', t);
    await ask('How much should I budget for that equipment?', t);
    await ask('Which of those machines gives the best return?', t);
    await ask('What about the grinder specifically?', t);
    await ask('How do I keep the beans fresh for retail sale?', t);
    const b7 = await ask('Sum up the buying priority order for me.', t);
    ok('final turn answered', b7.success === true, b7);
    ok('continuity held across 7 turns (still about coffee/roasting gear)', has(b7.reply, ['roaster', 'grinder', 'coffee', 'bean', 'equipment', 'machine']), { reply: String(b7.reply || '').slice(0, 250) });
  }

  // ── C. Ambiguous reference resolved from context, not randomly ──────────
  console.log('');
  console.log('[C] Ambiguous reference resolution with two candidate entities');
  {
    const t = { tenantId: 'rt-tenant-C', userId: 'rt-user-C' };
    await ask('I sell both mountain bikes and electric scooters in my shop.', t);
    await ask('Which has better margins for me?', t);
    const c3 = await ask('How much does it cost to service one of them?', t);
    ok('ambiguous turn answered', c3.success === true, c3);
    ok('ambiguity resolved to one of the real in-conversation entities', has(c3.reply, ['bike', 'scooter']), { reply: String(c3.reply || '').slice(0, 250) });
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
  console.log('ALL REFINED TESTS PASSED');
}

main().catch((e) => {
  console.error('FATAL: ' + (e && e.stack ? e.stack : e));
  process.exit(2);
});
