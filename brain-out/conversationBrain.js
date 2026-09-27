"use strict";
/**
 * Avanyx Conversation Brain — Hidden Context, Memory & Reasoning Engine
 *
 * Runs entirely server-side. NEVER exposed to the user.
 *
 * Pipeline:
 *   User message
 *     → detect intent (+ confidence, trivial/ambiguous flags)
 *     → extract entities
 *     → resolve pronouns / demonstratives / implicit references
 *     → decide topic CONTINUE / SHIFT / AMBIGUOUS
 *     → detect contradictions
 *     → track user goals & constraints
 *     → select only RELEVANT short-term context + meaningful facts
 *     → build hidden reasoning guidance for DeepSeek / Gemini
 *     → the LLM generates the final answer
 *
 * Design rules:
 *   - Universal: no hardcoded topics, no example-specific rules.
 *   - The brain ORGANIZES context; the LLM performs the actual reasoning.
 *   - Fully isolated by tenantId + userId + conversationId.
 *   - Internal reasoning state stays completely hidden from the user.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.processMessage = processMessage;
exports.processAssistantResponse = processAssistantResponse;
exports.getConversationStats = getConversationStats;
exports.resetConversation = resetConversation;
exports.getGlobalStats = getGlobalStats;
var UserIntent;
(function (UserIntent) {
    UserIntent["GREETING"] = "greeting";
    UserIntent["FOLLOW_UP"] = "follow_up";
    UserIntent["TOPIC_CHANGE"] = "topic_change";
    UserIntent["CLARIFICATION"] = "clarification";
    UserIntent["ELABORATION"] = "elaboration";
    UserIntent["NEW_QUESTION"] = "new_question";
    UserIntent["ACKNOWLEDGMENT"] = "acknowledgment";
    UserIntent["QUESTION_ABOUT_TOPIC"] = "question_about_topic";
    UserIntent["STATEMENT"] = "statement";
})(UserIntent || (UserIntent = {}));
var ContinuityDecision;
(function (ContinuityDecision) {
    ContinuityDecision["CONTINUE"] = "continue";
    ContinuityDecision["SHIFT"] = "shift";
    ContinuityDecision["AMBIGUOUS"] = "ambiguous";
})(ContinuityDecision || (ContinuityDecision = {}));
// ─── Constants ────────────────────────────────────────────────────────────
const MAX_CONVERSATION_STATES = 500;
const MAX_RECENT_MESSAGES = 14;
const MAX_CONTEXT_TOKENS = 1800;
const TOPIC_INACTIVITY_MS = 45 * 60 * 1000;
const MAX_FACTS = 12;
const MAX_GOALS = 5;
const MAX_CONSTRAINTS = 5;
const MAX_TOPICS = 12;
// ─── Language lexicons (pure structural categories — NO domain topics) ───
const STOPWORDS = new Set([
    'i', 'me', 'my', 'mine', 'myself', 'you', 'your', 'yours', 'yourself', 'yourselves',
    'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself',
    'we', 'us', 'our', 'ours', 'ourselves', 'they', 'them', 'their', 'theirs', 'themselves',
    'this', 'that', 'these', 'those', 'one', 'ones', 'who', 'whom', 'whose', 'which', 'what',
    'where', 'when', 'why', 'how',
    'the', 'a', 'an', 'some', 'any', 'all', 'both', 'each', 'every', 'either', 'neither',
    'few', 'little', 'less', 'more', 'most', 'other', 'another', 'such', 'same', 'different',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am',
    'do', 'does', 'did', 'done', 'doing', 'have', 'has', 'had', 'having',
    'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'must',
    'get', 'gets', 'got', 'make', 'makes', 'take', 'takes', 'use', 'uses', 'want', 'wants',
    'need', 'needs', 'like', 'likes', 'know', 'knows', 'think', 'thinks', 'go', 'goes',
    'going', 'come', 'comes', 'look', 'looks', 'say', 'says', 'tell', 'tells', 'ask',
    'asks', 'give', 'gives', 'forget', 'forgets', 'remember', 'remembers', 'plan',
    'plans', 'trying', 'forward', 'move', 'moves', 'talk', 'talks', 'discuss', 'explain',
    'and', 'but', 'or', 'nor', 'for', 'yet', 'so', 'in', 'on', 'at', 'to', 'from', 'by',
    'with', 'about', 'as', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'between', 'out', 'up', 'down', 'off', 'over', 'under', 'again', 'then',
    'than', 'there', 'here', 'while', 'because', 'if', 'until', 'unless', 'since', 'of',
    'not', 'no', 'yes', 'ok', 'okay', 'please', 'thanks', 'thank', 'sorry', 'just',
    'only', 'even', 'still', 'already', 'very', 'really', 'quite', 'rather', 'pretty',
    'too', 'also', 'much', 'many', 'always', 'never', 'sometimes', 'usually', 'maybe',
    'perhaps', 'okay', 'hmm', 'um', 'uh',
]);
// Object/deictic references that must be resolved against the conversation.
const REFERENCE_TERMS = new Set([
    'it', 'its', 'they', 'them', 'their', 'theirs',
    'he', 'him', 'his', 'she', 'her', 'hers',
    'this', 'that', 'these', 'those',
]);
// Sentence-initial lookalikes that should never be treated as entities.
const FALSE_ENTITY_WORDS = new Set([
    ...Array.from(REFERENCE_TERMS),
    'there', 'here', 'then', 'when', 'where', 'who', 'what', 'why', 'how', 'which',
    'one', 'ones', 'now', 'also', 'still', 'just', 'only', 'even', 'though',
    'actually', 'basically', 'probably', 'maybe', 'please', 'okay',
    // Qualifier / superlative adjectives carry no topical identity of their own.
    'biggest', 'bigger', 'largest', 'larger', 'smallest', 'smaller',
    'best', 'better', 'worst', 'worse', 'main', 'primary', 'major', 'minor',
    'common', 'typical', 'important', 'useful', 'popular', 'average',
    'several', 'many', 'much', 'more', 'most', 'less', 'least', 'few',
]);
// Pure acknowledgments that carry no durable information.
const TRIVIAL_ACK = new Set([
    'ok', 'okay', 'k', 'fine', 'good', 'great', 'nice', 'awesome', 'cool',
    'thanks', 'thank you', 'thx', 'ty', 'yes', 'yeah', 'yea', 'yep', 'no',
    'nope', 'nah', 'haha', 'lol', 'lmao', 'sure', 'got it', 'understood',
    'perfect', 'alright', 'right', 'wow', 'sounds good', 'noted', 'done',
    'agreed', 'ok great', 'ok thanks', 'very nice', 'thats good', 'that is good',
    'nice one', 'good good', 'cool cool', 'great thanks', 'thanks a lot',
    'thank you so much', 'appreciated', 'awesome thanks',
]);
// Greetings (also trivial, but conversationally distinct).
const GREETING_WORDS = new Set([
    'hi', 'hello', 'hey', 'howdy', 'hola', 'yo', 'salam', 'salaam', 'assalam',
]);
// ─── Text utilities ────────────────────────────────────────────────────────
function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s'-]/g, ' ')
        .split(/\s+/)
        .map((t) => t.replace(/^'+|'+$/g, ''))
        .filter((w) => w.length >= 2);
}
function uniqueContentTokens(text) {
    const out = new Set();
    for (const t of tokenize(text)) {
        if (!STOPWORDS.has(t) && !FALSE_ENTITY_WORDS.has(t))
            out.add(t);
    }
    return out;
}
function bigramTokens(text) {
    const tokens = tokenize(text);
    const out = [];
    for (let i = 0; i + 1 < tokens.length; i++) {
        out.push(tokens[i] + ' ' + tokens[i + 1]);
    }
    return out;
}
function singularize(word) {
    const w = word.toLowerCase();
    if (w.length > 3 && w.endsWith('ies'))
        return w.slice(0, -3) + 'y';
    if (w.length > 3 && w.endsWith('es') && !w.endsWith('ses') && !w.endsWith('hes') && !w.endsWith('les'))
        return w.slice(0, -2);
    if (w.length > 2 && w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us'))
        return w.slice(0, -1);
    return w;
}
function isQuestion(text) {
    const t = text.trim();
    if (t.endsWith('?'))
        return true;
    return /^(what|who|where|when|why|how|which|whom|whose|do|does|did|can|could|would|will|shall|should|is|are|was|were|has|have|had)\b/i.test(t);
}
function hasReferenceTerm(text) {
    const padded = ' ' + text.trim().toLowerCase() + ' ';
    for (const term of REFERENCE_TERMS) {
        if (padded.includes(term))
            return true;
    }
    return false;
}
function isTrivialMessage(text) {
    const t = text.trim().toLowerCase();
    if (t.length === 0)
        return true;
    if (isQuestion(t))
        return false;
    // Pure acknowledgment or greeting, possibly with trailing punctuation.
    const compact = t.replace(/[!.?,;]+/g, '').trim();
    if (TRIVIAL_ACK.has(compact))
        return true;
    const firstWord = t.split(/\s+/)[0];
    if (GREETING_WORDS.has(firstWord) && tokenize(compact).length <= 5)
        return true;
    // Very short, content-free messages ("hmm", "wow", "interesting")
    if (tokenize(compact).length === 0)
        return true;
    if (tokenize(compact).length <= 2) {
        const content = uniqueContentTokens(compact);
        if (content.size === 0)
            return true;
    }
    return false;
}
// ─── State management ──────────────────────────────────────────────────────
const conversationStates = new Map();
function getConversationKey(tenantId, userId, conversationId) {
    return `${tenantId}::${userId}::${conversationId || 'default'}`;
}
function getOrCreateState(tenantId, userId, conversationId) {
    const key = getConversationKey(tenantId, userId, conversationId);
    const now = Date.now();
    const existing = conversationStates.get(key);
    if (existing) {
        if (now - existing.lastActivityAt > TOPIC_INACTIVITY_MS) {
            existing.topics = [];
            existing.activeTopicIndex = -1;
            existing.recentMessages = [];
            existing.prominentFacts = [];
            existing.userGoals = [];
            existing.constraints = [];
            existing.contradictions = [];
            existing.createdAt = now;
        }
        existing.lastActivityAt = now;
        return existing;
    }
    if (conversationStates.size >= MAX_CONVERSATION_STATES) {
        let oldestKey = null;
        let oldestTime = Infinity;
        for (const [k, v] of conversationStates) {
            if (v.lastActivityAt < oldestTime) {
                oldestTime = v.lastActivityAt;
                oldestKey = k;
            }
        }
        if (oldestKey)
            conversationStates.delete(oldestKey);
    }
    const state = {
        conversationId: conversationId || 'default',
        tenantId,
        userId,
        topics: [],
        activeTopicIndex: -1,
        recentMessages: [],
        prominentFacts: [],
        userGoals: [],
        constraints: [],
        contradictions: [],
        createdAt: now,
        lastActivityAt: now,
    };
    conversationStates.set(key, state);
    return state;
}
function activeTopic(state) {
    if (state.activeTopicIndex >= 0 && state.activeTopicIndex < state.topics.length) {
        return state.topics[state.activeTopicIndex];
    }
    return null;
}
function pushRecent(state, role, content) {
    state.recentMessages.push({ role, content, timestamp: Date.now() });
    if (state.recentMessages.length > MAX_RECENT_MESSAGES) {
        state.recentMessages = state.recentMessages.slice(-MAX_RECENT_MESSAGES);
    }
}
function seedFromHistory(state, history) {
    if (!history || history.length === 0 || state.recentMessages.length > 0)
        return;
    const recent = history.slice(-MAX_RECENT_MESSAGES);
    for (const item of recent) {
        if (typeof item === 'string') {
            pushRecent(state, item.startsWith('assistant:') ? 'assistant' : 'user', item);
        }
        else if (item && typeof item === 'object') {
            const role = String(item.role || 'user').toLowerCase() === 'assistant' ? 'assistant' : 'user';
            const content = String(item.content || '');
            if (content.trim())
                pushRecent(state, role, content);
        }
    }
}
// ─── Entity extraction ─────────────────────────────────────────────────────
function extractEntities(text) {
    const entities = [];
    const now = Date.now();
    const seen = new Set();
    const pushEntity = (name, type, certainty) => {
        const canonical = name.trim().replace(/\s+/g, ' ');
        if (canonical.length < 2 || FALSE_ENTITY_WORDS.has(canonical.toLowerCase()))
            return;
        const key = singularize(canonical);
        if (seen.has(key))
            return;
        seen.add(key);
        entities.push({
            name: canonical,
            type,
            firstMentioned: now,
            lastMentioned: now,
            mentionCount: 1,
            aliases: [],
            certainty,
        });
    };
    // 1. Proper nouns (multi-word capitalized sequences).
    const properPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
    let match;
    while ((match = properPattern.exec(text)) !== null) {
        const name = match[1];
        const lower = name.toLowerCase();
        if (FALSE_ENTITY_WORDS.has(lower) || STOPWORDS.has(lower))
            continue;
        pushEntity(name, 'subject', 0.9);
    }
    // 2. Quoted phrases.
    const quotedPattern = /"([^"]+)"|'([^']+)'/g;
    while ((match = quotedPattern.exec(text)) !== null) {
        const name = (match[1] || match[2] || '').trim();
        if (name.length >= 2)
            pushEntity(name, 'concept', 0.85);
    }
    // 3. Topic-phrase patterns: "about X", "tell me about X", "regarding X".
    const topicPatterns = [
        /(?:about|regarding|concerning)\s+((?:[a-z0-9][a-z0-9' -]{0,40})?[a-z0-9]{2,})(?=[^a-z0-9]|$)/i,
        /(?:tell|explain|describe|teach|inform|show|give)\s+(?:me\s+)?(?:about|of|on)?\s+((?:[a-z0-9][a-z0-9' -]{0,40})?[a-z0-9]{2,})(?=[^a-z0-9]|$)/i,
    ];
    for (const pattern of topicPatterns) {
        const topicMatch = text.match(pattern);
        if (!topicMatch)
            continue;
        const rawCandidate = topicMatch[1].trim();
        // Keep only content words (drop articles/determiners/prepositions inside the phrase).
        const contentWords = rawCandidate.split(/\s+/).filter((w) => {
            const lw = w.toLowerCase();
            return !STOPWORDS.has(lw) && !FALSE_ENTITY_WORDS.has(lw);
        });
        const candidate = contentWords.join(' ');
        if (candidate.length >= 2)
            pushEntity(candidate, 'topic', 0.8);
    }
    // 4. Content-word fallback: frequent non-stopword tokens (3+ chars).
    const tokens = tokenize(text);
    const freq = new Map();
    for (const t of tokens) {
        if (t.length < 3 || STOPWORDS.has(t) || FALSE_ENTITY_WORDS.has(t))
            continue;
        if (/^\d+$/.test(t))
            continue;
        const key = singularize(t);
        freq.set(key, (freq.get(key) || 0) + 1);
    }
    const ranked = Array.from(freq.entries()).sort((a, b) => b[1] - a[1]);
    for (const [word, count] of ranked.slice(0, 4)) {
        if (seen.has(word))
            continue;
        seen.add(word);
        entities.push({
            name: word,
            type: 'topic',
            firstMentioned: now,
            lastMentioned: now,
            mentionCount: count,
            aliases: [],
            certainty: Math.min(0.75, 0.45 + count * 0.1),
        });
    }
    return entities;
}
function entityMatches(entity, term) {
    const target = singularize(term.toLowerCase());
    if (singularize(entity.name.toLowerCase()) === target)
        return true;
    if (entity.aliases.some((a) => singularize(a.toLowerCase()) === target))
        return true;
    const entityTokens = uniqueContentTokens(entity.name);
    if (entityTokens.has(target))
        return true;
    // Plural/singular token overlap ("cars" matches "electric cars").
    for (const et of entityTokens) {
        if (singularize(et) === target)
            return true;
    }
    return false;
}
function rankedEntities(state) {
    const topic = activeTopic(state);
    if (!topic)
        return [];
    return [...topic.entities].sort((a, b) => {
        if (a.lastMentioned !== b.lastMentioned)
            return b.lastMentioned - a.lastMentioned;
        const weight = (t) => (t === 'subject' || t === 'topic' ? 3 : t === 'person' || t === 'place' ? 2 : 1);
        return weight(b.type) * b.mentionCount - weight(a.type) * a.mentionCount;
    });
}
// ─── Semantic relatedness (overlap-driven, no domain hardcoding) ──────────
function semanticRelatedness(a, b) {
    const tokensA = uniqueContentTokens(a);
    const tokensB = uniqueContentTokens(b);
    if (tokensA.size === 0 || tokensB.size === 0)
        return 0;
    let overlap = 0;
    for (const t of tokensA)
        if (tokensB.has(t))
            overlap++;
    const jaccard = overlap / (tokensA.size + tokensB.size - overlap || 1);
    const bigramsA = bigramTokens(a).filter((bg) => !bg.split(' ').some((w) => STOPWORDS.has(w)));
    const bigramsB = bigramTokens(b).filter((bg) => !bg.split(' ').some((w) => STOPWORDS.has(w)));
    let bigramOverlap = 0;
    for (const bg of bigramsA)
        if (bigramsB.includes(bg))
            bigramOverlap++;
    const bigramScore = Math.min(0.3, (bigramOverlap / (bigramsA.length || 1)) * 0.5);
    return Math.min(1, jaccard + bigramScore);
}
function relatednessToActive(message, state) {
    const topic = activeTopic(state);
    if (!topic)
        return 0;
    const recent = state.recentMessages.slice(-3).map((m) => m.content).join(' ').trim();
    const topicText = `${topic.label} ${topic.entities.map((e) => e.name).join(' ')}`;
    const scoreFromTopic = semanticRelatedness(message, topicText);
    const scoreFromRecent = recent ? semanticRelatedness(message, recent) : 0;
    return Math.max(scoreFromTopic, scoreFromRecent);
}
// ─── Intent detection ──────────────────────────────────────────────────────
const GREETING_RE = /^(hi|hello|hey|howdy|hola|yo|salam|salaam|assalamu)\b/i;
const EXPLICIT_NEW_TOPIC_RE = /(tell me about|tell us about|let's (?:talk|discuss|switch|move)|change (?:the )?topic|actually|forget (?:that|it)|instead|on a different note|different topic|new topic|switch(?:ing)? to|back to|going back to)/i;
const ASPECT_QUESTION_RE = /\b(what about|how about|and what about|what of)\s+(.+)/i;
const ABANDON_RE = /\b(forget |forget it|forget that|instead|change (?:the )?topic|switch(?:ing)? (?:the )?topic|on a different note|new topic|different topic|let's move on|moving on|drop that|back to|going back to|let'?s switch)\b/i;
const INTRODUCER_RE = /\b(?:tell me about|tell us about|let's talk about|talk about|let's discuss|discuss|explain|describe|teach me about|inform me about|switch to|move on to|back to)\s+((?:the|a|an)?[a-z][a-z0-9' -]{1,40})/i;
const CLARIFICATION_RE = /(what do you mean|i mean|i meant|let me clarify|to clarify|to be clear|clarify|correction|sorry,? i (?:said|meant)|did i say|rephrase)/i;
const ELABORATION_RE = /(tell me more|go on|continue|more about|and then|what else|anything else|explain further|elaborate|give more details|go into more detail|could you expand|expand on that|please elaborate)/i;
const NEW_SUBJECT_RE = /^(what|who|where|when|why|how|which|is|are|was|were|can|could|would|do|does|did|should|shall|will)\b/i;
function detectIntent(message, state) {
    const trimmed = message.trim();
    const lower = trimmed.toLowerCase();
    const question = isQuestion(trimmed);
    const trivial = isTrivialMessage(trimmed);
    if (trivial) {
        const firstWord = lower.split(/\s+/)[0] || '';
        const isGreeting = GREETING_RE.test(lower) || GREETING_WORDS.has(firstWord);
        return {
            intent: isGreeting ? UserIntent.GREETING : UserIntent.ACKNOWLEDGMENT,
            confidence: 0.95,
            targetTopic: '',
            explicitMention: false,
            isQuestion: false,
            isTrivial: true,
        };
    }
    if (CLARIFICATION_RE.test(lower)) {
        return {
            intent: UserIntent.CLARIFICATION,
            confidence: 0.85,
            targetTopic: '',
            explicitMention: false,
            isQuestion: question,
            isTrivial: false,
        };
    }
    if (ELABORATION_RE.test(lower)) {
        return {
            intent: UserIntent.ELABORATION,
            confidence: 0.8,
            targetTopic: '',
            explicitMention: false,
            isQuestion: question,
            isTrivial: false,
        };
    }
    const hasRef = hasReferenceTerm(lower);
    const related = state.topics.length > 0 ? relatednessToActive(trimmed, state) : 0;
    const newEntities = extractEntities(trimmed);
    const active = activeTopic(state);
    const mentionsActiveEntity = active
        ? newEntities.some((e) => active.entities.some((ae) => entityMatches(ae, e.name)))
        : false;
    const explicitNew = EXPLICIT_NEW_TOPIC_RE.test(lower);
    const aspectMatch = trimmed.match(ASPECT_QUESTION_RE);
    const abandonSignal = ABANDON_RE.test(lower);
    if (active && hasRef && related > 0.05) {
        return {
            intent: UserIntent.FOLLOW_UP,
            confidence: Math.min(0.95, 0.6 + related * 0.5),
            targetTopic: active.label,
            explicitMention: false,
            isQuestion: question,
            isTrivial: false,
        };
    }
    // "What about X?" / "How about X?" — an aspect follow-up on the current topic.
    if (active && aspectMatch) {
        return {
            intent: UserIntent.FOLLOW_UP,
            confidence: 0.75,
            targetTopic: active.label,
            explicitMention: false,
            isQuestion: true,
            isTrivial: false,
        };
    }
    if (active && explicitNew) {
        // Identify the subject explicitly introduced ("tell me about X", "back to X").
        const introMatch = trimmed.match(INTRODUCER_RE);
        const introduced = introMatch ? introMatch[1].trim().replace(/^(?:the|a|an)\s+/i, '') : '';
        const introducedMatchesActive = introduced
            ? active.entities.some((ae) => entityMatches(ae, introduced))
            : false;
        const hasClearNewIntro = introduced.length >= 2 && !introducedMatchesActive;
        const definitelyShift = abandonSignal && !introducedMatchesActive;
        const isShift = definitelyShift || (hasClearNewIntro && related < 0.25);
        return {
            intent: isShift ? UserIntent.TOPIC_CHANGE : UserIntent.FOLLOW_UP,
            confidence: isShift ? 0.85 : 0.6,
            targetTopic: isShift ? (introduced || newEntities[0]?.name || '') : active.label,
            explicitMention: true,
            isQuestion: question,
            isTrivial: false,
        };
    }
    if (active && question) {
        if (mentionsActiveEntity || related >= 0.2) {
            return {
                intent: UserIntent.QUESTION_ABOUT_TOPIC,
                confidence: Math.min(0.9, 0.45 + related * 0.6),
                targetTopic: active.label,
                explicitMention: mentionsActiveEntity,
                isQuestion: true,
                isTrivial: false,
            };
        }
        return {
            intent: UserIntent.NEW_QUESTION,
            confidence: newEntities.length > 0 ? 0.75 : 0.55,
            targetTopic: newEntities[0]?.name || '',
            explicitMention: newEntities.length > 0,
            isQuestion: true,
            isTrivial: false,
        };
    }
    if (active && !question) {
        if (mentionsActiveEntity || related >= 0.12) {
            return {
                intent: UserIntent.STATEMENT,
                confidence: Math.min(0.85, 0.5 + related * 0.5),
                targetTopic: active.label,
                explicitMention: mentionsActiveEntity,
                isQuestion: false,
                isTrivial: false,
            };
        }
        return {
            intent: UserIntent.TOPIC_CHANGE,
            confidence: 0.6,
            targetTopic: newEntities[0]?.name || '',
            explicitMention: true,
            isQuestion: false,
            isTrivial: false,
        };
    }
    const intent = question ? UserIntent.NEW_QUESTION : UserIntent.STATEMENT;
    return {
        intent,
        confidence: question ? 0.7 : 0.55,
        targetTopic: newEntities[0]?.name || '',
        explicitMention: newEntities.length > 0,
        isQuestion: question,
        isTrivial: false,
    };
}
// ─── Reference resolution ──────────────────────────────────────────────────
// Rewrite a message by substituting resolved references.
// Longest keys first so multi-word phrases win over bare pronouns.
function rewriteReferences(message, refs) {
    let out = message;
    const keys = Array.from(refs.keys()).sort((a, b) => b.length - a.length);
    for (const key of keys) {
        const target = refs.get(key) || '';
        if (!key || target.length < 2)
            continue;
        const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        try {
            out = out.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), target);
        }
        catch {
            /* ignore malformed pattern */
        }
    }
    return out;
}
// The topic's top content words form its anchor phrase ("supply chain").
// Used so vague references resolve to the full subject rather than a single fragment.
function topicAnchorName(topic) {
    const content = Array.from(uniqueContentTokens(topic.label || ''));
    return content.slice(0, 3).join(' ');
}
function resolveReferences(message, state) {
    let resolvedMessage = message;
    const resolvedReferences = new Map();
    const resolvedEntityNames = [];
    const topic = activeTopic(state);
    if (!topic)
        return { resolvedMessage, resolvedReferences, resolvedEntityNames };
    const entities = rankedEntities(state);
    if (entities.length === 0) {
        // Safety net: a topic must always expose at least one anchor, otherwise every
        // pronoun / vague reference in follow-up questions would silently fail to resolve.
        const fromLabel = extractEntities(topic.label || '');
        if (fromLabel.length > 0) {
            entities.push(...fromLabel.slice(0, 3));
        }
        else {
            const label = (topic.label || '').trim();
            if (label.length < 2)
                return { resolvedMessage, resolvedReferences, resolvedEntityNames };
            entities.push({
                name: label,
                type: 'topic',
                firstMentioned: topic.startedAt,
                lastMentioned: topic.lastActiveAt,
                mentionCount: 1,
                aliases: [],
                certainty: 0.6,
            });
        }
    }
    const tokens = tokenize(message);
    const contentTokens = tokens.filter((t) => !STOPWORDS.has(t) && !FALSE_ENTITY_WORDS.has(t));
    // If the message has content tokens that directly match an entity, that entity is the referent of any pronoun.
    let referent = null;
    for (const ct of contentTokens) {
        const match = entities.find((e) => entityMatches(e, ct));
        if (match) {
            referent = match;
            break;
        }
    }
    if (!referent)
        referent = entities[0];
    // Prefer the full topic phrase for vague references ("one", "it", "the same thing")
    // when the token-level referent is only a fragment of it.
    const anchorName = topicAnchorName(topic);
    const anchorTokens = uniqueContentTokens(anchorName);
    const referentFragment = singularize(referent.name);
    const anchorIsRicher = anchorTokens.size > 1 &&
        Array.from(anchorTokens).some((t) => singularize(t) === referentFragment);
    const vagueReferentName = anchorIsRicher ? anchorName : referent.name;
    // 1. Possessive + noun: "their eggs", "its price"
    const possessivePattern = /\b(their|its|his|her)\s+([a-z][a-z'-]{1,30})\b/gi;
    let pm;
    while ((pm = possessivePattern.exec(message)) !== null) {
        const pronoun = pm[1].toLowerCase();
        const noun = pm[2];
        const replacement = `${referent.name} ${noun}`;
        resolvedReferences.set(`${pronoun} ${noun}`, replacement);
        resolvedEntityNames.push(referent.name);
    }
    // 2. Demonstrative + noun: "this stock", "that report"
    const demonstrativePattern = /\b(this|that|these|those)\s+([a-z][a-z'-]{1,30})\b/gi;
    let dm;
    while ((dm = demonstrativePattern.exec(message)) !== null) {
        const pronoun = dm[1].toLowerCase();
        const noun = dm[2];
        // Prefer an entity matching the noun itself.
        const nounMatch = entities.find((e) => entityMatches(e, noun));
        const target = nounMatch || referent;
        resolvedReferences.set(`${pronoun} ${noun}`, `${target.name} ${noun}`);
        resolvedEntityNames.push(target.name);
    }
    // 3. Bare pronoun/demonstrative: "it", "they", "them", "these"
    const barePattern = /\b(it|its|they|them|their|theirs|he|him|his|she|her|hers|this|that|these|those)\b/gi;
    let bm;
    while ((bm = barePattern.exec(message)) !== null) {
        const pronoun = bm[1].toLowerCase();
        resolvedReferences.set(pronoun, vagueReferentName);
        resolvedEntityNames.push(vagueReferentName);
    }
    // 4. Vague quantifier / partitive references: "one of them", "the other one", "which one".
    //    These are genuinely referential in English and must bind to the active entity,
    //    e.g. "What are the biggest risks in one?" -> the previously discussed subject.
    const partitivePattern = /\b(the other ones?|the others|the one|that one|this one|which one|another one|one of (?:them|these|those|the [a-z][a-z'-]{1,30}))\b/gi;
    let qm;
    while ((qm = partitivePattern.exec(message)) !== null) {
        const phrase = qm[1].toLowerCase();
        // If the phrase names a noun itself (e.g. "one of the machines"), prefer that entity.
        const nounInPhrase = uniqueContentTokens(phrase);
        let target = referent;
        for (const nt of nounInPhrase) {
            const m = entities.find((e) => entityMatches(e, nt));
            if (m) {
                target = m;
                break;
            }
        }
        const targetName = target === referent ? vagueReferentName : target.name;
        resolvedReferences.set(phrase, targetName);
        resolvedEntityNames.push(targetName);
    }
    // 5. Bare "one" in a referential position ("... risks in one?", "how much for one?").
    const bareOnePattern = /\b(in|for|about|with|on|to|from|between|per)\s+one\b/gi;
    let om;
    while ((om = bareOnePattern.exec(message)) !== null) {
        const phrase = om[0].toLowerCase();
        resolvedReferences.set(phrase, `${om[1].toLowerCase()} ${vagueReferentName}`);
        resolvedReferences.set('one', vagueReferentName);
        resolvedEntityNames.push(vagueReferentName);
    }
    // 6. Vague placeholders: "the same thing", "that thing", "the same".
    const vagueThingPattern = /\b(the same thing|the same one|that thing|the same)\b/gi;
    let vm;
    while ((vm = vagueThingPattern.exec(message)) !== null) {
        const phrase = vm[1].toLowerCase();
        resolvedReferences.set(phrase, vagueReferentName);
        resolvedEntityNames.push(vagueReferentName);
    }
    // Produce an explicit, self-contained version of the message for downstream consumers.
    if (resolvedReferences.size > 0) {
        resolvedMessage = rewriteReferences(message, resolvedReferences);
    }
    return { resolvedMessage, resolvedReferences, resolvedEntityNames };
}
// ─── Topic continuity / shift / ambiguous ──────────────────────────────────
function findBestEarlierTopic(message, state) {
    let best = null;
    const msgTokens = uniqueContentTokens(message);
    for (let i = 0; i < state.topics.length; i++) {
        if (i === state.activeTopicIndex)
            continue;
        const topic = state.topics[i];
        const topicTokens = new Set();
        topicTokens.add(singularize(topic.label));
        for (const e of topic.entities)
            topicTokens.add(singularize(e.name));
        let overlap = 0;
        for (const t of msgTokens)
            if (topicTokens.has(singularize(t)))
                overlap++;
        const denominator = Math.max(1, msgTokens.size + topicTokens.size - overlap);
        const score = overlap / denominator;
        if (score > (best ? best.score : 0))
            best = { topic, index: i, score };
    }
    return best && best.score >= 0.25 ? best : null;
}
function decideContinuity(message, intent, refs, state) {
    if (intent.isTrivial)
        return ContinuityDecision.CONTINUE;
    // If the user's message contains an anaphoric reference that actually bound to the
    // active topic ("What are the biggest risks in one?" / "risks in one"), the user is
    // explicitly pointing back at that topic. That can never be a topic shift, even when a
    // newly-introduced noun (e.g. "risks") made the intent classifier lean TOPIC_CHANGE.
    const boundToActiveTopic = refs.resolvedEntityNames.length > 0 || refs.resolvedReferences.size > 0;
    const explicitAbandon = ABANDON_RE.test(message.toLowerCase()) || EXPLICIT_NEW_TOPIC_RE.test(message.toLowerCase());
    if (boundToActiveTopic && !explicitAbandon) {
        return ContinuityDecision.CONTINUE;
    }
    if (refs.resolvedEntityNames.length > 0 && intent.intent !== UserIntent.TOPIC_CHANGE) {
        return ContinuityDecision.CONTINUE;
    }
    const activeExists = state.topics.length > 0 && state.activeTopicIndex >= 0;
    const related = activeExists ? relatednessToActive(message, state) : 0;
    // GENUINE NEW TOPIC (explicit introducer / abandon / statement on a different subject)
    if (intent.intent === UserIntent.TOPIC_CHANGE) {
        // Returning to an earlier topic is a "shift" but should reuse that topic's context.
        return ContinuityDecision.SHIFT;
    }
    if (intent.intent === UserIntent.FOLLOW_UP ||
        intent.intent === UserIntent.CLARIFICATION ||
        intent.intent === UserIntent.ELABORATION ||
        intent.intent === UserIntent.QUESTION_ABOUT_TOPIC) {
        return ContinuityDecision.CONTINUE;
    }
    if (intent.intent === UserIntent.GREETING || intent.intent === UserIntent.ACKNOWLEDGMENT) {
        return ContinuityDecision.CONTINUE;
    }
    // NEW QUESTION / STATEMENT on an existing topic:
    if (intent.intent === UserIntent.NEW_QUESTION || intent.intent === UserIntent.STATEMENT) {
        if (!activeExists)
            return ContinuityDecision.SHIFT;
        if (related >= 0.15)
            return ContinuityDecision.CONTINUE;
        // Check for an explicit new subject or a return to an earlier topic.
        const introMatch = message.match(INTRODUCER_RE);
        const explicitSubject = introMatch ? introMatch[1].trim() : '';
        if (explicitSubject.length >= 2) {
            const active = activeTopic(state);
            const matchesActive = active ? active.entities.some((ae) => entityMatches(ae, explicitSubject)) : false;
            if (!matchesActive) {
                const earlier = findBestEarlierTopic(explicitSubject, state);
                if (earlier)
                    return ContinuityDecision.SHIFT;
                return ContinuityDecision.SHIFT;
            }
            return ContinuityDecision.CONTINUE;
        }
        // Strong signal: a proper-noun subject appears in the message while relatedness is very low.
        const properNoun = message.match(/\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})*)\b/);
        const hasExplicitNewEntity = properNoun !== null && related < 0.05;
        if (hasExplicitNewEntity)
            return ContinuityDecision.SHIFT;
        const earlier = findBestEarlierTopic(message, state);
        if (earlier && related < 0.1)
            return ContinuityDecision.SHIFT;
        // Default: continue. When unsure, prefer keeping the active topic context —
        // the model can still answer a genuinely new question using the full message.
        return ContinuityDecision.CONTINUE;
    }
    return ContinuityDecision.CONTINUE;
}
// ─── Topic labeling ────────────────────────────────────────────────────────
// Leading instruction verbs that carry no topical meaning on their own.
const LEADING_INSTRUCTION_RE = /^(?:please\s+)?(?:(?:can|could|would|will)\s+you\s+)?(?:tell\s+me\s+about|tell\s+me|explain|describe|teach\s+me\s+about|teach\s+me|inform\s+me\s+about|show\s+me|give\s+me|help\s+me\s+with|help\s+me|i\s+want\s+to\s+learn\s+about|i\s+want\s+to\s+learn|i\s+want\s+to\s+know\s+about|i\s+want\s+to|i\s+need\s+to|learn\s+about|learn|study|what\s+is|what\s+are|what's|who\s+is|who\s+are|how\s+do\s+i|how\s+does|how\s+do|why\s+is|why\s+are|define)\s+/i;
function generateTopicLabel(message) {
    const trimmed = message.trim().replace(/\s+/g, ' ');
    if (!trimmed)
        return '';
    // Strip a leading instruction preamble so the label is the actual subject.
    let core = trimmed.replace(LEADING_INSTRUCTION_RE, '');
    // Drop a trailing copula/auxiliary left behind ("... is", "... are", "... do").
    core = core.replace(/\s+(?:is|are|was|were|do|does|did|can|could|should|would|work|works)\s*[.?!]*$/i, '');
    core = core.replace(/[.?!]+$/, '').trim();
    const contentWords = Array.from(uniqueContentTokens(core));
    const phrase = contentWords.slice(0, 4).join(' ');
    if (phrase.length >= 4)
        return phrase;
    if (core.length >= 4)
        return core.slice(0, 60);
    // Fallbacks for short/unusual phrasings.
    const topicMatch = trimmed.match(/(?:about|regarding|concerning|on)\s+([^.?!]{4,60})/i);
    if (topicMatch)
        return topicMatch[1].trim();
    const whatMatch = trimmed.match(/^(?:what|who|where|when|why|how)(?:\s+is|\s+are|\s+was|\s+were|\s+do|\s+does)?\s+(?:the\s+|a\s+|an\s+)?([^.?!]{4,60})/i);
    if (whatMatch)
        return whatMatch[1].trim();
    return trimmed.slice(0, 40);
}
// ─── Contradiction awareness ───────────────────────────────────────────────
const FACT_CLAIM_RE = /\b(?:have|has|had|own|owns|employ|employs|run|runs|operate|operates|sell|sells|stock|stocks|cost|costs|earn|earns|spend|spends|paid|pay|charge|charges|make|makes|produce|produces|use|uses|bought|bought?)\b/i;
function captureProminentFacts(message, state) {
    if (!FACT_CLAIM_RE.test(message))
        return;
    const entities = extractEntities(message);
    const subject = entities[0]?.name;
    if (!subject || subject.length < 2)
        return;
    const compact = message.trim().replace(/\s+/g, ' ');
    const existing = state.prominentFacts.find((f) => singularize(f.subject) === singularize(subject));
    if (existing) {
        existing.claim = compact;
        existing.timestamp = Date.now();
    }
    else {
        state.prominentFacts.push({ subject, claim: compact, timestamp: Date.now() });
        if (state.prominentFacts.length > MAX_FACTS)
            state.prominentFacts.shift();
    }
}
// Detect contradictions between a new fact and previously captured facts.
function detectContradictions(message, state) {
    if (!FACT_CLAIM_RE.test(message) || state.prominentFacts.length === 0)
        return;
    const entities = extractEntities(message);
    const subject = entities[0]?.name;
    if (!subject)
        return;
    const numberMatch = message.match(/\b(\d+(?:[.,]\d+)?)\b/);
    if (!numberMatch)
        return;
    const newValue = numberMatch[1];
    for (const fact of state.prominentFacts) {
        if (fact.timestamp >= Date.now() - 45 * 60 * 1000)
            continue; // very recent already known
        const factSubject = fact.subject.toLowerCase();
        const thisSubject = subject.toLowerCase();
        const factEntities = extractEntities(fact.claim);
        const sameSubject = singularize(factSubject) === singularize(thisSubject) ||
            (factEntities.length > 0 && singularize(factEntities[0].name) === singularize(thisSubject));
        if (!sameSubject)
            continue;
        const factMatch = fact.claim.match(/\b(\d+(?:[.,]\d+)?)\b/);
        if (factMatch && factMatch[1] !== newValue) {
            const note = `user said "${fact.claim}" but now says "${message}"`;
            if (!state.contradictions.includes(note)) {
                state.contradictions.push(note);
                if (state.contradictions.length > 4)
                    state.contradictions.shift();
            }
        }
    }
}
// ─── Goal & constraint tracking ────────────────────────────────────────────
const GOAL_RE = /(\b(?:i|we|you|the business|my business)\b.{0,40}?\b(?:want to|wants to|am going to|are going to|plan to|planning to|need to|aim to|goal is|trying to|hope to))\b(.{0,80})/i;
const CONSTRAINT_RE = /\b(?:but|cannot|can't|must not|mustn't|don't want|do not want|can only|only have|budget is|limited to|max of|max is|under)\b.{0,60}/i;
function trackGoalsAndConstraints(message, state) {
    const lower = message.toLowerCase();
    const goalMatch = message.match(GOAL_RE);
    if (goalMatch && goalMatch[2] && goalMatch[2].length > 3) {
        const goal = goalMatch[2].trim().replace(/\s+/g, ' ').slice(0, 120);
        if (!state.userGoals.includes(goal)) {
            state.userGoals.push(goal);
            if (state.userGoals.length > MAX_GOALS)
                state.userGoals.shift();
        }
    }
    const constraintMatch = lower.match(CONSTRAINT_RE);
    if (constraintMatch && constraintMatch[0].length > 8) {
        const constraint = constraintMatch[0].trim().slice(0, 120);
        if (!state.constraints.includes(constraint)) {
            state.constraints.push(constraint);
            if (state.constraints.length > MAX_CONSTRAINTS)
                state.constraints.shift();
        }
    }
}
// ─── Relevance helpers ─────────────────────────────────────────────────────
function truncate(text, maxLen) {
    return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
}
function relevantRecentMessages(state, message, max) {
    const msgTokens = uniqueContentTokens(message);
    const scored = state.recentMessages.map((m) => {
        const mTokens = uniqueContentTokens(m.content);
        if (mTokens.size === 0 || msgTokens.size === 0)
            return { m, score: 0 };
        let overlap = 0;
        for (const t of msgTokens)
            if (mTokens.has(t))
                overlap++;
        let score = overlap / (mTokens.size || 1);
        if (m.role === 'user' && hasReferenceTerm(message))
            score += 0.2; // follow-up ties to last user turn
        return { m, score };
    });
    const picked = scored
        .sort((a, b) => b.score - a.score)
        .filter((s) => s.score > 0)
        .slice(0, max);
    if (picked.length > 0) {
        return picked.map((s) => s.m).sort((a, b) => a.timestamp - b.timestamp);
    }
    // If nothing relevant, fall back to the most recent messages only (small).
    return state.recentMessages.slice(-2);
}
function relevantFactsFor(state, message) {
    if (state.prominentFacts.length === 0)
        return [];
    const msgTokens = uniqueContentTokens(message);
    const topic = activeTopic(state);
    const topicTokens = new Set();
    if (topic) {
        topicTokens.add(singularize(topic.label));
        for (const e of topic.entities)
            topicTokens.add(singularize(e.name));
    }
    return state.prominentFacts.filter((f) => {
        if (f.subject.length < 2)
            return false;
        const factTokens = uniqueContentTokens(f.claim);
        let overlap = 0;
        for (const t of msgTokens)
            if (factTokens.has(t))
                overlap++;
        return overlap > 0;
    }).slice(-MAX_FACTS);
}
function relevantConstraintsFor(state, message) {
    if (state.constraints.length === 0)
        return [];
    const msgTokens = uniqueContentTokens(message);
    return state.constraints.filter((c) => {
        const cTokens = uniqueContentTokens(c);
        let overlap = 0;
        for (const t of msgTokens)
            if (cTokens.has(t))
                overlap++;
        return overlap > 0;
    }).slice(-MAX_CONSTRAINTS);
}
// ─── Context injection builder (priority-ordered, hidden guidance) ─────────
function buildContextInjection(state, message, refs, intent, continuity, previousTopicLabel) {
    const sections = [];
    const add = (text, source, priority) => {
        if (text.trim())
            sections.push({ text: text.trim(), source, priority });
    };
    const topic = activeTopic(state);
    // 1. Active topic + entities (the anchor for everything else).
    if (topic) {
        const ents = topic.entities
            .sort((a, b) => b.mentionCount - a.mentionCount)
            .slice(0, 4)
            .map((e) => e.name)
            .join(', ');
        add(`ACTIVE CONVERSATION TOPIC: "${topic.label}"${ents ? ` | Key entities: ${ents}` : ''}`, 'topic-tracker', 0);
    }
    else {
        add('ACTIVE CONVERSATION TOPIC: (none yet — this is likely the first message)', 'topic-tracker', 0);
    }
    // 2. Resolved references + explicit reading of the user's message.
    if (refs.resolvedReferences.size > 0) {
        const entries = Array.from(refs.resolvedReferences.entries())
            .sort((a, b) => b[0].length - a[0].length)
            .slice(0, 6);
        if (entries.length > 0) {
            const refLines = entries.map(([token, entity]) => `  - "${token}" refers to "${entity}"`).join('\n');
            let block = `RESOLVED REFERENCES:\n${refLines}`;
            if (refs.resolvedMessage && refs.resolvedMessage !== message) {
                block += `\nThe user's message, with those references resolved, means:\n  "${truncate(refs.resolvedMessage, 300)}"`;
            }
            add(block, 'reference-resolver', 1);
        }
    }
    // 3. Intent + reasoning guidance (hidden from user, guides the model).
    //    When reference resolution proved the message points back at the active topic, the raw
    //    classifier label ("TOPIC CHANGE") is contradicted by the continuity decision. Report the
    //    effective intent so the model is never simultaneously told to continue AND to drop context.
    const intentOverriddenByRefs = continuity === ContinuityDecision.CONTINUE && intent.intent === UserIntent.TOPIC_CHANGE;
    const effectiveIntent = intentOverriddenByRefs ? UserIntent.FOLLOW_UP : intent.intent;
    const intentLabel = effectiveIntent === UserIntent.FOLLOW_UP ? 'FOLLOW-UP (continuation)' :
        effectiveIntent === UserIntent.CLARIFICATION ? 'CLARIFICATION' :
            effectiveIntent === UserIntent.ELABORATION ? 'ELABORATION (more depth)' :
                effectiveIntent === UserIntent.TOPIC_CHANGE ? 'TOPIC CHANGE' :
                    effectiveIntent === UserIntent.NEW_QUESTION ? 'NEW TOPIC QUESTION' :
                        effectiveIntent === UserIntent.QUESTION_ABOUT_TOPIC ? 'QUESTION ABOUT CURRENT TOPIC' :
                            effectiveIntent === UserIntent.STATEMENT ? 'STATEMENT' :
                                effectiveIntent === UserIntent.GREETING ? 'GREETING' : 'ACKNOWLEDGMENT';
    const intentConfidence = intentOverriddenByRefs ? Math.max(0.7, intent.confidence) : intent.confidence;
    add(`USER INTENT: ${intentLabel} (confidence ${Math.round(intentConfidence * 100)}%)`, 'intent-analyzer', 2);
    if (continuity === ContinuityDecision.CONTINUE) {
        add('The user is continuing the current topic — keep your answer aligned with the active topic above and the resolved references.', 'topic-continuity', 2);
    }
    else if (continuity === ContinuityDecision.SHIFT) {
        add(previousTopicLabel
            ? `Topic shift: user moved from "${previousTopicLabel}" to a new subject. Answer based on this message; do not drag in irrelevant details from the old topic.`
            : 'Topic shift: the user has moved to a new subject. Answer based on the current message.', 'topic-shift', 2);
    }
    else if (continuity === ContinuityDecision.AMBIGUOUS) {
        add('The message is ambiguous — it may relate to the current topic or a new one. Consider it against the active topic; if still genuinely ambiguous, ask one concise clarifying question.', 'topic-ambiguity', 2);
    }
    // 4. Relevant recent context (only relevant messages).
    const relevant = relevantRecentMessages(state, message, 3);
    if (relevant.length > 0) {
        const recentText = relevant.map((m) => `${m.role}: ${truncate(m.content, 160)}`).join('\n');
        add(`RELEVANT RECENT CONVERSATION:\n${recentText}`, 'recent-messages', 3);
    }
    // 5. Relevant long-term memory (prominent facts).
    const facts = relevantFactsFor(state, message);
    if (facts.length > 0) {
        const factLines = facts.map((f) => `  - ${truncate(f.claim, 160)}`).join('\n');
        add(`KNOWN USER FACTS (memory):\n${factLines}`, 'memory', 4);
    }
    // 6. Relevant constraints + user goal.
    const constraints = relevantConstraintsFor(state, message);
    if (constraints.length > 0) {
        add(`USER CONSTRAINTS: ${constraints.map((c) => `"${truncate(c, 80)}"`).join(', ')}`, 'constraints', 5);
    }
    if (state.userGoals.length > 0) {
        add(`USER GOAL: "${truncate(state.userGoals[state.userGoals.length - 1], 100)}"`, 'goal-tracker', 5);
    }
    // 7. Contradiction warning (only if present).
    if (state.contradictions.length > 0) {
        const lastNote = state.contradictions[state.contradictions.length - 1];
        add(`CONTEXT NOTE: ${truncate(lastNote, 140)}. Prefer the user's most recent statement.`, 'contradiction-detector', 6);
    }
    // Assemble in priority order, cap token budget.
    sections.sort((a, b) => a.priority - b.priority);
    let text = '';
    let tokensEstimate = 0;
    const usedSources = [];
    for (const s of sections) {
        const est = Math.ceil(s.text.length / 4);
        if (tokensEstimate + est > MAX_CONTEXT_TOKENS && tokensEstimate > 0)
            break;
        text += (text ? '\n\n' : '') + s.text;
        tokensEstimate += est;
        usedSources.push(s.source);
    }
    return { text, tokensEstimate, sources: usedSources };
}
// ─── Public API (used by server.ts) ────────────────────────────────────────
function processMessage(params) {
    const { message, history, tenantId, userId, conversationId } = params;
    const state = getOrCreateState(tenantId, userId, conversationId);
    seedFromHistory(state, history);
    // 1. Detect intent.
    const intent = detectIntent(message, state);
    // 2. Push the user message to recent history (before reference resolution uses it).
    pushRecent(state, 'user', message);
    // 3. Resolve references against the current topic.
    const refs = resolveReferences(message, state);
    // 4. Decide continuity (CONTINUE / SHIFT / AMBIGUOUS).
    const continuity = decideContinuity(message, intent, refs, state);
    // 5. Update topic state (skip topic creation for pure trivial greetings/acks).
    const activeBefore = activeTopic(state);
    const previousTopicLabel = activeBefore?.label || '';
    const isTopicChange = continuity === ContinuityDecision.SHIFT;
    const newEntities = extractEntities(message);
    const meaningfulEntities = newEntities.filter((e) => e.certainty >= 0.5);
    const trivialNoTopic = intent.isTrivial && !activeBefore && (intent.intent === UserIntent.GREETING || intent.intent === UserIntent.ACKNOWLEDGMENT);
    if (!trivialNoTopic && (isTopicChange || !activeBefore)) {
        const topic = {
            id: `t-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            label: generateTopicLabel(message),
            startedAt: Date.now(),
            lastActiveAt: Date.now(),
            entities: meaningfulEntities.length > 0 ? meaningfulEntities : newEntities.slice(0, 4),
            messageCount: 1,
            lastUserMessage: message,
        };
        state.topics.push(topic);
        if (state.topics.length > MAX_TOPICS)
            state.topics.shift();
        state.activeTopicIndex = state.topics.length - 1;
    }
    else {
        const topic = activeTopic(state);
        if (topic) {
            topic.lastActiveAt = Date.now();
            topic.messageCount++;
            topic.lastUserMessage = message;
            for (const ne of meaningfulEntities) {
                const existing = topic.entities.find((e) => entityMatches(e, ne.name));
                if (existing) {
                    existing.lastMentioned = Date.now();
                    existing.mentionCount++;
                }
                else {
                    topic.entities.push(ne);
                }
            }
        }
    }
    // 6. Track goals/constraints, capture facts, detect contradictions (skip trivial).
    if (!intent.isTrivial) {
        if (intent.intent === UserIntent.STATEMENT || intent.intent === UserIntent.TOPIC_CHANGE) {
            captureProminentFacts(message, state);
            detectContradictions(message, state);
        }
        trackGoalsAndConstraints(message, state);
    }
    // 7. Build hidden context injection for the model.
    const contextInjection = buildContextInjection(state, message, refs, intent, continuity, previousTopicLabel);
    const activeTopicLabel = activeTopic(state)?.label || '';
    return { contextInjection, resolvedMessage: refs.resolvedMessage, isTopicChange, activeTopicLabel };
}
function processAssistantResponse(params) {
    const { assistantReply, tenantId, userId, conversationId } = params;
    const state = getOrCreateState(tenantId, userId, conversationId);
    pushRecent(state, 'assistant', assistantReply);
    // Harvest entities mentioned in the assistant reply into the active topic.
    const topic = activeTopic(state);
    if (!topic)
        return;
    const entities = extractEntities(assistantReply).filter((e) => e.certainty >= 0.5);
    for (const ne of entities) {
        const existing = topic.entities.find((e) => entityMatches(e, ne.name));
        if (existing) {
            existing.lastMentioned = Date.now();
            existing.mentionCount++;
        }
        else {
            topic.entities.push(ne);
        }
    }
}
function getConversationStats(tenantId, userId, conversationId) {
    const key = getConversationKey(tenantId, userId, conversationId);
    const state = conversationStates.get(key);
    if (!state)
        return null;
    return {
        conversationId: state.conversationId,
        totalTopics: state.topics.length,
        activeTopic: activeTopic(state)?.label || null,
        recentMessageCount: state.recentMessages.length,
        memoryFacts: state.prominentFacts.length,
        constraints: state.constraints.length,
        contradictions: state.contradictions.length,
        userGoals: state.userGoals.length,
        lastActivity: new Date(state.lastActivityAt).toISOString(),
    };
}
function resetConversation(tenantId, userId, conversationId) {
    conversationStates.delete(getConversationKey(tenantId, userId, conversationId));
}
function getGlobalStats() {
    return { totalConversations: conversationStates.size, maxCapacity: MAX_CONVERSATION_STATES };
}
