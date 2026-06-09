import { readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';

function searchFiles(dir: string) {
  const files = readdirSync(dir);
  for (const file of files) {
    const fullPath = join(dir, file);
    if (statSync(fullPath).isDirectory()) {
      searchFiles(fullPath);
    } else if (file.endsWith('.d.ts') || file.endsWith('.d.cts') || file.endsWith('.d.mts')) {
      const content = readFileSync(fullPath, 'utf8');
      if (content.includes('accountLinking') || content.includes('trustedProviders')) {
        console.log(`Found in: ${fullPath}`);
        // print matching lines
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('accountLinking') || lines[i].includes('trustedProviders')) {
            console.log(`  Line ${i+1}: ${lines[i].trim()}`);
          }
        }
      }
    }
  }
}

try {
  searchFiles('node_modules/better-auth');
} catch (err) {
  console.error(err);
}
