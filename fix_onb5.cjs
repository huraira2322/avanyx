const fs = require('fs');
const file = './src/context/AvanyxContext.tsx';
let c = fs.readFileSync(file, 'utf8');

const regex = /const \[isOnboardingOpen, setIsOnboardingOpen\] = useState<boolean>\(false\);/;
const newCode = `const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthenticated && authSessionType === 'owner' && !hasCompletedOnboarding) {
        setIsOnboardingOpen(true);
    }
  }, [isAuthenticated, authSessionType, hasCompletedOnboarding]);`;

c = c.replace(regex, newCode);
fs.writeFileSync(file, c, 'utf8');
console.log('Done 6');
