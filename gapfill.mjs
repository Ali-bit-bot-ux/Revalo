// Дозабор сдвинувшихся товаров: перечитывает указанные страницы, добавляет только новые id.
// Использование: node gapfill.mjs 0,1,2,3,4,5,6,7
import { execFile } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';

const pages = process.argv[2].split(',').map(Number);
const dir = 'data/chunks';
const HEADERS = [
  '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  '-H', 'Accept: application/json',
  '-H', 'Accept-Language: ru-RU,ru;q=0.9',
  '-H', 'Referer: https://kaspi.kz/shop/merchant/17768037/',
];

const known = new Set();
for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  for (const it of JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'))) known.add(it.id);
}
console.log('known ids before:', known.size);

const curl = (page) => new Promise((resolve, reject) => {
  const url = `https://kaspi.kz/yml/product-view/pl/results?page=${page}&sort=relevance&c=750000000&ui=d&q=%3AlistingType%3AmerchantListing%3AallMerchants%3A17768037`;
  execFile('curl', ['-s', '--compressed', '-w', '\n%{http_code}', ...HEADERS, url],
    { maxBuffer: 64 * 1024 * 1024, timeout: 60000, windowsHide: true },
    (err, stdout) => {
      if (err) return reject(err);
      const nl = stdout.lastIndexOf('\n');
      const code = (stdout.slice(nl + 1) || '').trim();
      if (code !== '200') return reject(new Error('HTTP ' + code));
      try { resolve(JSON.parse(stdout.slice(0, nl)).data || []); } catch { reject(new Error('parse')); }
    });
});

const norm = (it, page) => ({
  id: it.id, title: it.title, brand: it.brand ?? null, categoryId: it.categoryId ?? null,
  category: it.categoryRu || it.category || null,
  price: it.unitSalePrice ?? it.unitPrice ?? null, priceFormatted: it.priceFormatted ?? null,
  oldPrice: (it.unitPrice != null && it.unitSalePrice != null && it.unitPrice !== it.unitSalePrice) ? it.unitPrice : null,
  currency: it.currency ?? 'KZT', rating: it.rating ?? null, reviewsQuantity: it.reviewsQuantity ?? null,
  stock: it.stock ?? null, loanAvailable: it.loanAvailable ?? null, creditMonthlyPrice: it.creditMonthlyPrice ?? null,
  hasVariants: it.hasVariants ?? null, isBrandOfficialPartner: it.isBrandOfficialPartner ?? null,
  createdTime: it.createdTime ?? null,
  url: it.shopLink ? 'https://kaspi.kz' + (it.shopLink.startsWith('/shop') ? it.shopLink : '/shop' + (it.shopLink.startsWith('/') ? it.shopLink : '/' + it.shopLink)) : null,
  image: it.previewImages && it.previewImages[0] ? it.previewImages[0].medium : null,
  stickers: Array.isArray(it.stickers) && it.stickers.length ? it.stickers.map((s) => (s && (s.text || s.name)) || String(s)).join('; ') : null,
  sourcePage: page,
});

const outFile = `${dir}/gapfill.json`;
const added = existsSync(outFile) ? JSON.parse(readFileSync(outFile, 'utf8')) : [];
for (const a of added) known.add(a.id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let newCount = 0;
for (const p of pages) {
  try {
    const data = await curl(p);
    let fresh = 0;
    for (const it of data) {
      if (!known.has(it.id)) { known.add(it.id); added.push(norm(it, p)); fresh++; }
    }
    console.log(`page ${p}: ${data.length} items, new: ${fresh}`);
  } catch (e) { console.log(`page ${p} FAILED: ${e.message}`); }
  await sleep(700 + Math.random() * 500);
}
writeFileSync(outFile, JSON.stringify(added, null, 1));
console.log(`gapfill total added: ${added.length}`);
