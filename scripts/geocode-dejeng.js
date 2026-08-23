/**
 * Drink Nearby — 得正地址 Geocoder V1
 *
 * Public Nominatim：只查缺座標、單執行緒、每 request 至少 15.5 秒，結果寫回 JSON 永久快取。
 */
const fs = require("fs");
const path = require("path");

const DATA_PATH = path.resolve(__dirname, "../data/dejeng.json");
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const WAIT_MS = 15500;
const USER_AGENT = "DrinkNearbyGeocoder/1.0 (+https://github.com/charlie5116-cmd/drink-nearby)";

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function cleanAddress(address) {
  return String(address || "").trim().replace(/^\d{3,6}\s*/, "").replace(/\s+/g, " ");
}

async function geocode(address) {
  const cleaned = cleanAddress(address);
  const queries = [`${cleaned}, 台灣`, cleaned];
  for (let i = 0; i < queries.length; i++) {
    const q = queries[i];
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set("q", q);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "tw");
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.6", Accept: "application/json" }
    });
    if (!response.ok) throw new Error(`Nominatim HTTP ${response.status}: ${response.statusText}`);
    const results = await response.json();
    if (Array.isArray(results) && results.length) {
      const lat = Number(results[0].lat), lng = Number(results[0].lon);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng, display_name: results[0].display_name || null, query: q };
    }
    if (i < queries.length - 1) await sleep(WAIT_MS);
  }
  return null;
}

function updateMeta(data) {
  const stores = Array.isArray(data.stores) ? data.stores : [];
  data.meta = data.meta || {};
  data.meta.geocoded_count = stores.filter(s => Number.isFinite(s.lat) && Number.isFinite(s.lng)).length;
  data.meta.missing_coordinates = stores.length - data.meta.geocoded_count;
  data.meta.geocoding_updated_at = new Date().toISOString();
}

async function main() {
  if (!fs.existsSync(DATA_PATH)) throw new Error(`找不到 ${DATA_PATH}`);
  const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const stores = Array.isArray(data.stores) ? data.stores : [];
  const missing = stores.filter(s => !Number.isFinite(s.lat) || !Number.isFinite(s.lng));
  console.log("📍 Drink Nearby — 得正 Geocoder");
  console.log(`總門市：${stores.length}`);
  console.log(`待補座標：${missing.length}`);
  if (!missing.length) {
    console.log("✅ 所有門市都已有座標，不需要查詢。");
    updateMeta(data); fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n"); return;
  }
  console.log(`⏱️ 每 request 至少間隔 ${WAIT_MS/1000} 秒。`);
  let success=0, failed=0;
  for (let i=0; i<missing.length; i++) {
    const store=missing[i];
    console.log(`\n[${i+1}/${missing.length}] ${store.name}`);
    console.log(`  ${store.address}`);
    try {
      const result = await geocode(store.address);
      if (result) {
        store.lat=result.lat; store.lng=result.lng;
        store.geocoded_at=new Date().toISOString();
        store.geocode_provider="nominatim_osmf";
        store.geocode_query=result.query;
        store.geocode_display_name=result.display_name;
        success++; console.log(`  ✅ ${store.lat}, ${store.lng}`);
      } else {
        failed++; store.geocode_last_failed_at=new Date().toISOString(); console.log("  ⚠️ 找不到座標");
      }
    } catch (error) {
      failed++; store.geocode_last_failed_at=new Date().toISOString(); console.error(`  ❌ ${error.message}`);
    }
    updateMeta(data);
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n");
    if (i < missing.length-1) await sleep(WAIT_MS);
  }
  console.log(`\n✅ 成功：${success}`);
  console.log(`⚠️ 失敗：${failed}`);
  console.log(`📍 現有座標：${data.meta.geocoded_count}/${stores.length}`);
}
main().catch(err => { console.error("\n❌ Geocoding 失敗"); console.error(err); process.exit(1); });
