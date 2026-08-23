/**
 * Drink Nearby — 得正官方門市 Connector V3
 * V3 = V2 DOM scraping + 座標保留
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const BASE_URL = "https://dejeng.com";
const ENTRY_URL = `${BASE_URL}/stores/?country=taiwan&dist=taipei`;
const OUTPUT_PATH = path.resolve(__dirname, "../data/dejeng.json");

function clean(s) {
  return typeof s === "string" ? s.replace(/\u00a0/g, " ").trim() : "";
}

function splitDetails(details) {
  const lines = clean(details).split(/\n+/).map(x => x.trim()).filter(Boolean);
  return { address: lines[0] || "", phone: lines.slice(1).join(" ") || null };
}

function readPrevious() {
  if (!fs.existsSync(OUTPUT_PATH)) return null;
  try { return JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf8")); } catch { return null; }
}

function buildPreviousMap(previous) {
  const stores = Array.isArray(previous?.stores) ? previous.stores : [];
  return new Map(stores.map(s => [s.id, s]));
}

function normalizeStore(raw, district, previousMap) {
  const branch = clean(raw.name);
  const { address, phone } = splitDetails(raw.details);
  const id = `dejeng:${branch}`;
  const old = previousMap.get(id);
  const addressUnchanged = old && clean(old.address) && clean(old.address) === clean(address);

  return {
    id,
    brand: "得正",
    brand_id: "dejeng",
    type: "bubble_tea",
    branch,
    name: branch ? `得正 ${branch}` : "得正",
    district_source: district || null,
    address,
    phone,
    lat: addressUnchanged && Number.isFinite(old?.lat) ? old.lat : null,
    lng: addressUnchanged && Number.isFinite(old?.lng) ? old.lng : null,
    geocoded_at: addressUnchanged ? old?.geocoded_at || null : null,
    geocode_provider: addressUnchanged ? old?.geocode_provider || null : null,
    geocode_query: addressUnchanged ? old?.geocode_query || null : null,
    geocode_display_name: addressUnchanged ? old?.geocode_display_name || null : null,
    source: "dejeng_official_dom",
    source_url: raw.source_url || null,
  };
}

function fingerprint(store) {
  return JSON.stringify({ name: store.name, address: store.address, phone: store.phone });
}

function diffStores(oldStores, newStores) {
  const oldMap = new Map(oldStores.map(s => [s.id, s]));
  const newMap = new Map(newStores.map(s => [s.id, s]));
  return {
    added: newStores.filter(s => !oldMap.has(s.id)),
    removed: oldStores.filter(s => !newMap.has(s.id)),
    changed: newStores.filter(s => {
      const old = oldMap.get(s.id);
      return old && fingerprint(old) !== fingerprint(s);
    }),
  };
}

async function discoverTaiwanDistricts(page) {
  console.log("1/4 發現台灣地區連結…");
  await page.goto(ENTRY_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1500);
  const links = await page.evaluate(() => [...document.querySelectorAll("a")]
    .map(a => ({ text: (a.innerText || "").trim(), href: a.href }))
    .filter(x => x.href.includes("/stores/") && x.href.includes("country=taiwan") && x.href.includes("dist=")));
  const seen = new Set();
  const unique = [];
  for (const x of links) {
    if (!x.href || seen.has(x.href)) continue;
    seen.add(x.href); unique.push(x);
  }
  if (!unique.length) throw new Error("找不到任何台灣地區門市連結，官網 DOM 可能已改版。");
  console.log(`    找到 ${unique.length} 個地區`);
  return unique;
}

async function scrapeDistrict(page, district) {
  console.log(`  → ${district.text}`);
  await page.goto(district.href, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1600);
  const stores = await page.evaluate(() => {
    const candidates = [...document.querySelectorAll("div")].filter(el =>
      typeof el.className === "string" &&
      el.className.includes("text-[24px]") &&
      (el.innerText || "").trim().startsWith("#")
    );
    return candidates.map(el => {
      const row = el.closest(".row");
      const details = row?.children?.[1]?.innerText?.trim() || "";
      return {
        name: (el.innerText || "").replace(/^#\s*/, "").trim(),
        details,
        source_url: location.href,
      };
    });
  });
  return stores.filter(s => s.name && s.details);
}

async function main() {
  console.log("🧋 Drink Nearby — 得正官方門市 Connector V3\n");
  const previous = readPrevious();
  const oldStores = Array.isArray(previous?.stores) ? previous.stores : [];
  const previousMap = buildPreviousMap(previous);
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      locale: "zh-TW",
      userAgent: "Mozilla/5.0 (compatible; DrinkNearbyStoreSync/3.0; +https://github.com/charlie5116-cmd/drink-nearby)",
    });
    const page = await context.newPage();
    const districts = await discoverTaiwanDistricts(page);
    console.log("\n2/4 逐地區讀取官方 DOM…");
    const rawStores = [];
    for (const district of districts) {
      const districtStores = await scrapeDistrict(page, district);
      console.log(`     ${district.text}: ${districtStores.length} 間`);
      for (const raw of districtStores) rawStores.push({ ...raw, district: district.text });
    }
    console.log(`\n    原始合計：${rawStores.length} 筆`);
    console.log("3/4 Normalize + 去重 + 保留座標…");
    const normalized = rawStores
      .map(s => normalizeStore(s, s.district, previousMap))
      .filter(s => s.branch && s.address);
    const storeMap = new Map();
    for (const store of normalized) {
      const existing = storeMap.get(store.id);
      if (!existing || (store.address || "").length > (existing.address || "").length) storeMap.set(store.id, store);
    }
    const stores = [...storeMap.values()].sort((a,b) => a.address.localeCompare(b.address, "zh-Hant"));
    const diff = previous ? diffStores(oldStores, stores) : null;
    const output = {
      meta: {
        brand: "得正", brand_id: "dejeng", source: "dejeng_official_dom",
        source_page: ENTRY_URL, synced_at: new Date().toISOString(),
        district_count: districts.length, raw_store_count: rawStores.length,
        store_count: stores.length,
        geocoded_count: stores.filter(s => Number.isFinite(s.lat) && Number.isFinite(s.lng)).length,
        missing_coordinates: stores.filter(s => !Number.isFinite(s.lat) || !Number.isFinite(s.lng)).length,
      },
      districts: districts.map(d => ({ name: d.text, url: d.href })),
      stores,
    };
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + "\n", "utf8");
    console.log("4/4 寫入完成");
    console.log(`✅ 有效門市：${stores.length}`);
    console.log(`📍 已有座標：${output.meta.geocoded_count}`);
    console.log(`❓ 待補座標：${output.meta.missing_coordinates}`);
    if (diff) console.log(`📊 新增 ${diff.added.length} / 移除 ${diff.removed.length} / 變更 ${diff.changed.length}`);
    const muxin = stores.find(s => s.branch.includes("木新") || s.address.includes("木新路"));
    if (!muxin) { console.warn("⚠️ 仍未找到木新門市。"); process.exitCode = 2; }
    else console.log(`🔎 木新驗證：✅ ${muxin.name}｜${muxin.address}`);
    await context.close();
  } finally { await browser.close(); }
}
main().catch(err => { console.error("\n❌ Connector V3 同步失敗"); console.error(err); process.exit(1); });
