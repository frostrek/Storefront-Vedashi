/**
 * Script to update all component files to use buildPath() for URL construction.
 * 
 * This script:
 * 1. Adds `import { buildPath } from '@/lib/currency'` where needed
 * 2. Replaces `/${country}/` and `/${currentCountry}/` patterns with buildPath()
 * 3. Updates fallback defaults from 'in' to 'us'
 */

const fs = require('fs');
const path = require('path');

const STOREFRONT = path.resolve(__dirname, '..');

// Files that need the buildPath import and link update
const filesToUpdate = [
  // Components
  'components/Navbar.tsx',
  'components/SecondaryNavbar.tsx',
  'components/Footer.tsx',
  'components/RegionSwitcher.tsx',
  'components/SearchAutocomplete.tsx',
  'components/HeroCarousel.tsx',
  'components/BrandReel.tsx',
  'components/BestSellerShowcase.tsx',
  'components/ProductCard.tsx',
  // App pages (client components)
  'app/[country]/HomeClient.tsx',
  'app/[country]/products/ProductsClient.tsx',
  'app/[country]/products/[id]/ProductClient.tsx',
  // Context
  'context/CartContext.tsx',
  'context/CurrencyContext.tsx',
  // Lib
  'lib/api.ts',
];

let totalChanges = 0;

filesToUpdate.forEach(relPath => {
  const absPath = path.join(STOREFRONT, relPath);
  if (!fs.existsSync(absPath)) {
    console.log(`SKIP (not found): ${relPath}`);
    return;
  }

  let content = fs.readFileSync(absPath, 'utf8');
  const original = content;

  // 1. Replace fallback defaults: || 'in' → || 'us'
  content = content.replace(/\|\|\s*['"]in['"]/g, "|| 'us'");

  // 2. Replace country extraction from pathname
  content = content.replace(
    /const currentCountry = pathname\?\.split\('\/'\)\[1\] \|\| 'in';/g,
    "const currentCountry = getCountryFromPathname(pathname || '/');"
  );
  content = content.replace(
    /const currentCountry = pathname\?\.split\('\/'\)\[1\] \|\| 'us';/g,
    "const currentCountry = getCountryFromPathname(pathname || '/');"
  );

  if (content !== original) {
    fs.writeFileSync(absPath, content, 'utf8');
    totalChanges++;
    console.log(`UPDATED: ${relPath}`);
  } else {
    console.log(`NO CHANGE: ${relPath}`);
  }
});

console.log(`\nDone. Updated ${totalChanges} files.`);
