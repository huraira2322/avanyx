import { LearningCandidate, LearningResult, MemoryClassification, MemoryTier } from '../../types';
import { memoryService } from '../memory/memoryService';
import { wikiService } from '../indexing/wikiService';
import { contradictionService } from '../contradiction/contradictionService';
import { logger } from '../logging/logger';

const TRIVIAL_PATTERNS = [
  /^(hi|hello|hey|greetings|hola|good\s*(morning|afternoon|evening))\b/i,
  /^(thanks|thank\s*you|thx|ty|much\s*appreciated)\b/i,
  /^(ok|okay|k|cool|great|awesome|got\s*it|sure|yes|no|yep|nope|alright|fine)\b/i,
  /^(bye|goodbye|cya|see\s*you|farewell|later)\b/i,
  /^(test|testing|123|ping|pong)\b/i,
];

// General queries, science, math, or trivia questions that should NOT be saved as user memories
const GENERAL_QUERY_PATTERNS = [
  /^(what\s+is|what\s+are|what\s+was|who\s+is|who\s+was|who\s+wrote|who\s+created)\s+(?!my|our\s+goal|our\s+project|our\s+policy)/i,
  /^(why\s+is|why\s+are|why\s+do|why\s+does|how\s+does|how\s+do|how\s+to|how\s+can\s+i|how\s+should\s+i)\s+(?!we\s+set|i\s+set|my\s+goal)/i,
  /^(explain|describe|tell\s+me\s+about|define|calculate|translate|search\s+for)\s+(?!my|our)/i,
  /^(what\s+are\s+my\s+sales|how\s+is\s+my\s+business\s+performing|which\s+products\s+are\s+low|show\s+me\s+inventory)\b/i,
];

export interface ExtractedLearning {
  classification: MemoryClassification;
  tier: MemoryTier;
  topicKey?: string;
  tags: string[];
  entities: string[];
  summary: string;
  isUpdate: boolean;
  confidence: number;
}

export class LearningService {
  // Check if an interaction is trivial and should be ignored
  public isTrivial(text: string): boolean {
    if (!text || text.trim().length < 3) return true;
    const clean = text.trim();
    if (clean.length < 25) {
      for (const pattern of TRIVIAL_PATTERNS) {
        if (pattern.test(clean)) return true;
      }
    }
    return false;
  }

  // Check if an interaction is a general knowledge question or operational query
  public isGeneralInquiry(text: string): boolean {
    if (!text) return false;
    const clean = text.trim();

    // Check if it's explicitly a general knowledge / trivia question
    for (const pattern of GENERAL_QUERY_PATTERNS) {
      if (pattern.test(clean)) {
        // Exception: declarative user statements like "My goal is..." or "I'm building..." are NOT general queries
        const lower = clean.toLowerCase();
        if (
          lower.includes('my goal') ||
          lower.includes("i'm building") ||
          lower.includes('i am building') ||
          lower.includes('my project') ||
          lower.includes('i prefer') ||
          lower.includes('we decided')
        ) {
          return false;
        }
        return true;
      }
    }

    return false;
  }

  // Extract structured user context, goals, projects, preferences, or business rules
  public analyzeInteraction(text: string): ExtractedLearning | null {
    if (this.isTrivial(text) || this.isGeneralInquiry(text)) {
      return null;
    }

    const lower = text.toLowerCase();
    const clean = text.trim();

    // 1. Business Identity, Name & Business Type (e.g. "My business is a gold jewelry store called ABC Jewellers", "My business is a dental clinic")
    if (
      lower.includes('my business is') ||
      lower.includes('my store is') ||
      lower.includes('my shop is') ||
      lower.includes('we are a ') ||
      lower.includes('we operate a ') ||
      lower.includes('i run a ') ||
      lower.includes('i own a ') ||
      lower.includes('business called') ||
      lower.includes('store called') ||
      lower.includes('store name is') ||
      lower.includes('business name is')
    ) {
      const isUpdate = lower.includes('changed to') || lower.includes('now called') || lower.includes('rebranded') || lower.includes('new business');
      return {
        classification: 'knowledge',
        tier: 'permanent',
        topicKey: 'business_identity',
        tags: ['business_identity', 'store_type', 'identity', 'business_context'],
        entities: ['Business Identity'],
        summary: `Business Identity: ${clean.slice(0, 100)}`,
        isUpdate,
        confidence: 0.99,
      };
    }

    // 2. Catalog & Product Line Profile (e.g. "I mainly sell 22K gold jewelry", "We sell running shoes", "We specialize in organic silk scarves")
    if (
      lower.includes('i mainly sell') ||
      lower.includes('we mainly sell') ||
      lower.includes('mainly sell') ||
      lower.includes('our main product') ||
      lower.includes('our primary product') ||
      lower.includes('we sell ') ||
      lower.includes('we offer ') ||
      lower.includes('we specialize in') ||
      lower.includes('store specializes in') ||
      lower.includes('our catalog consists of')
    ) {
      const isUpdate = lower.includes('changed') || lower.includes('now selling') || lower.includes('switched to');
      return {
        classification: 'knowledge',
        tier: 'permanent',
        topicKey: 'catalog_profile',
        tags: ['catalog_profile', 'products', 'inventory', 'business_context'],
        entities: ['Catalog Profile'],
        summary: `Catalog & Products: ${clean.slice(0, 100)}`,
        isUpdate,
        confidence: 0.98,
      };
    }

    // 3. Operational Facts, Staff & Capacity (e.g. "I have 5 staff members", "We now have 12 staff", "We operate 2 branches in Lahore")
    if (
      lower.includes('staff member') ||
      lower.includes('staff members') ||
      lower.includes('staff account') ||
      lower.includes('employees') ||
      lower.includes('have 5 staff') ||
      lower.includes('have 12 staff') ||
      /\b(?:have|has|employ|with|now have)\s+\d+\s+(?:staff|employees|workers|cashiers|subusers|team members)\b/i.test(clean) ||
      /\b(?:operate|have|running)\s+\d+\s+(?:branches|stores|locations|warehouses|outlets)\b/i.test(clean) ||
      /\b\d+\s+(?:workstations|pos registers|terminals|checkout lanes)\b/i.test(clean)
    ) {
      const isUpdate = lower.includes('now have') || lower.includes('increased to') || lower.includes('reduced to') || lower.includes('changed to') || lower.includes('updated');
      return {
        classification: 'knowledge',
        tier: 'permanent',
        topicKey: 'operational_capacity',
        tags: ['operational_capacity', 'staff', 'capacity', 'infrastructure', 'business_context'],
        entities: ['Operational Capacity'],
        summary: `Operational Capacity: ${clean.slice(0, 100)}`,
        isUpdate,
        confidence: 0.98,
      };
    }

    // 4. User Projects & Ventures
    // e.g. "I'm building Avanyx as my main software project", "My software project is Avanyx", "Working on Project Apollo"
    const projectMatch = clean.match(/(?:i'm building|i am building|my project is|working on|developing)\s+([A-Za-z0-9_\-\s]{2,40}?)(?:\s+as\s+my|\s+for\s+my|\.|$|,)/i);
    if (
      lower.includes("i'm building") ||
      lower.includes('i am building') ||
      lower.includes('my project is') ||
      lower.includes('my software project') ||
      lower.includes('my main project') ||
      (lower.includes('project') && (lower.includes('building') || lower.includes('developing')))
    ) {
      const entity = projectMatch ? projectMatch[1].trim() : 'Software Project';
      const isUpdate = lower.includes('changed to') || lower.includes('new project') || lower.includes('switched to');
      return {
        classification: 'knowledge',
        tier: 'user',
        topicKey: 'user_project',
        tags: ['project', 'software', 'user_context', 'identity'],
        entities: entity && entity.length > 2 && entity.length < 30 ? [entity] : ['User Project'],
        summary: `User Project: ${clean.slice(0, 100)}`,
        isUpdate,
        confidence: 0.98,
      };
    }

    // 5. User Goals & Business Objectives
    // e.g. "My goal is $50,000 monthly revenue", "My goal has changed to $80,000", "Our target is to expand to 3 locations"
    if (
      lower.includes('my goal is') ||
      lower.includes('my goal has changed') ||
      lower.includes('my new goal') ||
      lower.includes('our target is') ||
      lower.includes('aiming for') ||
      lower.includes('plan to reach') ||
      lower.includes('target revenue is') ||
      lower.includes('update my goal')
    ) {
      const isUpdate = lower.includes('changed') || lower.includes('new goal') || lower.includes('update my goal') || lower.includes('revised');
      return {
        classification: 'decision',
        tier: 'user',
        topicKey: 'user_goal',
        tags: ['goal', 'target', 'business_objective', 'user_preference'],
        entities: ['Business Goal'],
        summary: `User Business Goal: ${clean.slice(0, 100)}`,
        isUpdate,
        confidence: 0.98,
      };
    }

    // 6. User Preferences & Working Style / Identity
    // e.g. "I prefer concise bullet points", "Call me Alex", "My name is...", "Never offer discounts above 10%", "My timezone is EST", "I prefer simple Apple-style UI"
    if (
      lower.includes('i prefer') ||
      lower.includes('call me') ||
      lower.includes('my name is') ||
      lower.includes('my working style') ||
      lower.includes('always format') ||
      lower.includes('never use') ||
      lower.includes('my timezone is') ||
      lower.includes('keep your answers') ||
      lower.includes('i like concise') ||
      lower.includes('apple-style ui') ||
      lower.includes('apple style')
    ) {
      const isUpdate = lower.includes('changed') || lower.includes('from now on') || lower.includes('instead');
      return {
        classification: 'insight',
        tier: 'user',
        topicKey: 'user_preference',
        tags: ['preference', 'style', 'working_mode', 'user_context'],
        entities: ['User Preferences'],
        summary: `User Preference: ${clean.slice(0, 100)}`,
        isUpdate,
        confidence: 0.95,
      };
    }

    // 7. Business Decisions & Operational Policies
    // e.g. "Our store policy is 14-day exchange only", "We decided to set free shipping to $75", "Return policy is 30 days", "Our secret supplier discount is 35%"
    if (
      lower.includes('we decided') ||
      lower.includes('decision:') ||
      lower.includes('agreed to') ||
      lower.includes('going forward, we will') ||
      lower.includes('policy:') ||
      lower.includes('store policy') ||
      lower.includes('our policy') ||
      lower.includes('exchange only') ||
      lower.includes('supplier discount') ||
      lower.includes('discount is') ||
      lower.includes('rule:') ||
      lower.includes('free shipping') ||
      lower.includes('return policy') ||
      lower.includes('discount will be') ||
      lower.includes('pricing strategy')
    ) {
      let subTopic = 'business_policy';
      if (lower.includes('shipping')) subTopic = 'policy_shipping';
      else if (lower.includes('return') || lower.includes('exchange')) subTopic = 'policy_returns';
      else if (lower.includes('discount') || lower.includes('pricing') || lower.includes('supplier')) subTopic = 'policy_pricing';

      const isUpdate = lower.includes('updated') || lower.includes('changed') || lower.includes('revised') || lower.includes('new policy');
      return {
        classification: 'decision',
        tier: 'permanent',
        topicKey: subTopic,
        tags: ['policy', 'business_policy', 'decision', 'operations', 'business_rules'],
        entities: ['Store Policy'],
        summary: `Store Policy: ${clean.slice(0, 100)}`,
        isUpdate,
        confidence: 0.96,
      };
    }

    // 8. System & Architecture Decisions (e.g. "User decided to use Gemini as fallback", "User wants inventory alerts when stock is low")
    if (
      lower.includes('gemini as fallback') ||
      lower.includes('fallback provider') ||
      lower.includes('inventory alerts') ||
      lower.includes('alert when stock is low') ||
      lower.includes('low stock alert')
    ) {
      return {
        classification: 'decision',
        tier: 'permanent',
        topicKey: 'system_decision',
        tags: ['system_decision', 'architecture', 'configuration'],
        entities: ['System Decision'],
        summary: `System Decision: ${clean.slice(0, 100)}`,
        isUpdate: lower.includes('changed') || lower.includes('switch'),
        confidence: 0.96,
      };
    }

    // 9. Explicit Directives (e.g. "Remember that our primary supplier is Acme", "Keep in mind that...")
    if (
      lower.startsWith('remember that') ||
      lower.startsWith('remember this') ||
      lower.startsWith('remember:') ||
      lower.startsWith('note that') ||
      lower.startsWith('keep in mind that') ||
      lower.startsWith('note down that')
    ) {
      return {
        classification: 'knowledge',
        tier: 'permanent',
        topicKey: 'explicit_note',
        tags: ['explicit_note', 'instruction', 'durable_fact'],
        entities: ['User Directive'],
        summary: `Note: ${clean.slice(0, 100)}`,
        isUpdate: false,
        confidence: 0.97,
      };
    }

    // 10. Durable Store Facts & Knowledge
    // e.g. "Our store specializes in organic silk scarves", "Our primary supplier is Acme Fabrics", "Store hours are Monday to Saturday"
    if (
      lower.includes('our store specializes') ||
      lower.includes('supplier is') ||
      lower.includes('lead time is') ||
      lower.includes('store hours are') ||
      lower.includes('brand voice') ||
      lower.includes('target demographic') ||
      lower.includes('wholesale price')
    ) {
      return {
        classification: 'knowledge',
        tier: 'permanent',
        topicKey: 'store_knowledge',
        tags: ['knowledge', 'store_facts', 'operations'],
        entities: ['Store Knowledge'],
        summary: `Store Fact: ${clean.slice(0, 100)}`,
        isUpdate: lower.includes('changed') || lower.includes('new'),
        confidence: 0.95,
      };
    }

    // 11. Ongoing Tasks / Plans
    // e.g. "We are launching the summer collection next week", "Currently preparing for Black Friday audit"
    if (
      lower.includes('currently preparing') ||
      lower.includes('planning to launch') ||
      lower.includes('we are launching') ||
      lower.includes('upcoming campaign')
    ) {
      return {
        classification: 'context',
        tier: 'contextual',
        topicKey: 'ongoing_plan',
        tags: ['plan', 'campaign', 'context'],
        entities: ['Ongoing Task'],
        summary: `Ongoing Plan: ${clean.slice(0, 100)}`,
        isUpdate: false,
        confidence: 0.90,
      };
    }

    // 12. Creative & Studio Preferences (Image & Video styles, Aspect Ratios, Brand design constraints)
    if (
      lower.includes('aspect ratio') ||
      lower.includes('cinematic') ||
      lower.includes('photorealistic') ||
      lower.includes('minimalist') ||
      lower.includes('branding preference') ||
      lower.includes('render style') ||
      lower.includes('visual style') ||
      lower.includes('image preference') ||
      lower.includes('video preference') ||
      lower.includes('preferred style')
    ) {
      return {
        classification: 'insight',
        tier: 'user',
        topicKey: 'creative_preference',
        tags: ['creative_preference', 'studio_preference', 'image_generation', 'video_generation', 'user_preference'],
        entities: ['Studio Creative Preferences'],
        summary: `Studio Creative Preference: ${clean.slice(0, 100)}`,
        isUpdate: lower.includes('changed') || lower.includes('instead') || lower.includes('from now on'),
        confidence: 0.95,
      };
    }

    return null;
  }

  // Evaluates an interaction and writes durable learnings into Second Brain memory
  public evaluateAndLearn(candidate: LearningCandidate): LearningResult {
    const { tenantId, userId, text, topicOrModule, businessContext } = candidate;

    if (!tenantId) {
      return { learned: false, reason: 'Missing tenantId' };
    }

    if (this.isTrivial(text)) {
      return { learned: false, reason: 'Ignored: Trivial message (greeting/closing/acknowledgement).' };
    }

    if (this.isGeneralInquiry(text)) {
      return { learned: false, reason: 'Ignored: General inquiry or query, not a declarative user memory.' };
    }

    const analysis = this.analyzeInteraction(text);
    if (!analysis) {
      return { learned: false, reason: 'Ignored: No persistent user context, decision, or business policy detected.' };
    }

    const { classification, tier, topicKey, tags, entities, summary, isUpdate, confidence } = analysis;

    // Check for existing memory on the same topicKey to update / supersede
    if (topicKey) {
      const existing = memoryService.findSuperseded(topicKey, tenantId, userId);
      if (existing) {
        // Track contradiction / revision if content changed significantly
        if (existing.content.trim().toLowerCase() !== text.trim().toLowerCase()) {
          contradictionService.detectOrRecord(
            tenantId,
            topicKey,
            existing.content,
            text.trim(),
            existing.updatedAt,
            new Date().toISOString(),
            existing.authority,
            candidate.speakerRole === 'user' ? 'USER_PROVIDED' : 'SYSTEM_GENERATED',
            existing.confidence,
            confidence,
            existing.source,
            `LearningEngine [${candidate.speakerRole}]`
          );
        }

        // Update the existing memory record with newest details (prevents duplicates & enforces newest info)
        const updatedItem = memoryService.update({
          id: existing.id,
          tenantId,
          userId: existing.userId || userId,
          content: text.trim(),
          summary: summary || text.slice(0, 100),
          classification,
          tier,
          tags: Array.from(new Set([...existing.tags, ...tags])),
          entities: Array.from(new Set([...existing.entities, ...entities])),
          authority: candidate.speakerRole === 'user' ? 'USER_PROVIDED' : 'SYSTEM_GENERATED',
          confidence,
          metadata: {
            ...existing.metadata,
            topicKey,
            lastUpdatedByRole: candidate.speakerRole,
            supersededPrevious: true,
            businessContext,
          },
        });

        logger.learn(tenantId, 'learning', 'UPDATE_EXISTING_KNOWLEDGE', {
          memoryId: updatedItem.id,
          topicKey,
          tier,
          textSnippet: text.slice(0, 60),
        });

        return {
          learned: true,
          reason: `Successfully updated existing ${topicKey} memory with latest user information.`,
          extractedClassification: classification,
          createdMemoryId: updatedItem.id,
        };
      }
    }

    // Store as new structured memory item
    const memoryItem = memoryService.store({
      tenantId,
      userId,
      tier,
      classification,
      content: text.trim(),
      summary: summary || topicOrModule || text.slice(0, 100),
      tags: Array.from(new Set([classification, ...(topicOrModule ? [topicOrModule] : []), ...tags])),
      entities,
      authority: candidate.speakerRole === 'user' ? 'USER_PROVIDED' : 'SYSTEM_GENERATED',
      confidence,
      source: `LearningEngine [${candidate.speakerRole}]`,
      provenance: topicOrModule ? `Module: ${topicOrModule}` : 'Chat interaction',
      metadata: {
        topicKey,
        speakerRole: candidate.speakerRole,
        businessContext,
      },
    });

    let createdWikiSlug: string | undefined;

    // If decision or crucial knowledge, create/update a Wiki page
    if (classification === 'decision' || classification === 'insight') {
      const title = `${classification.toUpperCase()} - ${topicKey || new Date().toISOString().slice(0, 10)} - ${text.slice(0, 30)}`;
      const doc = wikiService.saveDocument(
        classification === 'decision' ? 'decisions' : 'insights',
        title,
        text,
        {
          tenantId,
          userId,
          tags: [classification, ...(topicKey ? [topicKey] : [])],
          authority: candidate.speakerRole === 'user' ? 'USER_PROVIDED' : 'SYSTEM_GENERATED',
        }
      );
      createdWikiSlug = doc.slug;
    }

    logger.learn(tenantId, 'learning', 'LEARN_NEW_KNOWLEDGE', {
      memoryId: memoryItem.id,
      classification,
      tier,
      topicKey,
      createdWikiSlug,
      textSnippet: text.slice(0, 60),
    });

    return {
      learned: true,
      reason: `Successfully captured as ${tier} ${classification}.`,
      extractedClassification: classification,
      createdMemoryId: memoryItem.id,
      createdWikiSlug,
    };
  }
}

export const learningService = new LearningService();

