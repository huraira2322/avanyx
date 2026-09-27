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
        results.push({path: file, isDir: true});
      }
    } else {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('dist') && !file.includes('build')) {
        results.push({path: file, isDir: false});
      }
    }
  });
  return results;
};

const items = walkDir(path.resolve('.'));
// Sort by length descending to rename deepest first
items.sort((a, b) => b.path.length - a.path.length);

let count = 0;
for (const item of items) {
  const basename = path.basename(item.path);
  const hasMatch = /Avanyx|avanyx|Avanyx|avanyx|AVANYX|Avanyx|AVANYX/g.test(basename);
  if (hasMatch) {
    const newName = basename.replace(/Avanyx/g, 'Avanyx')
                            .replace(/avanyx/g, 'avanyx')
                            .replace(/Avanyx/g, 'Avanyx')
                            .replace(/avanyx/g, 'avanyx')
                            .replace(/AVANYX/g, 'AVANYX')
                            .replace(/AVANYX/g, 'AVANYX')
                            .replace(/Avanyx/g, 'Avanyx');
    const newPath = path.join(path.dirname(item.path), newName);
    console.log(`Renaming: ${item.path} -> ${newName}`);
    fs.renameSync(item.path, newPath);
    count++;
  }
}

console.log(`Total files/directories renamed: ${count}`);
