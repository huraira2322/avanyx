const fs = require('fs');
const file = './src/context/AvanyxContext.tsx';
let c = fs.readFileSync(file, 'utf8');

const regex = /\/\/ 1\. Enforce One Account = One POS logically on the frontend[\s\S]*?return;\n      \}/;

const newCode = `// 1. If they already have a business, we just UPDATE it with the new schema and modules
      const existingBiz = authUser ? businesses.find(b => b.ownerUid === authUser.uid) : null;
      if (existingBiz) {
        const updatedBiz = {
            ...existingBiz,
            name: config.businessName,
            legalName: \`\${config.businessName} Ltd.\`,
            industry: config.industry,
            businessModel: config.businessModel || 'product',
            industryCategory: config.industryCategory || 'retail',
            primaryColor: config.primaryColor || '#5B5CE2',
            country: config.country || 'United States',
            currency: config.currency,
            language: config.language,
            taxRateDefault: config.taxRate / 100,
            taxInclusive: config.taxInclusive,
            enabledModules: config.enabledModules,
            catalogSchema: config.catalogSchema,
        };
        
        try {
            setDoc(doc(db, 'businesses', existingBiz.id), cleanObjectForFirestore(updatedBiz), { merge: true });
        } catch(e) {}
        
        setBusinesses(prev => prev.map(b => b.id === existingBiz.id ? updatedBiz : b));
        setHasCompletedOnboarding(true);
        setIsOnboardingOpen(false);
        localStorage.setItem('avanyx_onboarding_completed', 'true');
        return;
      }`;

c = c.replace(regex, newCode);
fs.writeFileSync(file, c, 'utf8');
console.log('Done 4');
