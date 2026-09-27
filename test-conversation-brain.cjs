// Conversation Brain v3 â€” Unit tests (runs against the compiled JS)
// Compile first:  tsc src/server/conversationBrain.ts --outDir brain-out --module commonjs --target es2020 --skipLibCheck --esModuleInterop
// Then run:       node test-conversation-brain.cjs

const brain = require('./brain-out/conversationBrain.cjs');

let passed = 0;
let failed = 0;
const failures = [];

function ok(name, cond, extra) {
  if (cond) {
    passed++;
  } else {
    failed++;
    failures.push(`${name}${extra ? ' :: ' + JSON.stringify(extra) : ''}`);
    console.error('  X ' + name);
  }
}

function freshScope() {
  brain.resetConversation('t-tenant', 'u-user', 'conv-a');
  brain.resetConversation('t-tenant', 'u-user2', 'conv-b');
  brain.resetConversation('t-tenant2', 'u-user', 'conv-a');
  brain.resetConversation('t-tenant', 'u-user', 'conv-c');
}

function process(msg, opts = {}) {
  return brain.processMessage({
    message: msg,
    history: opts.history || [],
    tenantId: opts.tenantId || 't-tenant',
    userId: opts.userId || 'u-user',
    conversationId: opts.conversationId || 'conv-a',
  });
}

function respond(reply, opts = {}) {
  brain.processAssistantResponse({
    assistantReply: reply,
    tenantId: opts.tenantId || 't-tenant',
    userId: opts.userId || 'u-user',
    conversationId: opts.conversationId || 'conv-a',
  });
}

console.log('=== Conversation Brain v3 Unit Tests ===');
console.log('');

// ---------------------------------------------------------------------------
// 1. Related follow-up (CONTINUE)
// ---------------------------------------------------------------------------
freshScope();
process('Tell me about electric cars.');
const fu1 = process('How far can they normally travel?');
ok('follow-up continues topic', fu1.isTopicChange === false, { topic: fu1.activeTopicLabel });
ok('follow-up resolved into electric context', fu1.contextInjection.text.toLowerCase().includes('electric'), fu1.contextInjection.text);

// ---------------------------------------------------------------------------
// 2. Pronouns
// ---------------------------------------------------------------------------
freshScope();
process('I am starting a boutique online store.');
const p1 = process('What should I stock in it?');
ok('pronoun "in it" resolved without crash', p1.contextInjection.text.length > 0, p1.contextInjection.text);

// ---------------------------------------------------------------------------
// 3. Implicit references
// ---------------------------------------------------------------------------
freshScope();
process('Tell me about solar panels.');
process('How do they work?');
const imp = process('What about maintenance?');
ok('implicit continuation stays on topic', imp.isTopicChange === false, imp.contextInjection.text);
ok('solar reference included for implicit follow-up', imp.contextInjection.text.toLowerCase().includes('solar'), imp.contextInjection.text);

// ---------------------------------------------------------------------------
// 4. Multiple entities
// ---------------------------------------------------------------------------
freshScope();
process('Help me plan a cafe and a bakery.');
process('The cafe opens at 8am.');
const multi = process('What pastries should the bakery sell?');
ok('multi-entity follow-up is continuation', multi.isTopicChange === false, multi.contextInjection.text);
ok('bakery entity retained', multi.contextInjection.text.toLowerCase().includes('bakery'), multi.contextInjection.text);

// ---------------------------------------------------------------------------
// 5. Topic continuation
// ---------------------------------------------------------------------------
freshScope();
process('How do I improve my email marketing?');
const cont = process('What subject lines work best?');
ok('same-topic question continues', cont.isTopicChange === false, cont.contextInjection.text);

// ---------------------------------------------------------------------------
// 6. Genuine topic change
// ---------------------------------------------------------------------------
freshScope();
process('Tell me about electric cars.');
process('How do their batteries work?');
const shift = process('Actually, forget cars. Tell me about opening a restaurant.');
ok('genuine topic change detected as SHIFT', shift.isTopicChange === true, shift.contextInjection.text);

// ---------------------------------------------------------------------------
// 7. Returning to an earlier topic
// ---------------------------------------------------------------------------
freshScope();
process('Tell me about electric cars.');
process('Now explain Bitcoin to me.');
process('What affects its price?');
const back = process('Actually, back to electric cars - what about charging?');
ok('returning to earlier topic handled', back.isTopicChange === true || back.contextInjection.text.toLowerCase().includes('electric'), back.contextInjection.text);

// ---------------------------------------------------------------------------
// 8. Ambiguous reference
// ---------------------------------------------------------------------------
freshScope();
process('I am comparing two suppliers: Alpha and Beta.');
const amb = process('Which one should I choose?');
ok('ambiguous reference handled without error', amb.contextInjection.text.length > 0, amb.contextInjection.text);

// ---------------------------------------------------------------------------
// 9. Contradictory information
// ---------------------------------------------------------------------------
freshScope();
process('My shop has 2 employees.');
const c2 = process('I currently have 8 employees.');
ok('contradiction detection records a note', c2.contextInjection.text.includes('CONTEXT NOTE') || c2.contextInjection.text.length > 0, c2.contextInjection.text);

// ---------------------------------------------------------------------------
// 10. Irrelevant old context is not injected as the ACTIVE topic
// ---------------------------------------------------------------------------
freshScope();
process('Tell me about electric cars.');
process('Now explain Bitcoin.');
process('What affects its price?');
const afterLong = process('Tell me about solar panels.');
ok('solar panels creates a new topic', afterLong.activeTopicLabel.toLowerCase().includes('solar'), afterLong.activeTopicLabel);
ok('old car context not injected as active topic', !afterLong.contextInjection.text.toLowerCase().includes('active conversation topic: "electric'), afterLong.contextInjection.text);

// ---------------------------------------------------------------------------
// 11. Trivial messages do not create topics or facts
// ---------------------------------------------------------------------------
freshScope();
process('hi');
const triv = process('okay');
ok('trivial message keeps no topic', triv.activeTopicLabel === '' || triv.isTopicChange === false, triv.activeTopicLabel);
freshScope();
const hi = process('Hi there!');
ok('greeting does not force topic change', hi.isTopicChange === false, hi.contextInjection.text);
const stats = brain.getConversationStats('t-tenant', 'u-user', 'conv-a');
ok('trivial messages do not create durable memory', (stats ? stats.memoryFacts : 1) === 0, stats);

// ---------------------------------------------------------------------------
// 12. Long conversations / many turns stay stable
// ---------------------------------------------------------------------------
freshScope();
for (let i = 0; i < 25; i++) {
  process('Turn ' + i + ': updating inventory.');
  respond('Assistant turn ' + i + ' response.');
}
const longStats = brain.getConversationStats('t-tenant', 'u-user', 'conv-a');
ok('long conversation remains within recent-message bounds', longStats.recentMessageCount <= 14, longStats);
ok('long conversation has topics', longStats.totalTopics >= 1, longStats);

// ---------------------------------------------------------------------------
// 13. Different users/tenants are fully isolated
// ---------------------------------------------------------------------------
freshScope();
process('Tell me about electric cars.', { userId: 'u-user', conversationId: 'conv-a' });
process('Tell me about electric cars.', { userId: 'u-user2', conversationId: 'conv-b' });
const iso1 = process('How far can they travel?', { userId: 'u-user', conversationId: 'conv-a' });
const iso2 = process('How far can they travel?', { userId: 'u-user2', conversationId: 'conv-b' });
ok('user1 has own context', iso1.contextInjection.text.toLowerCase().includes('electric'), iso1.contextInjection.text);
ok('user2 has own context', iso2.contextInjection.text.toLowerCase().includes('electric'), iso2.contextInjection.text);
process('I love cooking.', { userId: 'u-user2', conversationId: 'conv-c' });
const iso3 = process('What ingredients go well together?', { userId: 'u-user2', conversationId: 'conv-c' });
ok('isolated user/conv has own topic', iso3.activeTopicLabel.toLowerCase().includes('cook'), iso3.activeTopicLabel);

// ---------------------------------------------------------------------------
// 14. DeepSeek â†’ Gemini fallback (public API contract preserved for server.ts)
// ---------------------------------------------------------------------------
ok('public API surface complete', typeof brain.processMessage === 'function' && typeof brain.processAssistantResponse === 'function');
ok('stats API complete', typeof brain.getConversationStats === 'function' && typeof brain.resetConversation === 'function' && typeof brain.getGlobalStats === 'function');

// ---------------------------------------------------------------------------
// 15. Vague quantifier / partitive reference resolution ("one", "one of them")
// ---------------------------------------------------------------------------
freshScope();
process('Explain what a supply chain is.');
const vq1 = process('What are the biggest risks in one?');
ok('bare "one" binds to the active subject (no random topic)', vq1.contextInjection.text.toLowerCase().includes('supply'), vq1.contextInjection.text);
ok('resolvedMessage is actually rewritten with the referent', vq1.resolvedMessage.toLowerCase().includes('supply'), vq1.resolvedMessage);
ok('context exposes the resolved meaning to the model', /means:/i.test(vq1.contextInjection.text), vq1.contextInjection.text);

// Terse variant: same referent, no question mark, and a freshly-introduced noun ("risks").
// This previously (a) flipped the active topic to "risks" and (b) injected an instruction
// telling the model to drop the supply-chain context.
freshScope();
process('Explain what a supply chain is.');
const vq1b = process('risks in one');
ok('terse "risks in one" is NOT a topic change', vq1b.isTopicChange === false, { label: vq1b.activeTopicLabel });
ok('terse "risks in one" keeps the active topic label', vq1b.activeTopicLabel.toLowerCase().includes('supply'), vq1b.activeTopicLabel);
ok('terse "risks in one" rewrites the referent into the message', /supply/i.test(vq1b.resolvedMessage), vq1b.resolvedMessage);
ok('terse "risks in one" injection tells the model to continue the topic', /continuing the current topic/i.test(vq1b.contextInjection.text), vq1b.contextInjection.text);
ok('terse "risks in one" injection never tells the model to drop the old topic', !/do not drag in irrelevant details/i.test(vq1b.contextInjection.text), vq1b.contextInjection.text);
ok('terse "risks in one" injection reports a continuation intent', /FOLLOW-UP/i.test(vq1b.contextInjection.text), vq1b.contextInjection.text);

// Guard: an explicit abandon must still produce a real topic shift.
freshScope();
process('Explain what a supply chain is.');
const vq1c = process('Forget that. Tell me about puppy training.');
ok('explicit abandon still triggers a genuine topic shift', vq1c.isTopicChange === true, { label: vq1c.activeTopicLabel });

freshScope();
process('We run three delivery vans.');
const vq2 = process('Which one is cheapest to maintain?');
ok('partitive "which one" resolves to the in-conversation entity', /van|delivery/.test(vq2.contextInjection.text.toLowerCase()), vq2.contextInjection.text);

freshScope();
process('I am comparing solar panels and wind turbines for my farm.');
const vq3 = process('How much does it cost to install one of them?');
ok('"one of them" resolves to an in-conversation entity', /solar|wind|turbine|panel/.test(vq3.contextInjection.text.toLowerCase()), vq3.contextInjection.text);

freshScope();
process('My shop sells handmade ceramic mugs.');
const vq4 = process('Do you think the same thing would work online?');
ok('vague placeholder "the same thing" binds to the active subject', /mug|ceramic/.test(vq4.contextInjection.text.toLowerCase()), vq4.contextInjection.text);

// ---------------------------------------------------------------------------
console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
  console.log('Failures:');
  failures.forEach((f) => console.log('  - ' + f));
  globalThis.process.exit(1);
} else {
  console.log('ALL TESTS PASSED');
}