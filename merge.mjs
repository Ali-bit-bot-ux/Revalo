// Склейка чанков из data/chunks/ в products.json и products.csv
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const dir = 'data/chunks';
const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
if (!files.length) { console.log('no chunks found'); process.exit(1); }

const catOf = (it) => {
  const c = it.category;
  if (Array.isArray(c) && c.length) return c.join(',');
  if (typeof c === 'string' && c) return c;
  return 'unknown';
};

const seen = new Map();
for (const f of files) {
  const items = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
  for (const it of items) if (!seen.has(it.id)) seen.set(it.id, { ...it, category: catOf(it) });
}
const all = [...seen.values()];
console.log(`chunks: ${files.length}, unique products: ${all.length}`);

writeFileSync('data/products.json', JSON.stringify(all, null, 1));

const cols = ['id', 'title', 'brand', 'categoryId', 'category', 'price', 'oldPrice', 'currency',
  'rating', 'reviewsQuantity', 'stock', 'loanAvailable', 'creditMonthlyPrice', 'hasVariants',
  'isBrandOfficialPartner', 'createdTime', 'url', 'image', 'sourcePage'];
const esc = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const csv = [cols.join(',')].concat(all.map((it) => cols.map((c) => esc(it[c])).join(','))).join('\r\n');
writeFileSync('data/products.csv', '﻿' + csv);
console.log(`written: data/products.json, data/products.csv (${all.length} rows)`);

const byCat = new Map();
let sum = 0, rated = 0, sumRating = 0, withReviews = 0, sumReviews = 0;
for (const it of all) {
  const top = (it.category || 'unknown').split(',')[0];
  byCat.set(top, (byCat.get(top) || 0) + 1);
  if (it.price) sum += it.price;
  if (it.rating) { rated++; sumRating += it.rating; }
  if (it.reviewsQuantity) { withReviews++; sumReviews += it.reviewsQuantity; }
}
console.log('\nTop-level categories:');
[...byCat.entries()].sort((a, b) => b[1] - a[1])
  .forEach(([c, n]) => console.log(`  ${n}\t${c}`));
console.log(`\nprice avg: ${Math.round(sum / all.length)} KZT, rated: ${rated}, rating avg: ${(sumRating / rated).toFixed(2)}, with reviews: ${withReviews}, avg reviews: ${(sumReviews / withReviews).toFixed(1)}`);
