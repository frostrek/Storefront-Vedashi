const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '../app/sitemap.ts');
let content = fs.readFileSync(file, 'utf8');

// Imports
if (!content.includes('buildPath')) {
    content = content.replace(
        "import { SUPPORTED_COUNTRIES } from '@/lib/currency';",
        "import { SUPPORTED_COUNTRIES, buildPath } from '@/lib/currency';"
    );
}

// x-default hreflang
content = content.replace(/languages\['x-default'\] = `\$\{SITE_URL\}\/in\$\{p\}`;/g, "languages['x-default'] = `${SITE_URL}${buildPath('us', p)}`;");
content = content.replace(/languages\['x-default'\] = `\$\{SITE_URL\}\/in\/products\?category=\$\{c\.slug\}`;/g, "languages['x-default'] = `${SITE_URL}${buildPath('us', `/products?category=${c.slug}`)}`;");
content = content.replace(/languages\['x-default'\] = `\$\{SITE_URL\}\/in\/products\/\$\{p\.slug\}`;/g, "languages['x-default'] = `${SITE_URL}${buildPath('us', `/products/${p.slug}`)}`;");

// static language fallback hreflang
content = content.replace(/languages\['en'\] = `\$\{SITE_URL\}\/in\$\{p\}`;/g, "languages['en'] = `${SITE_URL}${buildPath('us', p)}`;");
content = content.replace(/languages\['en'\] = `\$\{SITE_URL\}\/in\/products\?category=\$\{c\.slug\}`;/g, "languages['en'] = `${SITE_URL}${buildPath('us', `/products?category=${c.slug}`)}`;");
content = content.replace(/languages\['en'\] = `\$\{SITE_URL\}\/in\/products\/\$\{p\.slug\}`;/g, "languages['en'] = `${SITE_URL}${buildPath('us', `/products/${p.slug}`)}`;");

// ru/kr language fallback hreflang
content = content.replace(/languages\['ru'\] = `\$\{SITE_URL\}\/ru\$\{p\}`;/g, "languages['ru'] = `${SITE_URL}${buildPath('ru', p)}`;");
content = content.replace(/languages\['ru'\] = `\$\{SITE_URL\}\/ru\/products\?category=\$\{c\.slug\}`;/g, "languages['ru'] = `${SITE_URL}${buildPath('ru', `/products?category=${c.slug}`)}`;");
content = content.replace(/languages\['ru'\] = `\$\{SITE_URL\}\/ru\/products\/\$\{p\.slug\}`;/g, "languages['ru'] = `${SITE_URL}${buildPath('ru', `/products/${p.slug}`)}`;");

content = content.replace(/languages\['ko'\] = `\$\{SITE_URL\}\/kr\$\{p\}`;/g, "languages['ko'] = `${SITE_URL}${buildPath('kr', p)}`;");
content = content.replace(/languages\['ko'\] = `\$\{SITE_URL\}\/kr\/products\?category=\$\{c\.slug\}`;/g, "languages['ko'] = `${SITE_URL}${buildPath('kr', `/products?category=${c.slug}`)}`;");
content = content.replace(/languages\['ko'\] = `\$\{SITE_URL\}\/kr\/products\/\$\{p\.slug\}`;/g, "languages['ko'] = `${SITE_URL}${buildPath('kr', `/products/${p.slug}`)}`;");

// Removing ae
content = content.replace(/languages\['ar'\].*\n/g, "");

// URL builders
content = content.replace(/url: `\$\{SITE_URL\}\/\$\{country\}\$\{p\}`/g, "url: `${SITE_URL}${buildPath(country, p)}`");
content = content.replace(/url: `\$\{SITE_URL\}\/\$\{country\}\/products\?category=\$\{c\.slug\}`/g, "url: `${SITE_URL}${buildPath(country, `/products?category=${c.slug}`)}`");
content = content.replace(/url: `\$\{SITE_URL\}\/\$\{country\}\/products\/\$\{p\.slug\}`/g, "url: `${SITE_URL}${buildPath(country, `/products/${p.slug}`)}`");

// loop URLs
content = content.replace(/languages\[locale\] = `\$\{SITE_URL\}\/\$\{c\}\$\{p\}`/g, "languages[locale] = `${SITE_URL}${buildPath(c, p)}`");
content = content.replace(/languages\[locale\] = `\$\{SITE_URL\}\/\$\{cc\}\/products\?category=\$\{c\.slug\}`/g, "languages[locale] = `${SITE_URL}${buildPath(cc, `/products?category=${c.slug}`)}`");
content = content.replace(/languages\[locale\] = `\$\{SITE_URL\}\/\$\{cc\}\/products\/\$\{p\.slug\}`/g, "languages[locale] = `${SITE_URL}${buildPath(cc, `/products/${p.slug}`)}`");

fs.writeFileSync(file, content, 'utf8');
console.log('sitemap.ts updated');
