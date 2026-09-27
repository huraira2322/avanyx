import { describe, it, expect, beforeEach } from 'vitest';
import { memoryService } from '../second brain/src/services/memory/memoryService';
import { learningService } from '../second brain/src/services/learning/learningService';
import { retrievalService } from '../second brain/src/services/retrieval/retrievalService';

describe('Second Brain Cross-Session Grounding & Memory Isolation', () => {
  const tenantA = 'tenant-gold-jewelers';
  const tenantB = 'tenant-tech-repairs';
  const userA = 'user-owner-1';
  const userB = 'user-owner-2';

  beforeEach(() => {
    // Clean memory cache for isolated testing
    memoryService.clearUserMemories(tenantA, userA);
    memoryService.clearUserMemories(tenantA, null);
    memoryService.clearUserMemories(tenantB, userB);
    memoryService.clearUserMemories(tenantB, null);
  });

  it('learns and persists foundational business identity and operational capacity across sessions', () => {
    // Session A: User explains store identity & capacity
    const sessionATurn1 = learningService.evaluateAndLearn({
      tenantId: tenantA,
      userId: userA,
      text: 'My business is Royal Gems Jewelry Store. We specialize in handcrafted 22k gold necklaces, bridal sets, and certified diamond rings.',
      speakerRole: 'user',
    });

    const sessionATurn2 = learningService.evaluateAndLearn({
      tenantId: tenantA,
      userId: userA,
      text: 'We operate 2 store branches with 6 POS workstations and currently have 8 staff members.',
      speakerRole: 'user',
    });

    const sessionATurn3 = learningService.evaluateAndLearn({
      tenantId: tenantA,
      userId: userA,
      text: 'Our store policy is 14-day exchange only with receipt, no cash refunds.',
      speakerRole: 'user',
    });

    expect(sessionATurn1.learned).toBe(true);
    expect(sessionATurn2.learned).toBe(true);
    expect(sessionATurn3.learned).toBe(true);

    // Session B: New conversation session with a different query e.g. "What should we promote this weekend?"
    const sessionBContext = retrievalService.retrieveContext({
      query: 'What should we promote this weekend?',
      tenantId: tenantA,
      userId: userA,
    });

    // Verify context contains foundational business profile even if query doesn't mention "gold" or "staff"
    expect(sessionBContext.answerContext).toContain('Royal Gems Jewelry Store');
    expect(sessionBContext.answerContext).toContain('8 staff');
    expect(sessionBContext.answerContext).toContain('14-day exchange');
  });

  it('correctly updates and supersedes memories when business facts change', () => {
    // Initial statement: 5 staff
    learningService.evaluateAndLearn({
      tenantId: tenantA,
      userId: userA,
      text: 'We currently have 5 staff members working across shifts.',
      speakerRole: 'user',
    });

    let memories = memoryService.getCoreProfileMemories(tenantA, userA);
    const initialStaffMem = memories.find(m => m.content.toLowerCase().includes('5 staff'));
    expect(initialStaffMem).toBeDefined();

    // Later update: Hired more staff -> 12 staff
    learningService.evaluateAndLearn({
      tenantId: tenantA,
      userId: userA,
      text: 'We recently hired more staff so we now have 12 staff members total.',
      speakerRole: 'user',
    });

    memories = memoryService.getCoreProfileMemories(tenantA, userA);
    const updatedStaffMem = memories.find(m => m.content.toLowerCase().includes('12 staff'));
    expect(updatedStaffMem).toBeDefined();

    // The old memory should either be superseded/updated so newest accurate fact takes precedence
    const context = retrievalService.retrieveContext({
      query: 'How many employees do we have?',
      tenantId: tenantA,
      userId: userA,
    });
    expect(context.answerContext).toContain('12 staff');
  });

  it('guarantees strict multi-tenant isolation with zero memory leakage', () => {
    // Tenant A (Gold Jewelers) stores confidential business facts
    learningService.evaluateAndLearn({
      tenantId: tenantA,
      userId: userA,
      text: 'Our secret supplier discount is 35% on all gold wholesale orders from Apex Bullion.',
      speakerRole: 'user',
    });

    // Tenant B (Tech Repairs) queries for supplier discounts
    const tenantBContext = retrievalService.retrieveContext({
      query: 'What is our supplier discount on wholesale orders?',
      tenantId: tenantB,
      userId: userB,
    });

    expect(tenantBContext.answerContext).not.toContain('Apex Bullion');
    expect(tenantBContext.answerContext).not.toContain('35% on all gold');
    expect(tenantBContext.relevantMemories.length).toBe(0);

    const tenantAMemories = memoryService.getAllForTenant(tenantA);
    const tenantBMemories = memoryService.getAllForTenant(tenantB);

    expect(tenantAMemories.some(m => m.content.includes('Apex Bullion'))).toBe(true);
    expect(tenantBMemories.some(m => m.content.includes('Apex Bullion'))).toBe(false);
  });
});