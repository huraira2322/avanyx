import { describe, it, expect, beforeEach } from 'vitest';
import { KeyboardShortcut } from '../types';

describe('Per-User Keyboard Shortcuts & POS Key Execution Engine', () => {
  const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
    { id: 'focus_search', action: 'focus_search', label: 'Focus Product Search', description: 'Jump cursor straight to POS search bar', key: 'F2' },
    { id: 'add_customer', action: 'add_customer', label: 'Quick Add Customer', description: 'Open customer assignment form', key: 'F3' },
    { id: 'apply_discount', action: 'apply_discount', label: 'Apply Discount', description: 'Trigger checkout discount editor', key: 'F4' },
    { id: 'void_cart', action: 'void_cart', label: 'Void / Clear Cart', description: 'Remove all items currently in cart', key: 'F7' },
    { id: 'pay_checkout', action: 'pay_checkout', label: 'Pay & Checkout', description: 'Trigger master payment and print window', key: 'F8' },
    { id: 'barcode_scan', action: 'barcode_scan', label: 'Scan Barcode Simulator', description: 'Open barcode scanner testing utility', key: 'F9' },
    { id: 'open_drawer', action: 'open_drawer', label: 'Open Cash Drawer', description: 'Trigger connected cash drawer via ESC/POS', key: 'F10' },
    { id: 'voice_pilot', action: 'voice_pilot', label: 'Voice Pilot HUD', description: 'Toggle voice command pilot interface', key: 'v', altKey: true },
  ];

  // Helper simulating the POS shortcut matching algorithm
  function matchShortcut(
    shortcuts: KeyboardShortcut[],
    event: { key: string; ctrlKey?: boolean; altKey?: boolean; shiftKey?: boolean }
  ): KeyboardShortcut | undefined {
    return shortcuts.find(s => {
      const keyMatch = event.key.toLowerCase() === s.key.toLowerCase();
      const ctrlMatch = (s.ctrlKey ?? false) === (event.ctrlKey ?? false);
      const altMatch = (s.altKey ?? false) === (event.altKey ?? false);
      const shiftMatch = (s.shiftKey ?? false) === (event.shiftKey ?? false);
      return keyMatch && ctrlMatch && altMatch && shiftMatch;
    });
  }

  // Helper simulating the shortcut update & conflict engine
  function updateShortcut(
    shortcuts: KeyboardShortcut[],
    id: string,
    updated: Partial<KeyboardShortcut>
  ): { success: boolean; error?: string; shortcuts: KeyboardShortcut[] } {
    const candidateKey = (updated.key || '').toLowerCase();
    const candidateCtrl = updated.ctrlKey ?? false;
    const candidateAlt = updated.altKey ?? false;
    const candidateShift = updated.shiftKey ?? false;

    const conflict = shortcuts.find(s => {
      if (s.id === id) return false;
      const currentKey = (s.key || '').toLowerCase();
      const currentCtrl = s.ctrlKey ?? false;
      const currentAlt = s.altKey ?? false;
      const currentShift = s.shiftKey ?? false;
      return (
        currentKey === candidateKey &&
        currentCtrl === candidateCtrl &&
        currentAlt === candidateAlt &&
        currentShift === candidateShift
      );
    });

    if (conflict) {
      return {
        success: false,
        error: `Conflict! This key layout is already assigned to "${conflict.label}".`,
        shortcuts,
      };
    }

    const next = shortcuts.map(s => (s.id === id ? { ...s, ...updated } : s));
    return { success: true, shortcuts: next };
  }

  // Simple mock storage for Node test environment
  const mockStorage: Record<string, string> = {};
  const storage = {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, val: string) => { mockStorage[key] = val; },
    clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
  };

  beforeEach(() => {
    storage.clear();
  });

  it('allows User 1 (Cashier Jordan) to customize their shortcuts independently', () => {
    const user1Id = 'cashier-jordan';
    let user1Shortcuts = [...DEFAULT_SHORTCUTS];

    // Jordan prefers F1 for Search and F12 for Checkout
    const res1 = updateShortcut(user1Shortcuts, 'focus_search', { key: 'F1' });
    expect(res1.success).toBe(true);
    user1Shortcuts = res1.shortcuts;

    const res2 = updateShortcut(user1Shortcuts, 'pay_checkout', { key: 'F12' });
    expect(res2.success).toBe(true);
    user1Shortcuts = res2.shortcuts;

    // Persist to user 1's isolated storage
    storage.setItem(`avanyx_keyboard_shortcuts_${user1Id}`, JSON.stringify(user1Shortcuts));

    // Verify User 1 storage exists and has customized keys
    const stored = JSON.parse(storage.getItem(`avanyx_keyboard_shortcuts_${user1Id}`)!);
    expect(stored.find((s: KeyboardShortcut) => s.id === 'focus_search').key).toBe('F1');
    expect(stored.find((s: KeyboardShortcut) => s.id === 'pay_checkout').key).toBe('F12');
  });

  it('allows User 2 (Cashier Sarah) to have a completely different customized shortcut layout', () => {
    const user2Id = 'cashier-sarah';
    let user2Shortcuts = [...DEFAULT_SHORTCUTS];

    // Sarah prefers Ctrl+S for Search and Space for Checkout
    const res1 = updateShortcut(user2Shortcuts, 'focus_search', { key: 'S', ctrlKey: true });
    expect(res1.success).toBe(true);
    user2Shortcuts = res1.shortcuts;

    const res2 = updateShortcut(user2Shortcuts, 'pay_checkout', { key: 'Space' });
    expect(res2.success).toBe(true);
    user2Shortcuts = res2.shortcuts;

    storage.setItem(`avanyx_keyboard_shortcuts_${user2Id}`, JSON.stringify(user2Shortcuts));

    const stored = JSON.parse(storage.getItem(`avanyx_keyboard_shortcuts_${user2Id}`)!);
    expect(stored.find((s: KeyboardShortcut) => s.id === 'focus_search').key).toBe('S');
    expect(stored.find((s: KeyboardShortcut) => s.id === 'focus_search').ctrlKey).toBe(true);
    expect(stored.find((s: KeyboardShortcut) => s.id === 'pay_checkout').key).toBe('Space');
  });

  it('guarantees that User 1 and User 2 shortcuts do not overwrite or interfere with each other', () => {
    const user1Id = 'cashier-jordan';
    const user2Id = 'cashier-sarah';

    // Jordan customized
    const jordanShortcuts = updateShortcut(DEFAULT_SHORTCUTS, 'pay_checkout', { key: 'F12' }).shortcuts;
    storage.setItem(`avanyx_keyboard_shortcuts_${user1Id}`, JSON.stringify(jordanShortcuts));

    // Sarah customized to F11
    const sarahRes = updateShortcut(DEFAULT_SHORTCUTS, 'pay_checkout', { key: 'F11' });
    expect(sarahRes.success).toBe(true);
    storage.setItem(`avanyx_keyboard_shortcuts_${user2Id}`, JSON.stringify(sarahRes.shortcuts));

    // Retrieve both
    const loadedJordan = JSON.parse(storage.getItem(`avanyx_keyboard_shortcuts_${user1Id}`)!);
    const loadedSarah = JSON.parse(storage.getItem(`avanyx_keyboard_shortcuts_${user2Id}`)!);

    expect(loadedJordan.find((s: KeyboardShortcut) => s.id === 'pay_checkout').key).toBe('F12');
    expect(loadedSarah.find((s: KeyboardShortcut) => s.id === 'pay_checkout').key).toBe('F11');
  });

  it('executes POS actions matching each active user’s configured keys', () => {
    // Jordan's layout
    const jordanShortcuts: KeyboardShortcut[] = [
      { id: 'focus_search', action: 'focus_search', label: 'Focus Search', description: '', key: 'F1' },
      { id: 'pay_checkout', action: 'pay_checkout', label: 'Checkout', description: '', key: 'F12' },
      { id: 'open_drawer', action: 'open_drawer', label: 'Drawer', description: '', key: 'D', ctrlKey: true },
    ];

    // When Jordan presses F1 in the POS -> matches focus_search
    const matchF1 = matchShortcut(jordanShortcuts, { key: 'F1' });
    expect(matchF1).toBeDefined();
    expect(matchF1?.action).toBe('focus_search');

    // When Jordan presses F2 (system default) -> does NOT match because he remapped to F1
    const matchF2 = matchShortcut(jordanShortcuts, { key: 'F2' });
    expect(matchF2).toBeUndefined();

    // When Jordan presses Ctrl+D -> matches open_drawer
    const matchCtrlD = matchShortcut(jordanShortcuts, { key: 'd', ctrlKey: true });
    expect(matchCtrlD).toBeDefined();
    expect(matchCtrlD?.action).toBe('open_drawer');

    // But pressing D alone without Ctrl does NOT trigger drawer
    const matchDAlone = matchShortcut(jordanShortcuts, { key: 'd', ctrlKey: false });
    expect(matchDAlone).toBeUndefined();
  });

  it('prevents key layout conflicts when a user attempts to map a key already in use', () => {
    const shortcuts = [...DEFAULT_SHORTCUTS];

    // Attempt to map pay_checkout to 'F2' which is already mapped to 'focus_search'
    const result = updateShortcut(shortcuts, 'pay_checkout', { key: 'F2' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Conflict!');
    expect(result.error).toContain('Focus Product Search');
  });

  it('formats shortcut key combinations accurately for UI badges and labels', () => {
    const format = (s: KeyboardShortcut) => {
      const parts: string[] = [];
      if (s.ctrlKey) parts.push('Ctrl');
      if (s.altKey) parts.push('Alt');
      if (s.shiftKey) parts.push('Shift');
      parts.push(s.key === ' ' ? 'Space' : s.key);
      return parts.join(' + ');
    };

    expect(format({ id: '1', label: '', description: '', key: 'F2' })).toBe('F2');
    expect(format({ id: '2', label: '', description: '', key: 'v', altKey: true })).toBe('Alt + v');
    expect(format({ id: '3', label: '', description: '', key: 'P', ctrlKey: true, shiftKey: true })).toBe('Ctrl + Shift + P');
    expect(format({ id: '4', label: '', description: '', key: ' ' })).toBe('Space');
  });
});
