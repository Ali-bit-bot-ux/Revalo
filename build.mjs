// Генерация витрины index.html из датасета товаров (правила — в AGENTS.md).
import { readFileSync, writeFileSync } from 'node:fs';

const products = JSON.parse(readFileSync('data/products.json', 'utf8'));
const filters = JSON.parse(readFileSync('data/filters.json', 'utf8'));

const SHOP_URL = 'https://l.kaspi.kz/shop/EtfCocAVNHybrVR';
const OFFLINE = {
  address: 'Алматы, Тастак 1, 6А',
  gisUrl: 'https://2gis.kz/almaty/geo/70000001115555356',
};
const IMG = {
  heroMain: 'https://resources.cdn-kaspi.kz/img/m/p/pf5/p4a/167119560.png?format=preview-large',
  heroA: 'https://resources.cdn-kaspi.kz/img/m/p/pa0/p69/8929737.jpeg?format=preview-large',
  heroB: 'https://resources.cdn-kaspi.kz/img/m/p/pd5/pfe/136043513.jpg?format=preview-large',
  promo: 'https://resources.cdn-kaspi.kz/img/m/p/pa0/p69/8929737.jpeg?format=preview-large',
};

// ═══════════════════════════════════════════════════════════════════
//  ✏️ ЦЕНЫ НА КСЕРОКОПИЮ И ПЕЧАТЬ — РЕДАКТИРУЙТЕ ТОЛЬКО ЭТОТ БЛОК
//  Замените null на число (только цифры), например:  price: 50
//  unit — подпись рядом с ценой, например: 'за страницу' или '/ стр.'
//  После правки сохраните файл и запустите:  node build.mjs
// ═══════════════════════════════════════════════════════════════════
const XEROX_MAIN = [
  { name: 'Чёрно-белая копия А4', unit: '/ стр.', price: null },
  { name: 'Цветная копия А4', unit: '/ стр.', price: null },
  { name: 'Ксерокс', unit: '/ стр.', price: null },
  { name: 'Сканирование', unit: '/ стр.', price: null },
];
const XEROX_EXTRA = [
  { name: 'Цветная на глянцевой бумаге', unit: '/ стр.', price: null },
  { name: 'Печать на клеящейся бумаге', unit: '/ стр.', price: null },
  { name: 'Формат А3', unit: '/ лист', price: null },
  { name: 'Другие услуги', unit: 'уточняйте у продавца', price: null },
];

const priceCell = (s) => {
  if (s.price == null && s.unit && s.unit.startsWith('уточняйте')) return '<span class="pprice soft">' + s.unit + '</span>';
  if (s.price == null) return '<span class="pprice empty">укажите цену</span>';
  return '<span class="pprice">' + s.price.toLocaleString('ru-RU') + ' ₸</span>' + (s.unit ? '<span class="punit">' + s.unit + '</span>' : '');
};
const priceRows = (list) => list.map((s) =>
  '<div class="prow"><span class="pname">' + s.name + '</span><span class="dots"></span>' + priceCell(s) + '</div>'
).join('');

const fmt = (n) => (n == null ? '' : n.toLocaleString('ru-RU') + ' ₸');
const topCat = (c) => (c || 'unknown').split(',')[0];

const top = [...products]
  .filter((p) => p.image)
  .sort((a, b) => (b.reviewsQuantity || 0) - (a.reviewsQuantity || 0))
  .map((p) => ({
    id: p.id, title: p.title, price: p.price, oldPrice: p.oldPrice,
    rating: p.rating, reviews: p.reviewsQuantity || 0, monthly: p.creditMonthlyPrice,
    url: p.url, image: p.image, cat: topCat(p.category),
    created: p.createdTime ? Date.parse(p.createdTime) : 0,
  }));

const categories = (filters.data.treeCategory.items || []).map((c) => ({
  name: c.titleRu || c.title, count: c.count,
}));

const now = Date.now();
const badge = (p) => {
  if (p.reviews >= 1000) return 'Бестселлер';
  if (p.reviews >= 300) return 'Хит';
  if (now - p.created < 180 * 864e5) return 'Новинка';
  return null;
};

const data = {
  shop: SHOP_URL,
  products: top,
  categories,
  badges: Object.fromEntries(top.map((p) => [p.id, badge(p)])),
};

const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Revalo — товары для дома, детей и офиса</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,400;0,500;0,700;0,900;1,400&display=swap" rel="stylesheet">
<style>
:root {
  --color-text: #080808;
  --color-text-50: rgba(8, 8, 8, 0.5);
  --color-text-80: rgba(8, 8, 8, 0.8);
  --color-bg: #ffffff;
  --color-bg-soft: #f5f5f5;
  --color-bg-product: #f9f9f9;
  --color-hairline: #f7f7f7;
  --color-border: rgba(8, 8, 8, 0.08);
  --color-beige: #ece4d9;
  --color-beige-light: #f9f7f3;
  --color-blue: #d7dfe9;
  --color-blue-light: #ebeff4;
  --color-green: #d6dcd6;
  --color-green-light: #eaedea;
  --color-hero: #1e3a2d;
  --color-sale: #d20000;
  --radius: 8px;
  --radius-card: 16px;
  --radius-banner: 24px;
  --ease: cubic-bezier(0.225, 0.64, 0.365, 1);
  --font: 'Jost', 'Futura', sans-serif;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  font-family: var(--font);
  font-size: 14px;
  color: var(--color-text);
  background: var(--color-bg);
  line-height: 1.4;
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; text-decoration: none; }
button { font-family: inherit; cursor: pointer; }
img { display: block; max-width: 100%; }
h1, h2, h3 { font-weight: 900; letter-spacing: -1px; line-height: 1.2; }
h1, h2 { font-size: clamp(30px, 3.4vw, 33px); }
h3 { font-size: 24px; letter-spacing: -0.5px; }
.wrap { padding-left: 36px; padding-right: 36px; max-width: 1440px; margin: 0 auto; }
section { padding-top: 80px; }
.reveal { opacity: 0; transform: translateY(15px); transition: opacity 0.5s var(--ease), transform 0.5s var(--ease); }
.reveal.in { opacity: 1; transform: none; }

/* Topline */
.topline { background: var(--color-text); color: #fff; font-size: 12px; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 9px 16px; text-align: center; flex-wrap: wrap; }
.topline b { font-weight: 700; }
.topline a { border-bottom: 1px solid rgba(255, 255, 255, 0.4); transition: color 0.25s ease-out, border-color 0.25s ease-out; }
.topline a:hover { color: rgba(255, 255, 255, 0.7); border-color: rgba(255, 255, 255, 0.7); }

/* Announcement */
.announce { background: var(--color-text); color: #fff; text-align: center; font-size: 12px; height: 34px; position: relative; overflow: hidden; }
.announce span { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px; opacity: 0; transition: opacity 0.4s var(--ease); }
.announce span.on { opacity: 1; }
.announce a { border-bottom: 1px solid rgba(255, 255, 255, 0.4); }

/* Header */
header {
  position: sticky; top: 0; z-index: 50; background: var(--color-bg);
  transition: border-color 0.25s ease-out; border-bottom: 1px solid transparent;
}
header.scrolled { border-bottom-color: var(--color-hairline); }
.header-in { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; height: 64px; }
.header-side { display: flex; gap: 20px; align-items: center; }
.header-side.right { justify-content: flex-end; }
.icon-btn { background: none; border: 0; padding: 6px; color: var(--color-text); display: inline-flex; transition: color 0.25s ease-out; }
.icon-btn:hover { color: var(--color-text-80); }
.logo { font-weight: 900; font-size: 18px; letter-spacing: 6px; text-indent: 6px; }

/* Hero */
.hero { position: relative; background: var(--color-hero); color: #fff; min-height: 88vh; display: flex; align-items: flex-end; overflow: hidden; margin-top: -64px; padding-top: 64px; }
.hero::after { content: ''; position: absolute; width: 60vw; height: 60vw; border-radius: 50%; background: rgba(255, 255, 255, 0.05); top: -25vw; right: -18vw; pointer-events: none; }
.hero-in { position: relative; z-index: 2; width: 100%; padding-bottom: 72px; }
.hero-eyebrow { font-size: 12px; letter-spacing: 3px; text-transform: uppercase; opacity: 0.75; margin-bottom: 16px; }
.hero h1 { color: #fff; max-width: 520px; }
.hero p { font-size: 18px; margin-top: 16px; max-width: 460px; opacity: 0.9; }
.btn {
  display: inline-block; border-radius: var(--radius); font-size: 12px; font-weight: 900;
  padding: 16px 32px; border: 1px solid transparent; background: var(--color-text); color: #fff;
  transition: color 0.25s ease-out, background 0.25s ease-out, border 0.25s ease-out;
}
.btn:hover { background: var(--color-text-80); }
.btn.light { background: #fff; color: var(--color-text); border-color: #fff; }
.btn.light:hover { background: var(--color-text); color: #fff; border-color: var(--color-text); }
.hero .btn { margin-top: 28px; }
.hero-art { position: absolute; right: 36px; bottom: 72px; z-index: 1; width: min(44vw, 560px); height: 70%; pointer-events: none; }
.hero-card { position: absolute; background: #fff; border-radius: var(--radius-card); padding: 14px; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25); }
.hero-card img { border-radius: 10px; width: 100%; height: 100%; object-fit: cover; }
.hero-card.main { width: 62%; aspect-ratio: 1; right: 6%; bottom: 4%; transform: rotate(2deg); }
.hero-card.a { width: 40%; aspect-ratio: 1; left: 0; top: 2%; transform: rotate(-5deg); }
.hero-card.b { width: 34%; aspect-ratio: 1; left: 8%; bottom: 0; transform: rotate(4deg); }
@keyframes heroIn { from { opacity: 0; transform: translateY(15px) rotate(var(--rot, 0deg)); } to { opacity: 1; transform: translateY(0) rotate(var(--rot, 0deg)); } }
.hero-card { opacity: 0; animation: heroIn 0.6s var(--ease) forwards; }
.hero-card.main { --rot: 2deg; animation-delay: 0.15s; }
.hero-card.a { --rot: -5deg; animation-delay: 0.3s; }
.hero-card.b { --rot: 4deg; animation-delay: 0.45s; }
.hero h1, .hero p, .hero .btn, .hero-eyebrow { opacity: 0; animation: heroIn 0.6s var(--ease) forwards; }
.hero h1 { --rot: 0deg; animation-delay: 0.1s; }
.hero p { --rot: 0deg; animation-delay: 0.2s; }
.hero .btn { --rot: 0deg; animation-delay: 0.3s; }
.hero-eyebrow { --rot: 0deg; animation-delay: 0s; }

/* Section head */
.sec-head { display: flex; align-items: baseline; justify-content: space-between; gap: 24px; margin-bottom: 34px; }
.sec-link { font-size: 12px; font-weight: 900; border-bottom: 1px solid var(--color-text); padding-bottom: 2px; transition: color 0.25s ease-out, border-color 0.25s ease-out; white-space: nowrap; }
.sec-link:hover { color: var(--color-text-50); border-color: var(--color-text-50); }

/* Categories */
.cats { display: flex; gap: 16px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 12px; scrollbar-width: none; }
.cats::-webkit-scrollbar { display: none; }
.cat-card {
  scroll-snap-align: start; flex: 0 0 300px; border-radius: var(--radius-card); padding: 24px;
  min-height: 168px; display: flex; flex-direction: column; justify-content: space-between;
  transition: transform 0.25s ease-out; border: 0; text-align: left; font-size: inherit; color: inherit;
}
.cat-card:hover { transform: translateY(-4px); }
.cat-card .count { font-size: 12px; color: var(--color-text-50); }
.cat-card .name { font-size: 20px; font-weight: 900; letter-spacing: -0.5px; line-height: 1.2; margin-top: 4px; }
.cat-card .go { margin-top: 18px; width: 36px; height: 36px; border-radius: 50%; background: var(--color-text); color: #fff; display: flex; align-items: center; justify-content: center; transition: background 0.25s ease-out; }
.cat-card:hover .go { background: var(--color-text-80); }

/* Products */
.search { position: relative; margin-bottom: 20px; }
.search .s-ic { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--color-text-50); pointer-events: none; }
.search input {
  width: 100%; border: 1px solid var(--color-border); border-radius: var(--radius); background: #fff;
  padding: 14px 46px; font-family: inherit; font-size: 14px; color: var(--color-text);
  outline: none; transition: border-color 0.25s ease-out;
}
.search input:focus { border-color: var(--color-text); }
.search input::placeholder { color: var(--color-text-50); }
.search .s-clear {
  position: absolute; right: 6px; top: 50%; transform: translateY(-50%); border: 0; background: none;
  padding: 8px; color: var(--color-text-50); display: flex; opacity: 0; pointer-events: none;
  transition: opacity 0.25s ease-out, color 0.25s ease-out;
}
.search.has .s-clear { opacity: 1; pointer-events: auto; }
.search .s-clear:hover { color: var(--color-text); }
.s-info { display: none; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 12px; color: var(--color-text-50); margin: -6px 0 24px; }
.s-info.on { display: flex; }
.s-info .chip { padding: 6px 14px; }

.chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 28px; }
.chip {
  border: 1px solid var(--color-border); background: #fff; border-radius: 999px;
  padding: 8px 16px; font-size: 12px; font-weight: 700; transition: all 0.25s ease-out;
}
.chip:hover { border-color: var(--color-text); }
.chip.on { background: var(--color-text); color: #fff; border-color: var(--color-text); }
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.card { position: relative; display: flex; flex-direction: column; }
.card .ph { position: relative; border-radius: var(--radius-card); background: var(--color-bg-product); overflow: hidden; aspect-ratio: 1; }
.card .ph img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s var(--ease); }
.card:hover .ph img { transform: scale(1.04); }
.card .arrow {
  position: absolute; top: 12px; right: 12px; width: 36px; height: 36px; border-radius: 50%;
  background: #fff; display: flex; align-items: center; justify-content: center;
  opacity: 0; transform: translateY(-6px); transition: opacity 0.25s ease-out, transform 0.25s ease-out;
}
.card:hover .arrow { opacity: 1; transform: none; }
.pill {
  position: absolute; top: 12px; left: 12px; background: #fff; color: #595959;
  font-size: 12px; padding: 6px 12px; border-radius: 999px;
}
.card .info { padding: 14px 4px 0; display: flex; flex-direction: column; gap: 6px; flex: 1; }
.card .title { font-size: 18px; font-weight: 900; letter-spacing: -0.5px; line-height: 1.25; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.5em; }
.card .meta { font-size: 12px; color: var(--color-text-50); }
.card .rating { font-size: 12px; }
.card .rating b { font-weight: 700; }
.card .price-row { margin-top: auto; display: flex; align-items: baseline; gap: 10px; }
.card .price { font-size: 18px; font-weight: 900; letter-spacing: -0.5px; }
.card .old { font-size: 12px; color: var(--color-text-50); text-decoration: line-through; }
.card .monthly { font-size: 12px; color: var(--color-text-50); }
.more-wrap { text-align: center; margin-top: 36px; }

/* Promo banner (Editorial Split Style) */
.promo-banner {
  background: var(--color-beige-light);
  border-radius: var(--radius-banner);
  overflow: hidden;
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  align-items: center;
  min-height: 460px;
  border: 1px solid rgba(8, 8, 8, 0.04);
}
.promo-content {
  padding: 56px 64px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.promo-badge {
  display: inline-block;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-80);
  margin-bottom: 20px;
}
.promo-content h2 {
  font-size: clamp(30px, 3.2vw, 40px);
  font-weight: 900;
  letter-spacing: -1px;
  line-height: 1.15;
  color: var(--color-text);
  max-width: 520px;
}
.promo-content p {
  margin-top: 16px;
  font-size: 17px;
  line-height: 1.5;
  color: var(--color-text-80);
  max-width: 480px;
}
.promo-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 24px;
}
.promo-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-80);
  background: rgba(255, 255, 255, 0.75);
  padding: 6px 14px;
  border-radius: 999px;
}
.promo-tag svg {
  color: var(--color-text);
}
.promo-actions {
  margin-top: 32px;
}
.promo-actions .btn {
  background: var(--color-text);
  color: #fff;
  padding: 15px 32px;
  border-radius: var(--radius);
  font-size: 12px;
  font-weight: 900;
  border: 1px solid transparent;
  transition: all 0.25s ease-out;
}
.promo-actions .btn:hover {
  background: var(--color-text-80);
}

.promo-visual {
  padding: 36px 48px 36px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
.promo-card {
  position: relative;
  width: 100%;
  max-width: 440px;
  aspect-ratio: 1;
  border-radius: var(--radius-card);
  overflow: hidden;
  background: #fff;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.07);
}
.promo-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s var(--ease);
}
.promo-banner:hover .promo-card img {
  transform: scale(1.03);
}
.promo-pill {
  position: absolute;
  top: 14px;
  left: 14px;
  background: #fff;
  color: var(--color-text);
  font-size: 12px;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 999px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* Values */
.values { background: var(--color-beige-light); margin-top: 80px; padding-bottom: 80px; }
.values .intro { text-align: center; max-width: 560px; margin: 0 auto 44px; }
.values .intro p { color: var(--color-text-80); margin-top: 12px; font-size: 18px; }
.tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.tile { background: #fff; border-radius: var(--radius-card); padding: 24px; text-align: center; }
.tile .mark { width: 56px; height: 56px; border-radius: 50%; background: var(--color-text); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 14px; margin: 0 auto 14px; letter-spacing: -0.5px; }
.tile .t { font-weight: 900; font-size: 18px; letter-spacing: -0.5px; }
.tile .d { font-size: 12px; color: var(--color-text-50); margin-top: 4px; }

/* Duo cards */
.duo { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.duo-card { border-radius: var(--radius-banner); padding: 40px; display: flex; flex-direction: column; align-items: flex-start; }
.duo-card.blue { background: var(--color-blue-light); }
.duo-card.beige { background: var(--color-beige); }
.duo-card h3 { margin-bottom: 10px; }
.duo-card p { color: var(--color-text-80); max-width: 380px; }
.duo-card .btn { margin-top: 24px; }

/* Services: xerox & print */
.svc-tag { font-size: 12px; font-weight: 700; border: 1px solid var(--color-border); border-radius: 999px; padding: 8px 16px; white-space: nowrap; color: var(--color-text-80); }
.svc-intro { font-size: 18px; color: var(--color-text-80); max-width: 620px; margin: -18px 0 34px; }
.price-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.price-card { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-card); padding: 28px; }
.price-card.pastel { background: var(--color-green-light); border-color: transparent; }
.price-card h3 { font-size: 20px; margin-bottom: 6px; }
.prow { display: flex; align-items: baseline; gap: 10px; padding: 13px 0; border-bottom: 1px solid var(--color-hairline); }
.prow:last-child { border-bottom: 0; }
.pname { font-size: 14px; }
.dots { flex: 1; border-bottom: 1px dotted rgba(8, 8, 8, 0.25); transform: translateY(-4px); min-width: 24px; }
.pprice { font-size: 18px; font-weight: 900; letter-spacing: -0.5px; white-space: nowrap; }
.pprice.empty { font-size: 12px; font-weight: 700; color: var(--color-text-50); border-bottom: 1px dashed var(--color-text-50); }
.pprice.soft { font-size: 12px; font-weight: 700; color: var(--color-text-50); }
.punit { font-size: 12px; color: var(--color-text-50); white-space: nowrap; }
.svc-note { margin-top: 28px; font-size: 12px; color: var(--color-text-50); max-width: 640px; }
.svc-note a { border-bottom: 1px solid var(--color-text-50); transition: color 0.25s ease-out, border-color 0.25s ease-out; }
.svc-note a:hover { color: var(--color-text); border-color: var(--color-text); }

/* Offline store banner */
.offline { background: var(--color-beige); border-radius: var(--radius-banner); padding: 40px; display: flex; gap: 28px; align-items: flex-start; }
.off-mark { width: 56px; height: 56px; border-radius: 50%; background: var(--color-text); color: #fff; display: flex; align-items: center; justify-content: center; flex: 0 0 56px; }
.offline h3 { margin: 16px 0 10px; }
.offline p { color: var(--color-text-80); max-width: 500px; font-size: 18px; }
.offline p b { font-weight: 700; }
.offline .btn { margin-top: 24px; }

/* Footer */
footer { margin-top: 80px; border-top: 1px solid var(--color-hairline); }
.subscribe { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: center; padding-top: 56px; padding-bottom: 48px; border-bottom: 1px solid var(--color-hairline); }
.subscribe h3 { font-size: 24px; }
.sub-form { display: flex; gap: 8px; }
.sub-form input {
  flex: 1; border: 1px solid var(--color-border); border-radius: var(--radius); padding: 14px 16px;
  font-family: inherit; font-size: 14px; outline: none; transition: border-color 0.25s ease-out; background: #fff;
}
.sub-form input:focus { border-color: var(--color-text); }
.sub-form button { border: 0; background: var(--color-text); color: #fff; border-radius: var(--radius); width: 48px; display: flex; align-items: center; justify-content: center; transition: background 0.25s ease-out; }
.sub-form button:hover { background: var(--color-text-80); }
.sub-ok { font-size: 12px; color: var(--color-text-50); margin-top: 8px; min-height: 16px; }
.cols { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; padding-top: 48px; padding-bottom: 48px; }
.cols h4 { font-size: 12px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 14px; }
.cols a { display: block; font-size: 14px; color: var(--color-text-80); padding: 5px 0; transition: color 0.25s ease-out; }
.cols a:hover { color: var(--color-text); }
.bottom { display: flex; justify-content: space-between; gap: 16px; padding-top: 20px; padding-bottom: 28px; border-top: 1px solid var(--color-hairline); font-size: 12px; color: var(--color-text-50); }

@media (max-width: 1000px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
  .tiles { grid-template-columns: repeat(2, 1fr); }
  .hero-art { opacity: 0.35; width: 70vw; }
  .duo { grid-template-columns: 1fr; }
  .price-grid { grid-template-columns: 1fr; }
  .promo-banner { grid-template-columns: 1fr; min-height: auto; }
  .promo-content { padding: 44px 36px 28px; }
  .promo-visual { padding: 0 36px 44px; justify-content: flex-start; }
  .promo-card { max-width: 380px; }
  .cols { grid-template-columns: repeat(2, 1fr); }
  .subscribe { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .wrap { padding-left: 20px; padding-right: 20px; }
  section { padding-top: 56px; }
  .grid { grid-template-columns: repeat(2, 1fr); }
  .card .title { font-size: 14px; }
  .card .price { font-size: 14px; }
  .hero { min-height: 78vh; }
  .hero-art { right: -10vw; bottom: 40vh; opacity: 0.25; }
  .hero-in { padding-bottom: 48px; }
  .offline { padding: 28px; gap: 20px; }
  .off-mark { width: 48px; height: 48px; flex-basis: 48px; }
  .promo-banner { grid-template-columns: 1fr; min-height: auto; }
  .promo-content { padding: 32px 24px 20px; }
  .promo-content h2 { font-size: 26px; }
  .promo-content p { font-size: 15px; }
  .promo-visual { padding: 0 24px 32px; }
  .promo-card { max-width: 100%; aspect-ratio: 4 / 3; }
  h3 { font-size: 20px; }
}

/* Drawer & Backdrop */
.drawer-backdrop {
  position: fixed; inset: 0; z-index: 90;
  background: rgba(8, 8, 8, 0.45);
  backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  opacity: 0; pointer-events: none;
  transition: opacity 0.3s var(--ease);
}
.drawer-backdrop.open { opacity: 1; pointer-events: auto; }

.drawer {
  position: fixed; top: 0; left: 0; bottom: 0; z-index: 100;
  width: min(380px, 86vw); background: var(--color-bg);
  box-shadow: 20px 0 60px rgba(0, 0, 0, 0.15);
  display: flex; flex-direction: column;
  transform: translateX(-100%);
  transition: transform 0.35s var(--ease);
}
.drawer.open { transform: translateX(0); }

.drawer-head {
  height: 64px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid var(--color-hairline);
}
.drawer-logo { font-weight: 900; font-size: 18px; letter-spacing: 6px; text-indent: 6px; color: var(--color-text); }
.drawer-close {
  background: none; border: 0; padding: 8px; color: var(--color-text); display: inline-flex;
  border-radius: var(--radius); cursor: pointer; transition: background 0.25s ease-out;
}
.drawer-close:hover { background: var(--color-bg-soft); }

.drawer-body {
  flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 28px;
  overscroll-behavior: contain;
}

.drawer-nav { display: flex; flex-direction: column; gap: 4px; }
.drawer-link {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; border-radius: var(--radius); font-weight: 700; font-size: 14px;
  color: var(--color-text); transition: background 0.25s ease-out, color 0.25s ease-out;
}
.drawer-link:hover { background: var(--color-bg-soft); color: var(--color-text); }
.drawer-link .tag {
  font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 999px;
  background: var(--color-bg-soft); color: var(--color-text-50);
}

.drawer-sec-title {
  font-size: 12px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;
  color: var(--color-text-50); margin-bottom: 12px;
}
.drawer-cats { display: flex; flex-wrap: wrap; gap: 8px; }
.drawer-cat-btn {
  border: 1px solid var(--color-border); background: #fff; border-radius: 999px;
  padding: 7px 14px; font-size: 12px; font-weight: 500; cursor: pointer; color: var(--color-text);
  font-family: inherit; transition: all 0.25s ease-out;
}
.drawer-cat-btn:hover { border-color: var(--color-text); background: var(--color-bg-soft); }

.drawer-info {
  background: var(--color-beige-light); border-radius: var(--radius-card); padding: 18px;
  display: flex; flex-direction: column; gap: 6px; font-size: 13px;
}
.drawer-info b { font-weight: 700; color: var(--color-text); }
.drawer-info p { color: var(--color-text-80); margin: 0; line-height: 1.4; }
.drawer-info a {
  align-self: flex-start; font-size: 12px; font-weight: 700; border-bottom: 1px solid var(--color-text);
  margin-top: 4px; transition: opacity 0.25s ease-out;
}
.drawer-info a:hover { opacity: 0.6; }

.drawer-foot {
  padding: 20px 24px; border-top: 1px solid var(--color-hairline);
  display: flex; flex-direction: column; gap: 10px;
}
.drawer-foot .btn { text-align: center; }
.drawer-foot .note { font-size: 12px; color: var(--color-text-50); text-align: center; }

</style>
</head>
<body>

<div class="drawer-backdrop" id="menuBackdrop" aria-hidden="true"></div>
<aside class="drawer" id="menuDrawer" aria-label="Главное меню" aria-hidden="true">
  <div class="drawer-head">
    <a class="drawer-logo" href="#">REVALO</a>
    <button class="drawer-close" id="menuClose" aria-label="Закрыть меню">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
    </button>
  </div>
  <div class="drawer-body">
    <nav class="drawer-nav">
      <a class="drawer-link" href="#catalog" data-drawer-nav>
        <span>Каталог товаров</span>
        <span class="tag">1800+</span>
      </a>
      <a class="drawer-link" href="#categories" data-drawer-nav>
        <span>Категории</span>
      </a>
      <a class="drawer-link" href="#services" data-drawer-nav>
        <span>Ксерокопия и печать</span>
        <span class="tag">Услуга</span>
      </a>
      <a class="drawer-link" href="${OFFLINE.gisUrl}" target="_blank" rel="noopener">
        <span>Магазин на карте 2GIS</span>
        <span class="tag">Алматы</span>
      </a>
      <a class="drawer-link" href="${SHOP_URL}" target="_blank" rel="noopener">
        <span>Магазин на Kaspi.kz</span>
        <span class="tag">0-0-12</span>
      </a>
    </nav>
    <div>
      <div class="drawer-sec-title">Популярные категории</div>
      <div class="drawer-cats" id="drawerCats"></div>
    </div>
    <div class="drawer-info">
      <b>Офлайн-магазин</b>
      <p>${OFFLINE.address}</p>
      <p style="font-size:12px; color:var(--color-text-50);">В магазине цены ниже, чем онлайн</p>
      <a href="${OFFLINE.gisUrl}" target="_blank" rel="noopener">Открыть в 2GIS →</a>
    </div>
  </div>
  <div class="drawer-foot">
    <a class="btn" href="${SHOP_URL}" target="_blank" rel="noopener">Купить на Kaspi.kz</a>
    <div class="note">★ 4.8 рейтинг продавца · 10 000+ заказов</div>
  </div>
</aside>


<div class="topline">
  <span><svg width="14" height="14" viewBox="0 0 20 20" fill="none" style="vertical-align:-2px; margin-right:6px;"><path d="M10 17.5s5.8-4.9 5.8-9.3A5.8 5.8 0 0 0 4.2 8.2c0 4.4 5.8 9.3 5.8 9.3z" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/></svg>Ксерокопия, печать и скан — в магазине <b>${OFFLINE.address}</b> · цены ниже, чем онлайн</span>
  <a href="${OFFLINE.gisUrl}" target="_blank" rel="noopener">открыть в 2GIS</a>
</div>

<div class="announce" id="announce">
  <span class="on">Более 10 000 заказов на Kaspi.kz · <a href="${SHOP_URL}" target="_blank" rel="noopener">перейти в магазин</a></span>
  <span>Рассрочка 0-0-12 на тысячи товаров · <a href="${SHOP_URL}" target="_blank" rel="noopener">смотреть</a></span>
</div>

<header id="header">
  <div class="wrap header-in">
    <div class="header-side left">
      <button class="icon-btn" id="menuBtn" aria-label="Меню" aria-expanded="false" aria-controls="menuDrawer">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 5h16M2 10h16M2 15h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      </button>
      <button class="icon-btn" id="headerSearch" aria-label="Поиск">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6.2" stroke="currentColor" stroke-width="1.6"/><path d="M13.8 13.8L18 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      </button>
    </div>
    <a class="logo" href="#">REVALO</a>
    <div class="header-side right">
      <a class="icon-btn" href="${SHOP_URL}" target="_blank" rel="noopener" aria-label="Аккаунт">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="6.4" r="3.4" stroke="currentColor" stroke-width="1.6"/><path d="M3.4 17.2c1.2-3 3.6-4.6 6.6-4.6s5.4 1.6 6.6 4.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      </a>
      <a class="icon-btn" href="${SHOP_URL}" target="_blank" rel="noopener" aria-label="Корзина">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 3.6h2l1.8 9.6h9.4L17.4 7H6.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8" cy="16.6" r="1.2" fill="currentColor"/><circle cx="14.4" cy="16.6" r="1.2" fill="currentColor"/></svg>
      </a>
    </div>
  </div>
</header>

<section class="hero">
  <div class="hero-art" aria-hidden="true">
    <div class="hero-card a"><img src="${IMG.heroA}" alt=""></div>
    <div class="hero-card b"><img src="${IMG.heroB}" alt=""></div>
    <div class="hero-card main"><img src="${IMG.heroMain}" alt=""></div>
  </div>
  <div class="wrap hero-in">
    <div class="hero-eyebrow">Revalo 1 · Kaspi.kz · Алматы</div>
    <h1>Всё для дома, детей и творчества</h1>
    <p>Более 1800 товаров с доставкой по Казахстану. 3+ года на маркетплейсе, рейтинг продавца 4.8.</p>
    <a class="btn light" href="#catalog">Смотреть каталог</a>
  </div>
</section>

<section id="categories" class="wrap">
  <div class="sec-head reveal">
    <h2>Категории</h2>
    <a class="sec-link" href="${SHOP_URL}" target="_blank" rel="noopener">Все товары на Kaspi</a>
  </div>
  <div class="cats reveal" id="catRow"></div>
</section>

<section id="catalog" class="wrap">
  <div class="sec-head reveal">
    <h2>Каталог</h2>
    <a class="sec-link" href="${SHOP_URL}" target="_blank" rel="noopener">Смотреть все</a>
  </div>
  <div class="search reveal" id="searchBox">
    <svg class="s-ic" width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6.2" stroke="currentColor" stroke-width="1.6"/><path d="M13.8 13.8L18 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
    <input id="searchInput" type="text" placeholder="Поиск по товарам: весы, тетрадь, игрушки…" autocomplete="off" aria-label="Поиск по каталогу">
    <button class="s-clear" id="searchClear" aria-label="Очистить поиск">
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
    </button>
  </div>
  <div class="s-info" id="searchInfo"></div>
  <div class="chips reveal" id="chips"></div>
  <div class="grid" id="grid"></div>
  <div class="more-wrap">
    <button class="btn" id="more">Показать ещё</button>
  </div>
</section>

<section class="wrap">
  <div class="promo-banner reveal">
    <div class="promo-content">
      <span class="promo-badge">Детские товары · 536 позиций</span>
      <h2>Игры, которые развивают</h2>
      <p>Сортеры, конструкторы и обучающие наборы из экологичных материалов — самые любимые товары наших покупателей.</p>
      <div class="promo-tags">
        <span class="promo-tag">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Развитие логики
        </span>
        <span class="promo-tag">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Безопасные материалы
        </span>
        <span class="promo-tag">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Хит на Kaspi.kz
        </span>
      </div>
      <div class="promo-actions">
        <button class="btn" data-cat="Детские товары">Смотреть категорию</button>
      </div>
    </div>
    <div class="promo-visual">
      <div class="promo-card">
        <img src="${IMG.promo}" alt="Развивающие детские товары">
        <span class="promo-pill">★ 4.9 · Топ выбор</span>
      </div>
    </div>
  </div>
</section>

<section class="values">
  <div class="wrap">
    <div class="intro reveal">
      <h2>Почему Revalo 1</h2>
      <p>Продаём на Kaspi.kz больше трёх лет и держим высокий рейтинг за счёт качества и скорости.</p>
    </div>
    <div class="tiles reveal">
      <div class="tile"><div class="mark">10K+</div><div class="t">заказов</div><div class="d">выполнено на маркетплейсе</div></div>
      <div class="tile"><div class="mark">3+</div><div class="t">года</div><div class="d">продаж на Kaspi.kz</div></div>
      <div class="tile"><div class="mark">4.8</div><div class="t">рейтинг</div><div class="d">по 228 отзывам о продавце</div></div>
      <div class="tile"><div class="mark">1800+</div><div class="t">товаров</div><div class="d">в 19 категориях каталога</div></div>
    </div>
  </div>
</section>

<section class="wrap">
  <div class="duo reveal">
    <div class="duo-card blue">
      <h3>Рассрочка 0-0-12</h3>
      <p>Тысячи товаров можно оформить в рассрочку без переплаты — прямо на странице товара на Kaspi.</p>
      <a class="btn" href="${SHOP_URL}" target="_blank" rel="noopener">Выбрать товар</a>
    </div>
    <div class="duo-card beige">
      <h3>Доставка по Казахстану</h3>
      <p>Отправляем заказы в Алматы и по всей стране через пункты выдачи Kaspi.</p>
      <a class="btn" href="${SHOP_URL}" target="_blank" rel="noopener">Перейти в магазин</a>
    </div>
  </div>
</section>

<section id="services" class="wrap">
  <div class="sec-head reveal">
    <h2>Ксерокопия и печать</h2>
    <span class="svc-tag">Услуга в магазине</span>
  </div>
  <p class="svc-intro reveal">Делаем копии, сканы и цветную печать прямо в магазине — быстро и недорого.</p>
  <div class="price-grid reveal">
    <div class="price-card">
      <h3>Копия и скан</h3>
      ${priceRows(XEROX_MAIN)}
    </div>
    <div class="price-card pastel">
      <h3>Специальная печать</h3>
      ${priceRows(XEROX_EXTRA)}
    </div>
  </div>
  <p class="svc-note reveal">Цены указаны за одну страницу. Большой тираж, другой формат или срочный заказ — <a href="${SHOP_URL}" target="_blank" rel="noopener">уточняйте у продавца</a>.</p>
</section>

<section class="wrap">
  <div class="offline reveal">
    <div class="off-mark">
      <svg width="24" height="24" viewBox="0 0 20 20" fill="none"><path d="M10 17.5s5.8-4.9 5.8-9.3A5.8 5.8 0 0 0 4.2 8.2c0 4.4 5.8 9.3 5.8 9.3z" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/></svg>
    </div>
    <div>
      <span class="svc-tag">Офлайн-магазин Revalo</span>
      <h3>В магазине — дешевле, чем онлайн</h3>
      <p>При покупке в точке по адресу <b>${OFFLINE.address}</b> цены на товары ниже, чем при заказе на Kaspi.kz.</p>
      <a class="btn" href="${OFFLINE.gisUrl}" target="_blank" rel="noopener">Открыть в 2GIS</a>
    </div>
  </div>
</section>

<footer>
  <div class="wrap subscribe">
    <div>
      <h3>Скидки и новинки — первыми</h3>
      <div class="sub-ok" id="subOk"></div>
    </div>
    <form class="sub-form" id="subForm">
      <input type="email" required placeholder="Ваш email" aria-label="Email">
      <button type="submit" aria-label="Подписаться">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M3 10h13M12 5l5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </form>
  </div>
  <div class="wrap cols">
    <div>
      <h4>Магазин</h4>
      <a href="${SHOP_URL}" target="_blank" rel="noopener">Все товары</a>
      <a href="${SHOP_URL}" target="_blank" rel="noopener">Отзывы покупателей</a>
      <a href="${SHOP_URL}" target="_blank" rel="noopener">Условия доставки</a>
    </div>
    <div>
      <h4>Категории</h4>
      <a href="${SHOP_URL}" target="_blank" rel="noopener">Детские товары</a>
      <a href="${SHOP_URL}" target="_blank" rel="noopener">Товары для дома</a>
      <a href="${SHOP_URL}" target="_blank" rel="noopener">Красота и здоровье</a>
    </div>
    <div>
      <h4>Покупателям</h4>
      <a href="https://kaspi.kz" target="_blank" rel="noopener">Kaspi.kz</a>
      <a href="https://kaspi.kz/guide" target="_blank" rel="noopener">Kaspi Гид</a>
    </div>
    <div>
      <h4>Контакты</h4>
      <a href="${SHOP_URL}" target="_blank" rel="noopener">Страница продавца</a>
      <a href="${SHOP_URL}" target="_blank" rel="noopener">Задать вопрос</a>
    </div>
  </div>
  <div class="wrap bottom">
    <span>© ${new Date().getFullYear()} Revalo 1. Все права защищены.</span>
    <span>Витрина по дизайн-системе Revalo</span>
  </div>
</footer>

<script>
const DATA = ${JSON.stringify(data)};
const PASTELS = ['#F9F7F3', '#EBEFF4', '#EAEDEA', '#ECE4D9', '#F5F5F5'];
const state = { cat: 'Все', shown: 12, q: '' };
const fmtN = (n) => n == null ? '' : n.toLocaleString('ru-RU') + ' ₸';

// Поиск по каталогу: нормализация + словарь синонимов
const norm = (s) => s.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const SYN = {
  'игрушки': ['игрушка', 'сортер', 'сортеры', 'конструктор', 'машинки', 'кукла', 'мяч', 'пазл'],
  'игрушка': ['игрушки'],
  'пазл': ['пазлы'], 'пазлы': ['пазл'],
  'конструктор': ['конструкторы', 'лего'], 'лего': ['lego', 'конструктор'], 'lego': ['лего', 'конструктор'],
  'украшения': ['серьги', 'кольцо', 'кольца', 'браслет', 'подвеска', 'кулон', 'бижутерия'],
  'бижутерия': ['украшения'],
  'серьги': ['украшения'], 'кольцо': ['кольца', 'украшения'], 'кольца': ['кольцо', 'украшения'],
  'браслет': ['браслеты', 'украшения'], 'подвеска': ['подвески', 'кулон', 'украшения'], 'кулон': ['подвеска', 'украшения'],
  'тетрадь': ['тетради', 'блокнот'], 'тетради': ['тетрадь', 'блокнот'], 'блокнот': ['тетрадь', 'блокноты'],
  'ручка': ['ручки'], 'ручки': ['ручка', 'карандаши', 'фломастеры'],
  'карандаш': ['карандаши', 'фломастеры', 'маркеры'], 'карандаши': ['карандаш', 'фломастеры'],
  'фломастеры': ['фломастер', 'маркеры', 'карандаши'], 'маркер': ['маркеры', 'фломастеры'], 'маркеры': ['маркер', 'фломастеры'],
  'ножницы': ['ножницы'],
  'наклейки': ['наклейка', 'стикеры'], 'наклейка': ['наклейки', 'стикеры'], 'стикеры': ['наклейки'],
  'книги': ['книга'], 'книга': ['книги'],
  'посуда': ['тарелка', 'кружка', 'чашка', 'ложка', 'вилка', 'кастрюля', 'сковорода'],
  'ложка': ['ложки', 'посуда'], 'ложки': ['ложка', 'посуда'], 'вилка': ['вилки', 'посуда'],
  'кружка': ['кружки', 'посуда'], 'тарелка': ['тарелки', 'посуда'],
  'полотенце': ['полотенца'], 'полотенца': ['полотенце'],
  'ковер': ['ковры', 'коврик', 'коврики'], 'коврики': ['коврик', 'ковер', 'ковры'],
  'вешалки': ['вешалка', 'плечики'], 'вешалка': ['вешалки', 'плечики'], 'плечики': ['вешалки', 'вешалка'],
  'контейнер': ['контейнеры', 'хранение'], 'контейнеры': ['контейнер', 'хранение'],
  'органайзер': ['органайзеры', 'хранение'],
  'рюкзак': ['рюкзаки', 'туризм'], 'рюкзаки': ['рюкзак'],
  'палатка': ['палатки', 'туризм'],
  'сумка': ['сумки'], 'сумки': ['сумка'],
  'расческа': ['расчески', 'гребень'], 'расчески': ['расческа'],
  'канцелярия': ['тетрадь', 'ручка', 'карандаши', 'фломастеры', 'блокнот', 'ножницы', 'линейка'],
  'канцелярские': ['канцелярия'],
  'подарок': ['подарки'], 'подарки': ['подарок'],
  'мяч': ['мячи'], 'мячи': ['мяч'],
  'спорт': ['мяч', 'гантели', 'эспандер', 'турник'],
  'туризм': ['палатка', 'рюкзак', 'фонарь'],
  'приборы': ['ложка', 'вилка', 'ножи'],
};
DATA.products.forEach((p) => { p.nw = norm(p.title); });

function search(q) {
  const toks = norm(q).split(' ').filter(Boolean);
  if (!toks.length) return null;
  const exp = new Set(toks);
  toks.forEach((t) => (SYN[t] || []).forEach((s) => exp.add(s)));
  const scored = [];
  for (const p of DATA.products) {
    const words = p.nw.split(' ');
    let score = 0;
    for (const t of exp) {
      const orig = toks.indexOf(t) >= 0;
      if (words.some((w) => w.startsWith(t))) { score += orig ? 3 : 1.5; continue; }
      if (t.length >= 4 && words.some((w) => w.startsWith(t.slice(0, 4)))) score += orig ? 2 : 1;
    }
    if (score > 0) scored.push([score, p]);
  }
  if (scored.length) {
    scored.sort((a, b) => b[0] - a[0] || b[1].reviews - a[1].reviews);
    return { list: scored.map((x) => x[1]), byCat: null };
  }
  for (const c of DATA.categories) {
    const cw = norm(c.name).split(' ');
    const hit = toks.some((t) => cw.some((w) => w.startsWith(t) || (t.length > 3 && t.startsWith(w))));
    if (hit) return { list: DATA.products.filter((p) => p.cat === c.name), byCat: c.name };
  }
  return { list: [], byCat: null };
}

function suggest(q) {
  const toks = norm(q).split(' ').filter(Boolean);
  const cand = new Map();
  const add = (w, pts) => { if (w.length > 2 && !toks.includes(w)) cand.set(w, (cand.get(w) || 0) + pts); };
  toks.forEach((t) => (SYN[t] || []).forEach((s) => add(s, 6)));
  for (const p of DATA.products) {
    for (const w of p.nw.split(' ')) {
      for (const t of toks) if (t.length >= 3 && w.startsWith(t)) add(w, 1);
    }
  }
  return [...cand.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map((x) => x[0]);
}

const searchInput = document.getElementById('searchInput');
const searchBox = document.getElementById('searchBox');
const searchInfo = document.getElementById('searchInfo');
let searchTimer = null;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.q = searchInput.value;
    state.shown = 12;
    searchBox.classList.toggle('has', !!state.q.trim());
    render();
  }, 150);
});
document.getElementById('searchClear').addEventListener('click', () => {
  searchInput.value = '';
  state.q = '';
  searchBox.classList.remove('has');
  render();
  searchInput.focus();
});
document.getElementById('headerSearch').addEventListener('click', () => {
  document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => searchInput.focus({ preventScroll: true }), 500);
});

const catRow = document.getElementById('catRow');
DATA.categories.forEach((c, i) => {
  const b = document.createElement('button');
  b.className = 'cat-card';
  b.style.background = PASTELS[i % PASTELS.length];
  b.innerHTML = '<div><div class="count">' + c.count + ' товаров</div><div class="name">' + c.name + '</div></div>' +
    '<div class="go"><svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';
  b.addEventListener('click', () => { setCat(c.name); document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' }); });
  catRow.appendChild(b);
});

const chipsEl = document.getElementById('chips');
const chipCats = ['Все', ...DATA.categories.slice(0, 7).map((c) => c.name)];
chipCats.forEach((name) => {
  const el = document.createElement('button');
  el.className = 'chip' + (name === 'Все' ? ' on' : '');
  el.textContent = name;
  el.dataset.cat = name;
  el.addEventListener('click', () => setCat(name));
  chipsEl.appendChild(el);
});

function setCat(name) {
  state.cat = name;
  state.shown = 12;
  document.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c.dataset.cat === name));
  render();
}

const grid = document.getElementById('grid');
function render() {
  const q = state.q.trim();
  const res = q ? search(q) : null;
  let items = res ? res.list : DATA.products;
  items = items.filter((p) => state.cat === 'Все' || p.cat === state.cat);
  const slice = items.slice(0, state.shown);
  grid.innerHTML = '';
  slice.forEach((p) => {
    const b = DATA.badges[p.id];
    const a = document.createElement('a');
    a.className = 'card reveal in';
    a.href = p.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.innerHTML =
      '<div class="ph">' + (b ? '<span class="pill">' + b + '</span>' : '') +
      '<img loading="lazy" src="' + p.image + '" alt="">' +
      '<span class="arrow"><svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>' +
      '<div class="info">' +
      '<div class="title">' + p.title + '</div>' +
      '<div class="meta">' + p.cat + '</div>' +
      (p.rating ? '<div class="rating">★ <b>' + p.rating.toFixed(1) + '</b> · ' + p.reviews + ' отзывов</div>' : '') +
      '<div class="price-row"><span class="price">' + fmtN(p.price) + '</span>' +
      (p.oldPrice ? '<span class="old">' + fmtN(p.oldPrice) + '</span>' : '') + '</div>' +
      (p.monthly ? '<div class="monthly">от ' + fmtN(p.monthly) + ' / мес</div>' : '') +
      '</div>';
    grid.appendChild(a);
  });
  document.getElementById('more').style.display = state.shown >= items.length ? 'none' : '';

  searchInfo.innerHTML = '';
  searchInfo.classList.remove('on');
  if (!q) return;
  searchInfo.classList.add('on');
  const totalAll = res ? res.list.length : 0;
  if (items.length) {
    const note = document.createElement('span');
    note.textContent = 'Найдено: ' + totalAll + (res.byCat ? ' — вся категория «' + res.byCat + '»' : '') + (state.cat !== 'Все' ? ' · в категории «' + state.cat + '» показано ' + items.length : '');
    searchInfo.appendChild(note);
    return;
  }
  const none = document.createElement('span');
  none.textContent = 'По запросу «' + q + '» ничего не нашлось.';
  searchInfo.appendChild(none);
  const sug = suggest(q);
  const lbl = document.createElement('span');
  lbl.textContent = sug.length ? 'Возможно, вы искали:' : 'Популярные категории:';
  searchInfo.appendChild(lbl);
  if (sug.length) {
    sug.forEach((w) => {
      const c = document.createElement('button');
      c.className = 'chip';
      c.textContent = w;
      c.addEventListener('click', () => {
        searchInput.value = w;
        state.q = w;
        searchBox.classList.add('has');
        state.shown = 12;
        render();
      });
      searchInfo.appendChild(c);
    });
  } else {
    DATA.categories.slice(0, 4).forEach((cat) => {
      const c = document.createElement('button');
      c.className = 'chip';
      c.textContent = cat.name;
      c.addEventListener('click', () => {
        searchInput.value = '';
        state.q = '';
        searchBox.classList.remove('has');
        setCat(cat.name);
      });
      searchInfo.appendChild(c);
    });
  }
}
document.getElementById('more').addEventListener('click', () => { state.shown += 12; render(); });
document.querySelectorAll('[data-cat]').forEach(el => {
  el.addEventListener('click', (e) => {
    const cat = e.currentTarget.dataset.cat;
    if (cat) {
      setCat(cat);
      document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
    }
  });
});
render();

const header = document.getElementById('header');
addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 8), { passive: true });

const ann = [...document.querySelectorAll('#announce span')];
let ai = 0;
setInterval(() => { ann[ai].classList.remove('on'); ai = (ai + 1) % ann.length; ann[ai].classList.add('on'); }, 4000);

const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

document.getElementById('subForm').addEventListener('submit', (e) => {
  e.preventDefault();
  document.getElementById('subOk').textContent = 'Спасибо! Мы напишем, когда появятся новинки.';
  e.target.reset();
});

// Drawer Menu Interactions
const menuBtn = document.getElementById('menuBtn');
const menuClose = document.getElementById('menuClose');
const menuDrawer = document.getElementById('menuDrawer');
const menuBackdrop = document.getElementById('menuBackdrop');

function openDrawer() {
  menuDrawer.classList.add('open');
  menuBackdrop.classList.add('open');
  menuDrawer.setAttribute('aria-hidden', 'false');
  menuBtn.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  menuDrawer.classList.remove('open');
  menuBackdrop.classList.remove('open');
  menuDrawer.setAttribute('aria-hidden', 'true');
  menuBtn.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

menuBtn.addEventListener('click', openDrawer);
menuClose.addEventListener('click', closeDrawer);
menuBackdrop.addEventListener('click', closeDrawer);
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menuDrawer.classList.contains('open')) {
    closeDrawer();
  }
});

// Categories in drawer
const drawerCatsEl = document.getElementById('drawerCats');
DATA.categories.slice(0, 10).forEach((c) => {
  const b = document.createElement('button');
  b.className = 'drawer-cat-btn';
  b.textContent = c.name;
  b.addEventListener('click', () => {
    closeDrawer();
    setCat(c.name);
    document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
  });
  drawerCatsEl.appendChild(b);
});

// Drawer nav links click
document.querySelectorAll('[data-drawer-nav]').forEach((link) => {
  link.addEventListener('click', () => {
    closeDrawer();
  });
});

</script>
</body>
</html>
`;

writeFileSync('index.html', html);
console.log('index.html written:', (html.length / 1024).toFixed(1) + 'KB,', top.length, 'products embedded,', categories.length, 'categories');
