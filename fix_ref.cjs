const fs = require('fs');
let content = fs.readFileSync('src/components/ReferralPartnerDashboard.tsx', 'utf8');

content = content.replace(/\s*t\s*}\s*=\s*useAvanyx\(\);/g, '\n  } = useAvanyx();');

if (!content.includes('useTranslation')) {
  content = content.replace("import { useAvanyx }", "import { useTranslation } from '../context/TranslationContext';\nimport { useAvanyx }");
  content = content.replace("} = useAvanyx();", "} = useAvanyx();\n  const { t } = useTranslation();");
}

fs.writeFileSync('src/components/ReferralPartnerDashboard.tsx', content);
