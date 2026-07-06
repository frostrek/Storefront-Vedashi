/**
 * Script to add buildPath import and replace link patterns in component files.
 */

const fs = require('fs');
const path = require('path');

const STOREFRONT = path.resolve(__dirname, '..');

// Files and their country variable name for link replacements
const files = [
  { path: 'components/Navbar.tsx', countryVar: 'currentCountry', importFrom: '@/lib/currency', needsImport: true },
  { path: 'components/SecondaryNavbar.tsx', countryVar: 'country', importFrom: '@/lib/currency', needsImport: true },
  { path: 'components/Footer.tsx', countryVar: 'currentCountry', importFrom: '@/lib/currency', needsImport: true },
  { path: 'components/SearchAutocomplete.tsx', countryVar: 'country', importFrom: '@/lib/currency', needsImport: true },
  { path: 'components/HeroCarousel.tsx', countryVar: 'country', importFrom: '@/lib/currency', needsImport: true },
  { path: 'components/BrandReel.tsx', countryVar: 'country', importFrom: '@/lib/currency', needsImport: true },
  { path: 'components/BestSellerShowcase.tsx', countryVar: 'country', importFrom: '@/lib/currency', needsImport: true },
  { path: 'components/ProductCard.tsx', countryVar: 'country', importFrom: '@/lib/currency', needsImport: true },
  { path: 'app/[country]/HomeClient.tsx', countryVar: 'country', importFrom: '@/lib/currency', needsImport: true },
  { path: 'app/[country]/products/[id]/ProductClient.tsx', countryVar: 'country', importFrom: '@/lib/currency', needsImport: true },
  { path: 'lib/api.ts', countryVar: 'country', importFrom: '@/lib/currency', needsImport: false },
];

let totalChanges = 0;

files.forEach(({ path: relPath, countryVar, importFrom, needsImport }) => {
  const absPath = path.join(STOREFRONT, relPath);
  if (!fs.existsSync(absPath)) {
    console.log(`SKIP: ${relPath}`);
    return;
  }

  let content = fs.readFileSync(absPath, 'utf8');
  const original = content;

  // Add buildPath + getCountryFromPathname import if not already present
  if (needsImport && !content.includes('buildPath')) {
    // Check if file already imports from @/lib/currency
    const currencyImportRegex = /import\s*\{([^}]+)\}\s*from\s*['"]@\/lib\/currency['"]/;
    const match = content.match(currencyImportRegex);
    if (match) {
      // Add buildPath and getCountryFromPathname to existing import
      let imports = match[1].trim();
      if (!imports.includes('buildPath')) imports += ', buildPath';
      if (!imports.includes('getCountryFromPathname')) imports += ', getCountryFromPathname';
      content = content.replace(currencyImportRegex, `import { ${imports} } from '${importFrom}'`);
    } else {
      // Add new import line after the last import
      const lastImportIdx = content.lastIndexOf('\nimport ');
      if (lastImportIdx !== -1) {
        const endOfLine = content.indexOf('\n', lastImportIdx + 1);
        content = content.slice(0, endOfLine + 1) + `import { buildPath, getCountryFromPathname } from '${importFrom}';\n` + content.slice(endOfLine + 1);
      }
    }
  }
  
  // Replace /${countryVar}/ link patterns with buildPath
  // Pattern: `/${countryVar}/something`  →  buildPath(countryVar, '/something')
  // Pattern: `/${countryVar}`  →  buildPath(countryVar, '/')
  
  // Handle template literals like: `/${currentCountry}/products`
  const templateRegex = new RegExp('`/\\$\\{' + countryVar + '\\}(/[^`]*)`', 'g');
  content = content.replace(templateRegex, (match, rest) => {
    // rest is the path after the country, e.g., /products?category=${slug}
    // We need to preserve the rest as a template literal
    return `buildPath(${countryVar}, \`${rest}\`)`;
  });
  
  // Handle: `/${currentCountry}` (just root with country)
  const rootRegex = new RegExp('`/\\$\\{' + countryVar + '\\}`', 'g');
  content = content.replace(rootRegex, `buildPath(${countryVar}, '/')`);
  
  // Handle patterns like: `/${currentCountry}${item.href}`
  const dynamicRegex = new RegExp('`/\\$\\{' + countryVar + '\\}\\$\\{([^}]+)\\}`', 'g');
  content = content.replace(dynamicRegex, (match, expr) => {
    return `buildPath(${countryVar}, ${expr})`;
  });

  if (content !== original) {
    fs.writeFileSync(absPath, content, 'utf8');
    totalChanges++;
    console.log(`UPDATED: ${relPath}`);
  } else {
    console.log(`NO CHANGE: ${relPath}`);
  }
});

console.log(`\nDone. Updated ${totalChanges} files.`);
