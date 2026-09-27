const fs = require('fs');
const path = require('path');
const componentsDir = path.join(__dirname, 'src', 'components');
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(componentsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Fix the syntax error: `, tStr} = useAvanyx();` where there was a newline before `}`
  content = content.replace(/,\s*tStr\}\s*=\s*useAvanyx\(\);/g, ', tStr } = useAvanyx();');
  // Or more broadly: `executeAiAction,\n  , tStr} = useAvanyx();`
  content = content.replace(/,\s*,\s*tStr/g, ', tStr');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed syntax in ${file}`);
  }
}
