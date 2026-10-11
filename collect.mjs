// Сбор товаров мерчанта Revalo 1 (id 17768037) с Kaspi.
// Использование: node collect.mjs --from 0 --to 37 --out data/chunks/chunk_000-037.json
// curl выбран вместо fetch: у Kaspi антибот по TLS-фингерпринту, Node fetch получает 403.
import { execFile } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const from = parseInt(get('--from', '0'), 10);
const to = parseInt(get('--to', '0'), 10);
const out = get('--out', `data/chunks/chunk_${String(from).padStart(3, '0')}-${String(to).padStart(3, '0')}.json`);

const HEADERS = [
  '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  '-H', 'Accept: application/json',
  '-H', 'Accept-Language: ru-RU,ru;q=0.9',
  '-H', 'Referer: https://kaspi.kz/shop/merchant/17768037/',
];

const curl = (page) => new Promise((resolve, reject) => {
  const url = `https://kaspi.kz/yml/product-view/pl/results?page=${page}&sort=relevance&c=750000000&ui=d&q=%3AlistingType%3AmerchantListing%3AallMerchants%3A17768037`;
  execFile('curl', ['-s', '--compressed', '-w', '\n%{http_code}', ...HEADERS, url],
    { maxBuffer: 64 * 1024 * 1024, timeout: 60000, windowsHide: true },
    (err, stdout) => {
      if (err) return reject(err);
      const nl = stdout.lastIndexOf('\n');
      const body = stdout.slice(0, nl);
      const code = (stdout.slice(nl + 1) || '').trim();
      if (code !== '200') return reject(new Error('HTTP ' + code));
      try { resolve(JSON.parse(body).data || []); } catch { reject(new Error('JSON parse failed')); }
    });
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const norm = (it, page) => ({
  id: it.id,
  title: it.title,
  brand: it.brand ?? null,
  categoryId: it.categoryId ?? null,
  category: it.categoryRu || it.category || null,
  price: it.unitSalePrice ?? it.unitPrice ?? null,
  priceFormatted: it.priceFormatted ?? null,
  oldPrice: (it.unitPrice != null && it.unitSalePrice != null && it.unitPrice !== it.unitSalePrice) ? it.unitPrice : null,
  currency: it.currency ?? 'KZT',
  rating: it.rating ?? null,
  reviewsQuantity: it.reviewsQuantity ?? null,
  stock: it.stock ?? null,
  loanAvailable: it.loanAvailable ?? null,
  creditMonthlyPrice: it.creditMonthlyPrice ?? null,
  hasVariants: it.hasVariants ?? null,
  isBrandOfficialPartner: it.isBrandOfficialPartner ?? null,
  createdTime: it.createdTime ?? null,
  url: it.shopLink ? 'https://kaspi.kz' + (it.shopLink.startsWith('/shop') ? it.shopLink : '/shop' + (it.shopLink.startsWith('/') ? it.shopLink : '/' + it.shopLink)) : null,
  image: it.previewImages && it.previewImages[0] ? it.previewImages[0].medium : null,
  stickers: Array.isArray(it.stickers) && it.stickers.length
    ? it.stickers.map((s) => (s && (s.text || s.name)) || String(s)).join('; ')
    : null,
  sourcePage: page,
});

const items = [];
let fails = [];
for (let p = from; p <= to; p++) {
  let ok = false;
  for (let attempt = 1; attempt <= 4 && !ok; attempt++) {
    try {
      const data = await curl(p);
      for (const it of data) items.push(norm(it, p));
      console.log(`page ${p}: ${data.length} items (total ${items.length})`);
      ok = true;
    } catch (e) {
      console.log(`page ${p} attempt ${attempt} failed: ${e.message}`);
      await sleep(1500 * attempt);
    }
  }
  if (!ok) fails.push(p);
  await sleep(700 + Math.random() * 500);
}

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(items, null, 1));
console.log(`DONE pages ${from}-${to}: ${items.length} items, failed pages: [${fails.join(',')}] -> ${out}`);
process.exit(fails.length ? 2 : 0);
