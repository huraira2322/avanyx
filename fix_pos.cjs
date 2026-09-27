const fs = require('fs');
let content = fs.readFileSync('src/components/PosBuilderModal.tsx', 'utf8');

// Replace tStr with literal strings in the constant array
content = content.replace(/tStr\('business_brain'\)/g, "'Avanyx Business Brain'");
content = content.replace(/tStr\('online_store'\)/g, "'Online Store Beta'");
content = content.replace(/tStr\('studio'\)/g, "'Avanyx Creative Studio'");

fs.writeFileSync('src/components/PosBuilderModal.tsx', content);
