const fs = require('fs');
const file = './src/context/AvanyxContext.tsx';
let c = fs.readFileSync(file, 'utf8');

const regex = /const \[hasCompletedOnboarding, setHasCompletedOnboarding\] = useState<boolean>\(true\);/;
const newCode = `const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() => {
    try {
      if (localStorage.getItem('avanyx_onboarding_completed') === 'true') return true;
      
      const sessionUser = localStorage.getItem('avanyx_session_user');
      const businesses = localStorage.getItem('avanyx_businesses');
      if (sessionUser && businesses) {
          const userObj = JSON.parse(sessionUser);
          const bizArr = JSON.parse(businesses);
          if (Array.isArray(bizArr) && bizArr.some(b => b.ownerUid === (userObj.id || userObj.uid) && b.catalogSchema && b.catalogSchema.capabilities)) {
              return true;
          }
      }
      return false;
    } catch (e) {}
    return true; // fail safe for demo mode etc
});`;

c = c.replace(regex, newCode);
fs.writeFileSync(file, c, 'utf8');
console.log('Done 5');
