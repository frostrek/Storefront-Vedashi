const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '../lib/seo.ts');
let content = fs.readFileSync(file, 'utf8');

// Imports
if (!content.includes('buildPath')) {
    content = content.replace(
        "import { SUPPORTED_COUNTRIES } from './currency';",
        "import { SUPPORTED_COUNTRIES, buildPath } from './currency';"
    );
}

// Fallback currentCountry
content = content.replace(/currentCountry: string = 'in'/g, "currentCountry: string = 'us'");

// x-default hreflang
content = content.replace(
    "'x-default': `${SITE_URL}/in/${pathStrategy}`",
    "'x-default': `${SITE_URL}${buildPath('us', pathStrategy)}`"
);

// loop hreflang
content = content.replace(
    "languages[c.locale] = `${SITE_URL}/${c.code}/${pathStrategy}`;",
    "languages[c.locale] = `${SITE_URL}${buildPath(c.code, pathStrategy)}`;"
);

// Canonical URLs
content = content.replace(
    /canonical = seo\?\.canonical_url \|\| `\$\{SITE_URL\}\/\$\{currentCountry\}\/\$\{pathStrategy\}`;/g,
    "canonical = seo?.canonical_url || `${SITE_URL}${buildPath(currentCountry, pathStrategy)}`;"
);
content = content.replace(
    "canonical: `${SITE_URL}/${currentCountry}/${pathStrategy}`",
    "canonical: `${SITE_URL}${buildPath(currentCountry, pathStrategy)}`"
);

// OG image
content = content.replace(
    /ogImage = seo\?\.og_image \|\| `\$\{SITE_URL\}\/\$\{currentCountry\}\/products\/\$\{product\.slug \|\| product\.product_id\}\/opengraph-image`;/g,
    "ogImage = seo?.og_image || `${SITE_URL}${buildPath(currentCountry, `products/${product.slug || product.product_id}`)}/opengraph-image`;"
);

// PLP OG URL
content = content.replace(
    /url: `\$\{SITE_URL\}\/\$\{currentCountry\}\/\$\{pathStrategy\}`/g,
    "url: `${SITE_URL}${buildPath(currentCountry, pathStrategy)}`"
);

// JSON LD
content = content.replace(/country: string = 'in'/g, "country: string = 'us'");
content = content.replace(
    /url: `\$\{SITE_URL\}\/\$\{country\}\/products\/\$\{product\.slug \|\| product\.product_id\}`/g,
    "url: `${SITE_URL}${buildPath(country, `products/${product.slug || product.product_id}`)}`"
);

fs.writeFileSync(file, content, 'utf8');
console.log('seo.ts updated');
