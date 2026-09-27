const fs = require('fs');
const path = require('path');

const walkDir = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('dist') && !file.includes('build')) {
        results = results.concat(walkDir(file));
      }
    } else {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('dist') && !file.includes('build') && !file.endsWith('.png') && !file.endsWith('.jpg') && !file.endsWith('.ico') && !file.endsWith('.lock') && !file.includes('package-lock.json') && !file.includes('.env')) {
        results.push(file);
      }
    }
  });
  return results;
};

const files = walkDir(path.resolve('.'));
let count = 0;

for (const file of files) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const hasMatch = /Avanyx|avanyx|Avanyx|avanyx|AVANYX|Avanyx|AVANYX/g.test(content);
    if (hasMatch) {
      console.log(`Updating: ${file}`);
      let newContent = content.replace(/Avanyx/g, 'Avanyx')
                              .replace(/avanyx/g, 'avanyx')
                              .replace(/Avanyx/g, 'Avanyx')
                              .replace(/avanyx/g, 'avanyx')
                              .replace(/AVANYX/g, 'AVANYX')
                              .replace(/AVANYX/g, 'AVANYX')
                              .replace(/Avanyx/g, 'Avanyx');
      fs.writeFileSync(file, newContent, 'utf8');
      count++;
    }
  } catch (err) {
    console.error(`Error reading ${file}`);
  }
}

console.log(`Total files updated: ${count}`);
