import fs from 'fs';

const sitemapPath = 'src/sitemap.xml';
let xml = fs.readFileSync(sitemapPath, 'utf8');

if (xml.includes('/map/content/')) {
  process.exit(0);
}

const langs = ['ua', 'en', 'ru', 'pl', 'fr', 'de', 'esp', 'it', 'cz', 'chn', 'jpn', 'kor', 'ar'];
const hreflang = {
  ua: 'uk',
  en: 'en',
  ru: 'ru',
  pl: 'pl',
  fr: 'fr',
  de: 'de',
  esp: 'es',
  it: 'it',
  cz: 'cs',
  chn: 'zh',
  jpn: 'ja',
  kor: 'ko',
  ar: 'ar',
};
const games = ['shoc', 'cs', 'cop'];
const origin = 'https://stalker-map.online';

let block = '';
for (const game of games) {
  for (const lang of langs) {
    const path = `/${lang}/map/content/${game}`;
    block += '  <url>\n';
    block += `    <loc>${origin}${path}</loc>\n`;
    block += '    <changefreq>monthly</changefreq>\n';
    block += '    <priority>0.6</priority>\n';
    for (const alt of langs) {
      block += `    <xhtml:link rel="alternate" hreflang="${hreflang[alt]}" href="${origin}/${alt}/map/content/${game}"/>\n`;
    }
    block += `    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}/en/map/content/${game}"/>\n`;
    block += '  </url>\n';
  }
}

xml = xml.replace('</urlset>', `${block}</urlset>`);
fs.writeFileSync(sitemapPath, xml);
