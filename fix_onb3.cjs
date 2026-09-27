const fs = require('fs');
const file = './src/context/AvanyxContext.tsx';
let c = fs.readFileSync(file, 'utf8');

const oldCode = `// Check business in Firestore
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

const newCode = `// Check business in Firestore, and ensure it has a valid schema
let hasBiz = businesses.some(b => b.ownerUid === user.uid && b.catalogSchema && b.catalogSchema.capabilities);
if (!hasBiz) {
  try {
    const q = query(collection(db, 'businesses'), where('ownerUid', '==', user.uid));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const bizData = snap.docs[0].data();
      hasBiz = !!(bizData.catalogSchema && bizData.catalogSchema.capabilities);
    }
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

c = c.split(oldCode).join(newCode);

fs.writeFileSync(file, c, 'utf8');
console.log('Done 3');
