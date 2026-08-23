/**
 * Drink Nearby — 得正官方門市 Connector V2
 *
 * 1. 使用 Playwright 開啟得正官方門市頁
 * 2. 從頁面上的 <a> 自動發現所有台灣地區 URL
 * 3. 逐一開啟每個地區
 * 4. 讀取 JavaScript 執行後實際呈現在 DOM 裡的門市
 * 5. 合併、去重，輸出 data/dejeng.json
 *
 * Node.js >= 18
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
  const lines = clean(details)
    .split(/\n+/)
    .map((x) => x.trim())
    .filter(Boolean);

  return {
    address: lines[0] || "",
    phone: lines.slice(1).join(" ") || null,
  };
}

function normalizeStore(raw, district) {
  const branch = clean(raw.name);
  const { address, phone } = splitDetails(raw.details);

  return {
    id: `dejeng:${branch}`,
    brand: "得正",
    brand_id: "dejeng",
    type: "bubble_tea",
    branch,
    name: branch ? `得正 ${branch}` : "得正",
    district_source: district || null,
    address,
    phone,
    lat: null,
    lng: null,
    source: "dejeng_official_dom",
    source_url: raw.source_url || null,
  };
}

function readPrevious() {
  if (!fs.existsSync(OUTPUT_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf8"));
  } catch {
    return null;
  }
}

function fingerprint(store) {
  return JSON.stringify({
    name: store.name,
    address: store.address,
    phone: store.phone,
  });
}

function diffStores(oldStores, newStores) {
  const oldMap = new Map(oldStores.map((s) => [s.id, s]));
  const newMap = new Map(newStores.map((s) => [s.id, s]));

  return {
    added: newStores.filter((s) => !oldMap.has(s.id)),
    removed: oldStores.filter((s) => !newMap.has(s.id)),
    changed: newStores.filter((s) => {
      const old = oldMap.get(s.id);
      return old && fingerprint(old) !== fingerprint(s);
    }),
  };
}

function printDiff(diff) {
  if (!diff) return;
  console.log("\n📊 與上次同步比較");
  console.log(`  + 新增：${diff.added.length}`);
  console.log(`  - 移除：${diff.removed.length}`);
  console.log(`  ~ 變更：${diff.changed.length}`);

  const show = (label, items) => {
    if (!items.length) return;
    console.log(`\n${label}`);
    for (const s of items.slice(0, 10)) {
      console.log(`  • ${s.name}｜${s.address}`);
    }
    if (items.length > 10) console.log(`  …另有 ${items.length - 10} 筆`);
  };

  show("新增門市", diff.added);
  show("從官方頁面消失", diff.removed);
  show("資料變更", diff.changed);
}

async function discoverTaiwanDistricts(page) {
  console.log("1/4 發現台灣地區連結…");

  await page.goto(ENTRY_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(1500);

  const links = await page.evaluate(() => {
    return [...document.querySelectorAll("a")]
      .map((a) => ({
        text: (a.innerText || "").trim(),
        href: a.href,
      }))
      .filter(
        (x) =>
          x.href.includes("/stores/") &&
          x.href.includes("country=taiwan") &&
          x.href.includes("dist=")
      );
  });

  const seen = new Set();
  const unique = [];
  for (const x of links) {
    if (!x.href || seen.has(x.href)) continue;
    seen.add(x.href);
    unique.push(x);
  }

  if (!unique.length) {
    throw new Error("找不到任何台灣地區門市連結，官網 DOM 可能已改版。");
  }

  console.log(`    找到 ${unique.length} 個地區：${unique.map(x => x.text).join("、")}`);
  return unique;
}

async function scrapeDistrict(page, district) {
  console.log(`  → ${district.text}`);

  await page.goto(district.href, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  await page.waitForTimeout(1600);

  const stores = await page.evaluate(() => {
    const candidates = [...document.querySelectorAll("div")].filter((el) => {
      return (
        typeof el.className === "string" &&
        el.className.includes("text-[24px]") &&
        (el.innerText || "").trim().startsWith("#")
      );
    });

    return candidates.map((el) => {
      const row = el.closest(".row");
      const details = row?.children?.[1]?.innerText?.trim() || "";

      return {
        name: (el.innerText || "").replace(/^#\s*/, "").trim(),
        details,
        source_url: location.href,
      };
    });
  });

  return stores.filter((s) => s.name && s.details);
}

async function main() {
  console.log("🧋 Drink Nearby — 得正官方門市 Connector V2\n");

  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      locale: "zh-TW",
      userAgent:
        "Mozilla/5.0 (compatible; DrinkNearbyStoreSync/2.0; +https://github.com/charlie5116-cmd/drink-nearby)",
    });

    const page = await context.newPage();
    const districts = await discoverTaiwanDistricts(page);

    console.log("\n2/4 逐地區讀取官方 DOM…");
    const rawStores = [];

    for (const district of districts) {
      const districtStores = await scrapeDistrict(page, district);
      console.log(`     ${district.text}: ${districtStores.length} 間`);

      for (const raw of districtStores) {
        rawStores.push({
          ...raw,
          district: district.text,
        });
      }
    }

    console.log(`\n    原始合計：${rawStores.length} 筆`);
    console.log("3/4 Normalize + 去重…");

    const normalized = rawStores
      .map((s) => normalizeStore(s, s.district))
      .filter((s) => s.branch && s.address);

    const storeMap = new Map();
    for (const store of normalized) {
      const existing = storeMap.get(store.id);
      if (!existing || (store.address || "").length > (existing.address || "").length) {
        storeMap.set(store.id, store);
      }
    }

    const stores = [...storeMap.values()].sort((a, b) =>
      a.address.localeCompare(b.address, "zh-Hant")
    );

    const previous = readPrevious();
    const oldStores = Array.isArray(previous?.stores) ? previous.stores : [];
    const diff = previous ? diffStores(oldStores, stores) : null;

    const output = {
      meta: {
        brand: "得正",
        brand_id: "dejeng",
        source: "dejeng_official_dom",
        source_page: ENTRY_URL,
        synced_at: new Date().toISOString(),
        district_count: districts.length,
        raw_store_count: rawStores.length,
        store_count: stores.length,
        note:
          "V2 使用 Playwright 讀取官方頁面 client-render 後的 DOM。lat/lng 尚未處理。",
      },
      districts: districts.map((d) => ({
        name: d.text,
        url: d.href,
      })),
      stores,
    };

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(
      OUTPUT_PATH,
      JSON.stringify(output, null, 2) + "\n",
      "utf8"
    );

    console.log("4/4 寫入完成");
    console.log(`✅ ${OUTPUT_PATH}`);
    console.log(`✅ 地區：${districts.length}`);
    console.log(`✅ 有效門市：${stores.length}`);

    printDiff(diff);

    const muxin = stores.find(
      (s) => s.branch.includes("木新") || s.address.includes("木新路")
    );

    console.log("\n🔎 木新驗證");
    if (muxin) {
      console.log(`✅ ${muxin.name}`);
      console.log(`   ${muxin.address}`);
      console.log(`   ${muxin.phone || "無電話"}`);
    } else {
      console.warn("⚠️ 仍未找到木新門市，請檢查官方頁面 DOM 是否改版。");
      process.exitCode = 2;
    }

    await context.close();
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("\n❌ Connector V2 同步失敗");
  console.error(err);
  process.exit(1);
});
