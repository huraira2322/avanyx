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
  // Do NOT match dynamically modified regex string
  const brandStrings = ['Avenyx', 'avenyx', 'Velcora', 'velcora', 'VOLCORA', 'Volcora', 'VELCORA'];
  let hasMatch = false;
  for (const s of brandStrings) {
    if (basename.includes(s)) hasMatch = true;
  }
  
  if (hasMatch) {
    let newName = basename.split('Avenyx').join('Avanyx')
                            .split('avenyx').join('avanyx')
                            .split('Velcora').join('Avanyx')
                            .split('velcora').join('avanyx')
                            .split('VELCORA').join('AVANYX')
                            .split('VOLCORA').join('AVANYX')
                            .split('Volcora').join('Avanyx');
    const newPath = path.join(path.dirname(item.path), newName);
    console.log(`Renaming: ${item.path} -> ${newName}`);
    fs.renameSync(item.path, newPath);
    count++;
  }
}

console.log(`Total files/directories renamed: ${count}`);
