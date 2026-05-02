const fs = require('fs');
const path = require('path');

const DIRECTORY = path.join(__dirname, 'src');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already uses useTheme or if it's the ThemeProvider / colors.ts
  if (filePath.includes('ThemeProvider.tsx') || filePath.includes('colors.ts') || filePath.includes('theme\\index.ts') || filePath.includes('theme/index.ts')) {
    return;
  }
  
  if (!content.includes('from "../theme"') && !content.includes('from "../../theme"')) {
    return; // colors not imported from theme
  }

  let modified = false;

  // 1. Replace imports: remove colors from theme import, add useTheme import
  if (content.match(/import\s+\{[^}]*colors[^}]*\}\s+from\s+["'](\.\.\/theme|\.\.\/\.\.\/theme)["']/)) {
    content = content.replace(/import\s+\{([^}]*)\}\s+from\s+["'](\.\.\/theme|\.\.\/\.\.\/theme)["'];/g, (match, p1, p2) => {
      let vars = p1.split(',').map(v => v.trim()).filter(v => v && v !== 'colors');
      let newImport = vars.length > 0 ? `import { ${vars.join(', ')} } from "${p2}";\n` : '';
      let themeProviderImportPath = p2 === '../theme' ? '../providers/ThemeProvider' : '../../providers/ThemeProvider';
      newImport += `import { useTheme } from "${themeProviderImportPath}";`;
      return newImport;
    });
    modified = true;
  }

  // 2. Add useTheme inside component
  // Find main component export function
  if (modified) {
    const functionRegex = /export\s+(default\s+)?function\s+([A-Za-z0-9_]+)\s*\([^)]*\)\s*\{/g;
    content = content.replace(functionRegex, (match) => {
      return match + '\n  const { colors, isDark } = useTheme();';
    });
    
    const arrowFuncRegex = /const\s+([A-Za-z0-9_]+)\s*=\s*(?:React\.FC<[^>]*>\s*=\s*)?(?:\([^)]*\)|[^=]*)\s*=>\s*\{/g;
    content = content.replace(arrowFuncRegex, (match) => {
        return match + '\n  const { colors, isDark } = useTheme();';
    });

    // 3. Change StyleSheet.create to getStyles function
    if (content.includes('StyleSheet.create({')) {
        content = content.replace(/const\s+styles\s*=\s*StyleSheet\.create\(\{/g, 'const getStyles = (colors: any) => StyleSheet.create({');
        
        // Also inject `const styles = getStyles(colors);` into components
        content = content.replace(/(const { colors, isDark } = useTheme\(\);)/g, '$1\n  const styles = getStyles(colors);');
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walkDir(DIRECTORY);
