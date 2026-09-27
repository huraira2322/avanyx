const fs = require('fs');
const file = './src/context/AvanyxContext.tsx';
let c = fs.readFileSync(file, 'utf8');

const replacement = `
// Check business
const hasBiz = businesses.some(b => b.ownerUid === user.uid);
if (hasBiz) {
  setHasCompletedOnboarding(true);
  setIsOnboardingOpen(false);
  localStorage.setItem('avanyx_onboarding_completed', 'true');
} else {
  setHasCompletedOnboarding(false);
  setIsOnboardingOpen(true);
  localStorage.removeItem('avanyx_onboarding_completed');
}
`;

c = c.replace(/setHasCompletedOnboarding\(true\);\s*setIsOnboardingOpen\(false\);\s*localStorage\.setItem\('avanyx_onboarding_completed', 'true'\);/g, replacement);

fs.writeFileSync(file, c, 'utf8');
console.log('Done');
