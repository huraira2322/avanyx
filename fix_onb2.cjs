const fs = require('fs');
const file = './src/context/AvanyxContext.tsx';
let c = fs.readFileSync(file, 'utf8');

// Ensure getDocs, query, where, collection are imported
if (!c.includes('getDocs')) {
    c = c.replace(/import \{([^}]+)\} from 'firebase\/firestore';/, "import { $1, getDocs, query, where, collection } from 'firebase/firestore';");
}

// Replace the previous hack with an async Firestore check
const oldCode = `// Check business
const hasBiz = businesses.some(b => b.ownerUid === user.uid);
if (hasBiz) {
  setHasCompletedOnboarding(true);
  setIsOnboardingOpen(false);
  localStorage.setItem('avanyx_onboarding_completed', 'true');
} else {
  setHasCompletedOnboarding(false);
  setIsOnboardingOpen(true);
  localStorage.removeItem('avanyx_onboarding_completed');
}`;

const newCode = `// Check business in Firestore
let hasBiz = businesses.some(b => b.ownerUid === user.uid);
if (!hasBiz) {
  try {
    const q = query(collection(db, 'businesses'), where('ownerUid', '==', user.uid));
    const snap = await getDocs(q);
    hasBiz = !snap.empty;
  } catch (e) {
    console.error('Failed to query businesses', e);
  }
}

if (hasBiz) {
  setHasCompletedOnboarding(true);
  setIsOnboardingOpen(false);
  localStorage.setItem('avanyx_onboarding_completed', 'true');
} else {
  setHasCompletedOnboarding(false);
  setIsOnboardingOpen(true);
  localStorage.removeItem('avanyx_onboarding_completed');
}`;

// Since the old hack was duplicated in signupAsOwner, loginAsOwner, loginWithGoogle,
// we will replace all of them.
c = c.split(oldCode).join(newCode);

fs.writeFileSync(file, c, 'utf8');
console.log('Done 2');
